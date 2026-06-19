import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

/**
 * Shared modal shell: blurred scrim, a centered card on desktop that becomes
 * full-screen on mobile, a fixed header (eyebrow + title + close) and a
 * scrollable body. Styling lives in index.css (`.modal-*`) so it can express
 * the mobile breakpoint, hover, and the entrance animation.
 */
export function Modal({ title, subtitle, onClose, children }: ModalProps) {
  // Close on Escape, and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />

      <div className="modal-card">
        <header className="modal-header">
          <div className="modal-heading">
            {subtitle && <p className="modal-eyebrow">{subtitle}</p>}
            <h1 className="modal-title">{title}</h1>
          </div>

          <button
            type="button"
            className="modal-close cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </header>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
