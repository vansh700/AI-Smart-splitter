# Product Requirements Document
## Smart Bill Splitter Agent

**Project**: AI-Powered Receipt Splitting Tool  
**Author**: [Your Name]  
**Date**: September 2026  
**Status**: In Development

---

## 1. Overview

### Problem Statement
Splitting a shared bill is annoying:
- Manually typing every item and price from a receipt
- Doing tax/tip math by hand across multiple people
- Arguments over who owes what
- No easy way to share the final breakdown

**Current State**: Splitting a group bill by hand takes 5–10 minutes and is error-prone.

### Solution
A simple **AI-powered bill splitter** that reads a photo of a receipt, lets users assign items to people, and instantly calculates what each person owes (tax and tip included, proportionally).

### Target Users
- Friends splitting a restaurant bill
- Roommates splitting groceries
- Coworkers splitting a team lunch

---

## 2. Goals & Success Metrics

### Primary Goals
- Extract receipt items and prices with >95% accuracy
- Split any receipt among 1–10 people in under 10 seconds of user effort
- Correctly distribute tax and tip proportionally to each person's share

### Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Extraction Accuracy | >95% | Manual check against 20 sample receipts |
| Time to Split | <30 sec | User assigns items + gets result |
| Math Accuracy | 100% | Totals always sum to receipt total |

---

## 3. Core Features

### 3.1 Receipt Upload & Extraction
**Description**: User uploads/photographs a receipt → single AI call extracts structured data.

**Capabilities**:
- Supports JPG, PNG, PDF
- Single call to Claude Vision — no multi-step pipeline
- Handles slightly blurry or angled photos

**Extracted Fields**:
```json
{
  "vendor": "Joe's Pizza",
  "date": "2026-09-18",
  "items": [
    {"name": "Margherita Pizza", "price": 14.00},
    {"name": "Caesar Salad", "price": 9.00},
    {"name": "Soda", "price": 3.00}
  ],
  "subtotal": 26.00,
  "tax": 2.34,
  "tip": 5.00,
  "total": 33.34,
  "confidence": 0.97
}
```

### 3.2 Item Assignment
**Description**: User taps each item and assigns it to one or more people (or marks it "shared evenly").

**UI**:
- Add people by name (chips/tags)
- Tap an item → select who's paying for it
- Items can be split between multiple people (e.g., shared appetizer)
- "Split everything evenly" as a one-click fallback

### 3.3 Split Calculation
**Description**: App calculates each person's share, proportionally distributing tax and tip based on their portion of the subtotal.

**Logic**:
```
person_subtotal = sum of items assigned to person (split shares counted proportionally)
person_share_ratio = person_subtotal / total_subtotal
person_tax = tax * person_share_ratio
person_tip = tip * person_share_ratio
person_total = person_subtotal + person_tax + person_tip
```

**Output**:
```json
{
  "breakdown": [
    {"name": "Alex", "subtotal": 14.00, "tax": 1.26, "tip": 2.69, "total": 17.95},
    {"name": "Sam", "subtotal": 12.00, "tax": 1.08, "tip": 2.31, "total": 15.39}
  ],
  "checksTotal": 33.34,
  "receiptTotal": 33.34,
  "matches": true
}
```

### 3.4 Shareable Summary
**Description**: A clean summary card showing each person's total, shareable as an image or link.

**Capabilities**:
- Downloadable/shareable summary image
- Optional payment link field (e.g., paste your Venmo/UPI handle) shown next to your name

---

## 4. User Stories

### Story 1: Even Split (Happy Path)
```
AS A user
I WANT to split a dinner bill evenly among 4 friends
SO THAT I don't have to do the math myself

GIVEN I upload a receipt and add 4 names
WHEN I tap "Split evenly"
THEN the app divides subtotal, tax, and tip equally
  and shows each person's total

ACCEPTANCE CRITERIA:
- Totals sum exactly to receipt total
- Completes in one tap after names are added
```

### Story 2: Itemized Split
```
AS A user
I WANT to assign specific items to specific people
SO THAT everyone pays only for what they ordered

GIVEN a receipt with 5 items and 3 people
WHEN I assign each item to a person (or split a shared item)
THEN the app calculates each person's subtotal
  and distributes tax/tip proportionally

ACCEPTANCE CRITERIA:
- Every item must be assigned before calculating
- Shared items split evenly among selected people
```

### Story 3: Low-Quality Image
```
AS A user
I WANT to be told if my receipt photo didn't scan well
SO THAT I can fix it before splitting

GIVEN I upload a blurry receipt
WHEN confidence is below 80%
THEN the app shows extracted items with a warning
  and lets me manually edit any item/price

ACCEPTANCE CRITERIA:
- Manual edit is always available
- App never silently guesses without flagging low confidence
```

---

## 5. Technical Architecture

### 5.1 Tech Stack
```
Frontend:
- React (or plain HTML/JS for a single-file build)
- Tailwind CSS for styling

Backend / Logic:
- Single call to Claude API (Vision) for extraction
- All splitting math done client-side (no backend needed)

Storage:
- None required — fully stateless, in-memory per session
```

### 5.2 Flow (Single AI Call — No Multi-Agent Pipeline)
```
┌────────────────────┐
│ Receipt Photo       │
│ (JPG/PNG/PDF)       │
└─────────┬───────────┘
          │
   ┌──────▼──────────────┐
   │ One Claude Vision    │
   │ API call:            │
   │ image → JSON          │
   │ (items, tax, tip,     │
   │  total, confidence)   │
   └──────┬────────────────┘
          │
   ┌──────▼──────────────┐
   │ User assigns items   │
   │ to people (UI only)  │
   └──────┬───────────────┘
          │
   ┌──────▼──────────────┐
   │ Client-side math:    │
   │ proportional split   │
   └──────┬───────────────┘
          │
   ┌──────▼──────────────┐
   │ Summary card /       │
   │ shareable result     │
   └───────────────────────┘
```

### 5.3 API Specification

#### POST /api/parse-receipt
**Request**:
```
Content-Type: multipart/form-data
{ "image": <binary file> }
```

**Response**:
```json
{
  "vendor": "Joe's Pizza",
  "items": [
    {"name": "Margherita Pizza", "price": 14.00},
    {"name": "Caesar Salad", "price": 9.00}
  ],
  "subtotal": 23.00,
  "tax": 2.07,
  "tip": 4.00,
  "total": 29.07,
  "confidence": 0.96
}
```

No further backend endpoints are required — splitting and summary generation happen entirely in the frontend.

---

## 6. Data & Privacy

- Receipt image is sent only to the AI API for extraction and is not stored
- No user accounts, no database — nothing persists after the session ends
- No PII collected beyond names the user types in for splitting (not stored server-side)

---

## 7. Rollout Plan

### Phase 1: MVP (few hours)
- Upload receipt → single API call → display extracted items
- Manual edit of any field
- Add people, assign items, split evenly option

### Phase 2: Polish
- Proportional tax/tip math
- Shareable summary card (image export)
- Low-confidence warning + manual override

---

## 8. Constraints & Assumptions

### Constraints
- Single AI call only — no multi-agent orchestration
- No backend database — stateless, client-side calculation
- Receipts assumed to be in English, standard restaurant/retail format

### Assumptions
- Max 1 receipt per session
- Up to 10 people per split
- Receipt image under 10MB

---

## 9. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Extraction errors | Wrong prices shown | Manual edit always available |
| Blurry image | Low confidence extraction | Flag + prompt manual correction |
| Rounding errors | Totals don't match receipt | Adjust last person's total by the rounding remainder so sum always matches |

---

## 10. Why This Is a Good Simple Project

- ✅ **Single AI call** — no agent chaining, easy to build and reason about
- ✅ **Real, relatable problem** — everyone has split a bill
- ✅ **Visually demoable** — receipt in, clean split summary out
- ✅ **No backend/infra needed** — can run as a single-page app
- ✅ **Fast to build** — a few hours from scratch

---

## 11. Future Enhancements

- Multi-currency support
- Save frequent groups (roommates, recurring friend group)
- Payment app deep links (Venmo, UPI, PayPal)
- Multiple receipts in one session (e.g., a whole trip)

---

**Document Version**: 1.0  
**Status**: Ready for Development
