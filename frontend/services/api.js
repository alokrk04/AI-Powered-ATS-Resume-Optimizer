/**
 * API Service Layer
 * ==================
 * Centralised Axios instance + typed API calls for every backend endpoint.
 *
 * Base URL is auto-proxied by Vite (/api → http://localhost:8000/api).
 * In production, set VITE_API_BASE_URL in your .env file.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90_000,  // 90s — LLM calls can be slow
  headers: { 'Content-Type': 'application/json' },
})

// ── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Attach auth token if present (future use)
  const token = localStorage.getItem('ats_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response Interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)

// ── Resume Endpoints ─────────────────────────────────────────────────────────

/**
 * Upload a PDF or DOCX resume file.
 * @param {File} file
 * @param {Function} onProgress  (percent: number) => void
 * @returns {Promise<ParsedResumeResponse>}
 */
export const uploadResume = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api
    .post('/api/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    })
    .then((r) => r.data)
}

/**
 * Parse raw pasted resume text (no file upload).
 * @param {string} text
 * @returns {Promise<ParsedResumeResponse>}
 */
export const parseResumeText = (text) =>
  api.post('/api/resume/parse-text', { text }).then((r) => r.data)

// ── Analysis Endpoints ───────────────────────────────────────────────────────

/**
 * Full ATS analysis: rule-based + LLM scoring, skill gap, bullet review.
 * @param {string} resumeText
 * @param {string} jobDescription
 * @returns {Promise<ATSAnalysisResponse>}
 */
export const analyzeResume = (resumeText, jobDescription) =>
  api
    .post('/api/analyze/', { resume_text: resumeText, job_description: jobDescription })
    .then((r) => r.data)

/**
 * Fast rule-based score only — no LLM, ~100ms.
 * @param {string} resumeText
 * @param {string} jobDescription
 * @returns {Promise<{ats_score: number, method: string}>}
 */
export const quickScore = (resumeText, jobDescription) =>
  api
    .post('/api/analyze/quick-score', {
      resume_text: resumeText,
      job_description: jobDescription,
    })
    .then((r) => r.data)

// ── Optimization Endpoints ────────────────────────────────────────────────────

/**
 * Optimize a single bullet point into 3 XYZ formula versions.
 * @param {string} bullet
 * @param {string|null} context   Optional job title / industry
 * @returns {Promise<BulletOptimizeResponse>}
 */
export const optimizeBullet = (bullet, context = null) =>
  api
    .post('/api/optimize/bullet', { bullet, context })
    .then((r) => r.data)

/**
 * Rewrite the full resume in ATS-compliant format.
 * @param {string} resumeText
 * @param {string[]} optimizedBullets
 * @param {string[]} addedSkills
 * @returns {Promise<{optimized_resume: string}>}
 */
export const rewriteResume = (resumeText, optimizedBullets = [], addedSkills = []) =>
  api
    .post('/api/optimize/rewrite', {
      resume_text:       resumeText,
      optimized_bullets: optimizedBullets,
      added_skills:      addedSkills,
    })
    .then((r) => r.data)

/**
 * Generate and download an ATS-compliant PDF.
 * @param {string} resumeText
 * @param {string[]} optimizedBullets
 * @param {string[]} addedSkills
 * @returns {Promise<Blob>}
 */
export const generatePDF = (resumeText, optimizedBullets = [], addedSkills = []) =>
  api
    .post(
      '/api/optimize/generate-pdf',
      {
        resume_text:       resumeText,
        optimized_bullets: optimizedBullets,
        added_skills:      addedSkills,
      },
      { responseType: 'blob' },
    )
    .then((r) => r.data)

export default api
