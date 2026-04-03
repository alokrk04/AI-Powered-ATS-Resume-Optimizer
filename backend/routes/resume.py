from fastapi import APIRouter, UploadFile, File, HTTPException
from services.parser import ResumeParser
from models.schemas import ParsedResumeResponse

router = APIRouter()
parser = ResumeParser()


@router.post("/upload", response_model=ParsedResumeResponse)
async def upload_resume(file: UploadFile = File(...)):
    allowed = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted.")

    content = await file.read()

    try:
        if file.content_type == "application/pdf":
            raw_text = parser.extract_from_pdf(content)
        else:
            raw_text = parser.extract_from_docx(content)

        return ParsedResumeResponse(
            raw_text=raw_text,
            skills=parser.extract_skills(raw_text),
            experience_years=parser.extract_experience_years(raw_text),
            education=parser.extract_education(raw_text),
            sections_detected=parser.detect_sections(raw_text),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")


@router.post("/parse-text", response_model=ParsedResumeResponse)
async def parse_text(body: dict):
    raw_text = body.get("text", "")
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty.")

    return ParsedResumeResponse(
        raw_text=raw_text,
        skills=parser.extract_skills(raw_text),
        experience_years=parser.extract_experience_years(raw_text),
        education=parser.extract_education(raw_text),
        sections_detected=parser.detect_sections(raw_text),
    )
