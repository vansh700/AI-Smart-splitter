/**
 * Header.jsx
 * Persistent top navigation bar with logo, app name, API key button, and reset button.
 */
import { useState } from 'react'
import { ReceiptText, RefreshCw, KeyRound, Sparkles } from 'lucide-react'
import { hasApiKey } from '../services/aiReceiptParser.js'
import ApiKeyModal from './ApiKeyModal.jsx'

export default function Header({ onReset }) {
  const [showKeyModal, setShowKeyModal] = useState(false)
  const isConfigured = hasApiKey()

  return (
    <>
      {showKeyModal && (
        <ApiKeyModal
          onSave={() => setShowKeyModal(false)}
          onClose={() => setShowKeyModal(false)}
        />
      )}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10,11,15,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="content-wrapper"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.5rem',
          }}
        >
          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #6c63ff 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 16px rgba(108,99,255,0.45)',
              }}
            >
              <ReceiptText size={18} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  background: 'linear-gradient(135deg, #6c63ff, #a78bfa, #38bdf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                }}
              >
                Smart Bill Splitter
              </span>
              <p style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: 2 }}>
                AI-Powered · Instant · Accurate
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              id="header-api-key-btn"
              className="btn btn-ghost"
              onClick={() => setShowKeyModal(true)}
              title="Configure Gemini API Key"
              style={{
                padding: '0.45rem 0.8rem',
                fontSize: '0.78rem',
                gap: '0.35rem',
                border: isConfigured ? '1px solid rgba(34,211,168,0.3)' : undefined,
                color: isConfigured ? '#22d3a8' : undefined,
              }}
            >
              <KeyRound size={13} color={isConfigured ? '#22d3a8' : '#a78bfa'} />
              <span>{isConfigured ? 'API Key Set ✓' : 'Set API Key'}</span>
            </button>

            <button
              className="btn btn-ghost"
              onClick={onReset}
              title="Start over"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.78rem' }}
            >
              <RefreshCw size={13} strokeWidth={2.2} />
              New Split
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
