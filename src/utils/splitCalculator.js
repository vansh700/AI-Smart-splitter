/**
 * splitCalculator.js
 * ──────────────────
 * Core mathematical engine for the Smart Bill Splitter.
 *
 * Implements the PRD §3.3 logic:
 *   person_subtotal     = Σ (item.price / sharers_count) for all items assigned to person
 *   person_share_ratio  = person_subtotal / total_subtotal
 *   person_tax          = tax  * person_share_ratio
 *   person_tip          = tip  * person_share_ratio
 *   person_total        = person_subtotal + person_tax + person_tip
 *
 * Rounding: The last person absorbs any floating-point remainder so that
 *   Σ(person_total) === receiptTotal  exactly (to the cent).
 *
 * All monetary values are kept as JavaScript numbers (floats).
 * Dollar amounts are rounded to 2 decimal places for display using
 * roundCents() throughout.
 */

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Round to 2 decimal places (banker-safe via Math.round on shifted value).
 * @param {number} value
 * @returns {number}
 */
export function roundCents(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Format a number as a USD dollar string  e.g. 12.5 → "$12.50"
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// ─── Main calculation ─────────────────────────────────────────────

/**
 * Calculate how much each person owes.
 *
 * @param {Object} params
 * @param {Array<{id:string, name:string, price:number}>} params.items
 *   All line items on the receipt.
 * @param {Array<{id:string, name:string}>} params.people
 *   All participants.
 * @param {Object<string, string[]>} params.assignments
 *   Map of itemId → array of personIds who share that item.
 *   If an item has no assignment it is ignored (unassigned).
 * @param {number} params.tax       Total tax amount on the receipt.
 * @param {number} params.tip       Total tip amount on the receipt.
 * @param {number} params.subtotal  Receipt subtotal (sum of item prices).
 *
 * @returns {{
 *   breakdown: Array<{
 *     personId: string,
 *     name: string,
 *     subtotal: number,
 *     tax: number,
 *     tip: number,
 *     total: number,
 *     items: Array<{itemId:string, name:string, share:number}>
 *   }>,
 *   checksTotal: number,
 *   receiptTotal: number,
 *   matches: boolean,
 *   unassignedItems: string[]   // ids of items with no assignment
 * }}
 */
export function calculateSplit({ items, people, assignments, tax, tip, subtotal }) {
  // ── 1. Identify unassigned items ─────────────────────────────
  const unassignedItems = items
    .filter((item) => {
      const sharers = assignments[item.id]
      return !sharers || sharers.length === 0
    })
    .map((item) => item.id)

  // ── 2. Build per-person subtotal from assigned items ─────────
  //    Each person's share of a shared item = item.price / number_of_sharers
  const personSubtotals = {}  // { personId: number }
  const personItemLines = {}  // { personId: [{itemId, name, share}] }

  for (const person of people) {
    personSubtotals[person.id] = 0
    personItemLines[person.id] = []
  }

  for (const item of items) {
    const sharers = assignments[item.id]
    if (!sharers || sharers.length === 0) continue   // unassigned — skip

    const sharePerPerson = item.price / sharers.length

    for (const personId of sharers) {
      if (personSubtotals[personId] === undefined) continue  // unknown person guard
      personSubtotals[personId] += sharePerPerson
      personItemLines[personId].push({
        itemId: item.id,
        name: item.name,
        share: roundCents(sharePerPerson),
      })
    }
  }

  // ── 3. Compute effective subtotal (sum of all person subtotals)
  //    This equals receipt subtotal when everything is assigned.
  const effectiveSubtotal = Object.values(personSubtotals).reduce((s, v) => s + v, 0)

  // ── 4. Distribute tax & tip proportionally; build breakdown ──
  const receiptTotal = roundCents(subtotal + tax + tip)

  // Pre-round each person's amounts
  const breakdown = people.map((person) => {
    const pSub   = personSubtotals[person.id] || 0
    const ratio  = effectiveSubtotal > 0 ? pSub / effectiveSubtotal : 0
    const pTax   = roundCents(tax * ratio)
    const pTip   = roundCents(tip * ratio)
    const pTotal = roundCents(pSub + pTax + pTip)

    return {
      personId: person.id,
      name: person.name,
      subtotal: roundCents(pSub),
      tax: pTax,
      tip: pTip,
      total: pTotal,
      items: personItemLines[person.id] || [],
    }
  })

  // ── 5. Penny reconciliation ───────────────────────────────────
  //    Adjust the last person's total so the grand sum exactly
  //    matches receiptTotal (eliminates floating-point drift).
  if (breakdown.length > 0) {
    const sumBeforeReconcile = roundCents(
      breakdown.reduce((s, p) => s + p.total, 0)
    )
    const diff = roundCents(receiptTotal - sumBeforeReconcile)

    if (diff !== 0) {
      // Apply the remainder to the person with the largest share
      // (more natural than always adjusting the last alphabetically)
      const richestIdx = breakdown.reduce(
        (maxIdx, p, i, arr) => (p.total > arr[maxIdx].total ? i : maxIdx),
        0
      )
      breakdown[richestIdx].total  = roundCents(breakdown[richestIdx].total  + diff)
      // Allocate diff to tax column of that person for transparency
      breakdown[richestIdx].tax    = roundCents(breakdown[richestIdx].tax    + diff)
    }
  }

  // ── 6. Verify ────────────────────────────────────────────────
  const checksTotal = roundCents(breakdown.reduce((s, p) => s + p.total, 0))
  const matches     = checksTotal === receiptTotal

  return { breakdown, checksTotal, receiptTotal, matches, unassignedItems }
}

// ─── "Split Evenly" convenience helper ───────────────────────────

/**
 * Build an assignments map where every item is split among ALL people.
 * Useful for the one-tap "Split everything evenly" button.
 *
 * @param {Array<{id:string}>} items
 * @param {Array<{id:string}>} people
 * @returns {Object<string, string[]>}
 */
export function buildEvenAssignments(items, people) {
  const allPersonIds = people.map((p) => p.id)
  return Object.fromEntries(items.map((item) => [item.id, allPersonIds]))
}

// ─── Subtotal validator ───────────────────────────────────────────

/**
 * Check whether the sum of item prices matches the stated subtotal.
 * Returns the discrepancy (0 means perfect match).
 *
 * @param {Array<{price:number}>} items
 * @param {number} subtotal
 * @returns {number}  positive = items sum more than subtotal, negative = less
 */
export function subtotalDiscrepancy(items, subtotal) {
  const itemSum = roundCents(items.reduce((s, item) => s + item.price, 0))
  return roundCents(itemSum - subtotal)
}
