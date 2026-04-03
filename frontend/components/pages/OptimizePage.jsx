/**
 * OptimizePage
 * =============
 * Two sections:
 *  1. Weak Bullet Rewrites — AI-generated XYZ formula improvements from analysis
 *  2. Full Resume Rewriter — Generate and download optimized resume text
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, ArrowRight, Copy, Check, Download, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '@/src/store'
import { rewriteResume, generatePDF } from '@/services/api'
import { Card, SectionLabel, EmptyState, LoadingSpinner } from '@/components/ui'

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function OptimizePage() {
  const {
    analysis, resumeText, jdText,
    setActiveTab, optimizedResume, setOptimizedResume,
    rewriteLoading, setRewriteLoading, pdfLoading, setPdfLoading,
  } = useStore()

  if (!analysis) {
    return (
      <EmptyState
        icon="⟡"
        title="No analysis data"
        desc="Run the analysis first to see bullet rewrites and optimization suggestions."
        action={
          <button
            onClick={() => setActiveTab('input')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 24px', background: 'var(--amber)', color: '#000',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.15em',
            }}
          >
            GO TO INPUT <ArrowRight size={12} />
          </button>
        }
      />
    )
  }

  const weakBullets = analysis.weak_bullets || []
  const missing     = analysis.missing_skills || []

  const handleRewrite = async () => {
    setRewriteLoading(true)
    try {
      const optimizedBullets = weakBullets.map((b) => b.optimized).filter(Boolean)
      const result = await rewriteResume(resumeText, optimizedBullets, missing.slice(0, 5))
      setOptimizedResume(result.optimized_resume)
      toast.success('Resume rewritten — ready to download!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRewriteLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    const text = optimizedResume || resumeText
    if (!text) { toast.error('No resume to export.'); return }
    setPdfLoading(true)
    try {
      const blob = await generatePDF(
        resumeText,
        weakBullets.map((b) => b.optimized).filter(Boolean),
        missing.slice(0, 5),
      )
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href = url; a.download = 'optimized_resume.pdf'; a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      {/* XYZ formula header */}
      <motion.div variants={fadeUp} style={{ marginBottom: 14 }}>
        <Card accent accentColor="var(--amber)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Wand2 size={14} color="var(--amber)" />
            <SectionLabel style={{ marginBottom: 0 }}>Google XYZ Formula</SectionLabel>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { letter: 'X', label: 'Action Verb + Task',   example: '"Engineered real-time pipeline"' },
              { letter: 'Y', label: 'Quantifiable Result',  example: '"reducing latency by 67%"' },
              { letter: 'Z', label: 'Method / Context',     example: '"using Apache Kafka + Redis"' },
            ].map((item) => (
              <div key={item.letter} style={{
                background: 'var(--surf)', padding: '14px 16px',
                borderTop: `2px solid var(--amber)`,
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 28,
                  fontWeight: 700, color: 'var(--amber)',
                  lineHeight: 1, marginBottom: 6,
                }}>
                  {item.letter}
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt)', marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt-muted)', fontStyle: 'italic' }}>
                  {item.example}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Weak bullet rewrites */}
      <motion.div variants={fadeUp} style={{ marginBottom: 14 }}>
        <Card>
          <SectionLabel>
            AI-Detected Weak Bullets — {weakBullets.length} found
          </SectionLabel>
          {weakBullets.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 11,
            }}>
              ✓ No weak bullets detected — your bullets are well-quantified!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {weakBullets.map((b, i) => (
                <BulletDiff key={i} index={i} bullet={b} />
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Full rewrite panel */}
      <motion.div variants={fadeUp}>
        <Card accent accentColor="var(--cyan)">
          <SectionLabel>Full Resume Rewriter</SectionLabel>
          <p style={{ fontSize: 12, color: 'var(--txt-muted)', marginBottom: 16, lineHeight: 1.7 }}>
            Generate a fully rewritten, ATS-optimised version of your resume — applying all bullet
            improvements and adding {missing.slice(0, 5).length} missing skills to your skills section.
          </p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              onClick={handleRewrite}
              disabled={rewriteLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 24px',
                background: rewriteLoading ? 'var(--bord)' : 'var(--cyan)',
                color: rewriteLoading ? 'var(--txt-muted)' : '#000',
                border: 'none', cursor: rewriteLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', transition: 'all 0.2s',
              }}
            >
              {rewriteLoading ? <LoadingSpinner size={13} color="var(--txt-muted)" /> : <RefreshCw size={13} />}
              {rewriteLoading ? 'REWRITING…' : 'REWRITE RESUME'}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || (!optimizedResume && !resumeText)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 24px',
                background: 'transparent',
                color: 'var(--amber)',
                border: '1px solid rgba(245,158,11,0.3)',
                cursor: pdfLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', transition: 'all 0.2s',
                opacity: (!optimizedResume && !resumeText) ? 0.4 : 1,
              }}
            >
              {pdfLoading ? <LoadingSpinner size={13} color="var(--amber)" /> : <Download size={13} />}
              {pdfLoading ? 'GENERATING…' : 'EXPORT PDF'}
            </button>
          </div>

          {/* Optimized resume preview */}
          <AnimatePresence>
            {optimizedResume && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  background: 'var(--surf)',
                  border: '1px solid var(--bord)',
                  padding: 16, marginTop: 4,
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 10,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      letterSpacing: '0.15em', color: 'var(--green)',
                    }}>
                      ✓ OPTIMIZED RESUME
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(optimizedResume)
                        toast.success('Copied to clipboard!')
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'none', border: '1px solid var(--bord)',
                        color: 'var(--txt-muted)', padding: '3px 10px',
                        fontFamily: 'var(--font-mono)', fontSize: 9,
                        letterSpacing: '0.1em', cursor: 'pointer',
                      }}
                    >
                      <Copy size={10} /> COPY
                    </button>
                  </div>
                  <pre style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11, lineHeight: 1.8,
                    color: 'var(--txt-dim)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    maxHeight: 360, overflowY: 'auto',
                  }}>
                    {optimizedResume}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ── BulletDiff sub-component ──────────────────────────────────────────────────
function BulletDiff({ index, bullet }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(bullet.optimized)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      borderBottom: '1px solid var(--bord)',
      paddingBottom: 14,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--txt-muted)', letterSpacing: '0.1em',
        }}>
          BULLET {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
        {/* Original */}
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--red)', letterSpacing: '0.1em', marginBottom: 6,
          }}>
            ✗ ORIGINAL
          </div>
          <div style={{
            padding: '10px 12px',
            background: 'var(--red-glow)',
            borderLeft: '2px solid var(--red)',
            fontSize: 12, lineHeight: 1.7,
            color: 'var(--txt-muted)',
          }}>
            {bullet.original}
          </div>
        </div>

        {/* Optimized */}
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--green)', letterSpacing: '0.1em', marginBottom: 6,
          }}>
            ✓ XYZ REWRITE
          </div>
          <div style={{
            padding: '10px 12px',
            background: 'var(--green-glow)',
            borderLeft: '2px solid var(--green)',
            fontSize: 12, lineHeight: 1.7,
            color: 'var(--txt)',
            position: 'relative',
          }}>
            {bullet.optimized}
          </div>
        </div>
      </div>

      {/* Improvement note + copy */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--amber)' }}>
          ↑ {bullet.improvement}
        </span>
        <button
          onClick={copy}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: '1px solid var(--bord)',
            color: copied ? 'var(--green)' : 'var(--txt-muted)',
            padding: '3px 10px',
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: '0.1em', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
    </div>
  )
}
