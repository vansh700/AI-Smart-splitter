/**
 * aiReceiptParser.js
 * ──────────────────
 * Client-side service that sends receipt images to our secure backend endpoint
 * (`/api/parse-receipt`).
 *
 * 🔒 SECURITY ARCHITECTURE:
 * - NO API keys are kept, loaded, or bundled on the frontend.
 * - All AI requests are executed server-side via Vercel Serverless Functions.
 * - Returns normalized receipt object matching PRD §3.1 schema.
 */

import { nanoid } from '../utils/nanoid.js'
import { roundCents } from '../utils/splitCalculator.js'

// ─── Base64 helper ────────────────────────────────────────────────

/**
 * Convert a File/Blob to base64 string.
 * @param {File|Blob} file
 * @returns {Promise<string>} base64 data (no prefix)
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => {
      const result = reader.result || ''
      const base64 = typeof result === 'string' ? result.split(',')[1] : ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Main parse function ──────────────────────────────────────────

/**
 * Sends the receipt image to the backend endpoint `/api/parse-receipt`.
 *
 * @param {File|Blob} imageFile  The receipt image file
 * @returns {Promise<Object>}    Normalized receipt object
 */
export async function parseReceipt(imageFile) {
  const imageBase64 = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  const response = await fetch('/api/parse-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      mimeType,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data?.error || `Failed to analyze receipt (HTTP ${response.status})`
    )
  }

  return normalizeReceiptData(data)
}

// ─── Direct helper for Gemini (backward-compatibility/testing) ────
export async function parseReceiptWithGemini(imageFile) {
  return parseReceipt(imageFile)
}

// ─── Direct helper for Claude (backward-compatibility/testing) ────
export async function parseReceiptWithClaude(imageFile) {
  return parseReceipt(imageFile)
}

// ─── Normalize & validate ─────────────────────────────────────────

/**
 * Normalize raw API response into the canonical receipt shape.
 * Adds unique IDs to each item and ensures all numeric fields are valid.
 *
 * @param {Object} raw  Raw parsed JSON from the AI
 * @returns {Object}    Normalized receipt object
 */
export function normalizeReceiptData(raw) {
  const items = (Array.isArray(raw?.items) ? raw.items : []).map((item) => ({
    id:    nanoid(),
    name:  String(item?.name  || 'Unknown Item').trim(),
    price: roundCents(Math.max(0, Number(item?.price) || 0)),
  }))

  const subtotal   = roundCents(Math.max(0, Number(raw?.subtotal) || 0))
  const tax        = roundCents(Math.max(0, Number(raw?.tax)      || 0))
  const tip        = roundCents(Math.max(0, Number(raw?.tip)      || 0))
  const total      = roundCents(subtotal + tax + tip)
  const confidence = Math.min(1, Math.max(0, Number(raw?.confidence) || 0.8))

  return {
    vendor:     String(raw?.vendor || 'Unknown Vendor').trim(),
    date:       String(raw?.date   || '').trim(),
    items,
    subtotal,
    tax,
    tip,
    total,
    confidence,
  }
}

// ─── Helper functions ─────────────────────────────────────────────
// Frontend does not manage keys anymore; serverless backend handles it securely.
export function hasApiKey() {
  return true
}

export function loadApiKey() {
  return ''
}

export function saveApiKey()  {}
export function clearApiKey() {}
