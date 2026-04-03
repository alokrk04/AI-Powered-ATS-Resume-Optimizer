/**
 * ScorePage
 * ==========
 * The main results page:
 *  - Animated score ring (0–100)
 *  - 4-dimension score breakdown bars
 *  - Per-section scores (Experience, Skills, Education, Summary)
 *  - AI-generated recommendations
 *  - Overall summary text
 */
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import useStore from '@/src/store'
import ScoreRing from '@/components/ui/ScoreRing'
import {
  ProgressBar, Card, SectionLabel, Stat, EmptyState,
} from '@/components/ui'

function scoreColor(s) {
  if (s >= 80) return 'var(--green)'
  if (s >= 60) return 'var(--amber)'
  return 'var(--red)'
}

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32 } },
}

export default function ScorePage() {
  const { analysis, setActiveTab } = useStore()

  if (!analysis) {
    return (
      <EmptyState
        icon="◈"
        title="No analysis yet"
        desc="Head to the Input tab, paste your resume and job description, then run the analysis."
        action={
          <button
            onClick={() => setActiveTab('input')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 24px',
              background: 'var(--amber)', color: '#000',
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

  const sb = analysis.score_breakdown || {}
  const ss = analysis.section_scores  || {}

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      {/* Row 1: Score ring + summary card */}
      <motion.div
        variants={fadeUp}
        style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, marginBottom: 14 }}
      >
        {/* Score ring */}
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <ScoreRing score={analysis.ats_score} size={180} />
          <div style={{ marginTop: 14, width: '100%' }}>
            <ProgressBar
              label="Overall ATS Match"
              value={analysis.ats_score}
              color={scoreColor(analysis.ats_score)}
              delay={0.6}
            />
          </div>
        </Card>

        {/* Summary + recommendations */}
        <Card accent accentColor={scoreColor(analysis.ats_score)}>
          <SectionLabel>Analysis Summary</SectionLabel>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            color: 'var(--txt)',
            lineHeight: 1.6,
            marginBottom: 18,
          }}>
            {analysis.summary}
          </p>

          <SectionLabel>Top Recommendations</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(analysis.recommendations || []).map((rec, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  paddingBottom: i < (analysis.recommendations.length - 1) ? 8 : 0,
                  borderBottom: i < (analysis.recommendations.length - 1) ? '1px solid var(--bord)' : 'none',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--amber)', minWidth: 20, paddingTop: 2,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 12, color: 'var(--txt)', lineHeight: 1.7 }}>
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Row 2: Score breakdown bars */}
      <motion.div variants={fadeUp}>
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>Score Breakdown — 4 ATS Dimensions</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
            <div>
              <ProgressBar
                label="Keyword Match"
                value={sb.keyword_match ?? 0}
                color="var(--cyan)" delay={0.1}
              />
              <ProgressBar
                label="Formatting Quality"
                value={sb.formatting ?? 0}
                color="var(--green)" delay={0.2}
              />
            </div>
            <div>
              <ProgressBar
                label="Semantic Relevance"
                value={sb.relevance ?? 0}
                color="var(--amber)" delay={0.3}
              />
              <ProgressBar
                label="Quantification"
                value={sb.quantification ?? 0}
                color="var(--violet)" delay={0.4}
              />
            </div>
          </div>

          {/* Legend */}
          <div style={{
            marginTop: 14, paddingTop: 12,
            borderTop: '1px solid var(--bord)',
            display: 'flex', gap: 20, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Keyword Match', weight: '40%', color: 'var(--cyan)' },
              { label: 'Formatting',    weight: '25%', color: 'var(--green)' },
              { label: 'Relevance',     weight: '20%', color: 'var(--amber)' },
              { label: 'Quantification',weight: '15%', color: 'var(--violet)' },
            ].map((d) => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--txt-muted)' }}>
                  {d.label} <span style={{ color: d.color, fontFamily: 'var(--font-mono)' }}>({d.weight})</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Row 3: Section scores */}
      <motion.div variants={fadeUp}>
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>Section Scores</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {Object.entries(ss).map(([key, val]) => (
              <Stat
                key={key}
                label={key.replace(/_/g, ' ')}
                value={val}
                color={(v) => scoreColor(v)}
              />
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
