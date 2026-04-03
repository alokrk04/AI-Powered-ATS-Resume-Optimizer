"""
ATS Scoring Engine
==================
A deterministic, rule-based engine that scores resumes against job descriptions.
This runs in <50ms without any LLM calls — used for real-time feedback.

Scoring Dimensions
------------------
  Keyword Match    (40%) — Overlap of JD keywords found in resume
  Formatting       (25%) — ATS-friendly structure signals
  Relevance        (20%) — Section coverage and role alignment
  Quantification   (15%) — Presence of numbers/metrics in bullet points
"""

import re
import math
from typing import Tuple
from collections import Counter

# ── Stop words to exclude from keyword extraction ─────────────────────────────
STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "this", "that", "these",
    "those", "it", "its", "we", "our", "you", "your", "they", "their",
    "who", "which", "what", "when", "where", "how", "why", "not", "no",
    "as", "if", "so", "than", "then", "there", "here", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such",
    "up", "out", "about", "into", "through", "during", "including",
    "while", "although", "however", "therefore", "must", "role", "team",
    "work", "job", "position", "experience", "ability", "skills", "strong",
}

# ── ATS red-flag formatting signals ───────────────────────────────────────────
ATS_RED_FLAGS = [
    r"\|",                          # pipe characters (tables)
    r"[^\x00-\x7F]",               # non-ASCII (fancy bullets, em-dashes)
    r"http[s]?://\S+",             # URLs (often stripped by ATS)
    r"[☎✉✓●◆▪►]",                 # symbol bullets
]

# ── ATS green signals ─────────────────────────────────────────────────────────
ATS_SECTION_SIGNALS = [
    "experience", "education", "skills", "summary", "objective",
    "certifications", "projects", "work history",
]

QUANTIFICATION_PATTERN = re.compile(
    r"\b\d+[\.,]?\d*\s*(%|percent|x|times|million|billion|k\b|usd|\$|€|£|users|customers|leads|projects|teams?|members?|points?|days?|weeks?|months?|years?)\b",
    re.IGNORECASE,
)


class ATSScorer:

    def compute_score(self, resume_text: str, jd_text: str) -> int:
        """
        Returns composite ATS score 0–100.
        """
        kw_score   = self._keyword_score(resume_text, jd_text)     # 0–100
        fmt_score  = self._formatting_score(resume_text)            # 0–100
        rel_score  = self._relevance_score(resume_text, jd_text)   # 0–100
        qty_score  = self._quantification_score(resume_text)        # 0–100

        composite = (
            kw_score  * 0.40 +
            fmt_score * 0.25 +
            rel_score * 0.20 +
            qty_score * 0.15
        )
        return round(min(100, max(0, composite)))

    def get_breakdown(self, resume_text: str, jd_text: str) -> dict:
        return {
            "keyword_match":   self._keyword_score(resume_text, jd_text),
            "formatting":      self._formatting_score(resume_text),
            "relevance":       self._relevance_score(resume_text, jd_text),
            "quantification":  self._quantification_score(resume_text),
        }

    # ── Private Scorers ───────────────────────────────────────────────────────

    def _keyword_score(self, resume: str, jd: str) -> int:
        """TF-IDF inspired keyword overlap between resume and JD."""
        jd_keywords    = self._extract_keywords(jd)
        resume_keywords = self._extract_keywords(resume)

        if not jd_keywords:
            return 50  # neutral if JD is empty

        matches = sum(1 for kw in jd_keywords if kw in resume_keywords)
        # Weighted — top-frequency JD keywords matter more
        top_jd    = set(list(jd_keywords.keys())[:20])
        top_match = sum(1 for kw in top_jd if kw in resume_keywords)

        base_ratio  = matches / len(jd_keywords)
        top_ratio   = top_match / min(len(top_jd), 20)
        score       = (base_ratio * 0.5 + top_ratio * 0.5) * 100
        return round(min(100, score))

    def _formatting_score(self, resume: str) -> int:
        """Penalise ATS-hostile formatting; reward clean structure."""
        score = 100
        for pattern in ATS_RED_FLAGS:
            hits = len(re.findall(pattern, resume))
            score -= min(hits * 3, 15)   # cap penalty per flag at 15

        # Reward: standard section headers present
        found_sections = sum(
            1 for s in ATS_SECTION_SIGNALS
            if s in resume.lower()
        )
        section_bonus = min(found_sections * 5, 25)
        score += section_bonus

        # Check reasonable length (300–1500 words is ideal)
        word_count = len(resume.split())
        if word_count < 100:
            score -= 30
        elif word_count < 200:
            score -= 15
        elif word_count > 2000:
            score -= 10

        return round(min(100, max(0, score)))

    def _relevance_score(self, resume: str, jd: str) -> int:
        """Rough cosine similarity on bigram/unigram bag-of-words."""
        resume_vec = Counter(self._tokenize(resume))
        jd_vec     = Counter(self._tokenize(jd))

        common = set(resume_vec.keys()) & set(jd_vec.keys())
        if not common:
            return 10

        dot      = sum(resume_vec[t] * jd_vec[t] for t in common)
        mag_r    = math.sqrt(sum(v ** 2 for v in resume_vec.values()))
        mag_j    = math.sqrt(sum(v ** 2 for v in jd_vec.values()))

        if mag_r == 0 or mag_j == 0:
            return 10

        cosine = dot / (mag_r * mag_j)
        return round(min(100, cosine * 200))   # scale to 0–100

    def _quantification_score(self, resume: str) -> int:
        """Score based on number of quantified achievements."""
        hits = len(QUANTIFICATION_PATTERN.findall(resume))
        # 0 hits → 20, 5 hits → 70, 10+ hits → 100
        score = min(100, 20 + hits * 8)
        return round(score)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _tokenize(self, text: str):
        tokens = re.findall(r"[a-z]{2,}", text.lower())
        return [t for t in tokens if t not in STOP_WORDS]

    def _extract_keywords(self, text: str) -> Counter:
        tokens = self._tokenize(text)
        # Include bigrams
        bigrams = [f"{tokens[i]}_{tokens[i+1]}" for i in range(len(tokens) - 1)]
        return Counter(tokens + bigrams)
