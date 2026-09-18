/**
 * splitCalculator.test.js
 * ────────────────────────
 * Vitest unit tests for the core split engine.
 *
 * Scenarios covered:
 *  1. Even split (2 people, 3 items)          — PRD Story 1
 *  2. Itemized split (3 people, 5 items)      — PRD Story 2
 *  3. Shared appetizer (item split 2 ways)    — multi-person item
 *  4. Solo bill (1 person pays everything)    — edge: single person
 *  5. Rounding reconciliation                 — floating-point drift check
 *  6. Unassigned item detection               — guard rail
 *  7. Zero tax/tip                            — edge case
 *  8. buildEvenAssignments helper             — utility correctness
 *  9. subtotalDiscrepancy helper              — utility correctness
 * 10. PRD §3.3 example — exact values check  — specification verification
 */

import { describe, it, expect } from 'vitest'
import {
  calculateSplit,
  buildEvenAssignments,
  subtotalDiscrepancy,
  roundCents,
  formatCurrency,
} from './splitCalculator.js'

// ─── Fixtures ────────────────────────────────────────────────────

const ITEMS_3 = [
  { id: 'i1', name: 'Margherita Pizza',  price: 14.00 },
  { id: 'i2', name: 'Caesar Salad',      price: 9.00  },
  { id: 'i3', name: 'Soda',             price: 3.00  },
]
const PEOPLE_2 = [
  { id: 'p1', name: 'Alex' },
  { id: 'p2', name: 'Sam'  },
]

// ─── Scenario 1: Even split ───────────────────────────────────────
describe('Scenario 1 — Even split (2 people, 3 items)', () => {
  const assignments = buildEvenAssignments(ITEMS_3, PEOPLE_2)
  const result = calculateSplit({
    items: ITEMS_3,
    people: PEOPLE_2,
    assignments,
    tax: 2.34,
    tip: 5.00,
    subtotal: 26.00,
  })

  it('checksTotal equals receiptTotal', () => {
    expect(result.matches).toBe(true)
    expect(result.checksTotal).toBe(result.receiptTotal)
  })

  it('receiptTotal is subtotal + tax + tip', () => {
    expect(result.receiptTotal).toBe(roundCents(26.00 + 2.34 + 5.00))
  })

  it('each person pays roughly half', () => {
    for (const p of result.breakdown) {
      expect(p.total).toBeGreaterThan(0)
      // Each should be close to 16.67
      expect(p.total).toBeCloseTo(16.67, 0)
    }
  })

  it('no unassigned items', () => {
    expect(result.unassignedItems).toHaveLength(0)
  })
})

// ─── Scenario 2: Itemized split ───────────────────────────────────
describe('Scenario 2 — Itemized split (3 people, 5 items)', () => {
  const ITEMS_5 = [
    { id: 'a', name: 'Burger',    price: 12.00 },
    { id: 'b', name: 'Pasta',     price: 11.00 },
    { id: 'c', name: 'Salad',     price: 8.00  },
    { id: 'd', name: 'Dessert',   price: 7.00  },
    { id: 'e', name: 'Drinks',    price: 6.00  },
  ]
  const PEOPLE_3 = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob'   },
    { id: 'p3', name: 'Carol' },
  ]
  const assignments = {
    a: ['p1'],        // Alice's burger
    b: ['p2'],        // Bob's pasta
    c: ['p3'],        // Carol's salad
    d: ['p1', 'p2'],  // Alice & Bob share dessert
    e: ['p1', 'p2', 'p3'], // everyone shares drinks
  }

  const result = calculateSplit({
    items: ITEMS_5,
    people: PEOPLE_3,
    assignments,
    tax: 4.00,
    tip: 8.00,
    subtotal: 44.00,
  })

  it('checksTotal === receiptTotal (100% accuracy)', () => {
    expect(result.matches).toBe(true)
    expect(result.checksTotal).toBe(result.receiptTotal)
  })

  it('Alice subtotal is burger + half-dessert + third-drinks = 12 + 3.5 + 2 = 17.5', () => {
    const alice = result.breakdown.find((p) => p.name === 'Alice')
    expect(alice.subtotal).toBe(17.50)
  })

  it('Bob subtotal is pasta + half-dessert + third-drinks = 11 + 3.5 + 2 = 16.5', () => {
    const bob = result.breakdown.find((p) => p.name === 'Bob')
    expect(bob.subtotal).toBe(16.50)
  })

  it('Carol subtotal is salad + third-drinks = 8 + 2 = 10', () => {
    const carol = result.breakdown.find((p) => p.name === 'Carol')
    expect(carol.subtotal).toBe(10.00)
  })

  it('no unassigned items', () => {
    expect(result.unassignedItems).toHaveLength(0)
  })
})

// ─── Scenario 3: Shared item only ────────────────────────────────
describe('Scenario 3 — Shared appetizer split 2 ways', () => {
  const items = [{ id: 'app', name: 'Nachos', price: 10.00 }]
  const people = [{ id: 'x', name: 'X' }, { id: 'y', name: 'Y' }]
  const assignments = { app: ['x', 'y'] }

  const result = calculateSplit({ items, people, assignments, tax: 1.00, tip: 2.00, subtotal: 10.00 })

  it('each person pays half the item', () => {
    for (const p of result.breakdown) {
      expect(p.subtotal).toBe(5.00)
    }
  })

  it('totals balance', () => {
    expect(result.matches).toBe(true)
  })
})

// ─── Scenario 4: Solo bill ────────────────────────────────────────
describe('Scenario 4 — Solo bill (1 person)', () => {
  const items   = [{ id: 'i1', name: 'Steak', price: 45.00 }]
  const people  = [{ id: 'p1', name: 'Solo' }]
  const assignments = { i1: ['p1'] }

  const result = calculateSplit({ items, people, assignments, tax: 4.05, tip: 9.00, subtotal: 45.00 })

  it('solo person pays the full receipt total', () => {
    expect(result.breakdown[0].total).toBe(result.receiptTotal)
  })

  it('totals balance', () => {
    expect(result.matches).toBe(true)
  })
})

// ─── Scenario 5: Floating-point drift stress test ─────────────────
describe('Scenario 5 — Penny reconciliation (floating-point stress)', () => {
  // 3 items at $10 each, 3 people, tax $1 (doesn't divide evenly)
  const items = [
    { id: 'i1', name: 'A', price: 10.00 },
    { id: 'i2', name: 'B', price: 10.00 },
    { id: 'i3', name: 'C', price: 10.00 },
  ]
  const people = [
    { id: 'p1', name: 'P1' },
    { id: 'p2', name: 'P2' },
    { id: 'p3', name: 'P3' },
  ]
  const assignments = buildEvenAssignments(items, people)

  const result = calculateSplit({ items, people, assignments, tax: 1.00, tip: 0, subtotal: 30.00 })

  it('checksTotal === receiptTotal even with rounding', () => {
    expect(result.checksTotal).toBe(result.receiptTotal)
    expect(result.matches).toBe(true)
  })

  it('receiptTotal is $31.00', () => {
    expect(result.receiptTotal).toBe(31.00)
  })
})

// ─── Scenario 6: Unassigned item detection ────────────────────────
describe('Scenario 6 — Unassigned item detection', () => {
  const items  = [
    { id: 'i1', name: 'Pizza', price: 15.00 },
    { id: 'i2', name: 'Wine',  price: 20.00 },  // ← not assigned
  ]
  const people = [{ id: 'p1', name: 'Vansh' }]
  const assignments = { i1: ['p1'] }  // i2 has no assignment

  const result = calculateSplit({ items, people, assignments, tax: 2.00, tip: 3.00, subtotal: 35.00 })

  it('detects unassigned item i2', () => {
    expect(result.unassignedItems).toContain('i2')
  })

  it('unassigned item does not affect the person\'s subtotal', () => {
    expect(result.breakdown[0].subtotal).toBe(15.00)
  })
})

// ─── Scenario 7: Zero tax and tip ────────────────────────────────
describe('Scenario 7 — Zero tax and tip', () => {
  const items  = [{ id: 'i1', name: 'Groceries', price: 50.00 }]
  const people = [
    { id: 'p1', name: 'A' },
    { id: 'p2', name: 'B' },
  ]
  const assignments = { i1: ['p1', 'p2'] }

  const result = calculateSplit({ items, people, assignments, tax: 0, tip: 0, subtotal: 50.00 })

  it('each person pays $25.00', () => {
    for (const p of result.breakdown) {
      expect(p.total).toBe(25.00)
      expect(p.tax).toBe(0)
      expect(p.tip).toBe(0)
    }
  })

  it('totals balance', () => {
    expect(result.matches).toBe(true)
  })
})

// ─── Scenario 8: buildEvenAssignments helper ─────────────────────
describe('buildEvenAssignments helper', () => {
  it('assigns every item to every person', () => {
    const items  = [{ id: 'i1' }, { id: 'i2' }]
    const people = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]
    const result = buildEvenAssignments(items, people)

    expect(result['i1']).toEqual(['p1', 'p2', 'p3'])
    expect(result['i2']).toEqual(['p1', 'p2', 'p3'])
  })
})

// ─── Scenario 9: subtotalDiscrepancy helper ───────────────────────
describe('subtotalDiscrepancy helper', () => {
  it('returns 0 when items match subtotal', () => {
    const items = [{ price: 10 }, { price: 5 }]
    expect(subtotalDiscrepancy(items, 15)).toBe(0)
  })

  it('returns positive when items exceed subtotal', () => {
    const items = [{ price: 10 }, { price: 7 }]
    expect(subtotalDiscrepancy(items, 15)).toBe(2)
  })

  it('returns negative when items are less than subtotal', () => {
    const items = [{ price: 10 }]
    expect(subtotalDiscrepancy(items, 15)).toBe(-5)
  })
})

// ─── Scenario 10: PRD §3.3 exact specification example ───────────
describe('Scenario 10 — PRD §3.3 spec example', () => {
  // From PRD §3.3 output example:
  // Alex → subtotal 14, Sam → subtotal 12, total = 33.34
  const items = [
    { id: 'i1', name: 'Margherita Pizza', price: 14.00 },
    { id: 'i2', name: 'Caesar Salad',     price: 9.00  },
    { id: 'i3', name: 'Soda',            price: 3.00  },
  ]
  const people = [
    { id: 'alex', name: 'Alex' },
    { id: 'sam',  name: 'Sam'  },
  ]
  // Alex gets Pizza (14), Sam gets Salad (9) + Soda (3) = 12
  const assignments = { i1: ['alex'], i2: ['sam'], i3: ['sam'] }

  const result = calculateSplit({
    items,
    people,
    assignments,
    tax: 2.34,
    tip: 5.00,
    subtotal: 26.00,
  })

  it('Alex subtotal = $14.00', () => {
    const alex = result.breakdown.find((p) => p.name === 'Alex')
    expect(alex.subtotal).toBe(14.00)
  })

  it('Sam subtotal = $12.00', () => {
    const sam = result.breakdown.find((p) => p.name === 'Sam')
    expect(sam.subtotal).toBe(12.00)
  })

  it('checksTotal === $33.34 (PRD spec)', () => {
    expect(result.checksTotal).toBe(33.34)
    expect(result.receiptTotal).toBe(33.34)
  })

  it('matches === true', () => {
    expect(result.matches).toBe(true)
  })
})

// ─── roundCents & formatCurrency helpers ─────────────────────────
describe('Utility: roundCents', () => {
  it('rounds 1.005 to 1.01', () => expect(roundCents(1.005)).toBe(1.01))
  it('rounds 2.334 to 2.33', () => expect(roundCents(2.334)).toBe(2.33))
  it('handles 0',            () => expect(roundCents(0)).toBe(0))
})

describe('Utility: formatCurrency', () => {
  it('formats 12.5 as $12.50', () => expect(formatCurrency(12.5)).toBe('$12.50'))
  it('formats 0 as $0.00',     () => expect(formatCurrency(0)).toBe('$0.00'))
})
