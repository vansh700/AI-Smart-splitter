/**
 * AssignStep.jsx
 * ──────────────
 * Step 3 screen: Add people, then assign each receipt item to one or more people.
 *
 * Features:
 *  - Add / rename / remove people (up to 10), each with an auto color
 *  - Click an item card → opens person-picker chip set (multi-select for sharing)
 *  - "Split Everything Evenly" one-tap shortcut
 *  - Live unassigned-item counter badge
 *  - "Continue to Summary" CTA (disabled until every item is assigned)
 */
import { useState, useCallback } from 'react'
import {
  UserPlus, Trash2, Users, ChevronRight, Zap,
  CheckCircle2, AlertCircle, X, Check,
} from 'lucide-react'
import { nanoid } from '../utils/nanoid.js'
import { buildEvenAssignments, formatCurrency } from '../utils/splitCalculator.js'

// ─── Avatar colour palette ────────────────────────────────────────
const PERSON_COLORS = [
  '#a78bfa', // violet
  '#38bdf8', // sky
  '#34d399', // emerald
  '#fb923c', // orange
  '#f472b6', // pink
  '#facc15', // yellow
  '#818cf8', // indigo
  '#4ade80', // green
  '#e879f9', // fuchsia
  '#f87171', // red
]

// ─── Person avatar chip ───────────────────────────────────────────

function PersonAvatar({ person, size = 32 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `${person.color}22`,
        border: `2px solid ${person.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: person.color,
        fontSize: size * 0.4,
        fontWeight: 700,
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {person.name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  )
}

// ─── Add-person row ───────────────────────────────────────────────

function AddPersonInput({ onAdd, usedColors }) {
  const [name, setName] = useState('')

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const colorIdx = usedColors.length % PERSON_COLORS.length
    onAdd({ id: nanoid(), name: trimmed, color: PERSON_COLORS[colorIdx] })
    setName('')
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
      <input
        className="input"
        placeholder="Enter name…"
        value={name}
        maxLength={24}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
        style={{ flex: 1, padding: '0.5rem 0.75rem' }}
      />
      <button
        className="btn btn-primary"
        onClick={handleAdd}
        disabled={!name.trim()}
        style={{ padding: '0.5rem 1rem', gap: '0.375rem', whiteSpace: 'nowrap' }}
      >
        <UserPlus size={14} />
        Add
      </button>
    </div>
  )
}

// ─── Item assignment card ─────────────────────────────────────────

function ItemCard({ item, people, assignedTo, onTogglePerson }) {
  const assignedPeople = people.filter((p) => assignedTo.includes(p.id))
  const isAssigned     = assignedPeople.length > 0
  const shareAmt       = isAssigned ? item.price / assignedPeople.length : item.price

  return (
    <div
      style={{
        background: isAssigned
          ? 'rgba(167,139,250,0.06)'
          : 'rgba(248,113,113,0.04)',
        border: `1px solid ${isAssigned ? 'rgba(167,139,250,0.18)' : 'rgba(248,113,113,0.18)'}`,
        borderRadius: '0.875rem',
        padding: '0.875rem 1rem',
        marginBottom: '0.625rem',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Item header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.125rem' }}>
            {item.name}
          </p>
          <p style={{ fontSize: '0.8125rem', color: '#a78bfa', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(item.price)}
            {assignedPeople.length > 1 && (
              <span style={{ color: '#6b7280' }}>
                {' '}· {formatCurrency(shareAmt)}/person
              </span>
            )}
          </p>
        </div>
        {isAssigned
          ? <CheckCircle2 size={16} color="#22d3a8" style={{ flexShrink: 0 }} />
          : <AlertCircle  size={16} color="#f87171" style={{ flexShrink: 0 }} />
        }
      </div>

      {/* Person chips */}
      {people.length === 0 ? (
        <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>Add people above first.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {people.map((person) => {
            const selected = assignedTo.includes(person.id)
            return (
              <button
                key={person.id}
                onClick={() => onTogglePerson(item.id, person.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.3rem 0.625rem',
                  borderRadius: '99px',
                  border: `1.5px solid ${selected ? person.color : 'rgba(255,255,255,0.1)'}`,
                  background: selected ? `${person.color}18` : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  color: selected ? person.color : '#6b7280',
                  fontSize: '0.78rem',
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {selected && <Check size={11} />}
                {person.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

export default function AssignStep({ receipt, people, setPeople, assignments, setAssignments, onContinue, onBack }) {
  const { items } = receipt

  // ── People management ─────────────────────────────────────────

  const addPerson = useCallback((person) => {
    setPeople((prev) => [...prev, person])
  }, [setPeople])

  const removePerson = useCallback((personId) => {
    setPeople((prev) => prev.filter((p) => p.id !== personId))
    // Remove person from all assignments
    setAssignments((prev) => {
      const next = {}
      for (const [itemId, sharers] of Object.entries(prev)) {
        next[itemId] = sharers.filter((id) => id !== personId)
      }
      return next
    })
  }, [setPeople, setAssignments])

  // ── Assignment management ──────────────────────────────────────

  const togglePerson = useCallback((itemId, personId) => {
    setAssignments((prev) => {
      const current = prev[itemId] || []
      const hasIt   = current.includes(personId)
      return {
        ...prev,
        [itemId]: hasIt
          ? current.filter((id) => id !== personId)
          : [...current, personId],
      }
    })
  }, [setAssignments])

  const splitEvenly = useCallback(() => {
    if (people.length === 0) return
    setAssignments(buildEvenAssignments(items, people))
  }, [items, people, setAssignments])

  const clearAll = useCallback(() => {
    setAssignments({})
  }, [setAssignments])

  // ── Stats ──────────────────────────────────────────────────────

  const unassignedCount = items.filter((item) => {
    const sharers = assignments[item.id]
    return !sharers || sharers.length === 0
  }).length

  const allAssigned = unassignedCount === 0 && items.length > 0

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="slide-up" style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── People panel ─────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9375rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="#a78bfa" />
            People
            <span style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 400 }}>
              ({people.length})
            </span>
          </h3>
          {people.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-ghost"
                onClick={splitEvenly}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem' }}
                title="Assign every item to all people evenly"
              >
                <Zap size={13} />
                Split Evenly
              </button>
              <button
                className="btn btn-ghost"
                onClick={clearAll}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', gap: '0.3rem', color: '#f87171' }}
                title="Clear all assignments"
              >
                <X size={13} />
                Clear
              </button>
            </div>
          )}
        </div>

        {/* People list */}
        {people.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: '#4b5563', paddingTop: '0.25rem' }}>
            Add at least one person to start assigning items.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.625rem' }}>
            {people.map((person) => (
              <div
                key={person.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: `${person.color}10`,
                  border: `1px solid ${person.color}30`,
                  borderRadius: '99px',
                  padding: '0.3rem 0.5rem 0.3rem 0.375rem',
                }}
              >
                <PersonAvatar person={person} size={26} />
                <span style={{ fontSize: '0.85rem', color: person.color, fontWeight: 600 }}>
                  {person.name}
                </span>
                <button
                  onClick={() => removePerson(person.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#4b5563', padding: '0 0.125rem', display: 'flex', alignItems: 'center',
                  }}
                  title={`Remove ${person.name}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <AddPersonInput onAdd={addPerson} usedColors={people} />
      </div>

      {/* ── Assignment status bar ────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.625rem 1rem',
          background: allAssigned
            ? 'rgba(34,211,168,0.07)'
            : unassignedCount > 0 && people.length > 0
              ? 'rgba(245,158,11,0.07)'
              : 'rgba(255,255,255,0.03)',
          border: `1px solid ${allAssigned ? 'rgba(34,211,168,0.2)' : unassignedCount > 0 && people.length > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        {allAssigned
          ? <CheckCircle2 size={14} color="#22d3a8" />
          : <AlertCircle  size={14} color={people.length > 0 ? '#f59e0b' : '#4b5563'} />
        }
        <p style={{ fontSize: '0.8125rem', color: allAssigned ? '#22d3a8' : people.length > 0 && unassignedCount > 0 ? '#f59e0b' : '#6b7280' }}>
          {allAssigned
            ? `All ${items.length} items assigned — ready to continue!`
            : people.length === 0
              ? 'Add people above, then assign items below.'
              : `${unassignedCount} of ${items.length} item${unassignedCount !== 1 ? 's' : ''} still unassigned`
          }
        </p>
      </div>

      {/* ── Item cards ───────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9375rem', color: '#e2e8f0', marginBottom: '0.875rem' }}>
          Assign Items
        </h3>
        {items.length === 0 ? (
          <p style={{ color: '#4b5563', fontSize: '0.8125rem' }}>No items to assign.</p>
        ) : (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              people={people}
              assignedTo={assignments[item.id] || []}
              onTogglePerson={togglePerson}
            />
          ))
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ gap: '0.4rem' }}
        >
          ← Back
        </button>
        <button
          id="continue-to-summary-btn"
          className="btn btn-primary"
          onClick={onContinue}
          disabled={!allAssigned || people.length === 0}
          style={{
            flex: 1, justifyContent: 'center',
            opacity: (!allAssigned || people.length === 0) ? 0.45 : 1,
          }}
        >
          View Split Summary
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
