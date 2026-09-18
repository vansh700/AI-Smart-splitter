/**
 * aiReceiptParser.js
 * ──────────────────
 * AI Vision service that sends a receipt image to either:
 *   1. Anthropic Claude API (claude-3-5-sonnet-20241022) — per PRD §5.1
 *   2. Google Gemini Vision API (gemini-2.0-flash)
 *
 * Single-call design (per PRD §5.2) — one API request, no pipelines.
 *
 * Returns a receipt object matching the PRD §3.1 schema:
 * {
 *   vendor, date, items: [{id, name, price}],
 *   subtotal, tax, tip, total, confidence
 * }
 */

import { nanoid } from '../utils/nanoid.js'
import { roundCents } from '../utils/splitCalculator.js'

// ─── Prompt ───────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are a receipt parser. Analyze this receipt image and extract the data into EXACTLY this JSON format. Do NOT include any explanation or markdown, just the raw JSON object.

{
  "vendor": "Restaurant or store name (string)",
  "date": "Date in YYYY-MM-DD format or empty string",
  "items": [
    { "name": "Item name", "price": 0.00 }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "total": 0.00,
  "confidence": 0.95
}

Rules:
- All prices must be positive numbers with 2 decimal places
- confidence is 0.0–1.0 (how clearly readable the receipt is)
- If tax is not shown, set tax to 0
- If tip is not shown, set tip to 0
- Include every line item you can read
- If a field is unclear, make your best guess and lower confidence accordingly`

// ─── Base64 helper ────────────────────────────────────────────────

/**
 * Convert a File/Blob to base64 string.
 * @param {File|Blob} file
 * @returns {Promise<string>} base64 data (no prefix)
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Gemini Vision call ───────────────────────────────────────────

/**
 * Call Gemini Vision API to parse a receipt image.
 *
 * @param {File|Blob} imageFile  The receipt image file
 * @param {string}    apiKey     Gemini API key
 * @returns {Promise<Object>}    Parsed receipt object
 */
export async function parseReceiptWithGemini(imageFile, apiKey) {
  const base64Data = await fileToBase64(imageFile)
  const mimeType   = imageFile.type || 'image/jpeg'

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          { text: EXTRACTION_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  }

  const response = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      err?.error?.message || `Gemini API error: ${response.status} ${response.statusText}`
    )
  }

  const data  = await response.json()
  const text  = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('No content returned from Gemini API')

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse JSON response from Gemini')
    parsed = JSON.parse(match[0])
  }

  return normalizeReceiptData(parsed)
}

// ─── Claude Vision call ───────────────────────────────────────────

/**
 * Call Anthropic Claude API (Vision) to parse a receipt image.
 *
 * @param {File|Blob} imageFile  The receipt image file
 * @param {string}    apiKey     Anthropic API key (sk-ant-...)
 * @returns {Promise<Object>}    Parsed receipt object
 */
export async function parseReceiptWithClaude(imageFile, apiKey) {
  const base64Data = await fileToBase64(imageFile)
  const mimeType   = imageFile.type || 'image/jpeg'

  const endpoint = 'https://api.anthropic.com/v1/messages'

  const body = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      err?.error?.message || `Claude API error: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  const text = data?.content?.[0]?.text

  if (!text) throw new Error('No content returned from Claude API')

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse JSON response from Claude')
    parsed = JSON.parse(match[0])
  }

  return normalizeReceiptData(parsed)
}

// ─── Universal Parser Router ──────────────────────────────────────

/**
 * Automatically routes the request to Claude or Gemini depending on the key format.
 */
export async function parseReceipt(imageFile, apiKey) {
  const key = apiKey.trim()
  if (key.startsWith('sk-ant-')) {
    return parseReceiptWithClaude(imageFile, key)
  }
  return parseReceiptWithGemini(imageFile, key)
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
  const items = (Array.isArray(raw.items) ? raw.items : []).map((item) => ({
    id:    nanoid(),
    name:  String(item.name  || 'Unknown Item').trim(),
    price: roundCents(Math.max(0, Number(item.price) || 0)),
  }))

  const subtotal   = roundCents(Math.max(0, Number(raw.subtotal) || 0))
  const tax        = roundCents(Math.max(0, Number(raw.tax)      || 0))
  const tip        = roundCents(Math.max(0, Number(raw.tip)      || 0))
  const total      = roundCents(subtotal + tax + tip)
  const confidence = Math.min(1, Math.max(0, Number(raw.confidence) || 0.8))

  return {
    vendor:     String(raw.vendor || 'Unknown Vendor').trim(),
    date:       String(raw.date   || '').trim(),
    items,
    subtotal,
    tax,
    tip,
    total,
    confidence,
  }
}

// ─── API key storage ──────────────────────────────────────────────

const STORAGE_KEY = 'sbs_ai_api_key'

export function saveApiKey(key) {
  sessionStorage.setItem(STORAGE_KEY, key)
  localStorage.setItem(STORAGE_KEY, key)
}

export function loadApiKey() {
  return (
    sessionStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem(STORAGE_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLAUDE_API_KEY) ||
    ''
  )
}

export function clearApiKey() {
  sessionStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY)
}

export function hasApiKey() {
  return Boolean(loadApiKey())
}
