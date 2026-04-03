/**
 * SkillGapPage
 * =============
 * Visual skill gap analysis:
 *  - Matched skills (green) vs Missing skills (red)
 *  - Missing ATS keywords (amber)
 *  - Coverage percentage donut
 *  - Category-grouped missing skills
 */
import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '@/src/store'
import { Card, SectionLabel, SkillChip, EmptyState } from '@/components/ui'
import { rewriteResume } from '@/services/api'

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function SkillGapPage() {
  const { analysis, setActiveTab, resumeText, setOptimizedResume, setRewriteLoading } = useStore()
  const [addedSkills, setAddedSkills] = useState([])
  const [adding, setAdding]           = useState(false)

  if (!analysis) {
    return (
      <EmptyState
        icon="◎"
        title="No skill data yet"
        desc="Run analysis first to see your skill gap report."
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

  const matched  = analysis.matched_skills  || []
  const missing  = analysis.missing_skills  || []
  const keywords = analysis.missing_keywords || []
  const coverage = matched.length + missing.length > 0
    ? Math.round((matched.length / (matched.length + missing.length)) * 100)
    : 0

  const toggleSkill = (skill) => {
    setAddedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const handleAddToResume = async () => {
    if (!addedSkills.length) {
      toast.error('Select skills to add first.')
      return
    }
    setAdding(true)
    setRewriteLoading(true)
    try {
      const result = await rewriteResume(resumeText, [], addedSkills)
      setOptimizedResume(result.optimized_resume)
      toast.success(`${addedSkills.length} skill(s) added — see Optimize tab for the full rewrite.`)
      setActiveTab('optimize')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAdding(false)
      setRewriteLoading(false)
    }
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      {/* Overview stats */}
      <motion.div
        variants={fadeUp}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}
      >
        <StatCard
          label="Skills Matched"
          value={matched.length}
          color="var(--green)"
          bg="var(--green-glow)"
          icon={<CheckCircle2 size={16} color="var(--green)" />}
        />
        <StatCard
          label="Skills Missing"
          value={missing.length}
          color="var(--red)"
          bg="var(--red-glow)"
          icon={<XCircle size={16} color="var(--red)" />}
        />
        <StatCard
          label="Missing Keywords"
          value={keywords.length}
          color="var(--amber)"
          bg="var(--amber-glow)"
          icon={<AlertTriangle size={16} color="var(--amber)" />}
        />
        <StatCard
          label="Coverage"
          value={`${coverage}%`}
          color={coverage >= 70 ? 'var(--green)' : coverage >= 50 ? 'var(--amber)' : 'var(--red)'}
          bg={coverage >= 70 ? 'var(--green-glow)' : coverage >= 50 ? 'var(--amber-glow)' : 'var(--red-glow)'}
        />
      </motion.div>

      {/* Main grid */}
      <motion.div
        variants={fadeUp}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}
      >
        {/* Matched skills */}
        <Card accent accentColor="var(--green)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle2 size={14} color="var(--green)" />
            <SectionLabel style={{ marginBottom: 0 }}>
              Matched Skills — {matched.length}
            </SectionLabel>
          </div>
          <p style={{ fontSize: 11, color: 'var(--txt-muted)', marginBottom: 14, lineHeight: 1.6 }}>
            These skills appear in both your resume and the job description. ✓
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {matched.length ? matched.map((s) => (
              <SkillChip key={s} label={s} variant="matched" />
            )) : (
              <span style={{ fontSize: 12, color: 'var(--txt-muted)' }}>No matched skills detected.</span>
            )}
          </div>
        </Card>

        {/* Missing skills */}
        <Card accent accentColor="var(--red)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle size={14} color="var(--red)" />
              <SectionLabel style={{ marginBottom: 0 }}>
                Missing Skills — {missing.length}
              </SectionLabel>
            </div>
            {addedSkills.length > 0 && (
              <button
                onClick={handleAddToResume}
                disabled={adding}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px',
                  background: 'var(--amber-glow)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: 'var(--amber)',
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.1em', cursor: 'pointer',
                }}
              >
                <Plus size={10} /> ADD {addedSkills.length} TO RESUME
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--txt-muted)', marginBottom: 14, lineHeight: 1.6 }}>
            Click a skill to select it, then add to your resume if you have the experience.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {missing.length ? missing.map((s) => (
              <span
                key={s}
                onClick={() => toggleSkill(s)}
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  background: addedSkills.includes(s) ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.08)',
                  border: `1px solid ${addedSkills.includes(s) ? 'rgba(245,158,11,0.4)' : 'rgba(244,63,94,0.25)'}`,
                  color: addedSkills.includes(s) ? 'var(--amber)' : 'var(--red)',
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
              >
                {addedSkills.includes(s) ? '✓ ' : ''}{s}
              </span>
            )) : (
              <span style={{ fontSize: 12, color: 'var(--green)' }}>
                ✓ No missing skills — great match!
              </span>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Missing keywords */}
      {keywords.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card accent accentColor="var(--amber)" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <AlertTriangle size={14} color="var(--amber)" />
              <SectionLabel style={{ marginBottom: 0 }}>
                Missing ATS Keywords — {keywords.length}
              </SectionLabel>
            </div>
            <p style={{ fontSize: 11, color: 'var(--txt-muted)', marginBottom: 14, lineHeight: 1.6 }}>
              These specific terms appear in the job description but not your resume. ATS systems
              weight exact keyword matches heavily — try to include these naturally.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {keywords.map((k) => (
                <SkillChip key={k} label={k} variant="keyword" />
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Coverage bar */}
      <motion.div variants={fadeUp}>
        <Card>
          <SectionLabel>Skill Coverage Breakdown</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 12, background: 'var(--bord)', overflow: 'hidden', display: 'flex' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${coverage}%` }}
                transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
                style={{ background: 'var(--green)', height: '100%' }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - coverage}%` }}
                transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
                style={{ background: 'var(--red)', height: '100%', opacity: 0.4 }}
              />
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: coverage >= 70 ? 'var(--green)' : 'var(--amber)',
              minWidth: 40,
            }}>
              {coverage}%
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Legend color="var(--green)" label={`${matched.length} matched`} />
            <Legend color="var(--red)"   label={`${missing.length} missing`} />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function StatCard({ label, value, color, bg, icon }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${color}30`,
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 10, color: 'var(--txt-muted)' }}>{label}</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 28,
        fontWeight: 700, color,
      }}>
        {value}
      </div>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, background: color }} />
      <span style={{ fontSize: 11, color: 'var(--txt-muted)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </span>
    </div>
  )
}
