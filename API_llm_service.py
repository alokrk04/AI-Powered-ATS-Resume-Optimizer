"""
LLM Service
===========
All interactions with the LLM (Anthropic Claude by default, but provider-agnostic).
Contains the carefully engineered system prompts that make the AI behave as a
Professional Career Coach and ATS Expert.

"""" If you are using an API of any LLM provider use this code for llms which needs required api keys for LLM """"
Swap provider by changing the `_call_llm` method — just keep the JSON contract.
"""

import json
import re
import os
import httpx
from typing import List, Optional, Any


# ── System Prompts ────────────────────────────────────────────────────────────
# These are the core prompts. Tune them for your specific use-case / industry.

CAREER_COACH_SYSTEM_PROMPT = """You are an elite Professional Career Coach and ATS (Applicant Tracking System) Expert with 15+ years of experience in:

• Technical recruiting at FAANG, Fortune 500, and high-growth startups
• HR analytics and ATS system configuration (Workday, Greenhouse, Lever, Taleo)
• Executive resume writing and personal branding
• Keyword optimization and semantic relevance scoring

Your analysis is:
- DATA-DRIVEN: Back every claim with specific evidence from the resume
- PRECISE: Give exact scores, not vague ranges
- ACTIONABLE: Every recommendation must be specific and implementable
- HONEST: Don't inflate scores — recruiters rely on your accuracy

You understand that modern ATS systems use:
1. Exact keyword matching (weighted by frequency + placement)
2. Semantic similarity for contextual relevance
3. Section detection (headers must match expected patterns)
4. Formatting rules (avoid tables, columns, graphics, non-standard fonts)

ALWAYS respond with valid JSON only. No markdown fences, no explanation text outside the JSON."""

BULLET_OPTIMIZER_SYSTEM_PROMPT = """You are a master resume writer and career strategist who specializes in transforming weak, vague resume bullet points into powerful, quantified achievement statements.

You exclusively use the Google XYZ Formula:
  "Accomplished [X] as measured by [Y] by doing [Z]"
  
Which translates to:
  [Strong Action Verb] + [Specific Task/Project] + [Quantifiable Result] + [Method/Context]

Your rules:
1. ALWAYS start with a strong, specific action verb (Led, Architected, Reduced, Drove, Scaled, etc.) — never "Responsible for" or "Helped with"
2. ALWAYS include a metric or quantifiable result (%, $, time saved, users reached, etc.)
3. If the original has no numbers, INFER reasonable ranges based on role seniority — mark with "~" prefix
4. Make each version distinctly different in emphasis (impact, scale, method)
5. Keep bullets to 1-2 lines maximum (under 25 words preferred)

ALWAYS respond with valid JSON only."""

RESUME_REWRITER_SYSTEM_PROMPT = """You are a professional resume architect and ATS optimization specialist. Your job is to transform resumes into ATS-optimized documents that rank in the top 10% of applicants.

ATS Formatting Rules you always follow:
- Standard section headers: Work Experience | Education | Skills | Summary
- Bullet points: Use hyphens (-) only, never symbols
- Dates: MM/YYYY format
- No tables, columns, or text boxes
- Contact info on single lines
- Skills section: comma-separated list, no icons

XYZ Formula for every bullet:
- Start with action verb
- Include measurable result
- Provide context/method

ALWAYS respond with the rewritten resume text only — no JSON, no explanation."""


class LLMService:

    def __init__(self):
        self.api_key  = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        self.provider = os.getenv("LLM_PROVIDER", "gemini")   # "anthropic" | "openai" | "gemini"
        self.model    = os.getenv("LLM_MODEL", "gemini-2.0-flash")

    # ── Public Methods ────────────────────────────────────────────────────────

    async def analyze_resume(
        self,
        resume_text: str,
        job_description: str,
        rule_score: int,
        matched_skills: List[str],
        missing_skills: List[str],
    ) -> dict:
        """
        Full ATS analysis. Returns structured dict matching ATSAnalysisResponse.
        The rule_score is provided as context so the LLM calibrates consistently.
        """
        user_prompt = f"""Analyze this resume against the job description. The rule-based engine scored it {rule_score}/100.
Calibrate your score close to this number unless you have strong reason to deviate.

Pre-computed matched skills: {matched_skills[:10]}
Pre-computed missing skills: {missing_skills[:10]}

RESUME:
{resume_text[:3000]}

JOB DESCRIPTION:
{job_description[:2000]}

Return ONLY this exact JSON structure:
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
  "summary": "<2 precise sentences: overall assessment + single most critical fix>",
  "matched_skills": ["<skill>", ...],
  "missing_skills": ["<skill>", ...],
  "missing_keywords": ["<keyword>", ...],
  "weak_bullets": [
    {{
      "original": "<original bullet text>",
      "optimized": "<XYZ formula rewrite with metrics>",
      "improvement": "<one-line explanation of what changed>"
    }}
  ],
  "recommendations": [
    "<specific, actionable recommendation 1>",
    "<specific, actionable recommendation 2>",
    "<specific, actionable recommendation 3>",
    "<specific, actionable recommendation 4>",
    "<specific, actionable recommendation 5>"
  ]
}}"""

        raw = await self._call_llm(CAREER_COACH_SYSTEM_PROMPT, user_prompt)
        return self._parse_json(raw)

    async def optimize_bullet(self, bullet: str, context: Optional[str] = None) -> List[dict]:
        """Transform one weak bullet into 3 XYZ-formula versions."""
        ctx_line = f"\nRole context: {context}" if context else ""

        user_prompt = f"""Transform this resume bullet into 3 distinct enhanced versions using the XYZ formula.{ctx_line}

Original bullet: "{bullet}"

Return ONLY this JSON:
{{
  "versions": [
    {{
      "text": "<version 1 — Impact-focused>",
      "approach": "Impact-focused",
      "improvement": "<one line: what specifically was improved>"
    }},
    {{
      "text": "<version 2 — Metric-driven>",
      "approach": "Metric-driven",
      "improvement": "<one line: what specifically was improved>"
    }},
    {{
      "text": "<version 3 — Leadership & Scale>",
      "approach": "Leadership & Scale",
      "improvement": "<one line: what specifically was improved>"
    }}
  ]
}}"""

        raw = await self._call_llm(BULLET_OPTIMIZER_SYSTEM_PROMPT, user_prompt)
        data = self._parse_json(raw)
        return data.get("versions", [])

    async def rewrite_resume(
        self,
        resume_text: str,
        optimized_bullets: Optional[List[str]] = None,
        added_skills: Optional[List[str]] = None,
    ) -> str:
        """Rewrite full resume in ATS-compliant format."""
        additions = ""
        if optimized_bullets:
            additions += f"\n\nApply these improved bullets where relevant:\n" + "\n".join(f"- {b}" for b in optimized_bullets)
        if added_skills:
            additions += f"\n\nAdd these skills to the Skills section: {', '.join(added_skills)}"

        user_prompt = f"""Rewrite this resume into a clean, ATS-optimized format.{additions}

ORIGINAL RESUME:
{resume_text}

Return the complete rewritten resume as plain text. No JSON, no markdown."""

        return await self._call_llm(RESUME_REWRITER_SYSTEM_PROMPT, user_prompt, expect_json=False)

    # ── Provider Abstraction ──────────────────────────────────────────────────

    async def _call_llm(self, system: str, user: str, expect_json: bool = True) -> str:
        """Dispatch to the configured LLM provider."""
        if self.provider == "anthropic":
            return await self._call_anthropic(system, user)
        elif self.provider == "openai":
            return await self._call_openai(system, user)
        elif self.provider == "gemini":
            return await self._call_gemini(system, user)
        else:
            raise ValueError(f"Unknown LLM provider: {self.provider}")

    async def _call_anthropic(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": 2048,
                    "system": system,
                    "messages": [{"role": "user", "content": user}],
                },
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"]

    async def _call_openai(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model or "gpt-4o",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 2048,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def _call_gemini(self, system: str, user: str) -> str:
        """Call Google Gemini API."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}",
                headers={
                    "Content-Type": "application/json",
                },
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": system},
                                {"text": user},
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 2048,
                    }
                },
            )
            resp.raise_for_status()
            result = resp.json()
            return result["candidates"][0]["content"]["parts"][0]["text"]

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _parse_json(self, text: str) -> Any:
        """Strip markdown fences and parse JSON robustly."""
        cleaned = re.sub(r"```json|```", "", text).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Try extracting the first {...} block
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise
