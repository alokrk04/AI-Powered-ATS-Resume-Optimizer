/**
 * BulletPage — Standalone Bullet Point Optimizer
 * ================================================
 * Input one weak bullet → get 3 XYZ-formula enhanced versions.
 * Each version has: Impact-focused / Metric-driven / Leadership & Scale.
 *
 * Includes:
 *  - Job context field (optional)
 *  - Before/after diff display
 *  - Copy-to-clipboard for each version
 *  - Session history of optimized bullets
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Copy, Check, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '@/src/store'
import { useBulletOptimizer } from '@/hooks/useBulletOptimizer'
import { Card, SectionLabel, LoadingSpinner } from '@/components/ui'

const VERSION_COLORS = [
  { stroke: 'var(--amber)', bg: 'var(--amber-glow)', label: 'Impact-focused' },
  { stroke: 'var(--green)', bg: 'var(--green-glow)', label: 'Metric-driven' },
  { stroke: 'var(--cyan)',  bg: 'var(--cyan-glow)',  label: 'Leadership & Scale' },
]

// Example bullets to seed inspiration
const EXAMPLES = [
  'Responsible for managing the team and handling customer complaints',
  'Helped with developing new features for the product',
  'Worked on improving the website and fixing bugs',
  'Assisted in data analysis projects',
  'Managed social media accounts for the company',
]

export default function BulletPage() {
  const {
    bulletInput, setBulletInput,
    bulletContext, setBulletContext,
    bulletResults, bulletLoading, bulletError,
    clearBulletResults,
  } = useStore()

  const { optimize } = useBulletOptimizer()
  const [history, setHistory]     = useState([])   // { original, versions }[]
  const [showHistory, setShowHistory] = useState(false)
  const [showTips, setShowTips]   = useState(true)

  const handleOptimize = async () => {
    clearBulletResults()
    await optimize()
    // On success, store to history
    if (bulletInput && useStore.getState().bulletResults) {
      setHistory((prev) => [
        { original: bulletInput, versions: useStore.getState().bulletResults, ts: Date.now() },
        ...prev.slice(0, 9),
      ])
    }
  }

  const loadExample = (ex) => {
    setBulletInput(ex)
    clearBulletResults()
  }

  return (
    <div>
      {/* Tips panel */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={() => setShowTips((p) => !p)}
          style={{
            width: '100%', background: 'var(--surf)',
            border: '1px solid var(--bord)', padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', color: 'var(--txt-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={13} color="var(--amber)" />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              letterSpacing: '0.15em', color: 'var(--amber)',
            }}>
              HOW TO WRITE GREAT BULLETS
            </span>
          </div>
          {showTips ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <AnimatePresence>
          {showTips && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                background: 'var(--surf)',
                border: '1px solid var(--bord)', borderTop: 'none',
                padding: '16px',
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
              }}>
                {[
                  { bad: '✗ Responsible for managing team',    good: '✓ Led 8-engineer squad, shipping 3 features / sprint' },
                  { bad: '✗ Helped improve performance',       good: '✓ Cut API latency 67% via Redis caching layer' },
                  { bad: '✗ Worked on customer success',       good: '✓ Resolved 200+ tickets monthly; lifted NPS from 41→68' },
                ].map((tip, i) => (
                  <div key={i} style={{ fontSize: 11, lineHeight: 1.7 }}>
                    <div style={{ color: 'var(--red)', marginBottom: 4 }}>{tip.bad}</div>
                    <div style={{ color: 'var(--green)' }}>{tip.good}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input card */}
      <Card accent accentColor="var(--amber)" style={{ marginBottom: 14 }}>
        <SectionLabel>Bullet Point Input</SectionLabel>

        {/* Optional context */}
        <div style={{ marginBottom: 10 }}>
          <label style={{
            display: 'block', fontSize: 10, color: 'var(--txt-muted)',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
            marginBottom: 5,
          }}>
            ROLE CONTEXT (optional — e.g. "Senior Software Engineer at fintech startup")
          </label>
          <input
            type="text"
            value={bulletContext}
            onChange={(e) => setBulletContext(e.target.value)}
            placeholder="Job title, industry, or company type..."
            style={{
              width: '100%', background: 'var(--surf)',
              border: '1px solid var(--bord)', color: 'var(--txt)',
              fontFamily: 'var(--font-body)', fontSize: 12,
              padding: '8px 12px', outline: 'none',
            }}
          />
        </div>

        {/* Main bullet input */}
        <label style={{
          display: 'block', fontSize: 10, color: 'var(--txt-muted)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
          marginBottom: 5,
        }}>
          WEAK BULLET POINT
        </label>
        <textarea
          value={bulletInput}
          onChange={(e) => setBulletInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleOptimize()
          }}
          placeholder="Paste a weak resume bullet here, e.g.&#10;&quot;Responsible for managing customer accounts and handling support tickets&quot;"
          rows={3}
          style={{
            width: '100%', background: 'var(--surf)',
            border: '1px solid var(--bord)', color: 'var(--txt)',
            fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.7,
            padding: '12px 14px', resize: 'none', outline: 'none',
            marginBottom: 10,
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--amber)'}
          onBlur={(e)  => e.target.style.borderColor = 'var(--bord)'}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={handleOptimize}
            disabled={bulletLoading || !bulletInput.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 32px',
              background: bulletLoading || !bulletInput.trim() ? 'var(--bord)' : 'var(--amber)',
              color: bulletLoading || !bulletInput.trim() ? 'var(--txt-muted)' : '#000',
              border: 'none',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.15em',
              cursor: bulletLoading || !bulletInput.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {bulletLoading
              ? <><LoadingSpinner size={14} color="var(--txt-muted)" /> OPTIMIZING…</>
              : <><Zap size={14} /> OPTIMIZE BULLET</>
            }
          </button>

          <span style={{
            fontSize: 9, color: 'var(--txt-muted)',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
          }}>
            ⌘↵ to run
          </span>
        </div>

        {/* Example bullets */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--bord)' }}>
          <div style={{
            fontSize: 9, color: 'var(--txt-muted)',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.12em',
            marginBottom: 8,
          }}>
            TRY AN EXAMPLE:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => loadExample(ex)}
                style={{
                  padding: '3px 10px',
                  background: 'transparent',
                  border: '1px solid var(--bord)',
                  color: 'var(--txt-muted)',
                  fontSize: 10, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                  maxWidth: 220,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { e.target.style.borderColor = 'var(--amber)'; e.target.style.color = 'var(--amber)' }}
                onMouseLeave={(e) => { e.target.style.borderColor = 'var(--bord)'; e.target.style.color = 'var(--txt-muted)' }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Error */}
      {bulletError && (
        <div style={{
          padding: '10px 14px', marginBottom: 14,
          background: 'var(--red-glow)',
          border: '1px solid rgba(244,63,94,0.25)',
          color: 'var(--red)', fontSize: 12,
        }}>
          {bulletError}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {bulletResults && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card style={{ marginBottom: 14 }}>
              <SectionLabel>3 Enhanced Versions</SectionLabel>

              {/* Original reminder */}
              <div style={{
                padding: '8px 12px', marginBottom: 16,
                background: 'rgba(244,63,94,0.06)',
                borderLeft: '2px solid var(--red)',
                fontSize: 12, color: 'var(--txt-muted)', lineHeight: 1.7,
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--red)', letterSpacing: '0.1em', marginRight: 8,
                }}>
                  ORIGINAL
                </span>
                {bulletInput}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bulletResults.map((ver, i) => (
                  <VersionCard key={i} version={ver} index={i} />
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory((p) => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--txt-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 9,
              letterSpacing: '0.15em', marginBottom: 10, padding: 0,
            }}
          >
            {showHistory ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            SESSION HISTORY ({history.length})
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                {history.map((entry, i) => (
                  <div
                    key={entry.ts}
                    style={{
                      marginBottom: 8, padding: '10px 14px',
                      background: 'var(--surf)',
                      border: '1px solid var(--bord)',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setBulletInput(entry.original)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--txt-muted)', marginBottom: 4,
                    }}>
                      #{history.length - i}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--txt-dim)', lineHeight: 1.6 }}>
                      {entry.original}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ── VersionCard ───────────────────────────────────────────────────────────────
function VersionCard({ version, index }) {
  const [copied, setCopied] = useState(false)
  const col = VERSION_COLORS[index] || VERSION_COLORS[0]

  const copy = () => {
    navigator.clipboard?.writeText(version.text)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      style={{
        padding: '14px 16px',
        background: col.bg,
        border: '1px solid var(--bord)',
        borderLeft: `3px solid ${col.stroke}`,
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            color: col.stroke, letterSpacing: '0.12em',
          }}>
            VERSION {index + 1}
          </span>
          <span style={{
            padding: '2px 8px',
            background: 'var(--surf)',
            border: `1px solid ${col.stroke}30`,
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: col.stroke, letterSpacing: '0.08em',
          }}>
            {version.approach || col.label}
          </span>
        </div>
        <button
          onClick={copy}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: '1px solid var(--bord)',
            color: copied ? 'var(--green)' : 'var(--txt-muted)',
            padding: '3px 10px',
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: '0.08em', cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'COPIED!' : 'COPY'}
        </button>
      </div>

      <div style={{ fontSize: 13, color: 'var(--txt)', lineHeight: 1.7, marginBottom: 8 }}>
        {version.text}
      </div>

      <div style={{
        fontSize: 10, color: col.stroke,
        fontFamily: 'var(--font-body)', fontStyle: 'italic',
      }}>
        ↑ {version.improvement}
      </div>
    </motion.div>
  )
}
