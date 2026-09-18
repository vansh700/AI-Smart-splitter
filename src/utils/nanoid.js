/**
 * nanoid.js
 * ─────────
 * Tiny client-side unique ID generator (no dependency needed).
 * Generates a 10-character alphanumeric ID.
 */
export function nanoid() {
  return Math.random().toString(36).slice(2, 12)
}
