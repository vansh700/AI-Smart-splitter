/**
 * Header.jsx
 * Persistent top navigation bar with logo, app name, history, and reset buttons.
 * API key management has been intentionally removed from the frontend for security.
 * Keys must be set in the .env file (VITE_CLAUDE_API_KEY / VITE_GEMINI_API_KEY).
 */
import { History, ReceiptText, RefreshCw } from 'lucide-react'

export default function Header({ onReset, onShowHistory }) {
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
          height: 60,
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', userSelect: 'none' }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: '0.625rem', flexShrink: 0,
              background: 'linear-gradient(135deg, #6c63ff 0%, #38bdf8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(108,99,255,0.45)',
            }}
          >
            <ReceiptText size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: '1rem',
              color: '#e2e8f0', lineHeight: 1.1,
            }}>
              Smart Bill Splitter
            </p>
            <p style={{ fontSize: '0.65rem', color: '#4b5563', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              AI-Powered
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            id="header-history-btn"
            className="btn btn-ghost"
            onClick={onShowHistory}
            title="View split history"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.78rem', gap: '0.35rem' }}
          >
            <History size={13} color="#a78bfa" />
            <span>History</span>
          </button>

          <button
            id="header-new-split-btn"
            className="btn btn-ghost"
            onClick={onReset}
            title="Start a new split"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.78rem', gap: '0.35rem' }}
          >
            <RefreshCw size={13} strokeWidth={2.2} />
            <span>New Split</span>
          </button>
        </div>
      </div>
    </header>
  )
}
