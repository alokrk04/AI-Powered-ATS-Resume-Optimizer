# ⬡ ATS Resume Optimizer
### AI-Powered End-to-End Resume Intelligence Platform

A full-stack application that scores your resume against a job description, identifies skill gaps, rewrites weak bullet points using the Google XYZ formula, and exports an ATS-compliant PDF — all powered by an LLM acting as a Professional Career Coach.

---

## 📁 Project Structure

```
ats-optimizer/
│
├── backend/                          # Python / FastAPI
│   ├── main.py                       # App entry point, CORS, router registration
│   ├── .env.example                  # Environment variable template
│   ├── requirements.txt              # Python dependencies
│   │
│   ├── models/
│   │   └── schemas.py                # Pydantic request/response models
│   │
│   ├── routes/
│   │   ├── resume.py                 # POST /api/resume/upload  (PDF/DOCX)
│   │   ├── analyze.py                # POST /api/analyze/       (full ATS analysis)
│   │   └── optimize.py              # POST /api/optimize/bullet (XYZ optimizer)
│   │                                 # POST /api/optimize/generate-pdf
│   │
│   └── services/
│       ├── parser.py                 # pdfplumber + python-docx extraction
│       ├── ats_scorer.py             # Rule-based ATS scoring engine (0-100)
│       ├── skill_extractor.py        # spaCy + taxonomy-based skill extraction
│       ├── llm_service.py            # LLM provider abstraction + system prompts  ← Ollama integration (no API key)
│       └── pdf_generator.py          # ReportLab ATS-compliant PDF generation
│
├── frontend/                         # React + Vite
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── App.jsx                   # Root component, tab routing
│       ├── main.jsx
│       │
│       ├── components/
│       │   ├── ResumeUploader.jsx    # Drag-and-drop PDF/DOCX upload
│       │   ├── ATSScoreCard.jsx      # Score ring + breakdown bars
│       │   ├── SkillGapAnalysis.jsx  # Matched / Missing skill chips
│       │   ├── BulletOptimizer.jsx   # Single bullet → 3 XYZ versions
│       │   └── OptimizedResume.jsx   # Rewritten resume + PDF download
│       │
│       ├── services/
│       │   └── api.js                # Axios API calls to backend
│       │
│       └── hooks/
│           └── useAnalysis.js        # Analysis state management hook
│
└── README.md
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  Upload → Input JD → Analyze → Score → Gaps → Optimize → PDF    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────────┐
│                      FastAPI Backend                            │
│                                                                 │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────────────┐    │
│  │   Parser   │   │ ATS Scorer  │   │  Skill Extractor     │    │
│  │ PDF / DOCX │   │ Rule-based  │   │  spaCy + Taxonomy    │    │
│  │ pdfplumber │   │ <50ms, 0-100│   │  600+ skills tracked │    │
│  └────────────┘   └─────────────┘   └──────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    LLM Service                          │    │
│  │  Provider:  Ollama                                      │    │
│  │  • analyze_resume()   — full ATS analysis               │    │
│  │  • optimize_bullet()  — XYZ formula transform           │    │
│  │  • rewrite_resume()   — full restructure                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────┐                               │
│  │     PDF Generator            │                               │
│  │     ReportLab (ATS-safe)     │                               │
│  └──────────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download spaCy model
python -m spacy download en_core_web_sm

# 4. Configure environment
cp .env.example .env
# Edit .env and set your ANTHROPIC_API_KEY

# 5. Start server
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```
# Install Ollama
brew install ollama

# Pull a good model (pick one based on your RAM)
ollama pull llama3.2        # 3B  — needs 4GB RAM  (fast, decent quality)
ollama pull llama3.1        # 8B  — needs 8GB RAM  (best balance)
ollama pull mistral         # 7B  — needs 8GB RAM  (great for structured JSON)
ollama pull gemma2          # 9B  — needs 10GB RAM (very capable)

# Start the Ollama server
ollama serve

# 1. Install Ollama
brew install ollama

# 2. Pull a model — pick based on your  RAM
ollama pull llama3.2      # 4GB RAM (M1/M2 base)
ollama pull llama3.1      # 8GB RAM (recommended ✓)
ollama pull mistral       # 8GB RAM (best for JSON)

# 3. Start Ollama in a separate terminal (keep it running)
ollama serve

# 4. Copy your .env
cp .env.example .env
# Edit .env → set OLLAMA_MODEL=llama3.2  (or whichever you pulled)

# 5. Start your backend as usual
cd "Resume Opti"
uvicorn backend.main:app --reload --port 8000

### Frontend 

```bash
cd frontend
npm install
npm run dev
# Open: http://localhost:5173
```

---

## 🔌 API Endpoints

| Method | Endpoint                     | Description                                |
|--------|------------------------------|--------------------------------------------|
| `POST` | `/api/resume/upload`         | Upload PDF or DOCX resume                  |
| `POST` | `/api/resume/parse-text`     | Parse pasted resume text                   |
| `POST` | `/api/analyze/`              | Full ATS analysis (rule + LLM)             | 
| `POST` | `/api/analyze/quick-score`   | Fast rule-only score (<100ms)              |
| `POST` | `/api/optimize/bullet`       | Optimize single bullet (→ 3 XYZ versions)  |
| `POST` | `/api/optimize/rewrite`      | Full resume rewrite                        |
| `POST` | `/api/optimize/generate-pdf` | Export ATS-compliant PDF                   |

---

## 🧠 ATS Scoring Algorithm

The engine computes a composite score from 4 weighted dimensions:

| Dimension      | Weight | Method                                           |
|----------------|--------|--------------------------------------------------|
| Keyword Match  | 40%    | TF-IDF inspired overlap of JD keywords in resume |
| Formatting     | 25%    | ATS red-flag detection + section structure       |
| Relevance      | 20%    | Cosine similarity on bag-of-words                |
| Quantification | 15%    | Count of numeric metrics in bullet points        |

The LLM then calibrates the final score with semantic understanding.

---

## 💬 System Prompts

Three engineered prompts are used (see `services/llm_service.py`):

| Prompt                           | Purpose                                              |
|----------------------------------|------------------------------------------------------|
| `CAREER_COACH_SYSTEM_PROMPT`     | Full ATS analysis — data-driven, precise, ATS-aware  |
| `BULLET_OPTIMIZER_SYSTEM_PROMPT` | XYZ formula transformations — action verbs + metrics |
| `RESUME_REWRITER_SYSTEM_PROMPT`  | Full resume restructure — ATS formatting rules       |

---

## 📦 Key Dependencies

| Library       | Purpose                       |
|---------------|-------------------------------|
| `fastapi`     | Backend web framework         |
| `pdfplumber`  | PDF text extraction (primary) |
| `PyPDF2`      | PDF extraction fallback       |
| `python-docx` | DOCX file parsing             |
| `spacy`       | NLP entity recognition        |
| `reportlab`   | ATS-compliant PDF generation  |
| `httpx`       | Async HTTP for LLM API calls  |

---

## 🔧 Environment Variables

Copy `backend/.env.example` → `backend/.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
OLLAMA_TIMEOUT=120
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 🤖 Switching LLM Models

Edit `backend/.env`:

| Model      | RAM needed | Quality      | Speed    |
|------------|------------|--------------|----------|
| `llama3.2` | 4 GB       | Good         | Fast ⚡   |
| `llama3.1` | 8 GB       | Great        | Medium ✓ |
| `mistral`  | 8 GB       | Great (JSON) | Medium   |
| `gemma2`   | 10 GB      | Excellent    | Slow     |

```bash
ollama pull mistral
# then update .env: OLLAMA_MODEL=mistral
```

---

## 📈 Score Interpretation

| Score  | Label         | Recommended Action                     |
|--------|---------------|--------------------------------------- |
| 80–100 | ✅ Excellent  | Minor tweaks, ready to apply           |
| 60–79  | ⚠️ Needs Work | Add missing keywords, quantify bullets |
| 40–59  | 🔶 Poor       | Major rewrite recommended              |
| 0–39   | ❌ Critical   | Resume fundamentally mismatched        |



To Run the Application:

###Backend

export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$PATH" 
cd "/Users/alok/Desktop/Resume Opti/backend" 
python -m uvicorn main:app --reload --port 8000

###Frontend

 export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$PATH"
cd "/Users/alok/Desktop/Resume Opti/frontend"
npm run dev
