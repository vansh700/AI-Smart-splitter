/**
 * ReceiptUploader.jsx
 * ───────────────────
 * Step 1 screen: upload a receipt photo or pick a sample.
 *
 * Features:
 *  - Drag-and-drop zone (JPG, PNG, PDF)
 *  - Click-to-browse file picker
 *  - 3 sample receipt quick-picks (works without API key)
 *  - Calls AI Vision API to extract structured data
 *  - Shows loading spinner during extraction
 *  - Shows error with retry on failure
 *  - If no API key is configured in .env, shows a clear info banner
 *    (API key is NEVER entered or stored in the frontend)
 */
import { useState, useRef, useCallback } from 'react'
import {
  Upload, ImagePlus, AlertCircle,
  ChevronRight, ScanLine, FileImage, Info,
} from 'lucide-react'
import { SAMPLE_RECEIPTS } from '../data/sampleReceipts.js'
import { parseReceipt, hasApiKey, loadApiKey } from '../services/aiReceiptParser.js'

const ACCEPTED = '.jpg,.jpeg,.png,.pdf,.webp'

export default function ReceiptUploader({ onExtracted }) {
  const [dragging,   setDragging]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error,      setError]      = useState('')

  const fileInputRef = useRef(null)
  const keyConfigured = hasApiKey()

  // ── File handling ──────────────────────────────────────────────

  const processFile = useCallback(async (file, apiKey) => {
    setError('')
    setLoading(true)
    setLoadingMsg('Reading receipt image…')
    try {
      setLoadingMsg('Analyzing with AI Vision…')
      const receipt = await parseReceipt(file, apiKey)
      setLoadingMsg('Structuring data…')
      onExtracted(receipt)
    } catch (err) {
      setError(err.message || 'Failed to parse receipt. Please try again or use a sample.')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }, [onExtracted])

  const handleFile = useCallback((file) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|pdf|webp)$/i)) {
      setError('Please upload a JPG, PNG, PDF, or WebP file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please use an image under 10MB.')
      return
    }
    const key = loadApiKey()
    if (!key) {
      setError('No AI API key found. Add VITE_CLAUDE_API_KEY or VITE_GEMINI_API_KEY to your .env file and restart the dev server.')
      return
    }
    processFile(file, key)
  }, [processFile])

  // ── Drag & Drop ────────────────────────────────────────────────

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true)  }
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false) }
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  // ── Sample receipts ────────────────────────────────────────────

  const handleSample = (sample) => {
    setError('')
    onExtracted(sample.make())
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="fade-in">

      {/* No API key banner */}
      {!keyConfigured && (
        <div
          className="slide-up"
          style={{
            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            background: 'rgba(56,189,248,0.07)',
            border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: '0.875rem',
            padding: '1rem 1.125rem',
            marginBottom: '1.25rem',
          }}
        >
          <Info size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#7dd3fc', marginBottom: '0.25rem' }}>
              AI extraction not configured
            </p>
            <p style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: 1.6 }}>
              Add <code style={{ background: 'rgba(255,255,255,0.07)', padding: '0 0.3rem', borderRadius: '0.25rem', fontSize: '0.78rem', color: '#a78bfa' }}>VITE_CLAUDE_API_KEY</code> or <code style={{ background: 'rgba(255,255,255,0.07)', padding: '0 0.3rem', borderRadius: '0.25rem', fontSize: '0.78rem', color: '#a78bfa' }}>VITE_GEMINI_API_KEY</code> to your <code style={{ background: 'rgba(255,255,255,0.07)', padding: '0 0.3rem', borderRadius: '0.25rem', fontSize: '0.78rem', color: '#a78bfa' }}>.env</code> file and restart the dev server. Until then, use the sample receipts below.
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* ── Upload zone ─────────────────────────── */}
        <div
          id="receipt-drop-zone"
          className="glass-card"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !loading && fileInputRef.current?.click()}
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderColor: dragging ? 'var(--accent-1)' : undefined,
            boxShadow: dragging ? '0 0 0 3px rgba(108,99,255,0.25), var(--shadow-card)' : undefined,
            transition: 'all 0.2s ease',
            marginBottom: '1.5rem',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {loading ? (
            /* Loading state */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', width: 72, height: 72 }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px solid rgba(108,99,255,0.2)',
                }} />
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px solid transparent',
                  borderTopColor: '#6c63ff',
                  animation: 'spin 1s linear infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <ScanLine size={28} color="#a78bfa" />
                </div>
              </div>
              <div>
                <p style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>Analyzing Receipt…</p>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{loadingMsg}</p>
              </div>
            </div>
          ) : (
            /* Default upload state */
            <>
              <div style={{
                width: 72, height: 72, margin: '0 auto 1.25rem',
                borderRadius: '1.25rem',
                background: dragging
                  ? 'linear-gradient(135deg, rgba(108,99,255,0.25), rgba(56,189,248,0.15))'
                  : 'rgba(255,255,255,0.04)',
                border: `2px dashed ${dragging ? '#6c63ff' : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                {dragging
                  ? <ImagePlus size={30} color="#a78bfa" />
                  : <Upload size={28} color="#4b5563" />
                }
              </div>

              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.125rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                {dragging ? 'Drop it!' : 'Upload your receipt'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Drag & drop or click to browse<br />
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>JPG, PNG, PDF, WebP · Max 10MB</span>
              </p>

              <button
                id="browse-file-btn"
                className="btn btn-primary"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                style={{ fontSize: '0.9rem' }}
              >
                <ImagePlus size={16} />
                Choose File
              </button>
            </>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div
            className="slide-up"
            style={{
              display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: '0.75rem',
              padding: '0.875rem 1rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#f87171', fontWeight: 500 }}>Extraction failed</p>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 2 }}>{error}</p>
            </div>
          </div>
        )}

        {/* ── Divider ──────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <hr className="divider" style={{ flex: 1, margin: 0 }} />
          <span style={{ fontSize: '0.75rem', color: '#374151', whiteSpace: 'nowrap' }}>
            or try a sample receipt
          </span>
          <hr className="divider" style={{ flex: 1, margin: 0 }} />
        </div>

        {/* ── Sample receipts ──────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.875rem' }}>
          {SAMPLE_RECEIPTS.map((sample) => (
            <button
              key={sample.id}
              id={`sample-${sample.id}`}
              className="glass-card"
              onClick={() => handleSample(sample)}
              style={{
                padding: '1.25rem',
                textAlign: 'left',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                width: '100%',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(108,99,255,0.35)'
                e.currentTarget.style.background   = 'rgba(108,99,255,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.background   = 'rgba(255,255,255,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{sample.make().emoji}</span>
                <ChevronRight size={14} color="#374151" />
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                {sample.label}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>{sample.description}</p>
              <div style={{ marginTop: '0.625rem' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  <FileImage size={9} />
                  Sample
                </span>
              </div>
            </button>
          ))}
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
