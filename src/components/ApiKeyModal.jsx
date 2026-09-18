/**
 * ApiKeyModal.jsx
 * ───────────────
 * Modal for users to enter their Gemini API key.
 * Key is stored in sessionStorage (cleared when tab closes).
 */
import { useState } from 'react'
import { KeyRound, X, ExternalLink, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { saveApiKey } from '../services/aiReceiptParser.js'

export default function ApiKeyModal({ onSave, onClose }) {
  const [key,     setKey]     = useState('')
  const [visible, setVisible] = useState(false)
  const [error,   setError]   = useState('')

  const isClaude = key.trim().startsWith('sk-ant-')
  const isGemini = key.trim().startsWith('AIza')

  function handleSave() {
    const trimmed = key.trim()
    if (!trimmed) {
      setError('Please enter your API key.')
      return
    }
    if (trimmed.length < 15) {
      setError('That doesn\'t look like a valid API key.')
      return
    }
    saveApiKey(trimmed)
    onSave(trimmed)
  }

  return (
    <div
      id="api-key-modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass-card scale-in"
        style={{ width: '100%', maxWidth: 480, padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #6c63ff22, #38bdf822)',
              border: '1px solid rgba(108,99,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <KeyRound size={20} color="#a78bfa" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>
                AI Vision API Key
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                Supports Anthropic Claude or Google Gemini
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.3rem', minWidth: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Input */}
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
          <input
            id="api-key-input"
            type={visible ? 'text' : 'password'}
            className="input"
            placeholder="sk-ant-... or AIza..."
            value={key}
            onChange={(e) => { setKey(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            style={{ paddingRight: '3rem', fontFamily: 'monospace', fontSize: '0.875rem' }}
          />
          <button
            onClick={() => setVisible(!visible)}
            style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280',
              display: 'flex', alignItems: 'center',
            }}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Key type badge */}
        {key.trim() && (
          <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
              Detected: {isClaude ? 'Anthropic Claude' : isGemini ? 'Google Gemini' : 'Custom Key'}
            </span>
          </div>
        )}

        {error && <p style={{ color: '#f87171', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{error}</p>}

        {/* Get key links */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.78rem', color: '#c4b5fd', textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} />
            Claude API Key →
          </a>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.78rem', color: '#38bdf8', textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} />
            Gemini Free API Key →
          </a>
        </div>

        {/* Privacy note */}
        <div style={{
          display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
          background: 'rgba(34,211,168,0.06)',
          border: '1px solid rgba(34,211,168,0.15)',
          borderRadius: '0.625rem',
          padding: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          <ShieldCheck size={14} color="#22d3a8" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5 }}>
            Your key stays in your browser (<strong style={{ color: '#94a3b8' }}>localStorage & sessionStorage</strong>) — 
            it is sent directly from your browser to the AI provider endpoint and is never stored on any server.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button
            id="save-api-key-btn"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!key.trim()}
            style={{ flex: 2, opacity: key.trim() ? 1 : 0.5 }}
          >
            <KeyRound size={15} />
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  )
}
