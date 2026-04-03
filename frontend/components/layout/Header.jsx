/**
 * Header — Top Bar
 * =================
 * Shows current tab title, analysis progress bar, and quick actions.
 */
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '@/src/store'
import { generatePDF } from '@/services/api'

const TAB_META = {
  input:    { title: 'Resume Input',        desc: 'Upload or paste your resume + job description' },
  score:    { title: 'ATS Score Report',    desc: 'AI-powered scoring & recommendations' },
  skills:   { title: 'Skill Gap Analysis',  desc: 'Matched vs missing skills against the JD' },
  optimize: { title: 'Bullet Optimizer',    desc: 'XYZ formula rewrites for weak bullets' },
  bullet:   { title: 'Bullet Point Tool',   desc: 'Transform any single bullet in seconds' },
}

export default function Header() {
  const {
    activeTab, analysis, analysisLoading,
    setPdfLoading, pdfLoading, resumeText, clearAnalysis,
  } = useStore()

  const meta = TAB_META[activeTab] || TAB_META.input

  const handleDownloadPDF = async () => {
    if (!resumeText) { toast.error('No resume to export.'); return }
    setPdfLoading(true)
    try {
      const blob = await generatePDF(resumeText)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'optimized_resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <header style={{
      background: 'var(--surf)',
      borderBottom: '1px solid var(--bord)',
      padding: '0 28px',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Analysis progress bar */}
      <AnimatePresence>
        {analysisLoading && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 2,
              background: 'linear-gradient(90deg, var(--amber), var(--cyan), var(--amber))',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s linear infinite',
              transformOrigin: 'left',
            }}
          />
        )}
      </AnimatePresence>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
      }}>
        {/* Left: breadcrumb + title */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.2em',
                color: 'var(--txt-muted)',
                marginBottom: 2,
              }}>
                ATS OPTIMIZER / {activeTab.toUpperCase()}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: 'var(--txt)',
                lineHeight: 1,
              }}>
                {meta.title}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {analysis && (
            <>
              {/* Reset */}
              <ActionBtn
                icon={<RefreshCw size={13} />}
                label="RESET"
                onClick={() => { clearAnalysis(); toast('Analysis cleared.') }}
                color="var(--txt-muted)"
              />

              {/* Download PDF */}
              <ActionBtn
                icon={<Download size={13} />}
                label={pdfLoading ? 'EXPORTING…' : 'EXPORT PDF'}
                onClick={handleDownloadPDF}
                color="var(--amber)"
                accent
                disabled={pdfLoading}
              />
            </>
          )}

          {/* Score badge */}
          {analysis && (
            <ScorePill score={analysis.ats_score} />
          )}
        </div>
      </div>
    </header>
  )
}

function ActionBtn({ icon, label, onClick, color, accent, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 14px',
        background: accent ? 'var(--amber-glow)' : 'transparent',
        border: `1px solid ${accent ? 'rgba(245,158,11,0.3)' : 'var(--bord)'}`,
        color: color,
        fontFamily: 'var(--font-mono)',
        fontSize: 9, fontWeight: 700,
        letterSpacing: '0.15em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.18s ease',
      }}
    >
      {icon} {label}
    </button>
  )
}

function ScorePill({ score }) {
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)'
  const bg    = score >= 80 ? 'var(--green-glow)' : score >= 60 ? 'var(--amber-glow)' : 'var(--red-glow)'
  return (
    <div style={{
      padding: '5px 12px',
      background: bg,
      border: `1px solid ${color}`,
      color,
      fontFamily: 'var(--font-mono)',
      fontSize: 11, fontWeight: 700,
      letterSpacing: '0.1em',
    }}>
      {score}% ATS
    </div>
  )
}
