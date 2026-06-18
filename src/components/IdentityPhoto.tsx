interface IdentityPhotoProps {
  /** top-left in canvas (SVG) space */
  x: number
  y: number
  size: number
  src: string
  alt?: string
}

// Temporary stand-in for the interactive <CelestialBox /> ASCII star: a plain
// photo rendered in the same identity-anchor box (geometry, border, radius, and
// background all matched). The star explorer will return to this slot later —
// swap <IdentityPhoto /> back to <CelestialBox /> in App.tsx to restore it.
export function IdentityPhoto({ x, y, size, src, alt = '' }: IdentityPhotoProps) {
  return (
    <foreignObject x={x} y={y} width={size} height={size} data-block-pan="">
      <div
        // @ts-expect-error xmlns is valid for foreignObject content
        xmlns="http://www.w3.org/1999/xhtml"
        style={{
          width: size,
          height: size,
          boxSizing: 'border-box',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--bd-primary)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    </foreignObject>
  )
}
