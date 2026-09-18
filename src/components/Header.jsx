/**
 * Header.jsx
 * Persistent top navigation bar with logo, app name, and reset button.
 */
import { ReceiptText, RefreshCw } from 'lucide-react'

export default function Header({ onReset }) {
  return (
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

        {/* Reset button */}
        <button
          className="btn btn-ghost"
          onClick={onReset}
          title="Start over"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8125rem' }}
        >
          <RefreshCw size={14} strokeWidth={2.2} />
          New Split
        </button>
      </div>
    </header>
  )
}
