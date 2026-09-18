/**
 * Toast.jsx
 * ─────────
 * Lightweight toast notification system.
 * Usage:
 *   import { useToast, ToastContainer } from './Toast.jsx'
 *
 *   const { toasts, showToast } = useToast()
 *   showToast('Split saved!', 'success')
 *   <ToastContainer toasts={toasts} />
 */
import { useState, useCallback } from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'

const ICONS = {
  success: <CheckCircle2 size={15} />,
  info:    <Info size={15} />,
  error:   <XCircle size={15} />,
}

export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return { toasts, showToast }
}

export function ToastContainer({ toasts }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {ICONS[t.type]}
          {t.message}
        </div>
      ))}
    </div>
  )
}
