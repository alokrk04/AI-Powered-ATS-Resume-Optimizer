from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import tempfile

from models.schemas import BulletOptimizeRequest, BulletOptimizeResponse, ResumeGenerateRequest
from services.llm_service import LLMService
from services.pdf_generator import ResumePDFGenerator

router  = APIRouter()
llm     = LLMService()
pdf_gen = ResumePDFGenerator()


@router.post("/bullet", response_model=BulletOptimizeResponse)
async def optimize_bullet(body: BulletOptimizeRequest):
    if not body.bullet.strip():
        raise HTTPException(400, "Bullet text is required.")
    try:
        result = await llm.optimize_bullet(body.bullet, body.context)
        return BulletOptimizeResponse(original=body.bullet, versions=result)
    except Exception as e:
        raise HTTPException(500, f"Bullet optimization failed: {str(e)}")


@router.post("/rewrite")
async def rewrite_resume(body: ResumeGenerateRequest):
    if not body.resume_text.strip():
        raise HTTPException(400, "Resume text is required.")
    try:
        rewritten = await llm.rewrite_resume(
            body.resume_text,
            body.optimized_bullets,
            body.added_skills,
        )
        return {"optimized_resume": rewritten}
    except Exception as e:
        raise HTTPException(500, f"Rewrite failed: {str(e)}")


@router.post("/generate-pdf")
async def generate_pdf(body: ResumeGenerateRequest):
    if not body.resume_text.strip():
        raise HTTPException(400, "Resume text is required.")
    try:
        if body.optimized_bullets:
            text_to_render = await llm.rewrite_resume(
                body.resume_text, body.optimized_bullets, body.added_skills
            )
        else:
            text_to_render = body.resume_text

        tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        pdf_gen.generate(text_to_render, tmp.name)

        return FileResponse(
            path=tmp.name,
            media_type="application/pdf",
            filename="optimized_resume.pdf",
        )
    except Exception as e:
        raise HTTPException(500, f"PDF generation failed: {str(e)}")