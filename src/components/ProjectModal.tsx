import { useEffect } from 'react'
import type { ProjectContent } from '../content'
import { mdxComponents } from './mdx'

interface ProjectModalProps {
  project: ProjectContent | null
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

  const { Component } = project

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.5rem, 3vw, 2rem)',
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
          maxWidth: '720px',
          maxHeight: '85vh',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--bd-primary)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="elevation-2"
      >
        {/* Content */}
        <div
          style={{
            padding: '2rem',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
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
              fontSize: '0.9rem',
              color: 'var(--tx-tertiary)',
              marginTop: '0.5rem',
            }}
          >
            {project.subtitle}
          </p>

          <div
            style={{
              marginTop: '2rem',
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              color: 'var(--tx-secondary)',
            }}
          >
            <Component components={mdxComponents} />
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="cursor-pointer"
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
