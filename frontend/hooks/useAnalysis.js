/**
 * useAnalysis Hook
 * =================
 * Orchestrates the full analysis pipeline:
 *   upload/parse → quick score → full LLM analysis → store results
 *
 * Provides granular loading states so the UI can show a multi-step
 * progress indicator rather than a single spinner.
 */
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { analyzeResume, parseResumeText, uploadResume } from '@/services/api'
import useStore from '@/src/store'

const STEPS = [
  { id: 'parse',   label: 'Parsing resume...' },
  { id: 'score',   label: 'Computing ATS score...' },
  { id: 'llm',     label: 'Running AI analysis...' },
  { id: 'skills',  label: 'Mapping skill gaps...' },
  { id: 'done',    label: 'Analysis complete' },
]

export function useAnalysis() {
  const [step, setStep]       = useState(null)   // current step id
  const [stepIdx, setStepIdx] = useState(0)      // 0–4

  const {
    resumeText, resumeFile, jdText,
    setAnalysis, setAnalysisLoading, setAnalysisError,
    setParsedResume, setResumeText, setActiveTab,
  } = useStore()

  const advance = (idx) => {
    setStepIdx(idx)
    setStep(STEPS[idx].id)
  }

  const run = useCallback(async () => {
    if (!jdText.trim()) {
      toast.error('Please paste a job description first.')
      return
    }

    setAnalysisLoading(true)
    setAnalysisError(null)
    advance(0)

    try {
      // ── Step 0: Parse / upload resume ────────────────────────────
      let text = resumeText
      if (resumeFile && !resumeText) {
        const parsed = await uploadResume(resumeFile)
        setParsedResume(parsed)
        text = parsed.raw_text
        setResumeText(text)
      } else if (text) {
        const parsed = await parseResumeText(text)
        setParsedResume(parsed)
      }

      if (!text?.trim()) {
        throw new Error('Resume content is empty. Please upload a file or paste your resume.')
      }

      // ── Step 1–3: Full analysis (combines rule + LLM) ────────────
      advance(1)
      await new Promise((r) => setTimeout(r, 300))   // brief UX pause
      advance(2)

      const result = await analyzeResume(text, jdText)

      advance(3)
      await new Promise((r) => setTimeout(r, 200))
      advance(4)

      setAnalysis(result)
      setActiveTab('score')
      toast.success(`Analysis complete — ATS Score: ${result.ats_score}%`)
    } catch (err) {
      setAnalysisError(err.message)
      toast.error(err.message)
    } finally {
      setAnalysisLoading(false)
      setStep(null)
    }
  }, [resumeText, resumeFile, jdText])

  return {
    run,
    step,
    stepIdx,
    stepLabel:   step ? STEPS.find((s) => s.id === step)?.label : null,
    stepPercent: Math.round((stepIdx / (STEPS.length - 1)) * 100),
    steps:       STEPS,
  }
}
