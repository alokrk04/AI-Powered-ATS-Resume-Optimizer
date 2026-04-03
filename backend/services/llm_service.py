"""
LLM Service — Ollama Local Backend
====================================
Uses Ollama to run LLMs fully locally — no API key required.

Setup:
  1. Install Ollama:  brew install ollama
  2. Pull a model:    ollama pull llama3.1
  3. Start server:    ollama serve
  4. Set in .env:     OLLAMA_MODEL=llama3.1

Supported models (pick based on your RAM):
  llama3.2   — 4GB RAM  — fast, good quality
  llama3.1   — 8GB RAM  — best balance ✓ recommended
  mistral    — 8GB RAM  — excellent JSON output
  gemma2     — 10GB RAM — very capable
  llama3.1:70b — 48GB  — near GPT-4 quality
"""

import json
import re
import os
from typing import List, Optional, Any
import httpx

# ── Ollama config (override via .env) ────────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL",    "llama3.1")
OLLAMA_TIMEOUT  = int(os.getenv("OLLAMA_TIMEOUT", "120"))   # seconds

# ── System Prompts ────────────────────────────────────────────────────────────

CAREER_COACH_SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) analyst and career coach.
You analyze resumes against job descriptions and provide precise, data-driven scoring.

Your expertise includes:
- ATS keyword matching and semantic relevance scoring
- Resume formatting best practices
- Identifying weak bullet points and rewriting them with the Google XYZ formula
- Skill gap analysis between resume and job requirements

CRITICAL RULES:
1. Always respond with ONLY valid JSON — no markdown, no explanation, no text outside the JSON
2. Every score must be an integer 0-100
3. Be honest — do not inflate scores
4. The XYZ formula: [Action Verb] + [Task/Project] + [Quantifiable Result]"""

BULLET_OPTIMIZER_SYSTEM_PROMPT = """You are a professional resume writer specializing in the Google XYZ formula.
Transform weak resume bullets into powerful achievement statements.

Google XYZ Formula: "Accomplished [X] as measured by [Y] by doing [Z]"
= [Strong Action Verb] + [Specific Task] + [Quantifiable Result] + [Method]

Rules:
1. Always start with a strong action verb (never "Responsible for" or "Helped")
2. Always include a metric (%, $, time, users, etc.)
3. If no numbers exist, estimate with "~" prefix
4. Keep under 25 words

CRITICAL: Respond with ONLY valid JSON, no markdown, no extra text."""

RESUME_REWRITER_SYSTEM_PROMPT = """You are a professional resume architect specializing in ATS optimization.
Rewrite resumes to rank in the top 10% of ATS systems.

ATS Rules you always follow:
- Standard headers: Work Experience | Education | Skills | Summary
- Bullet points: hyphens (-) only
- Dates: MM/YYYY format
- No tables, columns, or special characters
- Every bullet uses XYZ formula with action verb + metric

Return ONLY the rewritten resume as plain text. No JSON, no explanation."""


class LLMService:

    def __init__(self):
        self.base_url = OLLAMA_BASE_URL
        self.model    = OLLAMA_MODEL
        self.timeout  = OLLAMA_TIMEOUT

    # ── Public Methods ────────────────────────────────────────────────────────

    async def analyze_resume(
        self,
        resume_text: str,
        job_description: str,
        rule_score: int,
        matched_skills: List[str],
        missing_skills: List[str],
    ) -> dict:
        user_prompt = f"""Analyze this resume against the job description.
The rule-based engine pre-scored it {rule_score}/100 — calibrate close to this.

Pre-computed matched skills: {matched_skills[:10]}
Pre-computed missing skills: {missing_skills[:10]}

RESUME:
{resume_text[:2500]}

JOB DESCRIPTION:
{job_description[:1500]}

Return ONLY this exact JSON (no markdown, no extra text):
{{
  "ats_score": <integer 0-100>,
  "score_breakdown": {{
    "keyword_match": <0-100>,
    "formatting": <0-100>,
    "relevance": <0-100>,
    "quantification": <0-100>
  }},
  "section_scores": {{
    "work_experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>,
    "summary": <0-100>
  }},
  "summary": "<2 sentences: overall assessment + single most critical fix>",
  "matched_skills": ["<up to 8 skills>"],
  "missing_skills": ["<up to 6 skills>"],
  "missing_keywords": ["<up to 5 keywords>"],
  "weak_bullets": [
    {{
      "original": "<original bullet>",
      "optimized": "<XYZ rewrite with metric>",
      "improvement": "<one line explanation>"
    }}
  ],
  "recommendations": [
    "<specific actionable recommendation 1>",
    "<specific actionable recommendation 2>",
    "<specific actionable recommendation 3>",
    "<specific actionable recommendation 4>"
  ]
}}"""

        raw = await self._call_ollama(CAREER_COACH_SYSTEM_PROMPT, user_prompt)
        return self._parse_json(raw)

    async def optimize_bullet(self, bullet: str, context: Optional[str] = None) -> List[dict]:
        ctx_line = f"\nRole context: {context}" if context else ""

        user_prompt = f"""Transform this resume bullet into 3 XYZ-formula versions.{ctx_line}

Original: "{bullet}"

Return ONLY this JSON:
{{
  "versions": [
    {{
      "text": "<version 1 — impact focused with strong action verb and metric>",
      "approach": "Impact-focused",
      "improvement": "<one line: what specifically improved>"
    }},
    {{
      "text": "<version 2 — metric driven with specific numbers>",
      "approach": "Metric-driven",
      "improvement": "<one line: what specifically improved>"
    }},
    {{
      "text": "<version 3 — leadership and scale focused>",
      "approach": "Leadership & Scale",
      "improvement": "<one line: what specifically improved>"
    }}
  ]
}}"""

        raw  = await self._call_ollama(BULLET_OPTIMIZER_SYSTEM_PROMPT, user_prompt)
        data = self._parse_json(raw)
        return data.get("versions", [])

    async def rewrite_resume(
        self,
        resume_text: str,
        optimized_bullets: Optional[List[str]] = None,
        added_skills: Optional[List[str]] = None,
    ) -> str:
        additions = ""
        if optimized_bullets:
            additions += "\n\nApply these improved bullets where relevant:\n"
            additions += "\n".join(f"- {b}" for b in optimized_bullets)
        if added_skills:
            additions += f"\n\nAdd these skills to the Skills section: {', '.join(added_skills)}"

        user_prompt = f"""Rewrite this resume into a clean ATS-optimized format.{additions}

ORIGINAL RESUME:
{resume_text}

Return the complete rewritten resume as plain text only."""

        return await self._call_ollama(
            RESUME_REWRITER_SYSTEM_PROMPT, user_prompt, expect_json=False
        )

    # ── Ollama API Call ───────────────────────────────────────────────────────

    async def _call_ollama(
        self, system: str, user: str, expect_json: bool = True
    ) -> str:
        """
        Call Ollama's /api/chat endpoint.
        Ollama must be running: `ollama serve`
        """
        payload = {
            "model":    self.model,
            "stream":   False,
            "messages": [
                {"role": "system",  "content": system},
                {"role": "user",    "content": user},
            ],
            "options": {
                "temperature": 0.1,       # low temp = more consistent JSON
                "num_predict": 2048,      # max output tokens
            },
        }

        # Ask Ollama for JSON output natively if expecting JSON
        if expect_json:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                return data["message"]["content"]

        except httpx.ConnectError:
            raise RuntimeError(
                f"Cannot connect to Ollama at {self.base_url}. "
                "Make sure Ollama is running: run `ollama serve` in a terminal."
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise RuntimeError(
                    f"Model '{self.model}' not found in Ollama. "
                    f"Pull it first: `ollama pull {self.model}`"
                )
            raise RuntimeError(f"Ollama API error: {e}")

    # ── JSON Parser ───────────────────────────────────────────────────────────

    def _parse_json(self, text: str) -> Any:
        """Robustly extract JSON from LLM output."""
        # Strip markdown fences if present
        cleaned = re.sub(r"```json\s*|\s*```", "", text).strip()

        # Try direct parse first
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Try extracting the first complete {...} block
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        # Last resort: return a safe fallback so the app doesn't crash
        return {
            "ats_score": 50,
            "score_breakdown": {
                "keyword_match": 50, "formatting": 50,
                "relevance": 50, "quantification": 50,
            },
            "section_scores": {
                "work_experience": 50, "skills": 50,
                "education": 50, "summary": 50,
            },
            "summary": "Analysis completed. The model output could not be fully parsed — try a larger model for better results.",
            "matched_skills": [],
            "missing_skills": [],
            "missing_keywords": [],
            "weak_bullets": [],
            "recommendations": [
                "Try pulling a larger model: ollama pull llama3.1",
                "Ensure your resume has clear section headers",
                "Add quantified metrics to your bullet points",
                "Include keywords directly from the job description",
            ],
        }
