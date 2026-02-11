import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import { createMomentum } from '../hooks/useMomentum'

interface CanvasProps {
  children?: React.ReactNode
  onZoomChange?: (scale: number) => void
}

// Large enough to cover any reasonable pan distance
const GRID_SIZE = 10000

export function Canvas({ children, onZoomChange }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Store current transform for momentum calculations
  const transformRef = useRef({ x: 0, y: 0, k: 1 })

  // Store zoom behavior ref so we can call it from zoom buttons
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  // Create momentum instance
  const momentum = useMemo(() => createMomentum({
    // Tune these for desired feel:
    minVelocity: 5,      // Min velocity to trigger momentum
    amplitude: 0.25,     // How far momentum carries (0.1 = subtle, 0.4 = dramatic)
    timeConstant: 342,   // Decay speed in ms (higher = longer glide)
  }), [])

  // Zoom in/out functions for external controls - zoom toward viewport center
  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    const svg = d3.select(svgRef.current)
    const { x, y, k } = transformRef.current
    const newK = Math.min(k * 1.3, 2) // 30% zoom in, max 2x

    // Zoom toward viewport center
    const rect = svgRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calculate new translation to keep center point stationary
    const newX = centerX - (centerX - x) * (newK / k)
    const newY = centerY - (centerY - y) * (newK / k)

    const newTransform = d3.zoomIdentity.translate(newX, newY).scale(newK)
    svg.transition().duration(200).call(zoomRef.current.transform, newTransform)
  }, [])

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    const svg = d3.select(svgRef.current)
    const { x, y, k } = transformRef.current
    const newK = Math.max(k / 1.3, 0.3) // 30% zoom out, min 0.3x

    // Zoom toward viewport center
    const rect = svgRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calculate new translation to keep center point stationary
    const newX = centerX - (centerX - x) * (newK / k)
    const newY = centerY - (centerY - y) * (newK / k)

    const newTransform = d3.zoomIdentity.translate(newX, newY).scale(newK)
    svg.transition().duration(200).call(zoomRef.current.transform, newTransform)
  }, [])

  // Expose zoom functions via window for the zoom controls
  useEffect(() => {
    (window as any).__canvasZoomIn = zoomIn;
    (window as any).__canvasZoomOut = zoomOut;
    return () => {
      delete (window as any).__canvasZoomIn;
      delete (window as any).__canvasZoomOut;
    }
  }, [zoomIn, zoomOut])

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return

    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)
    const svgElement = svgRef.current

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2])
      // Filter: allow drag and pinch-to-zoom (ctrl+wheel), block regular wheel
      .filter((event) => {
        // Allow touch events (for pinch zoom on mobile/trackpad)
        if (event.type === 'touchstart' || event.type === 'touchmove' || event.type === 'touchend') {
          return true
        }
        // Allow mouse drag events
        if (event.type === 'mousedown' || event.type === 'mousemove' || event.type === 'mouseup') {
          return true
        }
        // For wheel events: only allow if it's a pinch gesture (ctrlKey or metaKey)
        if (event.type === 'wheel') {
          return event.ctrlKey || event.metaKey
        }
        return true
      })
      .on('start', () => {
        // Cancel any running momentum when user starts dragging
        const wasMomentumActive = momentum.cancel()
        setIsDragging(true)

        // If momentum was running, d3-zoom's internal state is stale.
        // Sync it with the actual position before starting the new pan.
        if (wasMomentumActive) {
          const { x, y, k } = transformRef.current
          const currentTransform = d3.zoomIdentity.translate(x, y).scale(k)
          svg.call(zoom.transform, currentTransform)
        }

        // Start tracking velocity
        const { x, y } = transformRef.current
        momentum.start(x, y)
      })
      .on('zoom', (event) => {
        const { x, y, k } = event.transform
        transformRef.current = { x, y, k }

        // Track velocity during drag
        momentum.track(x, y)

        g.attr('transform', event.transform.toString())

        // Notify parent of zoom changes
        onZoomChange?.(k)
      })
      .on('end', (event) => {
        setIsDragging(false)

        // Only apply momentum for pan gestures (not pinch zoom)
        if (event.sourceEvent?.type === 'mouseup' || event.sourceEvent?.type === 'touchend') {
          const { x, y, k } = transformRef.current

          momentum.stop(x, y, (newX, newY) => {
            // Update transform directly for performance (bypass d3-zoom during animation)
            transformRef.current = { x: newX, y: newY, k }
            g.attr('transform', `translate(${newX},${newY}) scale(${k})`)
          }, () => {
            // Sync final position with d3-zoom when momentum ends
            const { x: finalX, y: finalY, k: finalK } = transformRef.current
            const finalTransform = d3.zoomIdentity.translate(finalX, finalY).scale(finalK)
            svg.call(zoom.transform, finalTransform)
          })
        }
      })

    zoomRef.current = zoom
    svg.call(zoom)

    // Handle wheel events for panning (when not pinch-zooming)
    const handleWheel = (event: WheelEvent) => {
      // If ctrl/meta is pressed, let d3-zoom handle it as pinch-zoom
      if (event.ctrlKey || event.metaKey) return

      event.preventDefault()

      const { x, y, k } = transformRef.current
      // Use deltaX and deltaY for natural scrolling/panning
      const newX = x - event.deltaX
      const newY = y - event.deltaY
      transformRef.current = { x: newX, y: newY, k }

      const newTransform = d3.zoomIdentity.translate(newX, newY).scale(k)
      svg.call(zoom.transform, newTransform)
    }

    svgElement.addEventListener('wheel', handleWheel, { passive: false })

    // Position initial view so intro section appears near top-left
    const initialX = 40
    const initialY = 20
    const initialTransform = d3.zoomIdentity.translate(initialX, initialY).scale(1)
    transformRef.current = { x: initialX, y: initialY, k: 1 }
    svg.call(zoom.transform, initialTransform)
    onZoomChange?.(1)

    return () => {
      momentum.cancel()
      svg.on('.zoom', null)
      svgElement.removeEventListener('wheel', handleWheel)
    }
  }, [momentum, onZoomChange])

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
