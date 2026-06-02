import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { projectOrthographic, type SkyCoord, type ViewRotation } from '../sky/projection'
import { STARS, CONSTELLATIONS, brightness } from '../sky/constellations'
import { eclipticPoint } from '../sky/lines'

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

// Coordinate scaffolding is drawn as thin STROKES (not dots), so it reads as
// structure distinct from the ASCII sky.
const GRATICULE_STEP = 10 // degrees between grid lines
const GRID_ALPHA = 0.16
const EQUATOR_ALPHA = 0.3
const ECLIPTIC: [number, number, number] = [255, 198, 74] // vivid gold — the zodiac path
const ECLIPTIC_ALPHA = 0.6

// Stars: brightness drives opacity (faint stars recede), glyph is fixed (no
// blinking), with a gentle slow alpha shimmer instead of glyph-cycling.
const STAR_MIN_ALPHA = 0.25
const STAR_TWINKLE = 0.06

const STAR_HOVER_RADIUS = 18 // px — how close the cursor must be to label a star
const MAX_INDICATORS = 4 // most edge indicators shown at once (nearest win)
// How near a constellation must be to show an edge indicator, as a multiple of the
// viewport's half-diagonal. Lower = indicators appear only when you're nearly there.
const INDICATOR_REACH = 1.1

// Toggleable render layers (a dev-only panel flips these live).
type LayerKey = 'stars' | 'graticule' | 'ecliptic' | 'constellationLines' | 'labels' | 'starLabels'
const LAYER_DEFS: { key: LayerKey; label: string }[] = [
  { key: 'stars', label: 'stars' },
  { key: 'graticule', label: 'grid + equator' },
  { key: 'ecliptic', label: 'ecliptic' },
  { key: 'constellationLines', label: 'figures' },
  { key: 'labels', label: 'labels + indicators' },
  { key: 'starLabels', label: 'star names (hover)' },
]
const ALL_ON: Record<LayerKey, boolean> = {
  stars: true,
  graticule: true,
  ecliptic: true,
  constellationLines: true,
  labels: true,
  starLabels: true,
}
const SHOW_PANEL = import.meta.env.DEV

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
  const hoverRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(0)
  const progressRef = useRef(0)
  const closingRef = useRef(false)
  const [grabbing, setGrabbing] = useState(false)

  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(ALL_ON)
  const layersRef = useRef(layers)
  useEffect(() => {
    layersRef.current = layers
  }, [layers])

  // each constellation's label anchor (baked into the data), for the edge indicators
  const centroids = useMemo(() => CONSTELLATIONS.map((c) => ({ name: c.name, center: c.center })), [])

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
      const L = layersRef.current

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

      // chars/strokes lerp from page-ink (dark on the light page) to starlight as night falls
      const cr = Math.round(lerp(charRGB[0], STARLIGHT[0], p))
      const cg = Math.round(lerp(charRGB[1], STARLIGHT[1], p))
      const cb = Math.round(lerp(charRGB[2], STARLIGHT[2], p))
      const inkCool = `rgb(${cr}, ${cg}, ${cb})`
      const charSize = lerp(boxR / 10, 15, p) // ~box char size -> comfortable full-screen
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // reference linework fades in once the sphere has grown
      const lineReveal = Math.max(0, (p - 0.2) / 0.8)

      // Adds a front-culled spherical polyline to the current path. The pen lifts
      // when a sample crosses to the back hemisphere, so lines stop at the limb.
      const arc = (at: (i: number) => SkyCoord, steps: number) => {
        let pen = false
        for (let i = 0; i <= steps; i++) {
          const pr = projectOrthographic(at(i), view)
          if (!pr.front) {
            pen = false
            continue
          }
          const x = cx + pr.x * radius
          const y = cy - pr.y * radius
          if (pen) ctx.lineTo(x, y)
          else {
            ctx.moveTo(x, y)
            pen = true
          }
        }
      }

      // coordinate graticule + celestial equator — thin strokes
      if (L.graticule && lineReveal > 0.01) {
        ctx.strokeStyle = inkCool
        ctx.lineWidth = 1
        ctx.globalAlpha = lineReveal * GRID_ALPHA
        ctx.beginPath()
        for (let lat = -60; lat <= 60; lat += GRATICULE_STEP) {
          arc((i) => ({ lon: i * 3, lat }), 120)
        }
        for (let lon = 0; lon < 360; lon += GRATICULE_STEP) {
          arc((i) => ({ lon, lat: -85 + i * 3 }), 56)
        }
        ctx.stroke()

        // celestial equator, a touch brighter
        ctx.globalAlpha = lineReveal * EQUATOR_ALPHA
        ctx.beginPath()
        arc((i) => ({ lon: i * 2, lat: 0 }), 180)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // ecliptic — the zodiac path, vivid gold stroke
      if (L.ecliptic && lineReveal > 0.01) {
        ctx.strokeStyle = `rgb(${ECLIPTIC[0]}, ${ECLIPTIC[1]}, ${ECLIPTIC[2]})`
        ctx.lineWidth = 1.25
        ctx.globalAlpha = lineReveal * ECLIPTIC_ALPHA
        ctx.beginPath()
        arc((i) => eclipticPoint(i * 2), 180)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // constellation figures — ASCII dot trails between the figure stars
      if (L.constellationLines && lineReveal > 0.01) {
        ctx.globalAlpha = lineReveal * 0.5
        ctx.fillStyle = inkCool
        ctx.font = `${charSize}px ${MONO}`
        for (const c of CONSTELLATIONS) {
          for (const path of c.paths) {
            for (let v = 0; v + 1 < path.length; v++) {
              const pa = projectOrthographic({ lon: path[v][0], lat: path[v][1] }, view)
              const pb = projectOrthographic({ lon: path[v + 1][0], lat: path[v + 1][1] }, view)
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
        }
        ctx.globalAlpha = 1
      }

      // stars — fixed glyph, opacity by magnitude, gentle slow alpha shimmer
      if (L.stars) {
        ctx.fillStyle = inkCool
        ctx.font = `${charSize}px ${MONO}`
        for (const s of STARS) {
          const pr = projectOrthographic(s, view)
          if (!pr.front) continue
          const b = brightness(s.mag)
          const shimmer = 1 + STAR_TWINKLE * Math.sin(now / 900 + s.lon * 3)
          ctx.globalAlpha = Math.min(1, (STAR_MIN_ALPHA + (1 - STAR_MIN_ALPHA) * b) * shimmer)
          ctx.fillText(asciiChar(b), cx + pr.x * radius, cy - pr.y * radius)
        }
        ctx.globalAlpha = 1
      }

      // hover label: name the nearest named star under the cursor (once revealed)
      if (L.starLabels && p > 0.9 && hoverRef.current) {
        const hx = hoverRef.current.x
        const hy = hoverRef.current.y
        let best: { name: string; sx: number; sy: number } | null = null
        let bestD = STAR_HOVER_RADIUS
        for (const s of STARS) {
          if (!s.name) continue
          const pr = projectOrthographic(s, view)
          if (!pr.front) continue
          const sx = cx + pr.x * radius
          const sy = cy - pr.y * radius
          const d = Math.hypot(sx - hx, sy - hy)
          if (d < bestD) {
            bestD = d
            best = { name: s.name, sx, sy }
          }
        }
        if (best) {
          ctx.globalAlpha = 1
          ctx.strokeStyle = `rgba(${STARLIGHT[0]}, ${STARLIGHT[1]}, ${STARLIGHT[2]}, 0.8)`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(best.sx, best.sy, 7, 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = `rgb(${STARLIGHT[0]}, ${STARLIGHT[1]}, ${STARLIGHT[2]})`
          ctx.font = `13px ${SANS}`
          ctx.textAlign = 'left'
          ctx.fillText(best.name, best.sx + 11, best.sy - 9)
          ctx.textAlign = 'center'
        }
      }

      // Constellation labels — ONE per constellation. Position = the figure's
      // centroid projected to screen, clamped to the padded viewport. On-screen it
      // sits on the figure; off-screen it pins to the edge with an arrow, so it
      // glides inward as a constellation pans in (no duplicate label + indicator).
      // Far-side ones hidden; edge indicators capped to the nearest few.
      if (L.labels && p > 0.6) {
        const pad = 52
        const labelAlpha = Math.min(1, (p - 0.6) / 0.4)
        const maxDist = Math.hypot(W / 2, H / 2) * INDICATOR_REACH
        ctx.font = `13px ${SANS}`
        ctx.textBaseline = 'middle'

        const edges: { name: string; ex: number; ey: number; dx: number; dy: number; dist: number }[] = []

        for (const { name, center } of centroids) {
          const pr = projectOrthographic(center, view)
          if (!pr.front) continue // far side of the sky — hidden
          const sx = cx + pr.x * radius
          const sy = cy - pr.y * radius

          if (sx >= pad && sx <= W - pad && sy >= pad && sy <= H - pad) {
            ctx.globalAlpha = labelAlpha
            ctx.textAlign = 'center'
            ctx.fillStyle = `rgb(${STARLIGHT[0]}, ${STARLIGHT[1]}, ${STARLIGHT[2]})`
            ctx.fillText(name, sx, sy - charSize * 1.6)
            ctx.globalAlpha = 1
          } else {
            let dx = sx - W / 2
            let dy = sy - H / 2
            const len = Math.hypot(dx, dy)
            if (len < 1) continue
            if (len > maxDist) continue
            dx /= len
            dy /= len
            const t = Math.min((W / 2 - pad) / Math.abs(dx || 1e-6), (H / 2 - pad) / Math.abs(dy || 1e-6))
            edges.push({ name, ex: W / 2 + dx * t, ey: H / 2 + dy * t, dx, dy, dist: len })
          }
        }

        edges.sort((a, b) => a.dist - b.dist)
        for (const e of edges.slice(0, MAX_INDICATORS)) {
          const tw = ctx.measureText(e.name).width
          const tx = e.ex - e.dx * 16
          const ty = e.ey - e.dy * 16
          ctx.textAlign = e.dx > 0 ? 'right' : 'left'
          const bx = e.dx > 0 ? tx - tw : tx
          ctx.globalAlpha = labelAlpha * 0.85
          ctx.fillStyle = 'rgba(8, 10, 22, 0.6)'
          ctx.fillRect(bx - 4, ty - 9, tw + 8, 18)
          ctx.fillStyle = `rgb(${STARLIGHT[0]}, ${STARLIGHT[1]}, ${STARLIGHT[2]})`
          ctx.fillText(e.name, tx, ty)

          const px = -e.dy
          const py = e.dx
          ctx.beginPath()
          ctx.moveTo(e.ex + e.dx * 9, e.ey + e.dy * 9)
          ctx.lineTo(e.ex + px * 4, e.ey + py * 4)
          ctx.lineTo(e.ex - px * 4, e.ey - py * 4)
          ctx.closePath()
          ctx.fill()
          ctx.globalAlpha = 1
        }
        ctx.textAlign = 'center'
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [originRect, onClose, centroids])

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = 0
    velRef.current = { lon: 0, lat: 0 }
    setGrabbing(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    hoverRef.current = { x: e.clientX, y: e.clientY }
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    movedRef.current += Math.abs(dx) + Math.abs(dy)
    dragRef.current = { x: e.clientX, y: e.clientY }
    const k = 0.2 // deg per px
    // lon sign matches the mirrored (inside-the-dome) projection so dragging right
    // still carries the sky right (grab-and-pull), not the other way.
    viewRef.current.lon += dx * k
    viewRef.current.lat = Math.max(-85, Math.min(85, viewRef.current.lat + dy * k))
    velRef.current = { lon: dx * k * 8, lat: dy * k * 8 }
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
      onPointerLeave={() => {
        hoverRef.current = null
      }}
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

      {SHOW_PANEL && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(8, 10, 22, 0.7)',
            border: '1px solid rgba(225, 232, 248, 0.15)',
            font: `12px ${MONO}`,
            color: 'rgba(225, 232, 248, 0.85)',
            userSelect: 'none',
          }}
        >
          <div style={{ opacity: 0.6, marginBottom: 2, letterSpacing: 0.5 }}>LAYERS</div>
          {LAYER_DEFS.map((d) => (
            <label key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={layers[d.key]}
                onChange={(e) => setLayers((prev) => ({ ...prev, [d.key]: e.target.checked }))}
              />
              {d.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
