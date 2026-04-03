"""
Pydantic Schemas
================
All request/response models for the ATS Optimizer API.
"""


from pydantic import Field


from pydantic import BaseModel
from typing import List, Optional, Dict

class ParsedResumeResponse(BaseModel):
    raw_text: str
    skills: List[str]
    experience_years: Optional[float]
    education: List[str]
    sections_detected: Dict[str, bool]

# ── Request Models ────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    resume_text: str = Field(..., description="Plain-text resume content")
    job_description: str = Field(..., description="Target job description")


class BulletOptimizeRequest(BaseModel):
    bullet: str = Field(..., description="Single resume bullet point to optimize")
    context: Optional[str] = Field(None, description="Optional job title / industry context")


class ResumeGenerateRequest(BaseModel):
    resume_text: str
    optimized_bullets: Optional[List[str]] = None
    added_skills: Optional[List[str]] = None


# ── Response Models ───────────────────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    keyword_match: int = Field(..., ge=0, le=100)
    formatting: int    = Field(..., ge=0, le=100)
    relevance: int     = Field(..., ge=0, le=100)
    quantification: int = Field(..., ge=0, le=100)


class SectionScores(BaseModel):
    work_experience: int
    skills: int
    education: int
    summary: int


class WeakBullet(BaseModel):
    original: str
    optimized: str
    improvement: str


class ATSAnalysisResponse(BaseModel):
    ats_score: int = Field(..., ge=0, le=100)
    score_breakdown: ScoreBreakdown
    section_scores: SectionScores
    summary: str
    matched_skills: List[str]
    missing_skills: List[str]
    missing_keywords: List[str]
    weak_bullets: List[WeakBullet]
    recommendations: List[str]
    raw_text: Optional[str] = None


class BulletVersion(BaseModel):
    text: str
    approach: str
    improvement: str


class BulletOptimizeResponse(BaseModel):
    original: str
    versions: List[BulletVersion]


class ParsedResumeResponse(BaseModel):
    raw_text: str
    skills: List[str]
    experience_years: Optional[int]
    education: List[str]
    sections_detected: List[str]
