/**
 * Shared UI Primitives
 * =====================
 * ProgressBar, SkillChip, Card, EmptyState, LoadingSpinner, Stat
 */
import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

// ── ProgressBar ───────────────────────────────────────────────────────────────

export function ProgressBar({
  label, value = 0, max = 100,
  color = 'var(--amber)', showValue = true,
  height = 3, delay = 0,
}) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--txt-dim)',
        }}>{label}</span>
        {showValue && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color, fontWeight: 700,
          }}>{pct}%</span>
        )}
      </div>
      <div style={{
        background: 'var(--bord)',
        height,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1], delay }}
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            background: color,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  )
}

// ── SkillChip ─────────────────────────────────────────────────────────────────

const chipVariants = {
  matched: {
    bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)',
    color: 'var(--green)',
  },
  missing: {
    bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.25)',
    color: 'var(--red)',
  },
  keyword: {
    bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)',
    color: 'var(--amber)',
  },
  neutral: {
    bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)',
    color: 'var(--txt-dim)',
  },
  violet: {
    bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)',
    color: 'var(--violet)',
  },
}

export function SkillChip({ label, variant = 'neutral', onClick }) {
  const v = chipVariants[variant] || chipVariants.neutral
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.05em',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({
  children, accent, accentColor = 'var(--amber)',
  padding = 20, style = {}, className,
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--bord)',
        borderLeft: accent ? `3px solid ${accentColor}` : '1px solid var(--bord)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

export function SectionLabel({ children, style = {} }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'var(--txt-muted)',
      marginBottom: 14,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Stat box ──────────────────────────────────────────────────────────────────

export function Stat({ label, value, color = 'var(--txt)', subLabel }) {
  const col = typeof color === 'function' ? color(value) : color
  return (
    <div style={{
      background: 'var(--surf)',
      border: '1px solid var(--bord)',
      padding: '16px 18px',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 10,
        color: 'var(--txt-muted)',
        marginBottom: 6,
        textTransform: 'capitalize',
      }}>
        {label}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 30,
          fontWeight: 700,
          color: col,
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </motion.div>
      <ProgressBar value={value} color={col} showValue={false} height={2} />
      {subLabel && (
        <div style={{ fontSize: 10, color: 'var(--txt-muted)', marginTop: 4 }}>
          {subLabel}
        </div>
      )}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, desc, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 40px',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 36, opacity: 0.15, marginBottom: 4 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.3rem',
        color: 'var(--txt-dim)',
      }}>{title}</div>
      {desc && (
        <p style={{ color: 'var(--txt-muted)', fontSize: 13, maxWidth: 360 }}>{desc}</p>
      )}
      {action}
    </motion.div>
  )
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 20, color = 'var(--amber)' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx={12} cy={12} r={10} opacity={0.2} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ style = {} }) {
  return (
    <div style={{
      height: 1,
      background: 'var(--bord)',
      margin: '0',
      ...style,
    }} />
  )
}
