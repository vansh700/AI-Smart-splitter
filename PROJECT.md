# Smart Bill Splitter Agent

**Goal**: An AI-powered receipt splitting tool that extracts line items from receipt photos, allows interactive item assignments (including multi-person sharing), proportionally distributes tax and tips with 100% mathematical accuracy, and generates shareable summaries.  
**Tech stack**: React 18, Vite, Tailwind CSS, Lucide React, Canvas / html-to-image, AI Vision (Claude / Gemini Vision APIs).

---

## Status
**Current step**: Step 0 (Git Repository Connected) | **Last updated**: 2026-09-19

---

## Roadmap
1. **Step 1: Scaffolding & Setup** — Initialize Vite + React + Tailwind CSS project, Lucide icons, baseline structure.
2. **Step 2: Math & Split Engine** — Proportional tax/tip distribution logic, penny rounding reconciliation, automated test suite.
3. **Step 3: Receipt Upload & Vision Extraction** — Drag-and-drop / camera receipt upload, sample presets, AI vision extraction API service.
4. **Step 4: Editable Item Grid & Confidence UI** — Line item editor, price adjustments, subtotal/tax/tip override, low-confidence warnings.
5. **Step 5: People & Item Assignment UI** — Interactive participant chips, multi-select assignment per item, "Split Evenly" mode.
6. **Step 6: Live Split Calculation & Validation** — Live tally per person, checksTotal vs receiptTotal match indicator, per-person item breakdown.
7. **Step 7: Shareable Summary & Card Export** — Visual receipt summary card, payment handle inputs (Venmo/UPI/Zelle), Copy text summary, and PNG image export.
8. **Step 8: UI Polish, Dark Mode & E2E Validation** — Glassmorphic styling, animations, responsive design, and end-to-end verification.

---

## Step Log
- **Step 0 — 2026-09-19** — Read PRD (`PRD_Bill_Splitter.md`) and rules (`AI_Agent_Project_Rules.pdf`). Initialized Git repository, connected remote `origin` (`https://github.com/vansh700/AI-Smart-splitter.git`), created `.gitignore`, established living documentation `PROJECT.md`, and committed baseline on branch `main`.

---

## File Map
- `PRD_Bill_Splitter.md` — Product Requirements Document.
- `AI_Agent_Project_Rules.pdf` — AI agent collaboration and operating rules.
- `PROJECT.md` — Living project tracking document (single source of truth).

---

## Open Issues
- None at present.

---

## Backlog / Future Ideas
- Multi-currency support (USD, EUR, GBP, INR, etc.)
- Save frequent groups (roommates, recurring dinner group)
- Direct deep links for payment apps (Venmo, UPI, PayPal)
- Multi-receipt support in a single session

---

## How to Run
*(Setup commands will be configured upon Step 1 completion)*
```bash
npm install
npm run dev
```
