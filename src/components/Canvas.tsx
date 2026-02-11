import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { createMomentum } from '../hooks/useMomentum'

interface CanvasProps {
  children?: React.ReactNode
}

// Large enough to cover any reasonable pan distance
const GRID_SIZE = 10000

export function Canvas({ children }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Store current transform for momentum calculations
  const transformRef = useRef({ x: 0, y: 0, k: 1 })

  // Create momentum instance
  const momentum = useMemo(() => createMomentum({
    // Tune these for desired feel:
    minVelocity: 5,      // Min velocity to trigger momentum
    amplitude: 0.25,     // How far momentum carries (0.1 = subtle, 0.4 = dramatic)
    timeConstant: 342,   // Decay speed in ms (higher = longer glide)
  }), [])

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return

    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2])
      .on('start', (event) => {
        // Cancel any running momentum when user starts dragging
        momentum.cancel()
        setIsDragging(true)

        // Start tracking velocity
        const { x, y } = event.transform
        momentum.start(x, y)
      })
      .on('zoom', (event) => {
        const { x, y, k } = event.transform
        transformRef.current = { x, y, k }

        // Track velocity during drag
        momentum.track(x, y)

        g.attr('transform', event.transform.toString())
      })
      .on('end', (event) => {
        setIsDragging(false)

        // Only apply momentum for pan gestures (not pinch zoom)
        if (event.sourceEvent?.type === 'mouseup' || event.sourceEvent?.type === 'touchend') {
          const { x, y, k } = transformRef.current

          momentum.stop(x, y, (newX, newY) => {
            // Apply momentum by updating the zoom transform
            const newTransform = d3.zoomIdentity.translate(newX, newY).scale(k)
            svg.call(zoom.transform, newTransform)
          })
        }
      })

    svg.call(zoom)

    // Position initial view so intro section appears near top-left
    const initialX = 40
    const initialY = 20
    const initialTransform = d3.zoomIdentity.translate(initialX, initialY).scale(1)
    transformRef.current = { x: initialX, y: initialY, k: 1 }
    svg.call(zoom.transform, initialTransform)

    return () => {
      momentum.cancel()
      svg.on('.zoom', null)
    }
  }, [momentum])

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
