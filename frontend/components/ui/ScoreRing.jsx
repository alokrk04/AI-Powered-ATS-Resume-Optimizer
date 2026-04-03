/**
 * ScoreRing — Animated SVG Score Arc
 * ====================================
 * Renders an animated circular progress arc for the ATS score.
 * The arc draws in on mount using CSS animation.
 */
import React, { useEffect, useState } from 'react'

function scoreColor(s) {
  if (s >= 80) return { stroke: '#10b981', text: '#10b981', glow: 'rgba(16,185,129,0.2)' }
  if (s >= 60) return { stroke: '#f59e0b', text: '#f59e0b', glow: 'rgba(245,158,11,0.2)' }
  return        { stroke: '#f43f5e', text: '#f43f5e', glow: 'rgba(244,63,94,0.2)' }
}

function scoreLabel(s) {
  if (s >= 80) return 'EXCELLENT'
  if (s >= 60) return 'NEEDS WORK'
  if (s >= 40) return 'POOR'
  return 'CRITICAL'
}

export default function ScoreRing({ score = 0, size = 180, animated = true }) {
  const [displayed, setDisplayed] = useState(animated ? 0 : score)

  // Animate the number counting up
  useEffect(() => {
    if (!animated) { setDisplayed(score); return }
    let start = null
    const duration = 1200
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)  // ease-out-cubic
      setDisplayed(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [score, animated])

  const r      = size * 0.38
  const circ   = 2 * Math.PI * r
  const offset = circ - (displayed / 100) * circ
  const cx     = size / 2
  const cy     = size / 2
  const colors = scoreColor(score)
  const label  = scoreLabel(score)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Glow */}
      <div style={{
        position: 'absolute',
        inset: size * 0.15,
        borderRadius: '50%',
        background: colors.glow,
        filter: 'blur(20px)',
        opacity: 0.6,
      }} />

      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', position: 'relative' }}
      >
        {/* Track ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--bord)"
          strokeWidth={size * 0.055}
        />
        {/* Track ticks */}
        {Array.from({ length: 20 }, (_, i) => {
          const angle = (i / 20) * 2 * Math.PI - Math.PI / 2
          const outer = r + size * 0.06
          const inner = r + size * 0.04
          return (
            <line
              key={i}
              x1={cx + inner * Math.cos(angle)}
              y1={cy + inner * Math.sin(angle)}
              x2={cx + outer * Math.cos(angle)}
              y2={cy + outer * Math.sin(angle)}
              stroke="var(--bord-bright)"
              strokeWidth={1}
              opacity={0.4}
            />
          )
        })}

        {/* Score arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={size * 0.055}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: animated
              ? 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'none',
            filter: `drop-shadow(0 0 6px ${colors.stroke}40)`,
          }}
        />

        {/* Score number */}
        <text
          x={cx} y={cy - size * 0.04}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colors.text}
          fontSize={size * 0.22}
          fontWeight={700}
          fontFamily="'Space Mono', monospace"
          style={{ animation: 'count-up 0.6s ease-out both' }}
        >
          {displayed}
        </text>

        {/* Percent sign */}
        <text
          x={cx + size * 0.13} y={cy - size * 0.08}
          textAnchor="middle"
          fill={colors.text}
          fontSize={size * 0.09}
          fontFamily="'Space Mono', monospace"
          opacity={0.7}
        >
          %
        </text>

        {/* Label */}
        <text
          x={cx} y={cy + size * 0.16}
          textAnchor="middle"
          fill="var(--txt-muted)"
          fontSize={size * 0.07}
          fontFamily="'Space Mono', monospace"
          letterSpacing="2"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}
