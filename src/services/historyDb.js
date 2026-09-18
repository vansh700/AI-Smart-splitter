/**
 * historyDb.js
 * ────────────
 * Client-side database using Dexie (IndexedDB wrapper).
 * Stores completed bill splits locally in the browser —
 * persists across page refreshes and browser restarts.
 *
 * Schema:
 *   splits {
 *     id            — auto-increment primary key
 *     createdAt     — ISO timestamp
 *     vendor        — restaurant / store name
 *     date          — receipt date (YYYY-MM-DD)
 *     total         — grand total (number)
 *     peopleCount   — number of people in the split
 *     itemsCount    — number of line items
 *     receipt       — full receipt JSON (vendor, date, items, subtotal, tax, tip, total, confidence)
 *     people        — people array JSON [{id, name, color}]
 *     assignments   — assignments object JSON {itemId: [personId, ...]}
 *     breakdown     — calculated split result JSON per person
 *   }
 */

import Dexie from 'dexie'

// ─── Database definition ──────────────────────────────────────────

export const db = new Dexie('SmartBillSplitter')

db.version(1).stores({
  splits: '++id, createdAt, vendor, date, total, peopleCount',
})

// ─── CRUD helpers ─────────────────────────────────────────────────

/**
 * Save a completed split to history.
 * @param {{ receipt, people, assignments, breakdown }} data
 * @returns {Promise<number>} The new split's id
 */
export async function saveSplit({ receipt, people, assignments, breakdown }) {
  return db.splits.add({
    createdAt:   new Date().toISOString(),
    vendor:      receipt.vendor || 'Unknown Vendor',
    date:        receipt.date   || '',
    total:       receipt.total  || 0,
    peopleCount: people.length,
    itemsCount:  receipt.items.length,
    receipt:     JSON.stringify(receipt),
    people:      JSON.stringify(people),
    assignments: JSON.stringify(assignments),
    breakdown:   JSON.stringify(breakdown),
  })
}

/**
 * Fetch all splits, newest first.
 * @returns {Promise<Array>}
 */
export async function getAllSplits() {
  return db.splits.orderBy('createdAt').reverse().toArray()
}

/**
 * Fetch a single split by id.
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
export async function getSplit(id) {
  return db.splits.get(id)
}

/**
 * Delete a split by id.
 * @param {number} id
 */
export async function deleteSplit(id) {
  return db.splits.delete(id)
}

/**
 * Clear all history.
 */
export async function clearHistory() {
  return db.splits.clear()
}

/**
 * Parse a stored split row — hydrates JSON fields back to objects.
 * @param {Object} row
 */
export function hydrateSplit(row) {
  return {
    ...row,
    receipt:     JSON.parse(row.receipt),
    people:      JSON.parse(row.people),
    assignments: JSON.parse(row.assignments),
    breakdown:   JSON.parse(row.breakdown),
  }
}

/**
 * Total number of splits stored.
 * @returns {Promise<number>}
 */
export async function getSplitCount() {
  return db.splits.count()
}
