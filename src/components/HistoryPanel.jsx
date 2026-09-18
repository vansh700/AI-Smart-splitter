/**
 * HistoryPanel.jsx
 * ────────────────
 * Slide-in panel showing all past splits stored in IndexedDB.
 *
 * Features:
 *  - List of past splits (vendor, date, total, people count)
 *  - Tap any split to re-load it instantly back into the app
 *  - Delete individual splits
 *  - Clear all history
 *  - Live record count badge
 */
import { useState, useEffect, useCallback } from 'react'
import {
  History, X, Trash2, RotateCcw, Clock, Users,
  Receipt, AlertTriangle, ChevronRight, Database,
} from 'lucide-react'
import { getAllSplits, deleteSplit, clearHistory, hydrateSplit } from '../services/historyDb.js'
import { formatCurrency } from '../utils/splitCalculator.js'

// ─── Relative time helper ─────────────────────────────────────────

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days < 30)   return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Single history row ───────────────────────────────────────────

function SplitRow({ row, onLoad, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    setDeleting(true)
    await deleteSplit(row.id)
    onDelete(row.id)
  }

  return (
    <div
      onClick={() => onLoad(row)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.875rem 1rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        marginBottom: '0.5rem',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(108,99,255,0.07)'
        e.currentTarget.style.borderColor = 'rgba(108,99,255,0.25)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
      }}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: '0.625rem', flexShrink: 0,
        background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Receipt size={16} color="#a78bfa" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, fontSize: '0.875rem', color: '#e2e8f0',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {row.vendor}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Users size={10} />
            {row.peopleCount} people
          </span>
          <span style={{ fontSize: '0.72rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={10} />
            {relativeTime(row.createdAt)}
          </span>
        </div>
      </div>

      {/* Total */}
      <span style={{
        fontWeight: 700, fontSize: '0.9375rem', color: '#a78bfa',
        fontVariantNumeric: 'tabular-nums', marginRight: '0.25rem',
      }}>
        {formatCurrency(row.total)}
      </span>

      {/* Load arrow */}
      <ChevronRight size={14} color="#374151" />

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0.25rem', borderRadius: '0.375rem', display: 'flex',
          color: '#4b5563', transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#4b5563' }}
        title="Delete this split"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

export default function HistoryPanel({ onClose, onLoadSplit }) {
  const [splits,   setSplits]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [clearing, setClearing] = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  useEffect(() => {
    getAllSplits().then((rows) => {
      setSplits(rows)
      setLoading(false)
    })
  }, [])

  const handleDelete = useCallback((id) => {
    setSplits((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleClearAll = async () => {
    if (!confirm) { setConfirm(true); return }
    setClearing(true)
    await clearHistory()
    setSplits([])
    setClearing(false)
    setConfirm(false)
  }

  const handleLoad = useCallback((row) => {
    const hydrated = hydrateSplit(row)
    onLoadSplit(hydrated)
    onClose()
  }, [onLoadSplit, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 440,
          zIndex: 110,
          background: 'linear-gradient(180deg, #0f0e1a 0%, #0a0b10 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInRight 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '0.625rem', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(56,189,248,0.12))',
            border: '1px solid rgba(108,99,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Database size={16} color="#a78bfa" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>
              Split History
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#4b5563' }}>
              {splits.length} record{splits.length !== 1 ? 's' : ''} stored locally
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.35rem', minWidth: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#4b5563' }}>
              <History size={32} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.875rem' }}>Loading history…</p>
            </div>
          ) : splits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#374151' }}>
              <Receipt size={40} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.375rem' }}>
                No history yet
              </p>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                Complete a split and it will be automatically saved here.
              </p>
            </div>
          ) : (
            splits.map((row) => (
              <SplitRow
                key={row.id}
                row={row}
                onLoad={handleLoad}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {splits.length > 0 && (
          <div style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <button
              className="btn btn-ghost"
              onClick={handleClearAll}
              disabled={clearing}
              style={{
                width: '100%', justifyContent: 'center', gap: '0.4rem',
                color: confirm ? '#f87171' : '#6b7280',
                border: confirm ? '1px solid rgba(248,113,113,0.3)' : undefined,
                fontSize: '0.8125rem',
              }}
            >
              {confirm ? <AlertTriangle size={13} /> : <Trash2 size={13} />}
              {clearing ? 'Clearing…' : confirm ? 'Tap again to confirm clear all' : 'Clear All History'}
            </button>
            {confirm && (
              <button
                onClick={() => setConfirm(false)}
                style={{ marginTop: '0.5rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: '0.78rem' }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
