/**
 * JDInput — Job Description Input
 * =================================
 * Large textarea for job description with:
 *  - Live keyword extraction preview
 *  - Character / word counter
 *  - Quick-score debounce (optional, disabled by default to save API calls)
 */
import React, { useMemo } from 'react'
import { Briefcase } from 'lucide-react'
import useStore from '@/src/store'
import { SectionLabel } from '@/components/ui'

// Common words to strip from keyword preview
const STOP = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','will','would','can',
  'should','may','we','our','you','your','they','their','this','that',
  'these','those','it','its','as','if','so','all','any','some','who',
  'which','what','how','role','team','work','join','strong','ability',
  'experience','skills','required','preferred','etc','using','well',
])

function extractKeywords(text) {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s+#]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w))
  )].slice(0, 18)
}

export default function JDInput() {
  const { jdText, setJdText } = useStore()

  const keywords = useMemo(() => extractKeywords(jdText), [jdText])
  const wordCount = useMemo(
    () => jdText.split(/\s+/).filter(Boolean).length,
    [jdText],
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Briefcase size={14} color="var(--cyan)" />
        <SectionLabel style={{ marginBottom: 0, color: 'var(--txt-muted)' }}>
          Target Job Description
        </SectionLabel>
      </div>

      <textarea
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        placeholder={`Paste the full job description here...\n\nInclude:\n• Role requirements and responsibilities\n• Required technical skills\n• Nice-to-have qualifications\n• About the company (optional)\n\nMore detail = more accurate analysis.`}
        rows={16}
        style={{
          width: '100%',
          background: 'var(--surf)',
          border: '1px solid var(--bord)',
          color: 'var(--txt)',
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          lineHeight: 1.8,
          padding: 16,
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.18s ease',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--cyan)'}
        onBlur={(e)  => e.target.style.borderColor = 'var(--bord)'}
      />

      {/* Stats row */}
      <div style={{
        marginTop: 6,
        display: 'flex', gap: 14, alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: '0.12em', color: 'var(--txt-muted)',
        }}>
          {wordCount} words
        </span>
        {wordCount < 80 && jdText.length > 0 && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: '0.1em', color: 'var(--amber)',
          }}>
            ⚠ JD seems short — more detail improves accuracy
          </span>
        )}
      </div>

      {/* Keyword preview */}
      {keywords.length > 0 && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'var(--cyan-glow)',
          border: '1px solid rgba(34,211,238,0.15)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: '0.15em', color: 'var(--cyan)',
            marginBottom: 8,
          }}>
            KEY TERMS DETECTED
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {keywords.map((kw) => (
              <span
                key={kw}
                style={{
                  padding: '2px 8px',
                  background: 'rgba(34,211,238,0.06)',
                  border: '1px solid rgba(34,211,238,0.2)',
                  color: 'var(--cyan)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
