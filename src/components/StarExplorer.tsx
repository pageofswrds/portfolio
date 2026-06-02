import { useEffect, useRef, useState, useCallback } from 'react'
import { projectOrthographic, type ViewRotation } from '../sky/projection'
import { STARS, CONSTELLATIONS, starById, brightness } from '../sky/constellations'

interface StarExplorerProps {
  /** the CelestialBox's on-screen rect — FLIP origin */
  originRect: DOMRect
  /** the box's rotation at click time — seeds the explorer for a seamless handoff */
  originView: ViewRotation
  onClose: () => void
}

const REVEAL_MS = 600
const CLOSE_DRAG_THRESHOLD = 6 // px of total movement below which a release counts as a click
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const DENSITY = [' ', '·', ':', '+', '*', '@']
const asciiChar = (w: number) => DENSITY[Math.round(Math.max(0, Math.min(1, w)) * (DENSITY.length - 1))]

const MONO = '"Fraktion Mono", ui-monospace, monospace'
const SANS = '"Whyte", system-ui, sans-serif'
const NIGHT: [number, number, number] = [8, 10, 22]

/** Resolve a CSS custom property to an [r,g,b] triple (canvas can't read var()). */
function resolveColor(varName: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof document === 'undefined') return fallback
  const probe = document.createElement('span')
  probe.style.color = `var(${varName})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const c = getComputedStyle(probe).color
  document.body.removeChild(probe)
  const m = c.match(/[\d.]+/g)
  if (!m || m.length < 3) return fallback
  return [Number(m[0]), Number(m[1]), Number(m[2])]
}

export function StarExplorer({ originRect, originView, onClose }: StarExplorerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewRef = useRef<ViewRotation>({ lon: originView.lon, lat: originView.lat })
  const velRef = useRef({ lon: 0, lat: 0 })
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(0)
  const progressRef = useRef(0)
  const closingRef = useRef(false)
  const [grabbing, setGrabbing] = useState(false)

  const beginClose = useCallback(() => {
    closingRef.current = true
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [beginClose])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const charRGB = resolveColor('--tx-tertiary', [120, 120, 130])
    const revealMs = reduceMotion ? 1 : REVEAL_MS

    let raf = 0
    let last = performance.now()
    const revealStart = last

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const W = window.innerWidth
      const H = window.innerHeight

      if (!closingRef.current) {
        progressRef.current = Math.min((now - revealStart) / revealMs, 1)
      } else {
        progressRef.current -= (dt * 1000) / revealMs
        if (progressRef.current <= 0) {
          cancelAnimationFrame(raf)
          window.removeEventListener('resize', resize)
          onClose()
          return
        }
      }
      const p = easeInOut(Math.max(0, Math.min(1, progressRef.current)))

      // inertia when not actively dragging
      if (!dragRef.current) {
        viewRef.current.lon += velRef.current.lon * dt
        viewRef.current.lat = Math.max(-85, Math.min(85, viewRef.current.lat + velRef.current.lat * dt))
        velRef.current.lon *= Math.exp(-2.5 * dt)
        velRef.current.lat *= Math.exp(-2.5 * dt)
      }
      const view = viewRef.current

      // sphere grows from the box rect to bigger-than-viewport; center glides to middle
      const boxR = Math.min(originRect.width, originRect.height) / 2
      const bigR = Math.max(W, H) * 0.9
      const radius = lerp(boxR, bigR, p)
      const cx = lerp(originRect.left + originRect.width / 2, W / 2, p)
      const cy = lerp(originRect.top + originRect.height / 2, H / 2, p)

      // night falls over the live page: transparent -> deep blue-black
      ctx.clearRect(0, 0, W, H)
      ctx.globalAlpha = 1
      ctx.fillStyle = `rgba(${NIGHT[0]}, ${NIGHT[1]}, ${NIGHT[2]}, ${p})`
      ctx.fillRect(0, 0, W, H)

      const asciiAlpha = Math.max(0, 1 - p * 1.4) // chars fade out early
      const starAlpha = Math.max(0, (p - 0.25) / 0.75) // points fade in after 25%

      // constellation lines
      if (starAlpha > 0.01) {
        ctx.strokeStyle = `rgba(150, 170, 210, ${0.35 * starAlpha})`
        ctx.lineWidth = 1
        for (const c of CONSTELLATIONS) {
          for (const [a, b] of c.lines) {
            const pa = projectOrthographic(starById(a)!, view)
            const pb = projectOrthographic(starById(b)!, view)
            if (!pa.front || !pb.front) continue
            ctx.beginPath()
            ctx.moveTo(cx + pa.x * radius, cy - pa.y * radius)
            ctx.lineTo(cx + pb.x * radius, cy - pb.y * radius)
            ctx.stroke()
          }
        }
      }

      // stars: ASCII fading out + rendered points fading in, same projected coords
      const asciiSize = Math.max(8, boxR / 5)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const s of STARS) {
        const pr = projectOrthographic(s, view)
        if (!pr.front) continue
        const sx = cx + pr.x * radius
        const sy = cy - pr.y * radius
        const b = brightness(s.mag)

        if (asciiAlpha > 0.01) {
          ctx.globalAlpha = asciiAlpha
          ctx.fillStyle = `rgb(${charRGB[0]}, ${charRGB[1]}, ${charRGB[2]})`
          ctx.font = `${asciiSize}px ${MONO}`
          ctx.fillText(asciiChar(b), sx, sy)
        }
        if (starAlpha > 0.01) {
          const tw = 0.75 + 0.25 * Math.sin(now / 600 + s.lon)
          const r = (1.2 + b * 2.8) * tw
          ctx.globalAlpha = starAlpha * (0.55 + 0.45 * b)
          ctx.beginPath()
          ctx.arc(sx, sy, r, 0, Math.PI * 2)
          ctx.fillStyle = `hsl(${lerp(210, 48, b)}, 70%, ${lerp(72, 92, b)}%)`
          ctx.fill()
        }
      }

      // constellation labels, once mostly revealed
      if (starAlpha > 0.5) {
        ctx.globalAlpha = (starAlpha - 0.5) / 0.5
        ctx.fillStyle = 'rgba(190, 202, 230, 0.85)'
        ctx.font = `13px ${SANS}`
        for (const c of CONSTELLATIONS) {
          const pr = projectOrthographic(starById(c.labelStar)!, view)
          if (!pr.front) continue
          ctx.fillText(c.name, cx + pr.x * radius, cy - pr.y * radius - 18)
        }
      }

      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [originRect, onClose])

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = 0
    velRef.current = { lon: 0, lat: 0 }
    setGrabbing(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    movedRef.current += Math.abs(dx) + Math.abs(dy)
    dragRef.current = { x: e.clientX, y: e.clientY }
    const k = 0.2 // deg per px
    viewRef.current.lon -= dx * k
    viewRef.current.lat = Math.max(-85, Math.min(85, viewRef.current.lat + dy * k))
    velRef.current = { lon: -dx * k * 8, lat: dy * k * 8 }
  }
  const onPointerUp = () => {
    dragRef.current = null
    setGrabbing(false)
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={() => {
        if (movedRef.current < CLOSE_DRAG_THRESHOLD) beginClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        cursor: grabbing ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100vw', height: '100vh' }} />
    </div>
  )
}
