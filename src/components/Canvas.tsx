import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface CanvasProps {
  children?: React.ReactNode
}

// Large enough to cover any reasonable pan distance
const GRID_SIZE = 10000

export function Canvas({ children }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return

    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2])
      .on('start', () => setIsDragging(true))
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })
      .on('end', () => setIsDragging(false))

    svg.call(zoom)

    // Position initial view to show the intro section with hints of cards off-screen
    const { width, height } = svgRef.current.getBoundingClientRect()
    const initialX = width * 0.35
    const initialY = height * 0.35
    svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(1))

    return () => {
      svg.on('.zoom', null)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <defs>
        {/* Dot pattern - 24px spacing */}
        <pattern
          id="dot-grid"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="12"
            cy="12"
            r="1"
            fill="var(--bd-primary)"
          />
        </pattern>
      </defs>

      <g ref={gRef}>
        {/* Dot grid background */}
        <rect
          x={-GRID_SIZE / 2}
          y={-GRID_SIZE / 2}
          width={GRID_SIZE}
          height={GRID_SIZE}
          fill="url(#dot-grid)"
        />
        {children}
      </g>
    </svg>
  )
}
