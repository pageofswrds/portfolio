import { useEffect } from 'react'
import type { Project } from '../data/projects'

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!project) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg-base)',
          opacity: 0.9,
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '80vh',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--bd-primary)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="elevation-2"
      >
        {/* Header image */}
        <div
          style={{
            width: '100%',
            height: '240px',
            backgroundImage: `url(${project.thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
          }}
        />

        {/* Content */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 400,
              color: 'var(--tx-primary)',
              margin: 0,
            }}
          >
            {project.title}
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              color: 'var(--tx-tertiary)',
              marginTop: '0.5rem',
            }}
          >
            {project.subtitle} · {project.date}
          </p>

          <div
            style={{
              marginTop: '1.5rem',
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'var(--tx-secondary)',
            }}
          >
            {/* Placeholder content - will be replaced with MDX */}
            <p>
              Project content will go here. This will eventually render the MDX
              content from your project files.
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--bg-base)',
            color: 'var(--tx-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontFamily: 'var(--font-sans)',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
