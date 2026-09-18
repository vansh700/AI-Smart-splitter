/**
 * sampleReceipts.js
 * ─────────────────
 * Built-in sample receipts for demonstration / offline use.
 * Each receipt is pre-structured as the AI parser would return it.
 */

import { nanoid } from '../utils/nanoid.js'

/**
 * Create a fresh copy of a sample receipt with unique item IDs
 * so the app state is always fresh per session.
 */
function makeSample({ vendor, date, emoji, description, items, subtotal, tax, tip, confidence }) {
  return {
    vendor,
    date,
    emoji,
    description,
    items: items.map((item) => ({ ...item, id: nanoid() })),
    subtotal,
    tax,
    tip,
    total: Math.round((subtotal + tax + tip) * 100) / 100,
    confidence,
  }
}

export const SAMPLE_RECEIPTS = [
  {
    id: 'pizza-dinner',
    label: 'Pizza Dinner 🍕',
    description: '4 friends at Joe\'s Pizza',
    make: () =>
      makeSample({
        vendor: "Joe's Pizza",
        date: '2026-09-18',
        emoji: '🍕',
        description: '4 friends at Joe\'s Pizza',
        items: [
          { name: 'Margherita Pizza',    price: 14.00 },
          { name: 'Pepperoni Pizza',     price: 16.00 },
          { name: 'Caesar Salad',        price: 9.00  },
          { name: 'Garlic Bread',        price: 5.00  },
          { name: 'Soda x2',            price: 6.00  },
          { name: 'Sparkling Water',     price: 4.00  },
        ],
        subtotal: 54.00,
        tax: 4.86,
        tip: 10.00,
        confidence: 0.97,
      }),
  },
  {
    id: 'team-lunch',
    label: 'Team Lunch 🥗',
    description: '3 coworkers at Fresh Bowl',
    make: () =>
      makeSample({
        vendor: 'Fresh Bowl',
        date: '2026-09-18',
        emoji: '🥗',
        description: '3 coworkers at Fresh Bowl',
        items: [
          { name: 'Chicken Rice Bowl',   price: 13.50 },
          { name: 'Veggie Wrap',         price: 11.00 },
          { name: 'Salmon Poke Bowl',    price: 15.50 },
          { name: 'Cold Brew x3',        price: 14.00 },
          { name: 'Shared Hummus',       price: 7.00  },
        ],
        subtotal: 61.00,
        tax: 5.49,
        tip: 12.00,
        confidence: 0.98,
      }),
  },
  {
    id: 'grocery-run',
    label: 'Grocery Run 🛒',
    description: '2 roommates at Whole Foods',
    make: () =>
      makeSample({
        vendor: 'Whole Foods',
        date: '2026-09-18',
        emoji: '🛒',
        description: '2 roommates at Whole Foods',
        items: [
          { name: 'Organic Eggs (12)',   price: 5.99  },
          { name: 'Sourdough Bread',     price: 4.49  },
          { name: 'Avocados (3)',        price: 3.99  },
          { name: 'Chicken Breast 1lb', price: 8.99  },
          { name: 'Greek Yogurt',       price: 6.49  },
          { name: 'Almond Milk',        price: 4.29  },
          { name: 'Mixed Greens',       price: 3.99  },
          { name: 'Cherry Tomatoes',    price: 3.49  },
        ],
        subtotal: 41.72,
        tax: 0.00,
        tip: 0.00,
        confidence: 0.99,
      }),
  },
]
