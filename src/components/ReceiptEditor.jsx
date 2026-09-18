/**
 * ReceiptEditor.jsx
 * ─────────────────
 * Step 2 screen: review and edit extracted receipt data.
 *
 * Features:
 *  - Low-confidence warning banner (< 80%)
 *  - Inline editable item name + price
 *  - Add / delete line items
 *  - Edit vendor, date, tax, tip
 *  - Live subtotal discrepancy indicator
 *  - "Looks good → Continue" CTA
 */
import { useState, useCallback } from 'react'
import {
  AlertTriangle, CheckCircle, Plus, Trash2, Edit3,
  ChevronRight, Store, CalendarDays, Info, RefreshCw,
} from 'lucide-react'
import { nanoid } from '../utils/nanoid.js'
import { subtotalDiscrepancy, roundCents, formatCurrency } from '../utils/splitCalculator.js'

// ─── Confidence banner ────────────────────────────────────────────

function ConfidenceBanner({ confidence }) {
  const pct = Math.round(confidence * 100)
  const isLow = confidence < 0.8

  if (!isLow) return (
    <div
      className="slide-up"
      style={{
        display: 'flex', gap: '0.625rem', alignItems: 'center',
        background: 'rgba(34,211,168,0.07)',
        border: '1px solid rgba(34,211,168,0.18)',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
      }}
    >
      <CheckCircle size={15} color="#22d3a8" />
      <p style={{ fontSize: '0.8125rem', color: '#22d3a8' }}>
        <strong>High confidence ({pct}%)</strong> — receipt read clearly. Review items below before continuing.
      </p>
    </div>
  )

  return (
    <div
      className="slide-up"
      style={{
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: '0.75rem',
        padding: '0.875rem 1rem',
        marginBottom: '1.25rem',
      }}
    >
      <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <p style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: 600, marginBottom: 2 }}>
          Low confidence ({pct}%) — please review carefully
        </p>
        <p style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5 }}>
          The receipt image may be blurry or partially obscured. Check each item name and price — tap any field to edit it.
        </p>
      </div>
    </div>
  )
}

// ─── Discrepancy banner ───────────────────────────────────────────

function DiscrepancyBanner({ diff }) {
  if (diff === 0) return null
  const over = diff > 0
  return (
    <div style={{
      display: 'flex', gap: '0.5rem', alignItems: 'center',
      background: 'rgba(248,113,113,0.07)',
      border: '1px solid rgba(248,113,113,0.2)',
      borderRadius: '0.625rem',
      padding: '0.6rem 0.875rem',
      marginTop: '0.625rem',
    }}>
      <Info size={13} color="#f87171" />
      <p style={{ fontSize: '0.75rem', color: '#f87171' }}>
        Items sum {over ? 'exceeds' : 'is less than'} subtotal by{' '}
        <strong>{formatCurrency(Math.abs(diff))}</strong>.
        {' '}Adjust items or the subtotal field to match.
      </p>
    </div>
  )
}

// ─── Single editable item row ─────────────────────────────────────

function ItemRow({ item, onUpdate, onDelete }) {
  const [editingName,  setEditingName]  = useState(false)
  const [editingPrice, setEditingPrice] = useState(false)
  const [localName,    setLocalName]    = useState(item.name)
  const [localPrice,   setLocalPrice]   = useState(String(item.price))

  const commitName = () => {
    setEditingName(false)
    const trimmed = localName.trim() || 'Unnamed Item'
    setLocalName(trimmed)
    onUpdate({ ...item, name: trimmed })
  }

  const commitPrice = () => {
    setEditingPrice(false)
    const val = roundCents(Math.max(0, parseFloat(localPrice) || 0))
    setLocalPrice(String(val))
    onUpdate({ ...item, price: val })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.625rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Item name */}
      {editingName ? (
        <input
          className="input"
          value={localName}
          autoFocus
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') commitName() }}
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.875rem' }}
        />
      ) : (
        <button
          onClick={() => setEditingName(true)}
          style={{
            background: 'none', border: 'none', cursor: 'text',
            textAlign: 'left', color: '#e2e8f0', fontSize: '0.875rem',
            padding: '0.35rem 0.5rem', borderRadius: '0.375rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          {localName}
          <Edit3 size={11} color="#374151" />
        </button>
      )}

      {/* Price */}
      {editingPrice ? (
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={localPrice}
          autoFocus
          onChange={(e) => setLocalPrice(e.target.value)}
          onBlur={commitPrice}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') commitPrice() }}
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.875rem', width: 90, textAlign: 'right' }}
        />
      ) : (
        <button
          onClick={() => setEditingPrice(true)}
          style={{
            background: 'none', border: 'none', cursor: 'text',
            textAlign: 'right', color: '#a78bfa', fontSize: '0.875rem', fontWeight: 600,
            padding: '0.35rem 0.5rem', borderRadius: '0.375rem', fontVariantNumeric: 'tabular-nums',
            transition: 'background 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          {formatCurrency(item.price)}
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="btn btn-danger"
        style={{ padding: '0.3rem 0.5rem', minWidth: 0 }}
        title="Remove item"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ─── Editable numeric field (tax / tip / subtotal) ────────────────

function NumericField({ label, value, onChange, accent = '#6b7280' }) {
  const [editing, setEditing] = useState(false)
  const [local,   setLocal]   = useState(String(value))

  const commit = () => {
    setEditing(false)
    const val = roundCents(Math.max(0, parseFloat(local) || 0))
    setLocal(String(val))
    onChange(val)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</span>
      {editing ? (
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={local}
          autoFocus
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
          style={{ width: 90, padding: '0.3rem 0.6rem', fontSize: '0.875rem', textAlign: 'right' }}
        />
      ) : (
        <button
          onClick={() => { setLocal(String(value)); setEditing(true) }}
          style={{
            background: 'none', border: 'none', cursor: 'text',
            color: accent, fontSize: '0.875rem', fontWeight: 600,
            padding: '0.3rem 0.5rem', borderRadius: '0.375rem',
            fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: '0.3rem',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          {formatCurrency(value)}
          <Edit3 size={11} color="#374151" />
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

export default function ReceiptEditor({ receipt, setReceipt, onContinue, onReupload }) {
  const { vendor, date, items, subtotal, tax, tip, confidence } = receipt

  // ── Item mutation helpers ─────────────────────────────────────

  const updateItem = useCallback((updated) => {
    setReceipt((prev) => ({
      ...prev,
      items: prev.items.map((it) => it.id === updated.id ? updated : it),
    }))
  }, [setReceipt])

  const deleteItem = useCallback((id) => {
    setReceipt((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }))
  }, [setReceipt])

  const addItem = useCallback(() => {
    setReceipt((prev) => ({
      ...prev,
      items: [...prev.items, { id: nanoid(), name: 'New Item', price: 0 }],
    }))
  }, [setReceipt])

  // ── Field updates ─────────────────────────────────────────────

  const setVendor   = (v) => setReceipt((p) => ({ ...p, vendor: v }))
  const setDate     = (v) => setReceipt((p) => ({ ...p, date: v }))
  const setSubtotal = (v) => setReceipt((p) => ({ ...p, subtotal: v, total: roundCents(v + p.tax + p.tip) }))
  const setTax      = (v) => setReceipt((p) => ({ ...p, tax: v,      total: roundCents(p.subtotal + v + p.tip) }))
  const setTip      = (v) => setReceipt((p) => ({ ...p, tip: v,      total: roundCents(p.subtotal + p.tax + v) }))

  // ── Live calculations ─────────────────────────────────────────
  const itemsSum = roundCents(items.reduce((s, i) => s + i.price, 0))
  const diff     = subtotalDiscrepancy(items, subtotal)
  const total    = roundCents(subtotal + tax + tip)

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="slide-up" style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Confidence banner */}
      <ConfidenceBanner confidence={confidence} />

      {/* ── Receipt metadata ─────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '0.625rem', flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(108,99,255,0.2),rgba(56,189,248,0.12))',
            border: '1px solid rgba(108,99,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Store size={16} color="#a78bfa" />
          </div>
          <div style={{ flex: 1 }}>
            <input
              className="input"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Vendor name"
              style={{ padding: '0.4rem 0.75rem', fontSize: '1rem', fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif" }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays size={14} color="#4b5563" />
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: '0.4rem 0.625rem', fontSize: '0.8125rem', width: 150 }}
            />
          </div>
        </div>
      </div>

      {/* ── Line items ──────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9375rem', color: '#e2e8f0' }}>
            Line Items
            <span style={{ marginLeft: '0.5rem', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 400, color: '#4b5563' }}>
              ({items.length} item{items.length !== 1 ? 's' : ''})
            </span>
          </h3>
          <button
            className="btn btn-ghost"
            onClick={addItem}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem', gap: '0.3rem' }}
          >
            <Plus size={14} />
            Add Item
          </button>
        </div>

        {items.length === 0 ? (
          <p style={{ color: '#4b5563', fontSize: '0.8125rem', textAlign: 'center', padding: '1rem 0' }}>
            No items yet — click "Add Item" to add one.
          </p>
        ) : (
          items.map((item) => (
            <ItemRow key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
          ))
        )}

        {/* Items sum row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0 0', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#4b5563' }}>Items total</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: diff === 0 ? '#22d3a8' : '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(itemsSum)}
          </span>
        </div>

        {/* Discrepancy warning */}
        <DiscrepancyBanner diff={diff} />
      </div>

      {/* ── Totals ─────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9375rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>
          Totals
        </h3>

        <NumericField label="Subtotal"  value={subtotal} onChange={setSubtotal} accent="#e2e8f0" />
        <NumericField label="Tax"       value={tax}      onChange={setTax}      accent="#6b7280" />
        <NumericField label="Tip"       value={tip}      onChange={setTip}      accent="#6b7280" />

        {/* Grand total — read-only */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0 0', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: '#e2e8f0' }}>Total</span>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: '#a78bfa', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
        <button
          className="btn btn-ghost"
          onClick={onReupload}
          style={{ gap: '0.4rem' }}
        >
          <RefreshCw size={14} />
          Re-upload
        </button>
        <button
          id="continue-to-assign-btn"
          className="btn btn-primary"
          onClick={onContinue}
          disabled={items.length === 0}
          style={{ flex: 1, justifyContent: 'center', opacity: items.length === 0 ? 0.5 : 1 }}
        >
          Assign items to people
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  )
}
