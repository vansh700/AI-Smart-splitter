# Smart Bill Splitter Agent

**Goal**: An AI-powered receipt splitting tool that extracts line items from receipt photos, allows interactive item assignments (including multi-person sharing), proportionally distributes tax and tips with 100% mathematical accuracy, and generates shareable summaries.  
**Tech stack**: React 18, Vite 8, Tailwind CSS v4, Lucide React, html-to-image, Vitest, Gemini Vision API.

---

## Status
**Current step**: ✅ Step 3 Complete → Ready for Step 4 | **Last updated**: 2026-09-19

---

## Roadmap
1. ✅ **Step 1: Scaffolding & Setup** — Vite + React + Tailwind CSS, Lucide icons, html-to-image, design system, baseline shell.
2. ✅ **Step 2: Math & Split Engine** — Proportional tax/tip distribution, fractional item sharing, penny reconciliation. 32/32 Vitest tests pass.
3. ✅ **Step 3: Receipt Upload & Vision Extraction** — Drag-and-drop uploader, 3 sample receipts, Gemini Vision API parser, API key modal, error handling.
4. **Step 4: Editable Item Grid & Confidence UI** — Line item editor, price adjustments, subtotal/tax/tip override, low-confidence warnings.
5. **Step 5: People & Item Assignment UI** — Interactive participant chips, multi-select assignment per item, "Split Evenly" mode.
6. **Step 6: Live Split Calculation & Validation** — Live tally per person, checksTotal vs receiptTotal match indicator, per-person item breakdown.
7. **Step 7: Shareable Summary & Card Export** — Visual receipt summary card, payment handle inputs (Venmo/UPI/Zelle), Copy text summary, and PNG image export.
8. **Step 8: UI Polish, Dark Mode & E2E Validation** — Glassmorphic styling, animations, responsive design, and end-to-end verification.

---

## Step Log
- **Step 0 — 2026-09-19** — Read PRD and rules. Initialized Git repo, connected remote, created `.gitignore` and `PROJECT.md`, committed baseline on `main`.
- **Step 1 — 2026-09-19** — Scaffolded Vite 8 + React 18. Installed Tailwind CSS v4, Lucide React, `html-to-image`. Built full design system. Created `App.jsx` 4-step router, `Header.jsx`, `StepProgressBar.jsx`, `LandingHero.jsx`. Build + dev server verified.
- **Step 2 — 2026-09-19** — Built core math engine `splitCalculator.js`. Proportional tax/tip, fractional item sharing, penny reconciliation. **32/32 Vitest tests pass** across 10 scenarios.
- **Step 3 — 2026-09-19** — Built `ReceiptUploader.jsx` (drag-and-drop, file picker, loading state with scan animation, error handling). Created `aiReceiptParser.js` (Gemini Vision API, single call, base64 encoding, JSON normalization, sessionStorage API key). Created `ApiKeyModal.jsx` (key entry with show/hide, get-key link, privacy note). Created 3 `sampleReceipts.js` (Pizza Dinner, Team Lunch, Grocery Run) — works fully offline. Wired into `App.jsx`. Build 0 errors, 32/32 tests pass.

---

## File Map
- `PRD_Bill_Splitter.md` — Product Requirements Document.
- `AI_Agent_Project_Rules.pdf` — AI agent collaboration and operating rules.
- `PROJECT.md` — Living project tracking document (single source of truth).
- `index.html` — Root HTML with SEO meta, OG tags, and title.
- `vite.config.js` — Vite config with React and Tailwind CSS v4 plugins.
- `src/main.jsx` — React 18 entry point.
- `src/index.css` — Complete design system (tokens, glassmorphism, animations, utilities).
- `src/App.jsx` — Top-level step router (LANDING → REVIEW → ASSIGN → SUMMARY).
- `src/components/Header.jsx` — Sticky glassmorphic navbar with logo and reset button.
- `src/components/StepProgressBar.jsx` — Animated 4-step progress indicator.
- `src/components/LandingHero.jsx` — Welcome screen with hero, CTA buttons, and feature cards.
- `src/components/ReceiptUploader.jsx` — Drag-and-drop upload zone, file picker, scan animation, sample receipt picker.
- `src/components/ApiKeyModal.jsx` — Gemini API key entry modal with validation and privacy note.
- `src/services/aiReceiptParser.js` — Gemini Vision API caller, base64 encoder, JSON normalizer, API key storage.
- `src/data/sampleReceipts.js` — 3 built-in sample receipts (Pizza Dinner, Team Lunch, Grocery Run).
- `src/utils/splitCalculator.js` — Core math engine: `calculateSplit`, `buildEvenAssignments`, `subtotalDiscrepancy`, `roundCents`, `formatCurrency`.
- `src/utils/splitCalculator.test.js` — 32 Vitest unit tests across 10 scenarios.
- `src/utils/nanoid.js` — Tiny unique ID generator.
- `public/favicon.svg` — Gradient SVG app icon.

---

## Open Issues
- None.

---

## How to Run
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Run 32 unit tests (Vitest)
npm run build    # Production bundle → dist/
```
