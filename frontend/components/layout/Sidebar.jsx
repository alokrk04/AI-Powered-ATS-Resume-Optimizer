/**
 * Sidebar — Navigation Rail
 * ==========================
 * Collapsible left sidebar with tab navigation, status, and branding.
 * Wide (220px) in open state, icon-only (64px) when collapsed.
 */
import React from 'react'
import { motion } from 'framer-motion'
import {
  UploadCloud, BarChart2, Layers, Wand2,
  Zap, ChevronLeft, ChevronRight, CheckCircle2,
} from 'lucide-react'
import useStore from '@/src/store'

const NAV_ITEMS = [
  { id: 'input',    icon: UploadCloud, label: 'Input',        sub: 'Resume + JD' },
  { id: 'score',    icon: BarChart2,   label: 'ATS Score',    sub: 'Full analysis' },
  { id: 'skills',   icon: Layers,      label: 'Skill Gap',    sub: 'Match / missing' },
  { id: 'optimize', icon: Wand2,       label: 'Optimize',     sub: 'XYZ bullets' },
  { id: 'bullet',   icon: Zap,         label: 'Bullet Tool',  sub: 'Single optimizer' },
]

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar, analysis, analysisLoading } = useStore()

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 220 : 64 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'var(--surf)',
        borderRight: '1px solid var(--bord)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo area */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--bord)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 64,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 32, height: 32, flexShrink: 0,
          background: 'var(--amber)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#000', fontSize: 16, fontWeight: 700,
          fontFamily: 'var(--font-mono)',
        }}>
          ⬡
        </div>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: 'var(--txt)',
              lineHeight: 1.2,
            }}>
              ATS OPT
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.12em',
              color: 'var(--txt-muted)',
              marginTop: 2,
            }}>
              v1.0 / CAREER AI
            </div>
          </motion.div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'hidden' }}>
        {NAV_ITEMS.map((item, i) => {
          const isActive   = activeTab === item.id
          const isLocked   = item.id !== 'input' && item.id !== 'bullet' && !analysis
          const Icon       = item.icon

          return (
            <motion.button
              key={item.id}
              onClick={() => !isLocked && setActiveTab(item.id)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: sidebarOpen ? '10px 12px' : '10px 0',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: isActive ? 'var(--amber-glow)' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '2px solid var(--amber)' : '2px solid transparent',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.35 : 1,
                borderRadius: '0 2px 2px 0',
                marginBottom: 2,
                transition: 'all 0.18s ease',
                color: isActive ? 'var(--amber)' : 'var(--txt-dim)',
              }}
              title={isLocked ? 'Run analysis first' : item.label}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.08 }}
                  style={{ textAlign: 'left', overflow: 'hidden' }}
                >
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: isActive ? 'var(--amber-dim)' : 'var(--txt-muted)',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-body)',
                  }}>
                    {item.sub}
                  </div>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Status area */}
      {sidebarOpen && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--bord)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <StatusRow
            label="Backend"
            status="online"
            color="var(--green)"
          />
          <StatusRow
            label="Analysis"
            status={analysisLoading ? 'running' : analysis ? 'complete' : 'idle'}
            color={analysisLoading ? 'var(--amber)' : analysis ? 'var(--green)' : 'var(--txt-muted)'}
          />
          {analysis && (
            <div style={{
              marginTop: 4,
              padding: '6px 8px',
              background: 'var(--green-glow)',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <CheckCircle2 size={11} color="var(--green)" />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.12em',
                color: 'var(--green)',
              }}>
                SCORE: {analysis.ats_score}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          right: -12,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 24, height: 24,
          background: 'var(--elevated)',
          border: '1px solid var(--bord)',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--txt-muted)',
          zIndex: 20,
          transition: 'all 0.2s ease',
        }}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </motion.aside>
  )
}

function StatusRow({ label, status, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--txt-muted)' }}>
        {label}
      </span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontFamily: 'var(--font-mono)', fontSize: 9, color,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: color,
          animation: status === 'running' ? 'pulse-ring 1.2s infinite' : 'none',
        }} />
        {status.toUpperCase()}
      </span>
    </div>
  )
}
