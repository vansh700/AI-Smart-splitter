/**
 * StepProgressBar.jsx
 * Visual step indicator showing current progress through the 4-step flow.
 */
import { Check } from 'lucide-react'

export default function StepProgressBar({ steps, currentStep }) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div
      className="glass-card slide-up"
      style={{ padding: '1rem 1.5rem', marginBottom: '0.5rem' }}
    >
      <div className="step-bar">
        {steps.map((step, i) => {
          const isDone   = i < currentIndex
          const isActive = i === currentIndex

          return (
            <div
              key={step.id}
              style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}
            >
              {/* Dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <div
                  className={`step-dot ${isDone ? 'done' : isActive ? 'active' : 'idle'}`}
                >
                  {isDone
                    ? <Check size={14} strokeWidth={2.5} />
                    : <span>{step.num}</span>
                  }
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isDone ? '#a78bfa' : isActive ? '#c4b5fd' : '#374151',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={`step-line ${isDone ? 'done' : ''}`}
                  style={{ margin: '0 0.5rem', marginBottom: '1.1rem' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
