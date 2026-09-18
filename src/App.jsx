/**
 * App.jsx — Smart Bill Splitter
 *
 * Top-level orchestrator. Manages global app state and routes between steps:
 *  Step 1 → Upload / Extract
 *  Step 2 → Review / Edit Items
 *  Step 3 → Assign Items to People
 *  Step 4 → View Split Summary
 */

import { useState } from 'react'
import Header from './components/Header.jsx'
import StepProgressBar from './components/StepProgressBar.jsx'
import LandingHero from './components/LandingHero.jsx'
import ReceiptUploader from './components/ReceiptUploader.jsx'
import ReceiptEditor from './components/ReceiptEditor.jsx'
import AssignStep from './components/AssignStep.jsx'
import SummaryStep from './components/SummaryStep.jsx'

// ─── App step constants ───────────────────────────────────────────
export const STEPS = {
  LANDING:    'landing',    // Welcome / upload
  REVIEW:     'review',     // Review extracted items
  ASSIGN:     'assign',     // Assign items to people
  SUMMARY:    'summary',    // Final split summary
}

const STEP_LABELS = [
  { id: STEPS.LANDING,  label: 'Upload',  num: 1 },
  { id: STEPS.REVIEW,   label: 'Review',  num: 2 },
  { id: STEPS.ASSIGN,   label: 'Assign',  num: 3 },
  { id: STEPS.SUMMARY,  label: 'Summary', num: 4 },
]

// ─── Initial state ────────────────────────────────────────────────
const initialReceiptState = {
  vendor: '',
  date: '',
  items: [],       // [{ id, name, price }]
  subtotal: 0,
  tax: 0,
  tip: 0,
  total: 0,
  confidence: 1,
}

export default function App() {
  const [currentStep, setCurrentStep] = useState(STEPS.LANDING)
  const [receipt, setReceipt]         = useState(initialReceiptState)
  const [people, setPeople]           = useState([])  // [{ id, name, color }]
  const [assignments, setAssignments] = useState({})  // { itemId: [personId, ...] }

  const goTo = (step) => setCurrentStep(step)
  const reset = () => {
    setCurrentStep(STEPS.LANDING)
    setReceipt(initialReceiptState)
    setPeople([])
    setAssignments({})
  }

  // Shared context passed down to child pages
  const ctx = {
    receipt, setReceipt,
    people, setPeople,
    assignments, setAssignments,
    goTo, reset,
  }

  return (
    <div className="app-container">
      {/* Background decorations */}
      <div className="bg-mesh" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      {/* App header */}
      <Header onReset={reset} />

      {/* Step progress bar — shown on all non-landing steps */}
      {currentStep !== STEPS.LANDING && (
        <div className="content-wrapper pt-6">
          <StepProgressBar steps={STEP_LABELS} currentStep={currentStep} />
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 content-wrapper py-8">
        {currentStep === STEPS.LANDING && (
          <LandingHero ctx={ctx} />
        )}
        {currentStep === STEPS.REVIEW && receipt.items.length === 0 && (
          /* No receipt yet — show uploader */
          <div className="slide-up">
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.375rem', color: '#e2e8f0', marginBottom: '0.375rem' }}>
                Upload your receipt
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Take a photo or upload an image — our AI will read every item instantly.
              </p>
            </div>
            <ReceiptUploader
              onExtracted={(receiptData) => {
                setReceipt(receiptData)
                // stay on REVIEW — next sub-step shows the editor
              }}
            />
          </div>
        )}
        {currentStep === STEPS.REVIEW && receipt.items.length > 0 && (
          <ReceiptEditor
            receipt={receipt}
            setReceipt={setReceipt}
            onContinue={() => goTo(STEPS.ASSIGN)}
            onReupload={() => setReceipt(initialReceiptState)}
          />
        )}
        {currentStep === STEPS.ASSIGN && (
          <AssignStep
            receipt={receipt}
            people={people}
            setPeople={setPeople}
            assignments={assignments}
            setAssignments={setAssignments}
            onContinue={() => goTo(STEPS.SUMMARY)}
            onBack={() => goTo(STEPS.REVIEW)}
          />
        )}
        {currentStep === STEPS.SUMMARY && (
          <SummaryStep
            receipt={receipt}
            people={people}
            assignments={assignments}
            onReset={reset}
            onBack={() => goTo(STEPS.ASSIGN)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="content-wrapper pb-6 text-center">
        <p className="text-xs text-slate-600">
          Smart Bill Splitter · All calculations done client-side · No data stored
        </p>
      </footer>
    </div>
  )
}
