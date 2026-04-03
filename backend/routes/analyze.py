from fastapi import APIRouter, HTTPException
from models.schemas import AnalyzeRequest, ATSAnalysisResponse
from services.ats_scorer import ATSScorer
from services.llm_service import LLMService
from services.skill_extractor import SkillExtractor

router    = APIRouter()
scorer    = ATSScorer()
llm       = LLMService()
extractor = SkillExtractor()


@router.post("/", response_model=ATSAnalysisResponse)
async def analyze_resume(body: AnalyzeRequest):
    if not body.resume_text.strip():
        raise HTTPException(400, "Resume text is required.")
    if not body.job_description.strip():
        raise HTTPException(400, "Job description is required.")

    try:
        rule_score = scorer.compute_score(body.resume_text, body.job_description)

        resume_skills = extractor.extract(body.resume_text)
        jd_skills     = extractor.extract(body.job_description)
        matched       = list(set(resume_skills) & set(jd_skills))
        missing       = list(set(jd_skills) - set(resume_skills))

        llm_result = await llm.analyze_resume(
            resume_text=body.resume_text,
            job_description=body.job_description,
            rule_score=rule_score,
            matched_skills=matched,
            missing_skills=missing,
        )

        return ATSAnalysisResponse(
            ats_score=llm_result["ats_score"],
            score_breakdown=llm_result["score_breakdown"],
            section_scores=llm_result["section_scores"],
            summary=llm_result["summary"],
            matched_skills=matched or llm_result.get("matched_skills", []),
            missing_skills=missing or llm_result.get("missing_skills", []),
            missing_keywords=llm_result.get("missing_keywords", []),
            weak_bullets=llm_result.get("weak_bullets", []),
            recommendations=llm_result.get("recommendations", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/quick-score")
async def quick_score(body: AnalyzeRequest):
    score = scorer.compute_score(body.resume_text, body.job_description)
    return {"ats_score": score, "method": "rule-based"}