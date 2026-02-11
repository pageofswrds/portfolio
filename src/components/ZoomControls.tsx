interface ZoomControlsProps {
  scale: number
}

export function ZoomControls({ scale }: ZoomControlsProps) {
  const handleZoomIn = () => {
    (window as any).__canvasZoomIn?.()
  }

  const handleZoomOut = () => {
    (window as any).__canvasZoomOut?.()
  }

  const handleRecenter = () => {
    (window as any).__canvasRecenter?.()
  }

  const percentage = Math.round(scale * 100)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--bd-primary)',
        borderRadius: 'var(--radius)',
        padding: '0.25rem',
        zIndex: 100,
      }}
    >
      <button
        onClick={handleZoomOut}
        style={{
          width: '32px',
          height: '32px',
          background: 'transparent',
          border: 'none',
          borderRadius: 'calc(var(--radius) - 2px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--tx-primary)',
        }}
        title="Zoom out"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <span
        style={{
          minWidth: '48px',
          textAlign: 'center',
          fontSize: '12px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--tx-secondary)',
          userSelect: 'none',
        }}
      >
        {percentage}%
      </span>

      <button
        onClick={handleZoomIn}
        style={{
          width: '32px',
          height: '32px',
          background: 'transparent',
          border: 'none',
          borderRadius: 'calc(var(--radius) - 2px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--tx-primary)',
        }}
        title="Zoom in"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div
        style={{
          width: '1px',
          height: '20px',
          background: 'var(--bd-primary)',
          margin: '0 0.25rem',
        }}
      />

      <button
        onClick={handleRecenter}
        style={{
          width: '32px',
          height: '32px',
          background: 'transparent',
          border: 'none',
          borderRadius: 'calc(var(--radius) - 2px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--tx-primary)',
        }}
        title="Recenter"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}
