/**
 * SummaryStep.jsx
 * ───────────────
 * Step 4 screen: Final split summary.
 *
 * Features:
 *  - Per-person card: their items, share of tax/tip, and total owed
 *  - Grand total verification banner
 *  - "Copy to clipboard" per-person and full summary
 *  - "Start Over" and "Share" actions
 */
import { useState } from 'react'
import {
  CheckCircle2, AlertTriangle, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, Receipt,
} from 'lucide-react'
import { calculateSplit, formatCurrency } from '../utils/splitCalculator.js'

// ─── Colours for avatar initials ─────────────────────────────────
// re-used from people.color

// ─── Person breakdown card ────────────────────────────────────────

function PersonCard({ person, result }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyText = () => {
    const lines = [
      `${person.name}'s share`,
      ...result.items.map((i) => `  ${i.name}: ${formatCurrency(i.share)}`),
      `  Tax: ${formatCurrency(result.tax)}`,
      `  Tip: ${formatCurrency(result.tip)}`,
      `  ────────`,
      `  Total: ${formatCurrency(result.total)}`,
    ]
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      style={{
        background: `${person.color}08`,
        border: `1px solid ${person.color}25`,
        borderRadius: '1rem',
        overflow: 'hidden',
        marginBottom: '0.75rem',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.875rem',
          padding: '1rem 1.125rem',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Avatar */}
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: `${person.color}22`,
            border: `2px solid ${person.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: person.color,
            fontSize: '1rem', fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {person.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: '#e2e8f0', fontSize: '0.9375rem' }}>
            {person.name}
          </p>
          <p style={{ fontSize: '0.78rem', color: '#6b7280' }}>
            {result.items.length} item{result.items.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ textAlign: 'right', marginRight: '0.625rem' }}>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '1.125rem', color: person.color, fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(result.total)}
          </p>
          <p style={{ fontSize: '0.72rem', color: '#4b5563' }}>subtotal {formatCurrency(result.subtotal)}</p>
        </div>

        {expanded ? <ChevronUp size={16} color="#4b5563" /> : <ChevronDown size={16} color="#4b5563" />}
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div
          style={{
            borderTop: `1px solid ${person.color}18`,
            padding: '0.875rem 1.125rem',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {/* Item lines */}
          {result.items.map((line) => (
            <div
              key={line.itemId}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8125rem' }}
            >
              <span style={{ color: '#9ca3af' }}>{line.name}</span>
              <span style={{ color: '#c4b5fd', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.share)}</span>
            </div>
          ))}

          {/* Tax / Tip */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
              <span style={{ color: '#6b7280' }}>Tax (proportional)</span>
              <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(result.tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
              <span style={{ color: '#6b7280' }}>Tip (proportional)</span>
              <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(result.tip)}</span>
            </div>
          </div>

          {/* Copy button */}
          <button
            className="btn btn-ghost"
            onClick={(e) => { e.stopPropagation(); copyText() }}
            style={{ marginTop: '0.625rem', width: '100%', justifyContent: 'center', fontSize: '0.8rem', gap: '0.4rem', padding: '0.4rem' }}
          >
            {copied ? <Check size={13} color="#22d3a8" /> : <Copy size={13} />}
            {copied ? 'Copied!' : `Copy ${person.name}'s share`}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

export default function SummaryStep({ receipt, people, assignments, onReset, onBack }) {
  const [copiedAll, setCopiedAll] = useState(false)

  const { breakdown, checksTotal, receiptTotal, matches, unassignedItems } =
    calculateSplit({
      items:       receipt.items,
      people,
      assignments,
      tax:         receipt.tax,
      tip:         receipt.tip,
      subtotal:    receipt.subtotal,
    })

  // Build a person map for avatar colors
  const peopleById = Object.fromEntries(people.map((p) => [p.id, p]))

  const copyAll = () => {
    const lines = [
      `Smart Bill Splitter — ${receipt.vendor || 'Receipt'} split`,
      `Total: ${formatCurrency(receiptTotal)}`,
      '',
      ...breakdown.map((r) =>
        `${r.name}: ${formatCurrency(r.total)}`
      ),
    ]
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2500)
    })
  }

  return (
    <div className="slide-up" style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '0.75rem', flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(108,99,255,0.25),rgba(56,189,248,0.15))',
            border: '1px solid rgba(108,99,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Receipt size={18} color="#a78bfa" />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>
              {receipt.vendor || 'Bill'} Split
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#4b5563' }}>
              {people.length} people · {receipt.items.length} items
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '1.375rem', color: '#a78bfa', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(receiptTotal)}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>grand total</p>
          </div>
        </div>

        {/* Verification banner */}
        {matches ? (
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            background: 'rgba(34,211,168,0.07)', border: '1px solid rgba(34,211,168,0.18)',
            borderRadius: '0.625rem', padding: '0.55rem 0.875rem',
          }}>
            <CheckCircle2 size={14} color="#22d3a8" />
            <p style={{ fontSize: '0.78rem', color: '#22d3a8' }}>
              All shares sum to <strong>{formatCurrency(checksTotal)}</strong> — matches receipt exactly ✓
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '0.625rem', padding: '0.55rem 0.875rem',
          }}>
            <AlertTriangle size={14} color="#f59e0b" />
            <p style={{ fontSize: '0.78rem', color: '#f59e0b' }}>
              Shares sum to <strong>{formatCurrency(checksTotal)}</strong>, receipt total is <strong>{formatCurrency(receiptTotal)}</strong>.
            </p>
          </div>
        )}

        {unassignedItems.length > 0 && (
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)',
            borderRadius: '0.625rem', padding: '0.55rem 0.875rem', marginTop: '0.5rem',
          }}>
            <AlertTriangle size={14} color="#f87171" />
            <p style={{ fontSize: '0.78rem', color: '#f87171' }}>
              {unassignedItems.length} item{unassignedItems.length !== 1 ? 's' : ''} unassigned — not included in any person's total.
            </p>
          </div>
        )}
      </div>

      {/* ── Per-person cards ─────────────────────────────── */}
      {breakdown.map((result) => {
        const person = peopleById[result.personId]
        if (!person) return null
        return (
          <PersonCard key={result.personId} person={person} result={result} />
        )
      })}

      {/* ── Actions ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ gap: '0.4rem' }}
        >
          ← Back
        </button>
        <button
          className="btn btn-ghost"
          onClick={copyAll}
          style={{ gap: '0.4rem' }}
        >
          {copiedAll ? <Check size={14} color="#22d3a8" /> : <Copy size={14} />}
          {copiedAll ? 'Copied!' : 'Copy All'}
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
