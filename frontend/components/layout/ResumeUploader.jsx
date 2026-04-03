/**
 * ResumeUploader
 * ===============
 * Two-mode resume input:
 *   1. Drag-and-drop / click to upload PDF or DOCX
 *   2. Paste raw resume text into a textarea
 *
 * Parsed metadata (skills, education, sections) shown after upload.
 */
import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '@/src/store'
import { uploadResume } from '@/services/api'
import { Card, SectionLabel, SkillChip, LoadingSpinner } from '@/components/ui'

const MAX_SIZE = 5 * 1024 * 1024   // 5 MB

export default function ResumeUploader() {
  const [mode, setMode]       = useState('paste')  // 'upload' | 'paste'
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  const {
    resumeText, setResumeText,
    resumeFile, setResumeFile,
    parsedResume, setParsedResume,
  } = useStore()

  // ── Dropzone ────────────────────────────────────────────────────
  const onDrop = useCallback(async (accepted, rejected) => {
    if (rejected.length) {
      const reason = rejected[0]?.errors?.[0]?.code === 'file-too-large'
        ? 'File exceeds 5 MB limit.'
        : 'Only PDF and DOCX files are accepted.'
      toast.error(reason)
      return
    }
    const file = accepted[0]
    if (!file) return

    setResumeFile({ name: file.name, size: file.size, type: file.type })
    setUploading(true)
    setUploadPct(0)

    try {
      const parsed = await uploadResume(file, setUploadPct)
      setParsedResume(parsed)
      setResumeText(parsed.raw_text)
      toast.success(`Parsed "${file.name}" — ${parsed.skills.length} skills detected`)
    } catch (err) {
      toast.error(err.message)
      setResumeFile(null)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_SIZE,
    multiple: false,
  })

  const clearFile = () => {
    setResumeFile(null)
    setParsedResume(null)
    setResumeText('')
  }

  return (
    <div>
      {/* Mode toggle */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 14,
        borderBottom: '1px solid var(--bord)',
      }}>
        {[
          { id: 'paste',  label: 'PASTE TEXT' },
          { id: 'upload', label: 'UPLOAD FILE' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              padding: '8px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: mode === m.id ? '2px solid var(--amber)' : '2px solid transparent',
              color: mode === m.id ? 'var(--amber)' : 'var(--txt-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.15em',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.18s ease',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'paste' ? (
          <motion.div
            key="paste"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SectionLabel>Resume Content</SectionLabel>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={`Paste your full resume here...\n\nInclude:\n• Name and contact info\n• Work experience with dates and bullets\n• Education\n• Skills section\n• Projects, certifications (optional)`}
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
              onFocus={(e) => e.target.style.borderColor = 'var(--amber)'}
              onBlur={(e) =>  e.target.style.borderColor = 'var(--bord)'}
            />
            {resumeText && (
              <div style={{
                marginTop: 6,
                display: 'flex', gap: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 9, color: 'var(--txt-muted)',
              }}>
                <span>{resumeText.split(/\s+/).filter(Boolean).length} words</span>
                <span>{resumeText.length} chars</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Uploaded file status */}
            {resumeFile && !uploading && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--green-glow)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={14} color="var(--green)" />
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--green)',
                  }}>
                    {resumeFile.name}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--txt-muted)' }}>
                    ({(resumeFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  onClick={clearFile}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-muted)', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}

            {/* Drop zone */}
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--amber)' : 'var(--bord)'}`,
                background: isDragActive ? 'var(--amber-glow)' : 'var(--surf)',
                padding: '52px 32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div>
                  <LoadingSpinner size={28} />
                  <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--amber)' }}>
                    UPLOADING… {uploadPct}%
                  </div>
                  <div style={{
                    marginTop: 8, height: 2,
                    background: 'var(--bord)',
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      style={{ height: '100%', background: 'var(--amber)' }}
                      animate={{ width: `${uploadPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud
                    size={36}
                    color={isDragActive ? 'var(--amber)' : 'var(--txt-muted)'}
                    style={{ margin: '0 auto 12px' }}
                  />
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    color: isDragActive ? 'var(--amber)' : 'var(--txt-dim)',
                    marginBottom: 6,
                  }}>
                    {isDragActive ? 'Drop to upload' : 'Drag & drop your resume'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-muted)' }}>
                    PDF or DOCX · Max 5 MB
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parsed metadata preview */}
      <AnimatePresence>
        {parsedResume && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: 14, overflow: 'hidden' }}
          >
            <Card accentColor="var(--cyan)" accent>
              <SectionLabel>Detected from Resume</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Sections */}
                {parsedResume.sections_detected?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--txt-muted)', marginBottom: 6 }}>
                      Sections ({parsedResume.sections_detected.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {parsedResume.sections_detected.map((s) => (
                        <SkillChip key={s} label={s} variant="neutral" />
                      ))}
                    </div>
                  </div>
                )}
                {/* Skills */}
                {parsedResume.skills?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--txt-muted)', marginBottom: 6 }}>
                      Skills detected ({parsedResume.skills.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {parsedResume.skills.slice(0, 12).map((s) => (
                        <SkillChip key={s} label={s} variant="matched" />
                      ))}
                      {parsedResume.skills.length > 12 && (
                        <SkillChip label={`+${parsedResume.skills.length - 12} more`} variant="neutral" />
                      )}
                    </div>
                  </div>
                )}
              </div>
              {parsedResume.experience_years && (
                <div style={{
                  marginTop: 12, paddingTop: 12,
                  borderTop: '1px solid var(--bord)',
                  fontSize: 11, color: 'var(--txt-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  ≈ {parsedResume.experience_years} years of experience detected
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
