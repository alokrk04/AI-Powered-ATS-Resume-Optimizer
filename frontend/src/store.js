/**
 * Global Application Store (Zustand)
 * ====================================
 * Single source of truth for resume analysis state,
 * UI state, and caches across all pages.
 */
import { create } from 'zustand'

const useStore = create((set, get) => ({
  // ── Resume & JD ────────────────────────────────────────────────
  resumeText:      '',
  resumeFile:      null,       // { name, size, type }
  parsedResume:    null,       // ParsedResumeResponse from /api/resume/upload
  jdText:          '',

  setResumeText:   (t)  => set({ resumeText: t }),
  setResumeFile:   (f)  => set({ resumeFile: f }),
  setParsedResume: (pr) => set({ parsedResume: pr }),
  setJdText:       (t)  => set({ jdText: t }),

  // ── Analysis ───────────────────────────────────────────────────
  analysis:        null,       // ATSAnalysisResponse
  analysisLoading: false,
  analysisError:   null,

  setAnalysis:        (a)  => set({ analysis: a }),
  setAnalysisLoading: (v)  => set({ analysisLoading: v }),
  setAnalysisError:   (e)  => set({ analysisError: e }),
  clearAnalysis:      ()   => set({ analysis: null, analysisError: null }),

  // ── Bullet Optimizer ──────────────────────────────────────────
  bulletInput:   '',
  bulletContext: '',
  bulletResults: null,
  bulletLoading: false,
  bulletError:   null,

  setBulletInput:   (v) => set({ bulletInput: v }),
  setBulletContext: (v) => set({ bulletContext: v }),
  setBulletResults: (r) => set({ bulletResults: r }),
  setBulletLoading: (v) => set({ bulletLoading: v }),
  setBulletError:   (e) => set({ bulletError: e }),
  clearBulletResults: () => set({ bulletResults: null, bulletError: null }),

  // ── Optimized Resume ──────────────────────────────────────────
  optimizedResume: null,
  rewriteLoading:  false,
  pdfLoading:      false,

  setOptimizedResume: (r) => set({ optimizedResume: r }),
  setRewriteLoading:  (v) => set({ rewriteLoading: v }),
  setPdfLoading:      (v) => set({ pdfLoading: v }),

  // ── UI ────────────────────────────────────────────────────────
  activeTab: 'input',
  sidebarOpen: true,

  setActiveTab:    (t) => set({ activeTab: t }),
  toggleSidebar:   ()  => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ── Derived helpers ───────────────────────────────────────────
  isReady: () => {
    const { resumeText, jdText } = get()
    return resumeText.trim().length > 50 && jdText.trim().length > 50
  },
  hasAnalysis: () => !!get().analysis,
}))

export default useStore
