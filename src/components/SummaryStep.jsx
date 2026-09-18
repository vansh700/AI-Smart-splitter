/**
 * SummaryStep.jsx  ← Step 7 UPGRADED
 * ────────────────────────────────────
 * Full shareable summary screen with:
 *  - Beautiful visual summary card (html-to-image exportable)
 *  - Per-person payment handle inputs (Venmo / UPI / Zelle)
 *  - Download card as PNG
 *  - Copy full text summary (WhatsApp / iMessage friendly)
 *  - Web Share API (native share sheet on mobile)
 *  - Per-person collapsible item breakdown
 *  - Grand total verification badge
 */
import { useState, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import {
  CheckCircle2, AlertTriangle, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, Receipt, Download, Share2,
  DollarSign, Link2, X,
} from 'lucide-react'
import { calculateSplit, formatCurrency } from '../utils/splitCalculator.js'

// ─── Payment platform config ──────────────────────────────────────

const PAYMENT_PLATFORMS = [
  {
    id: 'venmo',
    label: 'Venmo',
    placeholder: '@username',
    color: '#008dff',
    buildUrl: (handle, amount, note) =>
      `https://venmo.com/${handle.replace('@', '')}?txn=pay&amount=${amount}&note=${encodeURIComponent(note)}`,
  },
  {
    id: 'cashapp',
    label: 'Cash App',
    placeholder: '$cashtag',
    color: '#00d632',
    buildUrl: (handle, amount) =>
      `https://cash.app/${handle.replace('$', '')}/${amount}`,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    placeholder: 'email or @handle',
    color: '#003087',
    buildUrl: (handle, amount) =>
      `https://paypal.me/${handle.replace('@', '')}/${amount}`,
  },
]

// ─── Person avatar ────────────────────────────────────────────────

function Avatar({ person, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${person.color}22`,
      border: `2px solid ${person.color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: person.color, fontSize: size * 0.38, fontWeight: 700,
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {person.name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  )
}

// ─── Visual summary card (exported to PNG) ────────────────────────

function SummaryCard({ receipt, breakdown, peopleById, cardRef }) {
  const date = receipt.date
    ? new Date(receipt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div
      ref={cardRef}
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1033 50%, #0d1b2a 100%)',
        borderRadius: '1.25rem',
        padding: '2rem',
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        color: '#e2e8f0',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 180, height: 180,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: -20, width: 150, height: 150,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ marginBottom: '1.375rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, rgba(108,99,255,0.35), rgba(56,189,248,0.2))',
              border: '1px solid rgba(108,99,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Receipt size={15} color="#a78bfa" />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              Smart Bill Splitter
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>{date}</span>
        </div>

        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#e2e8f0', margin: '0.5rem 0 0.125rem' }}>
          {receipt.vendor || 'Dinner Split'}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {breakdown.length} people · {receipt.items.length} items
        </p>
      </div>

      {/* Per-person rows */}
      <div style={{ marginBottom: '1.25rem' }}>
        {breakdown.map((result) => {
          const person = peopleById[result.personId]
          if (!person) return null
          return (
            <div
              key={result.personId}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.7rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: `${person.color}22`, border: `2px solid ${person.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: person.color, fontSize: '0.8rem', fontWeight: 700,
              }}>
                {person.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9375rem', color: '#e2e8f0' }}>
                {person.name}
              </span>
              <span style={{
                fontWeight: 800, fontSize: '1.0625rem',
                color: person.color, fontVariantNumeric: 'tabular-nums',
              }}>
                {formatCurrency(result.total)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Total row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.875rem 1rem',
        background: 'rgba(167,139,250,0.1)',
        border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: '0.75rem',
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#c4b5fd' }}>Total</span>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#a78bfa', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(breakdown.reduce((s, p) => s + p.total, 0))}
        </span>
      </div>
    </div>
  )
}

// ─── Payment handle input for one person ─────────────────────────

function PaymentRow({ person, result, handle, setHandle }) {
  const [platform, setPlatform] = useState(PAYMENT_PLATFORMS[0])
  const [copiedLink, setCopiedLink] = useState(false)
  const payUrl = handle.trim()
    ? platform.buildUrl(handle.trim(), result.total.toFixed(2), `${result.name}'s share`)
    : null

  const copyLink = () => {
    if (!payUrl) return
    navigator.clipboard.writeText(payUrl).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      padding: '0.625rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      flexWrap: 'wrap',
    }}>
      <Avatar person={person} size={30} />
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', minWidth: 70 }}>
        {person.name}
      </span>
      <span style={{ fontSize: '0.875rem', color: person.color, fontVariantNumeric: 'tabular-nums', fontWeight: 700, minWidth: 64 }}>
        {formatCurrency(result.total)}
      </span>

      {/* Platform selector */}
      <select
        value={platform.id}
        onChange={(e) => setPlatform(PAYMENT_PLATFORMS.find((p) => p.id === e.target.value))}
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.5rem', color: '#9ca3af', fontSize: '0.78rem',
          padding: '0.3rem 0.5rem', cursor: 'pointer', outline: 'none',
        }}
      >
        {PAYMENT_PLATFORMS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>

      {/* Handle input */}
      <input
        className="input"
        placeholder={platform.placeholder}
        value={handle}
        maxLength={40}
        onChange={(e) => setHandle(e.target.value)}
        style={{ flex: 1, minWidth: 110, padding: '0.3rem 0.625rem', fontSize: '0.8rem' }}
      />

      {/* Copy payment link */}
      {payUrl && (
        <button
          onClick={copyLink}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem', cursor: 'pointer', padding: '0.3rem 0.55rem',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            color: copiedLink ? '#22d3a8' : '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap',
          }}
          title="Copy payment link"
        >
          {copiedLink ? <Check size={12} /> : <Link2 size={12} />}
          {copiedLink ? 'Copied' : 'Link'}
        </button>
      )}
    </div>
  )
}

// ─── Per-person breakdown card ────────────────────────────────────

function PersonBreakdownCard({ person, result }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: `${person.color}08`, border: `1px solid ${person.color}22`,
      borderRadius: '0.875rem', marginBottom: '0.5rem', overflow: 'hidden',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Avatar person={person} size={36} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem', fontFamily: "'Space Grotesk',sans-serif" }}>{person.name}</p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{result.items.length} item{result.items.length !== 1 ? 's' : ''}</p>
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: person.color, fontVariantNumeric: 'tabular-nums', marginRight: '0.5rem' }}>
          {formatCurrency(result.total)}
        </span>
        {expanded ? <ChevronUp size={15} color="#4b5563" /> : <ChevronDown size={15} color="#4b5563" />}
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${person.color}15`, padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.12)' }}>
          {result.items.map((line) => (
            <div key={line.itemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8125rem' }}>
              <span style={{ color: '#9ca3af' }}>{line.name}</span>
              <span style={{ color: '#c4b5fd', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.share)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.15rem 0' }}>
              <span style={{ color: '#6b7280' }}>Tax</span>
              <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(result.tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.15rem 0' }}>
              <span style={{ color: '#6b7280' }}>Tip</span>
              <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(result.tip)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

export default function SummaryStep({ receipt, people, assignments, onReset, onBack }) {
  const cardRef      = useRef(null)
  const [copiedAll,  setCopiedAll]  = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sharing,    setSharing]    = useState(false)

  // Per-person payment handles: { personId: string }
  const [handles, setHandles] = useState(() =>
    Object.fromEntries(people.map((p) => [p.id, '']))
  )
  const setHandle = useCallback((personId, val) => {
    setHandles((prev) => ({ ...prev, [personId]: val }))
  }, [])

  // ── Calculate ─────────────────────────────────────────────────
  const { breakdown, checksTotal, receiptTotal, matches, unassignedItems } =
    calculateSplit({ items: receipt.items, people, assignments, tax: receipt.tax, tip: receipt.tip, subtotal: receipt.subtotal })

  const peopleById = Object.fromEntries(people.map((p) => [p.id, p]))

  // ── Copy plain text summary ───────────────────────────────────
  const buildTextSummary = () => {
    const lines = [
      `🧾 ${receipt.vendor || 'Bill'} Split`,
      `📅 ${receipt.date || new Date().toLocaleDateString()}`,
      '',
      ...breakdown.map((r) => {
        const person  = peopleById[r.personId]
        const handle  = handles[r.personId]
        const platform = handle ? PAYMENT_PLATFORMS[0] : null
        const link = handle ? platform.buildUrl(handle, r.total.toFixed(2), `${r.name}'s share`) : null
        return `${person?.name ?? r.name}: ${formatCurrency(r.total)}${link ? `\n  Pay → ${link}` : ''}`
      }),
      '',
      `Total: ${formatCurrency(receiptTotal)}`,
      `Calculated by Smart Bill Splitter`,
    ]
    return lines.join('\n')
  }

  const copyAll = () => {
    navigator.clipboard.writeText(buildTextSummary()).then(() => {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2500)
    })
  }

  // ── Download PNG ──────────────────────────────────────────────
  const downloadPng = async () => {
    if (!cardRef.current || downloading) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0f0c29',
      })
      const link = document.createElement('a')
      link.download = `${(receipt.vendor || 'bill-split').toLowerCase().replace(/\s+/g, '-')}-split.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('PNG export failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  // ── Web Share API ─────────────────────────────────────────────
  const shareSummary = async () => {
    if (sharing) return
    const text = buildTextSummary()
    if (navigator.share) {
      setSharing(true)
      try {
        await navigator.share({
          title: `${receipt.vendor || 'Bill'} Split`,
          text,
        })
      } catch {
        // User cancelled — fine
      } finally {
        setSharing(false)
      }
    } else {
      // Fallback: copy
      navigator.clipboard.writeText(text).then(() => {
        setCopiedAll(true)
        setTimeout(() => setCopiedAll(false), 2500)
      })
    }
  }

  // ─────────────────────────────────────────────────────────────

  return (
    <div className="slide-up" style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── Verification banner ───────────────────────────── */}
      {matches ? (
        <div style={{
          display: 'flex', gap: '0.5rem', alignItems: 'center',
          background: 'rgba(34,211,168,0.07)', border: '1px solid rgba(34,211,168,0.2)',
          borderRadius: '0.75rem', padding: '0.625rem 1rem', marginBottom: '1rem',
        }}>
          <CheckCircle2 size={15} color="#22d3a8" />
          <p style={{ fontSize: '0.8125rem', color: '#22d3a8' }}>
            All shares sum to <strong>{formatCurrency(checksTotal)}</strong> — matches receipt exactly ✓
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex', gap: '0.5rem', alignItems: 'center',
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '0.75rem', padding: '0.625rem 1rem', marginBottom: '1rem',
        }}>
          <AlertTriangle size={15} color="#f59e0b" />
          <p style={{ fontSize: '0.8125rem', color: '#f59e0b' }}>
            Shares: <strong>{formatCurrency(checksTotal)}</strong> vs receipt: <strong>{formatCurrency(receiptTotal)}</strong>
          </p>
        </div>
      )}

      {unassignedItems.length > 0 && (
        <div style={{
          display: 'flex', gap: '0.5rem', alignItems: 'center',
          background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '0.75rem', padding: '0.625rem 1rem', marginBottom: '1rem',
        }}>
          <AlertTriangle size={15} color="#f87171" />
          <p style={{ fontSize: '0.8125rem', color: '#f87171' }}>
            {unassignedItems.length} item{unassignedItems.length !== 1 ? 's' : ''} not assigned — excluded from totals.
          </p>
        </div>
      )}

      {/* ── Visual summary card ───────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9375rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={15} color="#a78bfa" />
            Summary Card
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-ghost"
              onClick={downloadPng}
              disabled={downloading}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem' }}
            >
              <Download size={13} />
              {downloading ? 'Saving…' : 'Save PNG'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={shareSummary}
              disabled={sharing}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem' }}
            >
              <Share2 size={13} />
              Share
            </button>
          </div>
        </div>

        <SummaryCard
          receipt={receipt}
          breakdown={breakdown}
          peopleById={peopleById}
          cardRef={cardRef}
        />
      </div>

      {/* ── Payment handles ───────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9375rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <DollarSign size={15} color="#a78bfa" />
            Request Payment
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#4b5563' }}>
            Enter each person's handle to generate a direct payment link.
          </p>
        </div>

        {breakdown.map((result) => {
          const person = peopleById[result.personId]
          if (!person) return null
          return (
            <PaymentRow
              key={result.personId}
              person={person}
              result={result}
              handle={handles[result.personId] || ''}
              setHandle={(val) => setHandle(result.personId, val)}
            />
          )
        })}
      </div>

      {/* ── Per-person breakdown ──────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9375rem', color: '#e2e8f0', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={15} color="#a78bfa" />
          Itemized Breakdown
          <span style={{ fontWeight: 400, color: '#4b5563', fontSize: '0.75rem' }}>(tap to expand)</span>
        </h3>
        {breakdown.map((result) => {
          const person = peopleById[result.personId]
          if (!person) return null
          return (
            <PersonBreakdownCard key={result.personId} person={person} result={result} />
          )
        })}
      </div>

      {/* ── Actions ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ gap: '0.4rem' }}>
          ← Back
        </button>
        <button
          className="btn btn-ghost"
          onClick={copyAll}
          style={{ gap: '0.4rem' }}
        >
          {copiedAll ? <Check size={14} color="#22d3a8" /> : <Copy size={14} />}
          {copiedAll ? 'Copied!' : 'Copy Summary'}
        </button>
        <button
          id="start-over-btn"
          className="btn btn-primary"
          onClick={onReset}
          style={{ flex: 1, justifyContent: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} />
          Start Over
        </button>
      </div>
    </div>
  )
}

// Missing import used above
function Users({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
