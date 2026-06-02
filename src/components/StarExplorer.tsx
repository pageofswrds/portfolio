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
const STARLIGHT: [number, number, number] = [225, 232, 248]
const GRATICULE_STEP = 10 // degrees between coordinate grid lines
const GRATICULE_ALPHA = 0.18 // faintest layer — sits beneath the constellation lines

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

      // Chars stay ASCII the whole way; their color lerps from page-ink (dark on
      // the light page) to starlight (pale on the night) as the background darkens.
      const cr = Math.round(lerp(charRGB[0], STARLIGHT[0], p))
      const cg = Math.round(lerp(charRGB[1], STARLIGHT[1], p))
      const cb = Math.round(lerp(charRGB[2], STARLIGHT[2], p))
      const charSize = lerp(boxR / 10, 15, p) // ~box char size -> comfortable full-screen
      ctx.font = `${charSize}px ${MONO}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // reference linework fades in once the sphere has grown
      const lineReveal = Math.max(0, (p - 0.2) / 0.8)

      // faint coordinate graticule — the celestial grid, for orientation while panning.
      // Sampled every 2deg along each line and front-culled, so the far hemisphere's
      // lines never bleed through.
      if (lineReveal > 0.01) {
        ctx.globalAlpha = lineReveal * GRATICULE_ALPHA
        ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`
        for (let lat = -60; lat <= 60; lat += GRATICULE_STEP) {
          for (let lon = 0; lon < 360; lon += 2) {
            const pr = projectOrthographic({ lon, lat }, view)
            if (pr.front) ctx.fillText('·', cx + pr.x * radius, cy - pr.y * radius)
          }
        }
        for (let lon = 0; lon < 360; lon += GRATICULE_STEP) {
          for (let lat = -80; lat <= 80; lat += 2) {
            const pr = projectOrthographic({ lon, lat }, view)
            if (pr.front) ctx.fillText('·', cx + pr.x * radius, cy - pr.y * radius)
          }
        }
        ctx.globalAlpha = 1
      }

      // constellation lines as brighter ASCII trails, on top of the graticule
      if (lineReveal > 0.01) {
        ctx.globalAlpha = lineReveal * 0.45
        ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`
        for (const c of CONSTELLATIONS) {
          for (const [a, b] of c.lines) {
            const pa = projectOrthographic(starById(a)!, view)
            const pb = projectOrthographic(starById(b)!, view)
            if (!pa.front || !pb.front) continue
            const ax = cx + pa.x * radius
            const ay = cy - pa.y * radius
            const bx = cx + pb.x * radius
            const by = cy - pb.y * radius
            const steps = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / (charSize * 0.7)))
            for (let i = 1; i < steps; i++) {
              const t = i / steps
              ctx.fillText('·', ax + (bx - ax) * t, ay + (by - ay) * t)
            }
          }
        }
        ctx.globalAlpha = 1
      }

      // stars as density chars; twinkle by cycling the glyph up/down the ramp
      ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`
      for (const s of STARS) {
        const pr = projectOrthographic(s, view)
        if (!pr.front) continue
        const b = brightness(s.mag)
        const tw = 0.14 * Math.sin(now / 500 + s.lon)
        ctx.fillText(asciiChar(b + tw), cx + pr.x * radius, cy - pr.y * radius)
      }

      // constellation labels (mono-spirit text), once mostly revealed
      if (p > 0.6) {
        ctx.globalAlpha = (p - 0.6) / 0.4
        ctx.fillStyle = `rgb(${STARLIGHT[0]}, ${STARLIGHT[1]}, ${STARLIGHT[2]})`
        ctx.font = `13px ${SANS}`
        for (const c of CONSTELLATIONS) {
          const pr = projectOrthographic(starById(c.labelStar)!, view)
          if (!pr.front) continue
          ctx.fillText(c.name, cx + pr.x * radius, cy - pr.y * radius - charSize * 1.6)
        }
        ctx.globalAlpha = 1
      }
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
