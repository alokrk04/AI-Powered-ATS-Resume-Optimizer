# AI Coding Agent Guidelines for Resume Optimizer

## Architecture Overview
- **Type**: Full-stack SPA with AI-powered resume analysis and optimization
- **Backend**: FastAPI (Python) on port 8000 with async/await throughout
- **Frontend**: React 18 + Vite on port 5173 (dev) / 3000 (prod), proxies `/api` to backend
- **Core flow**: Resume (PDF/DOCX) → Parse → ATS Score (rule-based 50ms + LLM calibration) → Skill Gap → Bullet Optimization (XYZ formula) → PDF Export
- **State**: Zustand store (`frontend/src/store.js`) is single source of truth; UI syncs with store via hooks
- **Backend structure**: `routes/` (API endpoints), `services/` (business logic), `models/` (Pydantic schemas)
- **Frontend structure**: Tab-based SPA (`App.jsx`) with `components/pages/`, `components/layout/`, `components/ui/`, centralized API layer

## Backend Architecture

### Entry Point & Routing
- `main.py` (line 8): Uses `sys.path.insert(0, ...)` to enable relative imports from project root
- CORS middleware: Allows `localhost:3000,5173` (configurable via `ALLOWED_ORIGINS` env var)
- Three routers registered as blueprints with `/api/` prefix

### Service Layer Patterns

#### LLM Service (`services/llm_service.py`)
- **Provider abstraction**: `_call_llm()` dispatcher (line 205–212) routes to `_call_anthropic()` or `_call_openai()`
- **System prompts** (lines 21–74): Three carefully engineered prompts with specific directives:
  - `CAREER_COACH_SYSTEM_PROMPT`: ATS analysis instruction ("data-driven, precise, honest")
  - `BULLET_OPTIMIZER_SYSTEM_PROMPT`: XYZ formula instruction ("strong action verb + metric + method")
  - `RESUME_REWRITER_SYSTEM_PROMPT`: ATS formatting rules (no tables, hyphens only, MM/YYYY dates)
- **JSON handling** (line 256–266): `_parse_json()` strips markdown fences, regex fallback extracts first `{...}` block
- **Async pattern**: All public methods are `async`, use `httpx.AsyncClient` with 60s timeout

#### ATS Scorer (`services/ats_scorer.py`)
- **Deterministic scoring** (line 57–72): No LLM, runs <50ms
- **Composite formula** (line 66–70): `keyword_match*0.40 + formatting*0.25 + relevance*0.20 + quantification*0.15`
- **Keyword matching** (line 84–100): TF-IDF inspired with stop-word filtering + bigrams weighted by frequency
- **Formatting score** (line 102–126): Penalizes ATS red flags (pipes, non-ASCII, URLs, symbol bullets) via regex; rewards standard section headers
- **Relevance score** (line 128–145): Cosine similarity on bag-of-words after tokenization/stop-word removal
- **Quantification score** (line 147–152): Regex pattern (line 49–52) matches metrics (%, $, time units, user counts); scales linearly

#### Skill Extractor (`services/skill_extractor.py`)
- **Multi-layer approach**: Curated taxonomy (fast), spaCy NER (accurate), NLTK fallback
- **Taxonomy organization** (line 35+): 600+ skills across 10+ categories (Programming, Frontend, Backend, DevOps, Data, Cloud, etc.)
- **Gap analysis**: `matched = resume_skills ∩ jd_skills`, `missing = jd_skills - resume_skills`

#### Resume Parser (`services/parser.py`)
- **Format support**: PDF (pdfplumber primary, PyPDF2 fallback), DOCX (python-docx), raw text
- **Returns** `ParsedResumeResponse` with raw_text, skills, experience_years, education, sections_detected

#### PDF Generator (`services/pdf_generator.py`)
- **ReportLab rendering**: ATS-safe (no tables, columns, graphics, custom fonts)
- **Format rules**: Section headers in caps, bullet hyphens only, dates MM/YYYY, contact on single lines, skills comma-separated

### Route Handlers

#### `/api/analyze/` (Analysis Route)
- **Flow** (line 14–46 in `routes/analyze.py`):
  1. Extract input validation (resume, JD)
  2. Compute rule score via `ATSScorer.compute_score()` (~50ms)
  3. Extract skills from both texts via `SkillExtractor.extract()`
  4. Compute matched/missing sets
  5. Call `LLMService.analyze_resume()` with rule score as context for calibration
  6. Return `ATSAnalysisResponse` combining rule insights + LLM assessment

#### `/api/optimize/bullet` (Bullet Optimizer Route)
- Input: `BulletOptimizeRequest` (bullet text, optional context)
- Output: `BulletOptimizeResponse` with 3 distinct XYZ versions (impact-focused, metric-driven, leadership-scale)
- Uses `LLMService.optimize_bullet()` async method

#### `/api/optimize/generate-pdf` (PDF Export Route)
- Input: Resume text + optional optimized bullets + added skills
- If bullets provided: First rewrites resume via LLM, then renders PDF
- Returns file response with `media_type="application/pdf"`
- Temporary file created in system temp directory

### Request/Response Schemas
- All defined in `models/schemas.py` using Pydantic with strict validation
- Request models: `AnalyzeRequest` (resume_text, job_description), `BulletOptimizeRequest` (bullet, context), `ResumeGenerateRequest` (resume_text, optimized_bullets, added_skills)
- Response models: `ATSAnalysisResponse` (ats_score, score_breakdown, section_scores, matched/missing skills, weak_bullets, recommendations)
- All numeric fields use `Field(..., ge=0, le=100)` for bounds validation

## Frontend Architecture

### Global State (Zustand Store)
- Single store in `store.js` with 4 state groups:
  - **Resume/JD**: `resumeText`, `resumeFile`, `parsedResume`, `jdText`
  - **Analysis**: `analysis`, `analysisLoading`, `analysisError` + setters + `clearAnalysis()`
  - **Bullet Optimizer**: `bulletInput`, `bulletContext`, `bulletResults`, `bulletLoading`, `bulletError` + setters + `clearBulletResults()`
  - **Optimized Resume**: `optimizedResume`, `rewriteLoading`, `pdfLoading` + setters
  - **UI**: `activeTab`, `sidebarOpen` + `toggleSidebar()`
  - **Helpers**: `isReady()` (checks resume/JD length > 50), `hasAnalysis()` (checks analysis present)
- Usage: `const { setAnalysis } = useStore()` → setter called after async action

### Root Component (App.jsx)
- **Layout**: Flex container with Sidebar (collapsible) → Header + Main content area
- **Routing**: 5 tabs mapped to page components: input, score, skills, optimize, bullet
- **Animations**: Framer Motion page transitions (fade + slide)
- **Prop pattern**: `pages` object maps tab names to components, `ActivePage` selected via `activeTab` store

### Page Components (`components/pages/`)
- Each page reads/writes to Zustand store, calls API functions from `services/api.js`
- **InputPage**: Resume upload (file + text), JD input, "Analyze" button
- **ScorePage**: Score ring (Framer Motion circular progress), breakdown bars, score label
- **SkillGapPage**: Matched skills (green chips), missing skills (red chips)
- **OptimizePage**: List of weak bullets, recommendations
- **BulletPage**: Input field for single bullet, "Optimize" button, 3 result versions with copy buttons

### API Layer (`services/api.js`)
- **Axios instance** (line 13–17): 90s timeout (LLM calls slow), JSON content-type
- **Request interceptor** (line 20–25): Adds auth token if present in localStorage (future use)
- **Response interceptor** (line 28–38): Extracts error message from response detail/message or fallback
- **Endpoint functions** (all async):
  - `uploadResume(file, onProgress)` — FormData POST with upload progress callback
  - `parseResumeText(text)` — Plain text parsing
  - `analyzeResume(resumeText, jobDescription)` — Full analysis
  - `quickScore(resumeText, jobDescription)` — Rule-only (no LLM)
  - `optimizeBullet(bullet, context)` — 3 XYZ versions
  - `rewriteResume(resumeText, optimizedBullets, addedSkills)` — Full resume rewrite
  - `generatePDF(resumeText, optimizedBullets, addedSkills)` — Returns Blob

### Layout Components
- **Sidebar.jsx**: Tab navigation links, collapse button, branding
- **Header.jsx**: Title, status indicators (loading spinners), help text
- **ResumeUploader.jsx**: `react-dropzone` drag-and-drop, file preview, upload progress
- **JDInput.jsx**: Textarea for job description with char count

### UI Components
- **ScoreRing.jsx**: Framer Motion circular progress (CSS transform), score number center, breakdown legend
- Custom styling via CSS variables (--bg, --amber, --text, etc.)

### Styling & Design Patterns
- CSS variables for theming (dark mode baseline)
- Framer Motion for animations (page transitions, score ring rotation, button hover)
- Lucide React for icons
- Responsive design: Sidebar collapsible on mobile, main area flex grows

## Development Workflow

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env  # Set ANTHROPIC_API_KEY or OPENAI_API_KEY
uvicorn main:app --reload --port 8000
# API docs at http://localhost:8000/docs
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# Vite proxy rule: /api/* → http://localhost:8000/api/*
```

### Environment Configuration (Backend .env)
```env
# LLM Provider
LLM_PROVIDER=anthropic         # "anthropic" or "openai"
LLM_MODEL=claude-opus-4-5      # or "gpt-4o"
ANTHROPIC_API_KEY=sk-ant-...   # Set one
OPENAI_API_KEY=sk-...          # or the other

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend Vite Config
- `vite.config.js`: Proxy `/api/*` to `http://localhost:8000/api/*`
- API base URL can be overridden via `VITE_API_BASE_URL` env var

## Coding Patterns & Conventions

### Request/Response Cycle
1. Component calls API function from `services/api.js` (e.g., `analyzeResume(...)`)
2. API function uses Axios to POST to backend endpoint
3. Backend route handler validates Pydantic schema, calls services
4. Services return structured data
5. Backend returns JSON response (or FileResponse for PDF)
6. Frontend catches response, updates Zustand store via setters
7. UI re-renders automatically (React dependency on store)

### Error Handling
- **Backend**: All exceptions caught in route handlers, re-raised as `HTTPException(status_code, detail)`
- **Frontend**: Axios response interceptor extracts error detail → throws new Error(message)
- **Component pattern**: Wrap API calls in try/catch, set error state before call, clear in finally

### Async/Await Patterns
- **Backend**: All route handlers and service methods are `async def`, use `await` for LLM calls
- **Frontend**: API functions are async (return Promises), components use `async function` or `.then()` chaining
- **Store**: Loading flags set before async call, cleared in finally (prevents race conditions)

### LLM Integration
- **System prompt tuning**: Edit constants in `llm_service.py` (lines 21–74), always include "respond with JSON only" if expecting JSON
- **Provider switching**: Change `LLM_PROVIDER` env var and optional `LLM_MODEL` — no code changes needed
- **JSON parsing robustness**: `_parse_json()` (line 256–266) handles markdown fences + regex fallback for malformed responses
- **Timeout handling**: 60s timeout in LLM calls; frontend Axios timeout 90s (gives LLM extra buffer)

### State Management
- **Single source of truth**: Zustand store in `store.js`
- **No prop drilling**: Pages read/write directly to store, no intermediate props
- **Selector pattern**: Use `const { field } = useStore()` to read specific fields (reactive updates)
- **Batch updates**: Use `set()` callback to update multiple fields atomically

### Skill Taxonomy
- Edit `SKILL_TAXONOMY` dict in `services/skill_extractor.py` to add categories/skills
- Categories: Programming Languages, Frontend, Backend & APIs, DevOps, Data, Cloud, etc.
- Each skill is lowercase string for case-insensitive matching

### PDF ATS Compliance
- No tables, columns, graphics, or special symbols
- Section headers must be plain text (e.g., "EXPERIENCE" not "▼ EXPERIENCE")
- Bullet points: single hyphen only (`- ` not `•` or `*`)
- Dates: MM/YYYY format (e.g., "01/2025" not "January 2025")
- No URLs (ATS systems may strip them)
- Skills section: comma-separated list without icons/formatting

### Bullet XYZ Formula
- **Template**: `[Action Verb] [Task/Project] [Quantified Result] [Method/Context]`
- **Examples**:
  - ❌ "Responsible for project management"
  - ✅ "Led cross-functional team of 8 to deliver Q4 product launch, increasing revenue by 15%"
- **Metrics to infer**: If original has no numbers, LLM infers reasonable ranges based on role seniority, marks with "~" prefix
- **3 versions**: Always generate distinct emphasis (impact, metrics, scale) for A/B testing

## Key Files Reference
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app setup, CORS, router registration |
| `backend/services/llm_service.py` | LLM provider abstraction, system prompts (lines 21–74), `_call_llm()` dispatcher |
| `backend/services/ats_scorer.py` | Deterministic rule-based scoring (40% keywords, 25% format, 20% relevance, 15% quant) |
| `backend/services/skill_extractor.py` | spaCy + taxonomy skill extraction, gap analysis |
| `backend/services/parser.py` | Resume text extraction (PDF/DOCX/text) |
| `backend/services/pdf_generator.py` | ReportLab ATS-safe PDF rendering |
| `backend/models/schemas.py` | Pydantic request/response types (15 schemas) |
| `backend/routes/analyze.py` | `/api/analyze/` full analysis, `/api/analyze/quick-score` |
| `backend/routes/optimize.py` | `/api/optimize/bullet`, `/api/optimize/rewrite`, `/api/optimize/generate-pdf` |
| `backend/routes/resume.py` | `/api/resume/upload`, `/api/resume/parse-text` |
| `frontend/src/App.jsx` | Root component, tab routing, layout (Sidebar + Header + Main) |
| `frontend/src/store.js` | Zustand global store (70 lines) |
| `frontend/services/api.js` | Axios instance + 8 API endpoint functions |
| `frontend/components/pages/InputPage.jsx` | Resume/JD input form |
| `frontend/components/pages/ScorePage.jsx` | ATS score ring + breakdown bars |
| `frontend/components/pages/SkillGapPage.jsx` | Matched/missing skills chips |
| `frontend/components/pages/OptimizePage.jsx` | Weak bullets + recommendations |
| `frontend/components/pages/BulletPage.jsx` | Single bullet optimizer, 3 XYZ versions |
| `frontend/components/layout/Sidebar.jsx` | Tab navigation, collapse button |
| `frontend/components/layout/Header.jsx` | Title, status indicators |
| `frontend/components/ui/ScoreRing.jsx` | Framer Motion circular progress |

## Common Tasks

### Add New Analysis Feature (End-to-End)
1. **Define schema**: Add Pydantic model to `models/schemas.py`
2. **Create route**: Add endpoint in `routes/analyze.py` or new router
3. **Add service logic**: Create method in `LLMService` or new service class
4. **Add system prompt**: If LLM needed, add constant to `llm_service.py` with JSON directive
5. **Frontend API**: Add function to `frontend/services/api.js` with JSDoc types
6. **Zustand store**: Add state fields to `store.js` for results/loading/error
7. **Page component**: Create new page in `components/pages/`, read/write store
8. **Routing**: Add tab to `App.jsx` pages object

### Modify ATS Scoring Weights
- **Location**: `services/ats_scorer.py` line 66–70
- **Current weights**: keyword 0.40, formatting 0.25, relevance 0.20, quantification 0.15
- **Impact**: Changing weights affects all rule scores returned by `compute_score()`
- **LLM calibration**: Line 98–145 uses rule score as context, may need prompt tuning if weights change significantly

### Switch LLM Provider
- **Edit `.env`**: `LLM_PROVIDER=anthropic` ↔ `openai`, set `LLM_MODEL`
- **No code changes**: `LLMService._call_llm()` dispatcher (line 205–212) routes to correct implementation
- **Adding new provider**: Implement new `_call_<provider>()` method, add case to dispatcher

### Update System Prompts
- **Location**: `llm_service.py` lines 21–74 (3 constants)
- **Testing**: Use `http://localhost:8000/docs` Swagger UI to test endpoints
- **Debugging**: Check raw LLM response before JSON parsing; print in `_call_llm()` if needed
- **Important**: Always include "respond with JSON only" directive if expecting JSON response

### Debug LLM Response Issues
- **Add logging**: Print raw response before `_parse_json()` call (line 256)
- **JSON parsing fails**: Check markdown fences (` ```json ... ``` `), regex fallback extracts first `{...}`
- **Schema mismatch**: Verify response JSON matches expected model in backend schema
- **Timeout**: Increase timeout in `_call_anthropic()` or `_call_openai()` if LLM calls regularly fail

### Add New Skill Category
- **Edit**: `services/skill_extractor.py` line 35+ `SKILL_TAXONOMY` dict
- **Format**: `"Category Name": ["skill1", "skill2", ...]` (lowercase strings)
- **Impact**: Affects skill extraction in all resumes automatically
- **Usage**: Skills extracted from both resume and JD for gap analysis

### Customize PDF Output
- **Styling**: Edit `services/pdf_generator.py` ReportLab styles
- **Sections**: Modify section headers, margins, fonts
- **ATS compliance**: Ensure no tables/graphics, plain ASCII text, standard fonts

## Dependencies & Versions
| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.111+ | Backend web framework |
| Uvicorn | 0.29+ | ASGI server |
| pdfplumber | 0.11+ | PDF text extraction (primary) |
| PyPDF2 | 3.0+ | PDF extraction fallback |
| python-docx | 1.1+ | DOCX parsing |
| spacy | 3.7+ | NLP entity recognition |
| reportlab | 4.1+ | PDF generation |
| httpx | 0.27+ | Async HTTP for LLM APIs |
| pydantic | 2.6+ | Data validation |
| python-dotenv | 1.0+ | Environment loading |
| React | 18.3+ | Frontend framework |
| Vite | 5.2+ | Build tool & dev server |
| Zustand | 4.5+ | State management |
| Axios | 1.7+ | HTTP client |
| Framer Motion | 11.2+ | Animations |
| Lucide React | Latest | Icon library |

## Important Caveats & Troubleshooting

### Import Issues
- **Problem**: `ModuleNotFoundError: No module named 'models'`
- **Cause**: `sys.path` manipulation not taking effect (line 8 in main.py)
- **Fix**: Ensure uvicorn runs from `backend/` directory: `cd backend && uvicorn main:app --reload`

### spaCy Model Missing
- **Problem**: RuntimeError when skill extraction runs
- **Fix**: Run `python -m spacy download en_core_web_sm` from venv
- **Fallback**: Code gracefully degrades to NLTK if spaCy unavailable (line 16–21 skill_extractor.py)

### LLM API Failures
- **Anthropic**: Check `ANTHROPIC_API_KEY` validity, rate limits
- **OpenAI**: Check `OPENAI_API_KEY`, model availability, rate limits
- **Network**: Verify internet connectivity, proxy settings
- **Timeout**: If calls regularly timeout, increase timeout in `_call_anthropic()` or `_call_openai()`

### PDF Generation Issues
- **Blank pages**: Check if text_to_render is empty string (validation issue)
- **Text cutoff**: ReportLab may truncate very long resumes; consider pagination
- **File not deleted**: Temporary files in system temp directory; OS cleans up eventually

### Frontend Hot Reload Not Working
- **Cause**: Vite config issue or port conflict
- **Fix**: Verify `vite.config.js` proxy rule exists, check port 5173 is free, restart dev server

### State Not Syncing
- **Problem**: UI doesn't update after API call
- **Cause**: Zustand setter not called after async result
- **Fix**: Ensure component calls `setAnalysis(result)` or equivalent setter in API call handler

### CORS Errors
- **Problem**: Frontend request blocked by CORS
- **Cause**: Frontend origin not in `ALLOWED_ORIGINS` env var
- **Fix**: Add origin to backend `.env` (e.g., `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173`)

## Testing & Validation
- **Backend health**: `curl http://localhost:8000/health`
- **API docs**: Open `http://localhost:8000/docs` (Swagger UI with try-it-out)
- **Frontend hot reload**: Edit `.jsx` file → auto-reload in browser
- **LLM testing**: Use Swagger UI to test LLM endpoints with sample data
- **Mock LLM**: For offline testing, stub `_call_llm()` to return hardcoded JSON responses</content>
<parameter name="filePath">/Users/alok/Desktop/Resume Opti/AGENTS.md
