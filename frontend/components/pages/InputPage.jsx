/**
 * InputPage
 * ==========
 * Split-panel layout: Resume (left) | Job Description (right)
 * Analyze button at the bottom with multi-step progress.
 */
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, AlertCircle } from 'lucide-react'
import useStore from '@/src/store'
import { useAnalysis } from '@/hooks/useAnalysis'
import ResumeUploader from '@/components/layout/ResumeUploader'
import JDInput        from '@/components/layout/JDInput'
import { Card, LoadingSpinner } from '@/components/ui'

export default function InputPage() {
  const { resumeText, jdText, analysisLoading, analysisError } = useStore()
  const { run, stepLabel, stepPercent, steps, stepIdx } = useAnalysis()

  const isReady = resumeText.trim().length > 50 && jdText.trim().length > 50

  return (
    <div>
      {/* Error */}
      <AnimatePresence>
        {analysisError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px',
              background: 'var(--red-glow)',
              border: '1px solid rgba(244,63,94,0.25)',
              color: 'var(--red)',
              marginBottom: 14,
              fontSize: 13,
            }}
          >
            <AlertCircle size={14} />
            {analysisError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
        marginBottom: 16,
      }}>
        <Card>
          <ResumeUploader />
        </Card>
        <Card>
          <JDInput />
        </Card>
      </div>

      {/* Analyze CTA */}
      <Card style={{ textAlign: 'center' }}>
        <AnimatePresence mode="wait">
          {analysisLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Step tracker */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 8,
                marginBottom: 16,
              }}>
                {steps.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i < stepIdx
                        ? 'var(--green)'
                        : i === stepIdx
                          ? 'var(--amber)'
                          : 'var(--bord)',
                      transition: 'background 0.3s',
                      boxShadow: i === stepIdx ? '0 0 8px var(--amber)' : 'none',
                    }} />
                    {i < steps.length - 1 && (
                      <div style={{
                        width: 24, height: 1,
                        background: i < stepIdx ? 'var(--green)' : 'var(--bord)',
                        transition: 'background 0.3s',
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{
                height: 2, background: 'var(--bord)',
                marginBottom: 10, overflow: 'hidden',
              }}>
                <motion.div
                  animate={{ width: `${stepPercent}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'var(--amber)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <LoadingSpinner size={16} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11, letterSpacing: '0.15em',
                  color: 'var(--amber)',
                }}>
                  {stepLabel}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                color: isReady ? 'var(--txt)' : 'var(--txt-muted)',
                marginBottom: 6,
              }}>
                {isReady
                  ? 'Ready to analyze your resume'
                  : 'Add resume and job description to begin'}
              </div>
              {isReady && (
                <p style={{
                  color: 'var(--txt-muted)', fontSize: 12,
                  marginBottom: 16, maxWidth: 480, margin: '0 auto 16px',
                }}>
                  Our AI will score your resume across 4 ATS dimensions, identify skill gaps,
                  and suggest XYZ formula bullet rewrites.
                </p>
              )}

              <button
                onClick={run}
                disabled={!isReady}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 40px',
                  background: isReady ? 'var(--amber)' : 'var(--bord)',
                  color: isReady ? '#000' : 'var(--txt-muted)',
                  border: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.18em',
                  cursor: isReady ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                <Cpu size={14} />
                ANALYZE RESUME
              </button>

              {!isReady && (
                <div style={{
                  marginTop: 12,
                  display: 'flex', gap: 20, justifyContent: 'center',
                }}>
                  <Requirement met={resumeText.trim().length > 50} label="Resume added" />
                  <Requirement met={jdText.trim().length > 50}     label="JD added" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}

function Requirement({ met, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--font-mono)', fontSize: 9,
      letterSpacing: '0.12em',
      color: met ? 'var(--green)' : 'var(--txt-muted)',
    }}>
      <span>{met ? '✓' : '○'}</span>
      <span>{label}</span>
    </div>
  )
}
