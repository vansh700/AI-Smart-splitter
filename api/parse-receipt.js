/**
 * api/parse-receipt.js
 * ────────────────────
 * Vercel Serverless Function that receives a receipt image from the frontend,
 * securely reads the AI API key on the backend (never exposed to browser),
 * and parses the receipt with Claude Vision or Gemini Vision.
 */

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {}

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing receipt image in request body' })
    }

    // Read API key securely from server-side environment variables
    const apiKey = (
      process.env.CLAUDE_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_CLAUDE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      ''
    ).trim()

    if (!apiKey) {
      return res.status(500).json({
        error: 'No AI API key configured on server. Please add CLAUDE_API_KEY or GEMINI_API_KEY to your environment variables.',
      })
    }

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

    let parsed

    if (apiKey.startsWith('sk-ant-')) {
      // ── Claude Vision API (Anthropic Messages) ──
      const endpoint = 'https://api.anthropic.com/v1/messages'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
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
                    data: imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: EXTRACTION_PROMPT,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return res.status(response.status).json({
          error: err?.error?.message || `Claude API error: ${response.status} ${response.statusText}`,
        })
      }

      const data = await response.json()
      const text = data?.content?.[0]?.text
      if (!text) {
        return res.status(500).json({ error: 'No content returned from Claude API' })
      }

      try {
        parsed = JSON.parse(text)
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (!match) {
          return res.status(500).json({ error: 'Could not parse JSON response from Claude' })
        }
        parsed = JSON.parse(match[0])
      }
    } else {
      // ── Google Gemini Vision API ──
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBase64,
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
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return res.status(response.status).json({
          error: err?.error?.message || `Gemini API error: ${response.status} ${response.statusText}`,
        })
      }

      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        return res.status(500).json({ error: 'No content returned from Gemini API' })
      }

      try {
        parsed = JSON.parse(text)
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (!match) {
          return res.status(500).json({ error: 'Could not parse JSON response from Gemini' })
        }
        parsed = JSON.parse(match[0])
      }
    }

    return res.status(200).json(parsed)
  } catch (error) {
    console.error('Server error in /api/parse-receipt:', error)
    return res.status(500).json({
      error: error.message || 'Internal server error while analyzing receipt.',
    })
  }
}
