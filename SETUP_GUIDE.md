# Resume Opti - Complete Setup Guide

## 🔧 Issue Fixed: Shell PATH Corruption

Your `.zshrc` had `NVM_DIR=""` (empty string) which broke your shell PATH. This has been fixed in `~/.zshrc`.

**Solution**: Close your terminal and open a new one, then the PATH will be properly restored.

---

## ✅ What's Installed

- **Node.js**: v24.14.1
- **npm**: v11.11.0  
- **Backend Python**: Python 3.13 with all dependencies (requirements.txt)
- **Frontend npm packages**: 303 packages installed successfully

---

## 🚀 Starting Both Services

### Option 1: Start in Two Terminal Windows (Recommended)

**Terminal 1 - Backend:**
```bash
cd "/Users/alok/Desktop/Resume Opti/backend"
python -m uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Started reloader process [XXXXX] using WatchFiles
```

**Terminal 2 - Frontend:**
```bash
cd "/Users/alok/Desktop/Resume Opti/frontend"
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Option 2: Start Both Services (One Terminal with Background Process)

**Terminal:**
```bash
# Start backend in background
cd "/Users/alok/Desktop/Resume Opti/backend"
python -m uvicorn main:app --reload --port 8000 &

# Start frontend
cd "/Users/alok/Desktop/Resume Opti/frontend"
npm run dev
```

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Resume Opti web app |
| **Backend API** | http://localhost:8000 | REST API |
| **API Docs** | http://localhost:8000/docs | Swagger UI (interactive testing) |
| **API Health** | http://localhost:8000/health | Health check endpoint |

---

## 📋 Initial Setup Checklist

- [x] Node.js installed (v24.14.1)
- [x] npm installed (v11.11.0)
- [x] Backend dependencies installed (Python venv)
- [x] Frontend dependencies installed (npm)
- [x] Shell PATH fixed (.zshrc corrected)
- [ ] Start backend server (port 8000)
- [ ] Start frontend server (port 5173)
- [ ] Verify frontend connects to backend
- [ ] Create `.env` file in `backend/` with LLM API keys

---

## 🔑 Environment Setup (Backend .env)

Before running the backend, create `backend/.env`:

```bash
cd "/Users/alok/Desktop/Resume Opti/backend"
cp .env.example .env   # If .env.example exists
```

Then edit `backend/.env` and add:


## 📦 Key Dependencies

| Library | Purpose |
|---------|---------|
| `fastapi` | Backend web framework |
| `pdfplumber` | PDF text extraction (primary) |
| `PyPDF2` | PDF extraction fallback |
| `python-docx` | DOCX file parsing |
| `spacy` | NLP entity recognition |
| `reportlab` | ATS-compliant PDF generation |
| `httpx` | Async HTTP for LLM API calls |

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

| Model | RAM needed | Quality | Speed |
|-------|-----------|---------|-------|
| `llama3.2` | 4 GB | Good | Fast ⚡ |
| `llama3.1` | 8 GB | Great | Medium ✓ |
| `mistral` | 8 GB | Great (JSON) | Medium |
| `gemma2` | 10 GB | Excellent | Slow |

```bash
ollama pull mistral
# then update .env: OLLAMA_MODEL=mistral
```

---

---

## 🧪 Testing the Setup

### 1. Backend Health Check
```bash
# From any terminal with fixed PATH
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$PATH"
python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read())"
```

Expected: `{"status":"healthy"}`

### 2. Frontend Connectivity
Open http://localhost:5173 in your browser and check the browser console (F12) for any API errors.

### 3. API Documentation
Visit http://localhost:8000/docs to see all available endpoints and test them interactively.

---

## 🐛 Common Issues & Fixes

### Issue: "Command not found: node / npm"
**Fix**: The PATH environment is still broken from the old .zshrc
```bash
# Manually fix for current session:
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$PATH"

# Close terminal and open new one for permanent fix
```

### Issue: "Port 8000 already in use"
```bash
# Find process using port 8000:
lsof -ti:8000

# Kill it:
kill -9 <PID>

# Then restart backend
```

### Issue: "ModuleNotFoundError: No module named 'models'"
**Fix**: Make sure you're running from the backend directory:
```bash
cd "/Users/alok/Desktop/Resume Opti/backend"
python -m uvicorn main:app --reload --port 8000
```

### Issue: Frontend doesn't connect to backend
**Fix**: 
1. Verify backend is running: http://localhost:8000/health
2. Check Vite proxy config in `frontend/vite.config.js`
3. Check browser console (F12) for CORS errors
4. Ensure `ALLOWED_ORIGINS` in backend `.env` includes http://localhost:5173

---

## 📚 Documentation

- **Architecture**: See `AGENTS.md` for detailed architecture and patterns
- **Backend README**: `backend/README.md` for backend-specific info
- **API Docs**: Available at http://localhost:8000/docs (when running)

---

## ✨ Next Steps

1. **Start both services** following the instructions above
2. **Open frontend** at http://localhost:5173
3. **Set up LLM credentials** (Anthropic API key or OpenAI key)
4. **Upload a resume** to test the system
5. **Analyze** against a job description

---

## 🎯 Quick Reference Commands

```bash
# Navigate to project
cd "/Users/alok/Desktop/Resume Opti"

# Start backend
cd backend && python -m uvicorn main:app --reload --port 8000

# Start frontend (in another terminal)
cd frontend && npm run dev

# Access frontend
open http://localhost:5173

# Access API docs
open http://localhost:8000/docs

# View API health
python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read())"
```

---

**Status**: ✅ Setup Complete - Ready to develop!

