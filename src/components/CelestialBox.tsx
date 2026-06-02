import { useEffect, useRef, useState } from 'react'
import { projectOrthographic, type ViewRotation } from '../sky/projection'
import { BRIGHT_STARS } from '../sky/sky.bright'
import { rasterize, type AsciiPoint } from '../sky/ascii'

// Local brightness over the bright-star range, so the box doesn't import the
// full catalog (keeps the heavy data in the lazily-loaded explorer chunk).
const BRIGHT_MIN = -1.5
const BRIGHT_MAX = 2.8
const boxWeight = (mag: number) => Math.max(0, Math.min(1, (BRIGHT_MAX - mag) / (BRIGHT_MAX - BRIGHT_MIN)))

interface CelestialBoxProps {
  /** top-left in canvas (SVG) space */
  x: number
  y: number
  size: number
  /** when true, rotation freezes (the explorer is open and owns the view) */
  paused?: boolean
  /** called with the box's on-screen rect + current rotation when clicked */
  onOpen: (rect: DOMRect, view: ViewRotation) => void
}

// More columns than rows so the disc reads round: monospace cells are ~0.6 as
// wide as tall, so ~1.6x the columns squares it up.
const COLS = 32
const ROWS = 20
const VIEW_LAT = 12
const REST_SPEED = 3 // deg/sec
const HOVER_SPEED = 14

export function CelestialBox({ x, y, size, paused = false, onOpen }: CelestialBoxProps) {
  const [lon, setLon] = useState(20)
  const [hovered, setHovered] = useState(false)
  // Rotation speed lives in a ref set by the mouse handlers (not during render),
  // so the rAF loop reads the live value without re-subscribing.
  const speedRef = useRef(REST_SPEED)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paused) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      setLon((l) => (l + speedRef.current * dt) % 360)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paused])

  const points: AsciiPoint[] = []
  for (const s of BRIGHT_STARS) {
    const p = projectOrthographic(s, { lon, lat: VIEW_LAT })
    if (p.front) points.push({ x: p.x, y: p.y, weight: boxWeight(s.mag) })
  }
  const grid = rasterize(points, COLS, ROWS).join('\n')

  return (
    <foreignObject x={x} y={y} width={size} height={size} data-block-pan="">
      <div
        ref={boxRef}
        // @ts-expect-error xmlns is valid for foreignObject content
        xmlns="http://www.w3.org/1999/xhtml"
        onMouseEnter={() => {
          setHovered(true)
          speedRef.current = HOVER_SPEED
        }}
        onMouseLeave={() => {
          setHovered(false)
          speedRef.current = REST_SPEED
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (boxRef.current) onOpen(boxRef.current.getBoundingClientRect(), { lon, lat: VIEW_LAT })
        }}
        style={{
          width: size,
          height: size,
          boxSizing: 'border-box',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--bd-primary)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          boxShadow: hovered ? '0 0 0 1px var(--bd-hover)' : 'none',
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: size / ROWS,
            lineHeight: `${size / ROWS}px`,
            color: hovered ? 'var(--tx-primary)' : 'var(--tx-tertiary)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {grid}
        </pre>
      </div>
    </foreignObject>
  )
}
