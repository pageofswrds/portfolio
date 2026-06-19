import { useEffect, useMemo, useState } from 'react'

interface StickyNoteProps {
  /** Top-left of the note in canvas coords (before rotation). */
  x: number
  y: number
  /** Width of the paper. */
  width: number
  /** Tilt in degrees. */
  rotate?: number
  /** Optional bold heading line above the body. */
  heading?: string
  /** Note body; wrapped to fill the paper width automatically. */
  text: string
}

const PAD_X = 24
const PAD_TOP = 42
const PAD_BOTTOM = 24
const LINE_H = 21
const FONT_SIZE = 14
const HEADING_SIZE = 19
// Distance from the heading baseline down to the first body line's baseline.
const HEADING_TO_BODY = 28
const FONT = `${FONT_SIZE}px "Whyte", system-ui, -apple-system, sans-serif`
// Fallback advance width if canvas measurement is unavailable.
const PX_PER_CHAR = 7.2

// One shared offscreen canvas for text measurement.
let measureCtx: CanvasRenderingContext2D | null = null
function lineWidth(text: string): number {
  if (typeof document === 'undefined') return text.length * PX_PER_CHAR
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
  if (!measureCtx) return text.length * PX_PER_CHAR
  measureCtx.font = FONT
  return measureCtx.measureText(text).width
}

/** Greedy word-wrap that packs each line as close to maxWidth as it fits. */
function wrap(text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const word of text.split(' ')) {
    const trial = cur ? cur + ' ' + word : word
    if (cur && lineWidth(trial) > maxWidth) {
      lines.push(cur)
      cur = word
    } else {
      cur = trial
    }
  }
  if (cur) lines.push(cur)
  return lines
}

/**
 * A tilted, curled-corner Post-it with a strip of tape — a deliberately
 * haphazard "captured a fleeting idea" artifact.
 *
 * Pure SVG, intentionally: a foreignObject can't be rotated reliably across
 * engines (the `rotate` attribute detaches it in Chromium; any CSS transform
 * detaches it in WebKit, pinning it to the viewport instead of the canvas).
 * SVG content honors the `transform` attribute everywhere and pans/zooms with
 * the canvas, so the note is drawn with <rect>/<text>/<ellipse>.
 */
export function StickyNote({ x, y, width, rotate = -4, heading, text }: StickyNoteProps) {
  // Re-wrap once the custom font loads so measurement reflects real metrics.
  const [fontReady, setFontReady] = useState(false)
  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => alive && setFontReady(true))
    return () => {
      alive = false
    }
  }, [])

  const lines = useMemo(
    // fontReady is a dep so the wrap recomputes after the font loads.
    () => wrap(text, width - PAD_X * 2),
    [text, width, fontReady],
  )

  const bodyFirstBaseline = heading ? PAD_TOP + HEADING_TO_BODY : PAD_TOP
  const height = bodyFirstBaseline + (lines.length - 1) * LINE_H + PAD_BOTTOM
  const cx = width / 2
  const cy = height / 2

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate} ${cx} ${cy})`}>
      <defs>
        <linearGradient id="stickyPaper" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#fdf3a6" />
          <stop offset="100%" stopColor="#f3e079" />
        </linearGradient>
        <filter id="stickyBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Shadows behind the paper: a soft base drop + two lifted-corner blobs
          at the bottom that peek out below the edge (the "curl" illusion). */}
      <g filter="url(#stickyBlur)">
        <rect
          x={5}
          y={12}
          width={width - 10}
          height={height - 6}
          rx={4}
          fill="rgba(0,0,0,0.16)"
        />
        <ellipse cx={width * 0.27} cy={height - 1} rx={width * 0.26} ry={8} fill="rgba(0,0,0,0.26)" />
        <ellipse cx={width * 0.73} cy={height - 1} rx={width * 0.26} ry={8} fill="rgba(0,0,0,0.26)" />
      </g>

      {/* Paper */}
      <rect
        width={width}
        height={height}
        rx={3}
        fill="url(#stickyPaper)"
        stroke="rgba(0,0,0,0.05)"
        strokeWidth={1}
      />

      {/* Tape */}
      <rect
        x={width / 2 - 48}
        y={-12}
        width={96}
        height={26}
        rx={1}
        fill="rgba(244,238,216,0.5)"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth={1}
        transform={`rotate(-5 ${width / 2} 1)`}
      />

      {/* Ink */}
      {heading && (
        <text
          x={PAD_X}
          y={PAD_TOP}
          fill="#3b3526"
          fontSize={HEADING_SIZE}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {heading}
        </text>
      )}

      <text
        x={PAD_X}
        y={bodyFirstBaseline}
        fill="#3b3526"
        fontSize={FONT_SIZE}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={PAD_X} dy={i === 0 ? 0 : LINE_H}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}
