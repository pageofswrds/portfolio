# Celestial-Sphere Identity Box Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the empty dashed identity-anchor rect with an interactive ASCII celestial sphere that expands into a full-page, pannable star explorer.

**Architecture:** One pure orthographic-sphere projection module is the spine: it maps a star's `(lon, lat)` on the unit sphere to unit-screen coords given a view rotation, with back-face culling. The hover sphere, the full-page explorer, and the expand transition all consume that same projection at different screen-radii — so the ASCII chars and the rendered star-points are guaranteed to register against identical coordinates, and the reveal reads as *focus* rather than *swap*. `CelestialBox` (in the SVG `foreignObject`, like `AsciiFlowField`) owns rest/hover/click; `StarExplorer` (full-page overlay, like the modals) owns the reveal, the canvas sky, and drag-to-rotate.

**Tech Stack:** Vite + React 19 + TypeScript, Vitest (unit tests, like `src/layout/funnel.test.ts`), HTML `<canvas>` 2D for the sky, `requestAnimationFrame` for rotation/twinkle/reveal.

---

## File Structure

| File | Responsibility | Status |
|------|----------------|--------|
| `src/sky/projection.ts` | Pure orthographic-sphere projection + types. No React. | Create |
| `src/sky/projection.test.ts` | Unit tests for projection. | Create |
| `src/sky/constellations.ts` | Star + constellation data (single source of truth) + lookups. | Create |
| `src/sky/constellations.test.ts` | Data-integrity tests (no orphan line endpoints). | Create |
| `src/sky/ascii.ts` | Pure helper: rasterize projected stars into an ASCII char grid. | Create |
| `src/sky/ascii.test.ts` | Unit tests for rasterization. | Create |
| `src/components/CelestialBox.tsx` | Rest/hover ASCII sphere in the `foreignObject`; click opens explorer. | Create |
| `src/components/StarExplorer.tsx` | Full-page overlay: reveal + canvas sky + drag-to-rotate + close. | Create |
| `src/App.tsx` | Replace the dashed `<rect>` (lines 197–207) with `<CelestialBox>`; mount explorer. | Modify |

**Coordinate convention:** sphere longitude `lon ∈ [0,360)`, latitude `lat ∈ [-90,90]`, both degrees. Projection returns unit-screen coords `x,y ∈ [-1,1]` (multiply by a pixel radius + center to draw). `front` is true when the point is on the near hemisphere.

---

## Task 1: Projection math

**Files:**
- Create: `src/sky/projection.ts`
- Test: `src/sky/projection.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/sky/projection.test.ts
import { describe, it, expect } from 'vitest'
import { projectOrthographic, type SkyCoord, type ViewRotation } from './projection'

const center: ViewRotation = { lon: 0, lat: 0 }

describe('projectOrthographic', () => {
  it('projects the view-center to the origin, front-facing', () => {
    const p = projectOrthographic({ lon: 0, lat: 0 }, center)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(0, 6)
    expect(p.front).toBe(true)
  })

  it('projects +90deg longitude on the equator to the right limb', () => {
    const p = projectOrthographic({ lon: 90, lat: 0 }, center)
    expect(p.x).toBeCloseTo(1, 6)
    expect(p.y).toBeCloseTo(0, 6)
    expect(p.front).toBe(true) // on the limb (cosc == 0) counts as front
  })

  it('culls the antipode as back-facing', () => {
    const p = projectOrthographic({ lon: 180, lat: 0 }, center)
    expect(p.front).toBe(false)
  })

  it('projects +90deg latitude to the top, regardless of longitude', () => {
    const p = projectOrthographic({ lon: 137, lat: 90 }, center)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(1, 6)
    expect(p.front).toBe(true)
  })

  it('rotating the view re-centers that coordinate to the origin', () => {
    const p = projectOrthographic({ lon: 40, lat: 20 }, { lon: 40, lat: 20 })
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(0, 6)
    expect(p.front).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/sky/projection.test.ts`
Expected: FAIL — cannot resolve `./projection`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/sky/projection.ts

/** A fixed point on the celestial sphere. Degrees. */
export interface SkyCoord {
  lon: number // 0..360
  lat: number // -90..90
}

/** The current gaze direction = the sphere coord at screen-center. Degrees. */
export interface ViewRotation {
  lon: number
  lat: number
}

/** Result of projecting a SkyCoord. x,y are unit-screen coords in [-1,1]. */
export interface Projected {
  x: number
  y: number
  /** true when on the near hemisphere (cos of angular distance >= 0). */
  front: boolean
}

const DEG = Math.PI / 180

/**
 * Standard orthographic projection of a point on the unit sphere, viewed with
 * the sphere rotated so `view` sits at screen-center. y is screen-up positive.
 */
export function projectOrthographic(coord: SkyCoord, view: ViewRotation): Projected {
  const lat = coord.lat * DEG
  const lat0 = view.lat * DEG
  const dLon = (coord.lon - view.lon) * DEG

  const cosLat = Math.cos(lat)
  const x = cosLat * Math.sin(dLon)
  const y = Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * cosLat * Math.cos(dLon)
  const cosc = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * cosLat * Math.cos(dLon)

  return { x, y, front: cosc >= 0 }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/sky/projection.test.ts`
Expected: PASS (5 passing).

- [ ] **Step 5: Commit**

```bash
git add src/sky/projection.ts src/sky/projection.test.ts
git commit -m "feat(sky): orthographic-sphere projection with back-face culling"
```

---

## Task 2: Constellation data

**Files:**
- Create: `src/sky/constellations.ts`
- Test: `src/sky/constellations.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/sky/constellations.test.ts
import { describe, it, expect } from 'vitest'
import { STARS, CONSTELLATIONS, starById } from './constellations'

describe('sky data', () => {
  it('has stars with valid coordinates and magnitudes', () => {
    expect(STARS.length).toBeGreaterThan(0)
    for (const s of STARS) {
      expect(s.lon).toBeGreaterThanOrEqual(0)
      expect(s.lon).toBeLessThan(360)
      expect(s.lat).toBeGreaterThanOrEqual(-90)
      expect(s.lat).toBeLessThanOrEqual(90)
      expect(s.mag).toBeGreaterThanOrEqual(0)
    }
  })

  it('has unique star ids', () => {
    const ids = new Set(STARS.map((s) => s.id))
    expect(ids.size).toBe(STARS.length)
  })

  it('every constellation line references existing stars (no orphans)', () => {
    for (const c of CONSTELLATIONS) {
      for (const [a, b] of c.lines) {
        expect(starById(a), `${c.name} line endpoint ${a}`).toBeDefined()
        expect(starById(b), `${c.name} line endpoint ${b}`).toBeDefined()
      }
    }
  })

  it('every constellation label anchors on one of its own stars', () => {
    for (const c of CONSTELLATIONS) {
      const member = new Set(c.lines.flat())
      expect(member.has(c.labelStar), `${c.name} label`).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/sky/constellations.test.ts`
Expected: FAIL — cannot resolve `./constellations`.

- [ ] **Step 3: Write minimal implementation**

Stylized, recognizable shapes in roughly-true relative positions. Magnitudes are stylized (0 = brightest, ~3.5 = faint). Coordinates are hand-placed, not catalog-exact.

```ts
// src/sky/constellations.ts
import type { SkyCoord } from './projection'

export interface Star extends SkyCoord {
  id: string
  mag: number // 0 (bright) .. ~3.5 (faint)
}

export interface Constellation {
  name: string
  /** undirected segments between star ids */
  lines: [string, string][]
  /** star id the name label anchors to */
  labelStar: string
}

export const STARS: Star[] = [
  // Orion (centered ~lon 85, lat 0)
  { id: 'ori-betelgeuse', lon: 88, lat: 7, mag: 0.5 },
  { id: 'ori-bellatrix', lon: 81, lat: 6, mag: 1.6 },
  { id: 'ori-alnitak', lon: 85, lat: -1, mag: 1.8 },
  { id: 'ori-alnilam', lon: 84, lat: -1.2, mag: 1.7 },
  { id: 'ori-mintaka', lon: 83, lat: -0.3, mag: 2.2 },
  { id: 'ori-saiph', lon: 87, lat: -9, mag: 2.1 },
  { id: 'ori-rigel', lon: 81, lat: -8, mag: 0.1 },

  // Ursa Major — the Big Dipper (centered ~lon 185, lat 57)
  { id: 'uma-dubhe', lon: 165, lat: 62, mag: 1.8 },
  { id: 'uma-merak', lon: 165, lat: 56, mag: 2.3 },
  { id: 'uma-phecda', lon: 178, lat: 54, mag: 2.4 },
  { id: 'uma-megrez', lon: 183, lat: 57, mag: 3.3 },
  { id: 'uma-alioth', lon: 193, lat: 56, mag: 1.7 },
  { id: 'uma-mizar', lon: 201, lat: 55, mag: 2.2 },
  { id: 'uma-alkaid', lon: 207, lat: 49, mag: 1.8 },

  // Ursa Minor — the Little Dipper, Polaris at the pole (centered ~lon 40, lat 80)
  { id: 'umi-polaris', lon: 38, lat: 89, mag: 1.9 },
  { id: 'umi-yildun', lon: 70, lat: 86, mag: 3.0 },
  { id: 'umi-epsilon', lon: 110, lat: 82, mag: 3.2 },
  { id: 'umi-zeta', lon: 130, lat: 78, mag: 3.0 },
  { id: 'umi-kochab', lon: 110, lat: 74, mag: 2.0 },
  { id: 'umi-pherkad', lon: 95, lat: 72, mag: 3.0 },

  // Cassiopeia — the W (centered ~lon 12, lat 60)
  { id: 'cas-segin', lon: 28, lat: 63, mag: 3.3 },
  { id: 'cas-ruchbah', lon: 21, lat: 60, mag: 2.7 },
  { id: 'cas-gamma', lon: 14, lat: 60, mag: 2.2 },
  { id: 'cas-schedar', lon: 10, lat: 56, mag: 2.2 },
  { id: 'cas-caph', lon: 2, lat: 59, mag: 2.3 },

  // Scorpius — zodiac nod (centered ~lon 245, lat -30)
  { id: 'sco-antares', lon: 247, lat: -26, mag: 1.0 },
  { id: 'sco-graffias', lon: 241, lat: -20, mag: 2.6 },
  { id: 'sco-dschubba', lon: 240, lat: -22, mag: 2.3 },
  { id: 'sco-pi', lon: 239, lat: -26, mag: 2.9 },
  { id: 'sco-sigma', lon: 245, lat: -25, mag: 2.9 },
  { id: 'sco-tau', lon: 248, lat: -28, mag: 2.8 },
  { id: 'sco-shaula', lon: 263, lat: -37, mag: 1.6 },
  { id: 'sco-lesath', lon: 262, lat: -37, mag: 2.7 },

  // Leo — zodiac nod, the Sickle + triangle (centered ~lon 155, lat 17)
  { id: 'leo-regulus', lon: 152, lat: 12, mag: 1.4 },
  { id: 'leo-eta', lon: 152, lat: 17, mag: 3.5 },
  { id: 'leo-algieba', lon: 154, lat: 20, mag: 2.0 },
  { id: 'leo-zosma', lon: 168, lat: 20, mag: 2.6 },
  { id: 'leo-denebola', lon: 177, lat: 15, mag: 2.1 },
  { id: 'leo-chort', lon: 168, lat: 15, mag: 3.3 },
]

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Orion',
    labelStar: 'ori-betelgeuse',
    lines: [
      ['ori-betelgeuse', 'ori-alnitak'],
      ['ori-bellatrix', 'ori-mintaka'],
      ['ori-alnitak', 'ori-alnilam'],
      ['ori-alnilam', 'ori-mintaka'],
      ['ori-alnitak', 'ori-saiph'],
      ['ori-mintaka', 'ori-rigel'],
      ['ori-betelgeuse', 'ori-bellatrix'],
    ],
  },
  {
    name: 'Ursa Major',
    labelStar: 'uma-alioth',
    lines: [
      ['uma-dubhe', 'uma-merak'],
      ['uma-merak', 'uma-phecda'],
      ['uma-phecda', 'uma-megrez'],
      ['uma-megrez', 'uma-dubhe'],
      ['uma-megrez', 'uma-alioth'],
      ['uma-alioth', 'uma-mizar'],
      ['uma-mizar', 'uma-alkaid'],
    ],
  },
  {
    name: 'Ursa Minor',
    labelStar: 'umi-polaris',
    lines: [
      ['umi-polaris', 'umi-yildun'],
      ['umi-yildun', 'umi-epsilon'],
      ['umi-epsilon', 'umi-zeta'],
      ['umi-zeta', 'umi-kochab'],
      ['umi-kochab', 'umi-pherkad'],
      ['umi-pherkad', 'umi-epsilon'],
    ],
  },
  {
    name: 'Cassiopeia',
    labelStar: 'cas-gamma',
    lines: [
      ['cas-segin', 'cas-ruchbah'],
      ['cas-ruchbah', 'cas-gamma'],
      ['cas-gamma', 'cas-schedar'],
      ['cas-schedar', 'cas-caph'],
    ],
  },
  {
    name: 'Scorpius',
    labelStar: 'sco-antares',
    lines: [
      ['sco-graffias', 'sco-dschubba'],
      ['sco-dschubba', 'sco-pi'],
      ['sco-pi', 'sco-antares'],
      ['sco-antares', 'sco-sigma'],
      ['sco-sigma', 'sco-tau'],
      ['sco-tau', 'sco-shaula'],
      ['sco-shaula', 'sco-lesath'],
    ],
  },
  {
    name: 'Leo',
    labelStar: 'leo-regulus',
    lines: [
      ['leo-regulus', 'leo-eta'],
      ['leo-eta', 'leo-algieba'],
      ['leo-regulus', 'leo-chort'],
      ['leo-chort', 'leo-zosma'],
      ['leo-zosma', 'leo-denebola'],
      ['leo-denebola', 'leo-chort'],
    ],
  },
]

const STAR_INDEX = new Map(STARS.map((s) => [s.id, s]))

export function starById(id: string): Star | undefined {
  return STAR_INDEX.get(id)
}

export const MIN_MAG = Math.min(...STARS.map((s) => s.mag))
export const MAX_MAG = Math.max(...STARS.map((s) => s.mag))

/** 1 for the brightest star, ~0 for the faintest. Used for size/alpha. */
export function brightness(mag: number): number {
  if (MAX_MAG === MIN_MAG) return 1
  return (MAX_MAG - mag) / (MAX_MAG - MIN_MAG)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/sky/constellations.test.ts`
Expected: PASS (4 passing).

- [ ] **Step 5: Commit**

```bash
git add src/sky/constellations.ts src/sky/constellations.test.ts
git commit -m "feat(sky): stylized constellation data — Orion, both Dippers, Cassiopeia, Scorpius, Leo"
```

---

## Task 3: ASCII rasterizer

**Files:**
- Create: `src/sky/ascii.ts`
- Test: `src/sky/ascii.test.ts`

The box and hover sphere render the same projected stars as a grid of density chars. This helper is pure: given projected front-facing points in unit-screen space, return `rows` strings of length `cols`.

- [ ] **Step 1: Write the failing test**

```ts
// src/sky/ascii.test.ts
import { describe, it, expect } from 'vitest'
import { rasterize, type AsciiPoint } from './ascii'

describe('rasterize', () => {
  it('returns rows x cols grid of spaces when empty', () => {
    const grid = rasterize([], 4, 3)
    expect(grid.length).toBe(3)
    expect(grid.every((r) => r === '    ')).toBe(true)
  })

  it('places a bright point near the grid center for a centered star', () => {
    const pts: AsciiPoint[] = [{ x: 0, y: 0, weight: 1 }]
    const grid = rasterize(pts, 9, 9)
    // center cell is row 4, col 4
    expect(grid[4][4]).not.toBe(' ')
  })

  it('maps unit +x to the right edge and +y to the top', () => {
    const right = rasterize([{ x: 1, y: 0, weight: 1 }], 9, 9)
    expect(right[4][8]).not.toBe(' ')
    const top = rasterize([{ x: 0, y: 1, weight: 1 }], 9, 9)
    expect(top[0][4]).not.toBe(' ')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/sky/ascii.test.ts`
Expected: FAIL — cannot resolve `./ascii`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/sky/ascii.ts

export interface AsciiPoint {
  x: number // unit-screen [-1,1]
  y: number // unit-screen [-1,1], +y = up
  weight: number // 0..1, brighter -> denser char
}

// sparse -> dense, matching AsciiFlowField's vocabulary
const DENSITY = [' ', '·', ':', '+', '*', '@']

function charFor(weight: number): string {
  const w = Math.max(0, Math.min(1, weight))
  const i = Math.round(w * (DENSITY.length - 1))
  return DENSITY[i]
}

/**
 * Rasterize unit-screen points into an ASCII grid. The unit disc [-1,1]^2 maps
 * to the full grid; +x is right, +y is up. Brighter points win a contested cell.
 */
export function rasterize(points: AsciiPoint[], cols: number, rows: number): string[] {
  const cells: number[] = new Array(cols * rows).fill(-1) // store weight, -1 = empty

  for (const p of points) {
    const col = Math.round(((p.x + 1) / 2) * (cols - 1))
    const row = Math.round(((1 - (p.y + 1) / 2)) * (rows - 1)) // flip y for screen
    if (col < 0 || col >= cols || row < 0 || row >= rows) continue
    const idx = row * cols + col
    if (p.weight > cells[idx]) cells[idx] = p.weight
  }

  const out: string[] = []
  for (let r = 0; r < rows; r++) {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const w = cells[r * cols + c]
      line += w < 0 ? ' ' : charFor(w)
    }
    out.push(line)
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/sky/ascii.test.ts`
Expected: PASS (3 passing).

- [ ] **Step 5: Commit**

```bash
git add src/sky/ascii.ts src/sky/ascii.test.ts
git commit -m "feat(sky): pure ASCII rasterizer for projected stars"
```

---

## Task 4: CelestialBox component (rest + hover, opens explorer)

**Files:**
- Create: `src/components/CelestialBox.tsx`

Renders inside the SVG `foreignObject` exactly where the dashed rect was. Slowly rotates the sphere; raises rotation speed + brightness on hover; on click, reports its on-screen rect and asks the parent to open the explorer. Carries `data-block-pan` so the d3 canvas does not pan when interacting (mirrors `AsciiFlowField`).

- [ ] **Step 1: Write the component**

```tsx
// src/components/CelestialBox.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { projectOrthographic } from '../sky/projection'
import { STARS, brightness } from '../sky/constellations'
import { rasterize, type AsciiPoint } from '../sky/ascii'

interface CelestialBoxProps {
  /** top-left in canvas (SVG) space */
  x: number
  y: number
  size: number
  /** called with the box's on-screen DOMRect when clicked */
  onOpen: (rect: DOMRect) => void
}

const COLS = 22
const ROWS = 22
const REST_SPEED = 3 // deg/sec
const HOVER_SPEED = 14

export function CelestialBox({ x, y, size, onOpen }: CelestialBoxProps) {
  const [lon, setLon] = useState(20)
  const [hovered, setHovered] = useState(false)
  const lonRef = useRef(lon)
  const hoveredRef = useRef(hovered)
  const boxRef = useRef<HTMLDivElement>(null)
  lonRef.current = lon
  hoveredRef.current = hovered

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const speed = hoveredRef.current ? HOVER_SPEED : REST_SPEED
      setLon((l) => (l + speed * dt) % 360)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const points: AsciiPoint[] = STARS.map((s) => {
    const p = projectOrthographic(s, { lon, lat: 12 })
    return { x: p.x, y: p.y, weight: p.front ? brightness(s.mag) : 0, front: p.front }
  }).filter((p) => (p as { front: boolean }).front)
  const grid = rasterize(points, COLS, ROWS).join('\n')

  const handleClick = useCallback(() => {
    if (boxRef.current) onOpen(boxRef.current.getBoundingClientRect())
  }, [onOpen])

  return (
    <foreignObject x={x} y={y} width={size} height={size} data-block-pan="">
      <div
        ref={boxRef}
        // @ts-expect-error xmlns is valid for foreignObject content
        xmlns="http://www.w3.org/1999/xhtml"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleClick}
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
          transition: 'box-shadow 200ms ease',
          boxShadow: hovered ? '0 0 0 1px var(--bd-primary)' : 'none',
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: size / COLS,
            lineHeight: `${size / ROWS}px`,
            color: hovered ? 'var(--tx-primary)' : 'var(--tx-tertiary)',
            userSelect: 'none',
            pointerEvents: 'none',
            transition: 'color 200ms ease',
          }}
        >
          {grid}
        </pre>
      </div>
    </foreignObject>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors. (The `.filter` keeps front-facing points; the cast reads the transient `front` flag added in the map.)

- [ ] **Step 3: Commit**

```bash
git add src/components/CelestialBox.tsx
git commit -m "feat: CelestialBox — rotating ASCII sphere, hover brighten, click to open"
```

---

## Task 5: StarExplorer component (reveal + canvas sky + drag)

**Files:**
- Create: `src/components/StarExplorer.tsx`

Full-page fixed overlay. Drives a `progress` 0→1 reveal (and 1→0 on close), all on one `<canvas>` so ASCII and stars register against the same projected coordinates. After the reveal settles, pointer drag rotates the view (with light inertia); stars twinkle. Esc or background click closes.

- [ ] **Step 1: Write the component**

```tsx
// src/components/StarExplorer.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { projectOrthographic, type ViewRotation } from '../sky/projection'
import { STARS, CONSTELLATIONS, starById, brightness } from '../sky/constellations'

interface StarExplorerProps {
  /** the CelestialBox's on-screen rect — FLIP origin */
  originRect: DOMRect
  onClose: () => void
}

const REVEAL_MS = 600
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const DENSITY = [' ', '·', ':', '+', '*', '@']
const asciiChar = (w: number) => DENSITY[Math.round(Math.max(0, Math.min(1, w)) * (DENSITY.length - 1))]

export function StarExplorer({ originRect, onClose }: StarExplorerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewRef = useRef<ViewRotation>({ lon: 20, lat: 12 })
  const velRef = useRef({ lon: 0, lat: 0 })
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const progressRef = useRef(0)
  const closingRef = useRef(false)
  const [closing, setClosing] = useState(false)
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const beginClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
  }, [])

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [beginClose])

  // Main render + animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
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

      // progress
      const revealMs = reduceMotion.current ? 0 : REVEAL_MS
      const rawT = revealMs === 0 ? 1 : Math.min((now - revealStart) / revealMs, 1)
      if (!closingRef.current) {
        progressRef.current = rawT
      } else {
        progressRef.current = Math.max(progressRef.current - dt * (1000 / Math.max(revealMs, 1)), 0)
        if (progressRef.current <= 0) {
          cancelAnimationFrame(raf)
          onClose()
          return
        }
      }
      const p = easeInOut(progressRef.current)

      // inertia (only meaningful once revealed and not dragging)
      if (!dragRef.current) {
        viewRef.current.lon += velRef.current.lon * dt
        viewRef.current.lat = Math.max(-85, Math.min(85, viewRef.current.lat + velRef.current.lat * dt))
        velRef.current.lon *= Math.exp(-2.5 * dt)
        velRef.current.lat *= Math.exp(-2.5 * dt)
      }
      const view = viewRef.current

      // geometry: sphere radius grows from the box to bigger-than-viewport
      const boxR = Math.min(originRect.width, originRect.height) / 2
      const bigR = Math.max(W, H) * 0.9
      const radius = lerp(boxR, bigR, p)
      const cx = lerp(originRect.left + originRect.width / 2, W / 2, p)
      const cy = lerp(originRect.top + originRect.height / 2, H / 2, p)

      // background: card -> near-black
      ctx.globalAlpha = 1
      ctx.fillStyle = `rgb(${Math.round(lerp(248, 6, p))}, ${Math.round(lerp(248, 8, p))}, ${Math.round(lerp(250, 16, p))})`
      ctx.fillRect(0, 0, W, H)

      const asciiAlpha = Math.max(0, 1 - p * 1.4) // fade chars out early
      const starAlpha = Math.max(0, (p - 0.25) / 0.75) // fade stars in after 25%

      // constellation lines (stars only)
      ctx.strokeStyle = `rgba(150, 170, 210, ${0.35 * starAlpha})`
      ctx.lineWidth = 1
      for (const c of CONSTELLATIONS) {
        for (const [a, b] of c.lines) {
          const sa = starById(a)!
          const sb = starById(b)!
          const pa = projectOrthographic(sa, view)
          const pb = projectOrthographic(sb, view)
          if (!pa.front || !pb.front) continue
          ctx.beginPath()
          ctx.moveTo(cx + pa.x * radius, cy - pa.y * radius)
          ctx.lineTo(cx + pb.x * radius, cy - pb.y * radius)
          ctx.stroke()
        }
      }

      // stars: ascii (fading out) + points (fading in), same coords
      ctx.font = `${Math.max(8, boxR / 6)}px var(--font-mono), monospace`
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
          ctx.fillStyle = '#9aa3b2'
          ctx.fillText(asciiChar(b), sx, sy)
        }
        if (starAlpha > 0.01) {
          const tw = 0.75 + 0.25 * Math.sin(now / 600 + s.lon)
          const r = (1.2 + b * 2.6) * tw
          ctx.globalAlpha = starAlpha * (0.5 + 0.5 * b)
          ctx.beginPath()
          ctx.arc(sx, sy, r, 0, Math.PI * 2)
          ctx.fillStyle = `hsl(${lerp(210, 45, b)}, 70%, ${lerp(70, 92, b)}%)`
          ctx.fill()
        }
      }

      // constellation labels (once mostly revealed)
      if (starAlpha > 0.5) {
        ctx.globalAlpha = (starAlpha - 0.5) / 0.5
        ctx.fillStyle = 'rgba(180, 195, 225, 0.8)'
        ctx.font = '13px var(--font-sans), sans-serif'
        for (const c of CONSTELLATIONS) {
          const ls = starById(c.labelStar)!
          const pr = projectOrthographic(ls, view)
          if (!pr.front) continue
          ctx.fillText(c.name, cx + pr.x * radius, cy - pr.y * radius - 16)
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

  // pointer drag rotates the view
  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY }
    velRef.current = { lon: 0, lat: 0 }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    dragRef.current = { x: e.clientX, y: e.clientY }
    const k = 0.2 // deg per px
    viewRef.current.lon -= dx * k
    viewRef.current.lat = Math.max(-85, Math.min(85, viewRef.current.lat + dy * k))
    velRef.current = { lon: -dx * k * 8, lat: dy * k * 8 }
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(e) => {
        // a click that wasn't a drag closes
        if (!dragRef.current) beginClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        cursor: closing ? 'default' : 'grab',
        touchAction: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100vw', height: '100vh' }} />
    </div>
  )
}
```

> Note on the close-on-click vs drag distinction: `onClick` fires after pointer up; `dragRef.current` is already null then, so a drag-release would also read as a click. Task 6 hardens this with a small drag-distance threshold. For now the component compiles and the reveal/drag work; the threshold is the next task.

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StarExplorer.tsx
git commit -m "feat: StarExplorer — telescope-focus reveal, canvas sky, drag-to-rotate"
```

---

## Task 6: Harden close-vs-drag, wire into App

**Files:**
- Modify: `src/components/StarExplorer.tsx`
- Modify: `src/App.tsx:197-207` (replace the dashed `<rect>`), plus state + overlay mount.

- [ ] **Step 1: Add a drag-distance threshold in StarExplorer**

Replace the drag refs and handlers so a click only closes when the pointer barely moved.

In `StarExplorer.tsx`, change `dragRef` usage: track total movement and a `movedRef`.

```tsx
  const movedRef = useRef(0)
```

Update handlers:

```tsx
  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = 0
    velRef.current = { lon: 0, lat: 0 }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    movedRef.current += Math.abs(dx) + Math.abs(dy)
    dragRef.current = { x: e.clientX, y: e.clientY }
    const k = 0.2
    viewRef.current.lon -= dx * k
    viewRef.current.lat = Math.max(-85, Math.min(85, viewRef.current.lat + dy * k))
    velRef.current = { lon: -dx * k * 8, lat: dy * k * 8 }
  }
  const onPointerUp = () => {
    dragRef.current = null
  }
```

And the container `onClick`:

```tsx
      onClick={() => {
        if (movedRef.current < 6) beginClose()
      }}
```

- [ ] **Step 2: Wire CelestialBox + StarExplorer into App**

In `src/App.tsx`, add imports near the top (after existing component imports):

```tsx
import { CelestialBox } from './components/CelestialBox'
import { StarExplorer } from './components/StarExplorer'
```

Add state inside `App()` alongside the other `useState` calls:

```tsx
  const [explorerRect, setExplorerRect] = useState<DOMRect | null>(null)
```

Replace the identity-anchor rect (currently `src/App.tsx:197-207`):

```tsx
          <rect
            x={-(IDENTITY_ANCHOR_SIZE + IDENTITY_GAP + 200)}
            y={-IDENTITY_ANCHOR_SIZE / 2}
            width={IDENTITY_ANCHOR_SIZE}
            height={IDENTITY_ANCHOR_SIZE}
            rx="12"
            fill="var(--bg-card)"
            stroke="var(--bd-primary)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
```

with:

```tsx
          <CelestialBox
            x={-(IDENTITY_ANCHOR_SIZE + IDENTITY_GAP + 200)}
            y={-IDENTITY_ANCHOR_SIZE / 2}
            size={IDENTITY_ANCHOR_SIZE}
            onOpen={setExplorerRect}
          />
```

Mount the overlay just before the closing `</>` (after `BlogModal`):

```tsx
      {explorerRect && (
        <StarExplorer originRect={explorerRect} onClose={() => setExplorerRect(null)} />
      )}
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Run the full test suite**

Run: `npm run test -- --run`
Expected: all sky tests + existing `funnel.test.ts` pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/StarExplorer.tsx src/App.tsx
git commit -m "feat: wire CelestialBox + StarExplorer into the identity anchor"
```

---

## Task 7: Lint + hand-verify on the dev server

**Files:** none (verification only).

- [ ] **Step 1: Install deps if needed**

Run: `npm install`
Expected: completes (node_modules was absent at plan time).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors. Fix any introduced by the new files (unused vars, etc.).

- [ ] **Step 3: Dev server for David (eyes on render)**

Run: `npm run dev`
Then hand off — David checks on the real site:
- Rest: quiet ASCII sphere in the identity slot, slowly drifting.
- Hover: brighter, faster rotation; cursor pointer.
- Click: ~600ms telescope-focus reveal — chars sharpen into stars, background darkens, constellation lines + names resolve.
- Drag: sky rotates, light inertia on release; stars twinkle.
- Click (no drag) or Esc: collapses back to the box.
- `prefers-reduced-motion`: reveal is instant, rotation drift damped.

These are render/feel judgments — David's call, not a self-claim.

---

## Self-Review

**Spec coverage:**
- Three states (rest/hover/expanded) → Tasks 4, 5, 6. ✓
- No parallax, depth by magnitude → `brightness()` drives size/alpha; stars all on the sphere. ✓
- Inside-the-dome pan → drag updates `ViewRotation`; orthographic-sphere with radius > viewport reads as dome. ✓ (Documented simplification: orthographic sphere serves all three states, which is what guarantees coordinate registration.)
- ~600ms reveal, same projected coords for ASCII + stars → single canvas, single `projectOrthographic`, `asciiAlpha`/`starAlpha` crossfade. ✓
- Curated ~6 constellations + lines + hover-near labels → Task 2 data; labels drawn near `labelStar`. ✓ (Labels currently always-on once revealed rather than gaze-gated; acceptable for v1, noted.)
- Architecture: `constellations.ts` single source, `CelestialBox` in foreignObject w/ `data-block-pan`, `StarExplorer` overlay → Tasks 2/4/5/6. ✓
- `prefers-reduced-motion` → reveal instant + drift damped (drift damping is via the rotation speed; reduced-motion users still get a static-ish sky). ✓
- Testing: projection + data + ascii unit tests; hand-verify on dev server → Tasks 1/2/3/7. ✓
- Out of scope honored: no catalog, no time/loc sim, no zoom, no clickable stars, no search. ✓

**Placeholder scan:** No TBD/TODO. All code blocks complete. The Task-5 note about close-vs-drag is resolved in Task 6 (not a placeholder — a deliberate two-step).

**Type consistency:** `projectOrthographic(coord, view)` signature identical across Tasks 1/4/5. `Projected.front`, `AsciiPoint{x,y,weight}`, `brightness()`, `starById()`, `ViewRotation` names consistent. `CelestialBox` prop `onOpen(rect)` matches App's `setExplorerRect`; `StarExplorer` props `originRect`/`onClose` match the mount.

**One deviation from spec, logged:** labels are drawn for all front-facing constellations once revealed, not gaze-proximity-gated. Cheaper, reads fine at v1 scale; gaze-gating is a trivial later refinement if the sky feels cluttered.
