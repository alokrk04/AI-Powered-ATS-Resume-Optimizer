"""
ATS Resume Optimizer — FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


# Load .env if present (requires python-dotenv)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from routes.resume   import router as resume_router
from routes.analyze  import router as analyze_router
from routes.optimize import router as optimize_router

app = FastAPI(
    title="ATS Resume Optimizer API",
    description="AI-powered resume analysis and optimization engine",
    version="1.0.0",
)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume_router,   prefix="/api/resume",   tags=["Resume"])
app.include_router(analyze_router,  prefix="/api/analyze",  tags=["Analysis"])
app.include_router(optimize_router, prefix="/api/optimize", tags=["Optimization"])


@app.get("/")
def root():
    return {"status": "online", "service": "ATS Resume Optimizer v1.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)