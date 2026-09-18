/**
 * LandingHero.jsx
 * Welcome screen with upload CTA, feature highlights, and sample receipt shortcuts.
 * This is the first thing the user sees.
 */
import { Camera, FileImage, Zap, Users, Share2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react'
import { STEPS } from '../App.jsx'

// ─── Feature cards shown below the hero ──────────────────────────
const FEATURES = [
  {
    icon: <Zap size={20} color="#6c63ff" />,
    title: 'AI Extraction',
    desc: 'One photo → instant structured receipt with items, tax & tip.',
  },
  {
    icon: <Users size={20} color="#38bdf8" />,
    title: 'Flexible Splitting',
    desc: 'Assign items per person or split everything evenly in one tap.',
  },
  {
    icon: <ShieldCheck size={20} color="#22d3a8" />,
    title: '100% Accurate Math',
    desc: 'Proportional tax & tip. Totals always balance to the cent.',
  },
  {
    icon: <Share2 size={20} color="#f59e0b" />,
    title: 'Shareable Summary',
    desc: 'Download a summary card or copy a ready-to-paste text breakdown.',
  },
]

export default function LandingHero({ ctx }) {
  const { goTo } = ctx

  return (
    <div className="fade-in">
      {/* ── Hero area ─────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '3.5rem 0 2.5rem' }}>
        {/* AI badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <span className="badge badge-purple slide-up">
            <Sparkles size={11} />
            AI-Powered Receipt Scanner
          </span>
        </div>

        {/* Headline */}
        <h1
          className="slide-up delay-100"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1rem',
          }}
        >
          Split any bill{' '}
          <span className="gradient-text">instantly</span>
          <br />
          — down to the cent.
        </h1>

        {/* Subheadline */}
        <p
          className="slide-up delay-200"
          style={{
            color: '#6b7280',
            fontSize: '1.0625rem',
            maxWidth: 480,
            margin: '0 auto 2.5rem',
            lineHeight: 1.65,
          }}
        >
          Upload a receipt photo and our AI reads every item, tax &amp; tip.
          Assign to friends, get a perfect breakdown, share it.
        </p>

        {/* CTA buttons */}
        <div
          className="slide-up delay-300"
          style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button
            id="upload-receipt-btn"
            className="btn btn-primary"
            onClick={() => goTo(STEPS.REVIEW)}
            style={{ fontSize: '1rem', padding: '0.8rem 1.75rem' }}
          >
            <Camera size={18} strokeWidth={2.2} />
            Upload Receipt
            <ArrowRight size={16} />
          </button>
          <button
            id="try-sample-btn"
            className="btn btn-secondary"
            onClick={() => goTo(STEPS.REVIEW)}
            style={{ fontSize: '1rem', padding: '0.8rem 1.75rem' }}
          >
            <FileImage size={18} strokeWidth={2} />
            Try Sample Receipt
          </button>
        </div>
      </div>

      {/* ── Feature grid ─────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`glass-card slide-up delay-${(i + 3) * 100}`}
            style={{ padding: '1.375rem 1.25rem' }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '0.625rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.875rem',
              }}
            >
              {f.icon}
            </div>
            <h3
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: '#e2e8f0',
                marginBottom: '0.375rem',
              }}
            >
              {f.title}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.6 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── Privacy note ─────────────────────── */}
      <div
        className="slide-up"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          marginTop: '2rem',
          color: '#374151',
          fontSize: '0.75rem',
        }}
      >
        <ShieldCheck size={13} />
        Your receipt is never stored · All math runs in your browser
      </div>
    </div>
  )
}
