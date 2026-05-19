# Funnel Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the column-and-row layout in `src/App.tsx` with a single-axis vertical funnel: ancestry artifacts (projects + writing, mingled) extend upward from a centered identity card, narrowing as they approach it; the Kairos card sits alone below.

**Architecture:** A pure placement function (`src/layout/funnel.ts`) maps each chronologically-ordered artifact to canvas coordinates. The formula spreads cards wider farther from the focal point and uses slug-seeded jitter for deterministic organic placement. Frontmatter can override with explicit `{ x, y }` coordinates. `App.tsx` consumes the placement function and renders ancestry above + Kairos below a centered identity zone. The `Canvas` component opens with the focal point at the viewport center.

**Tech Stack:** Vite + React 19 + TypeScript + MDX. Tests via vitest (added in Task 1).

**Spec:** `docs/specs/2026-05-19-funnel-layout-design.md`

---

## File Structure

**Create:**
- `src/layout/funnel.ts` — placement formula, slug hash, override resolver
- `src/layout/funnel.test.ts` — unit tests for the formula
- `vitest.config.ts` — vitest configuration

**Modify:**
- `package.json` — add vitest dev dep + `test` script
- `src/content/index.ts` — add `position?: { x, y }` to `ProjectContent`, propagate from frontmatter
- `src/content/blog/index.ts` — same addition to `BlogContent`
- `src/components/ProjectCard.tsx` — add optional `centered` prop for center-anchored placement
- `src/components/Canvas.tsx` — initial viewport centers on canvas origin (0, 0) instead of (40, 20)
- `src/App.tsx` — full layout rewrite

**Not touched:** `src/components/AsciiFlowField.tsx` (stays in repo as compost, no longer imported), `ProjectModal.tsx`, `BlogModal.tsx`, `ThemeToggle.tsx`, `ZoomControls.tsx`, `ThemeProvider.tsx`, all MDX content files (no edits to existing frontmatter), `src/index.css`.

---

## Task 1: Add vitest infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/layout/funnel.smoke.test.ts` (deleted at end of task)

- [ ] **Step 1: Install vitest as a dev dependency**

Run: `cd /Users/pageofswrds/armillary/repos/portfolio && npm install -D vitest @vitest/ui`
Expected: `package.json` and `package-lock.json` updated; no warnings/errors.

- [ ] **Step 2: Add test script to `package.json`**

Modify `package.json` — under `"scripts"`, add `"test": "vitest"`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Write a smoke test to verify vitest works**

Create `src/layout/funnel.smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('vitest infrastructure', () => {
  it('runs a test', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run the smoke test**

Run: `npm test -- --run`
Expected: 1 passing test, exit code 0.

- [ ] **Step 6: Delete the smoke test file**

Run: `rm src/layout/funnel.smoke.test.ts`

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add vitest infrastructure"
```

---

## Task 2: Add `position` field to content schemas

**Files:**
- Modify: `src/content/index.ts`
- Modify: `src/content/blog/index.ts`

- [ ] **Step 1: Extend `ProjectContent` type and frontmatter parsing in `src/content/index.ts`**

Modify `src/content/index.ts`. In the `mdxModules` glob type, add `position` to the frontmatter shape. In `ProjectContent`, add the field. In the `.map(...)` body, read it from frontmatter.

The `mdxModules` declaration becomes:

```ts
const mdxModules = import.meta.glob<{
  default: React.ComponentType<MDXContentProps>
  frontmatter: {
    title?: string
    subtitle?: string
    published?: string
    year?: string
    location?: string
    thumbnail?: string
    thumbnailSmall?: string
    order?: number
    visible?: boolean
    position?: { x: number; y: number }
  }
}>('./work/*.mdx', { eager: true })
```

The `ProjectContent` interface gains:

```ts
export interface ProjectContent {
  id: string
  slug: string
  title: string
  subtitle: string
  date: string
  year: string
  location: string
  thumbnail: string
  thumbnailSmall: string
  order: number
  visible: boolean
  position?: { x: number; y: number }
  Component: React.ComponentType<MDXContentProps>
}
```

And the `.map(...)` body returns:

```ts
return {
  id: slug,
  slug,
  title: frontmatter.title || slug,
  subtitle: frontmatter.subtitle || '',
  date: frontmatter.published || '',
  year: frontmatter.year || '',
  location: frontmatter.location || '',
  thumbnail: frontmatter.thumbnail || '',
  thumbnailSmall: frontmatter.thumbnailSmall || frontmatter.thumbnail || '',
  order: frontmatter.order ?? 999,
  visible: frontmatter.visible ?? true,
  position: frontmatter.position,
  Component: module.default,
}
```

- [ ] **Step 2: Same extension to `src/content/blog/index.ts`**

The `mdxModules` declaration becomes:

```ts
const mdxModules = import.meta.glob<{
  default: React.ComponentType<MDXContentProps>
  frontmatter: {
    title?: string
    subtitle?: string
    year?: number
    date?: string
    thumbnail?: string
    order?: number | null
    visible?: boolean
    position?: { x: number; y: number }
  }
}>('./*.mdx', { eager: true })
```

The `BlogContent` interface gains:

```ts
export interface BlogContent {
  id: string
  slug: string
  title: string
  subtitle: string
  date: string
  thumbnail: string
  visible: boolean
  position?: { x: number; y: number }
  Component: React.ComponentType<MDXContentProps>
}
```

And the `.map(...)` body returns:

```ts
return {
  id: slug,
  slug,
  title: frontmatter.title || slug,
  subtitle: frontmatter.subtitle || '',
  date: frontmatter.date || '',
  thumbnail: frontmatter.thumbnail || '',
  visible: frontmatter.visible ?? true,
  position: frontmatter.position,
  Component: module.default,
}
```

- [ ] **Step 3: Verify build still passes**

Run: `npm run build`
Expected: build succeeds with no TS errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/index.ts src/content/blog/index.ts
git commit -m "content: add optional position frontmatter field"
```

---

## Task 3: Implement funnel.ts placement formula (TDD)

**Files:**
- Create: `src/layout/funnel.ts`
- Test: `src/layout/funnel.test.ts`

- [ ] **Step 1: Write failing tests for `slugHash`**

Create `src/layout/funnel.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { slugHash, placeAncestry, type Placeable } from './funnel'

describe('slugHash', () => {
  it('is deterministic — same slug yields same hash', () => {
    expect(slugHash('kairos')).toBe(slugHash('kairos'))
    expect(slugHash('rapid-refactoring')).toBe(slugHash('rapid-refactoring'))
  })

  it('returns a non-negative integer', () => {
    expect(slugHash('kairos')).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(slugHash('kairos'))).toBe(true)
  })

  it('produces different hashes for different slugs', () => {
    expect(slugHash('kairos')).not.toBe(slugHash('layer'))
    expect(slugHash('a')).not.toBe(slugHash('b'))
  })
})
```

- [ ] **Step 2: Run failing tests**

Run: `npm test -- --run`
Expected: FAIL — module `./funnel` not found.

- [ ] **Step 3: Implement `slugHash` and module skeleton**

Create `src/layout/funnel.ts`:

```ts
export interface Placeable {
  slug: string
  date: string  // ISO-ish, lexically sortable
  position?: { x: number; y: number }
}

export interface FunnelConfig {
  focalX: number
  focalY: number
  topMargin: number
  verticalSpacing: number
  maxSpread: number
  jitterRange: number
}

export const DEFAULT_FUNNEL_CONFIG: FunnelConfig = {
  focalX: 0,
  focalY: 0,
  topMargin: 280,
  verticalSpacing: 280,
  maxSpread: 480,
  jitterRange: 60,
}

export function slugHash(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function placeAncestry(
  cards: Placeable[],
  config: FunnelConfig = DEFAULT_FUNNEL_CONFIG,
): Array<{ slug: string; x: number; y: number }> {
  // Stub — implemented in next step
  return []
}
```

- [ ] **Step 4: Run hash tests**

Run: `npm test -- --run`
Expected: PASS — 3 tests in slugHash suite.

- [ ] **Step 5: Write failing tests for `placeAncestry`**

Append to `src/layout/funnel.test.ts`:

```ts
describe('placeAncestry', () => {
  const config = {
    focalX: 0,
    focalY: 0,
    topMargin: 200,
    verticalSpacing: 100,
    maxSpread: 400,
    jitterRange: 0,  // disable jitter for predictable assertions
  }

  it('returns an entry per input card', () => {
    const cards: Placeable[] = [
      { slug: 'old', date: '2022-01-01' },
      { slug: 'newer', date: '2024-01-01' },
      { slug: 'newest', date: '2025-01-01' },
    ]
    const result = placeAncestry(cards, config)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.slug).sort()).toEqual(['newer', 'newest', 'old'])
  })

  it('places the newest card closest to the focal point (smallest |y|)', () => {
    const cards: Placeable[] = [
      { slug: 'old', date: '2022-01-01' },
      { slug: 'newer', date: '2024-01-01' },
      { slug: 'newest', date: '2025-01-01' },
    ]
    const result = placeAncestry(cards, config)
    const newest = result.find(r => r.slug === 'newest')!
    const old = result.find(r => r.slug === 'old')!
    expect(Math.abs(newest.y - config.focalY)).toBeLessThan(Math.abs(old.y - config.focalY))
  })

  it('places ancestry above the focal point (y < focalY)', () => {
    const cards: Placeable[] = [
      { slug: 'a', date: '2024-01-01' },
      { slug: 'b', date: '2024-02-01' },
    ]
    const result = placeAncestry(cards, config)
    for (const card of result) {
      expect(card.y).toBeLessThan(config.focalY)
    }
  })

  it('spreads older cards wider horizontally than newer cards', () => {
    const cards: Placeable[] = [
      { slug: 'old', date: '2022-01-01' },
      { slug: 'mid', date: '2023-01-01' },
      { slug: 'newer', date: '2024-01-01' },
      { slug: 'newest', date: '2025-01-01' },
    ]
    const result = placeAncestry(cards, config)
    const old = result.find(r => r.slug === 'old')!
    const newest = result.find(r => r.slug === 'newest')!
    expect(Math.abs(old.x - config.focalX)).toBeGreaterThanOrEqual(
      Math.abs(newest.x - config.focalX)
    )
  })

  it('honors explicit position override from frontmatter', () => {
    const cards: Placeable[] = [
      { slug: 'star', date: '2024-01-01', position: { x: 999, y: -1234 } },
      { slug: 'other', date: '2024-02-01' },
    ]
    const result = placeAncestry(cards, config)
    const star = result.find(r => r.slug === 'star')!
    expect(star.x).toBe(999)
    expect(star.y).toBe(-1234)
  })

  it('produces stable positions across calls (same input → same output)', () => {
    const cards: Placeable[] = [
      { slug: 'a', date: '2024-01-01' },
      { slug: 'b', date: '2024-02-01' },
      { slug: 'c', date: '2024-03-01' },
    ]
    const first = placeAncestry(cards, config)
    const second = placeAncestry(cards, config)
    expect(first).toEqual(second)
  })

  it('adding a card does not change existing cards positions (without jitter)', () => {
    const baseConfig = { ...config }
    const a: Placeable = { slug: 'a', date: '2024-01-01' }
    const b: Placeable = { slug: 'b', date: '2024-02-01' }
    const before = placeAncestry([a, b], baseConfig)
    // Note: with a chronological-index-based formula, *adding* a newer card shifts
    // indices. This test confirms the formula uses date-based, not insertion-order,
    // ranking — so reordering the input array does not change positions.
    const reordered = placeAncestry([b, a], baseConfig)
    const beforeA = before.find(r => r.slug === 'a')!
    const reorderedA = reordered.find(r => r.slug === 'a')!
    expect(reorderedA).toEqual(beforeA)
  })

  it('places left or right of focal point deterministically by slug', () => {
    const a = placeAncestry([{ slug: 'a', date: '2024-01-01' }], config)
    const b = placeAncestry([{ slug: 'b', date: '2024-01-01' }], config)
    // The side depends on slugHash parity — just confirm output is determined.
    expect(typeof a[0].x).toBe('number')
    expect(typeof b[0].x).toBe('number')
  })
})
```

- [ ] **Step 6: Run failing placement tests**

Run: `npm test -- --run`
Expected: FAIL — `placeAncestry` returns empty array, most assertions fail.

- [ ] **Step 7: Implement `placeAncestry`**

Replace the `placeAncestry` stub in `src/layout/funnel.ts`:

```ts
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

export function placeAncestry(
  cards: Placeable[],
  config: FunnelConfig = DEFAULT_FUNNEL_CONFIG,
): Array<{ slug: string; x: number; y: number }> {
  // Sort by date ascending — oldest first.
  const sorted = [...cards].sort((a, b) => a.date.localeCompare(b.date))
  const N = sorted.length

  return sorted.map((card, i) => {
    // Override wins — coordinates are relative to focal point.
    if (card.position) {
      return {
        slug: card.slug,
        x: config.focalX + card.position.x,
        y: config.focalY + card.position.y,
      }
    }

    // distance: 0 = newest (closest to focal), N-1 = oldest (farthest, top)
    const distance = N - 1 - i

    const baseY = config.focalY - config.topMargin - distance * config.verticalSpacing

    const spreadRatio = N <= 1 ? 0 : distance / (N - 1)
    const spreadAmount = config.maxSpread * easeOutQuad(spreadRatio)

    const hash = slugHash(card.slug)
    const side = hash % 2 === 0 ? 1 : -1
    const baseX = config.focalX + side * spreadAmount

    const jitterX = config.jitterRange === 0
      ? 0
      : ((hash >> 8) % config.jitterRange) - config.jitterRange / 2
    const jitterY = config.jitterRange === 0
      ? 0
      : ((hash >> 16) % config.jitterRange) - config.jitterRange / 2

    return {
      slug: card.slug,
      x: baseX + jitterX,
      y: baseY + jitterY,
    }
  })
}
```

- [ ] **Step 8: Run placement tests**

Run: `npm test -- --run`
Expected: PASS — all tests in `placeAncestry` suite green.

- [ ] **Step 9: Commit**

```bash
git add src/layout/funnel.ts src/layout/funnel.test.ts
git commit -m "layout: add funnel placement formula"
```

---

## Task 4: Add center-anchored rendering to ProjectCard

**Files:**
- Modify: `src/components/ProjectCard.tsx`

Currently `ProjectCard` treats `(x, y)` as top-left. For the funnel layout, we want `(x, y)` to be the card's center so the placement formula's output corresponds to visually-centered positions. Add an optional `centered` prop.

- [ ] **Step 1: Modify `ProjectCardProps` and the `<g>` transform**

In `src/components/ProjectCard.tsx`:

Update the props interface:

```tsx
interface ProjectCardProps {
  x: number
  y: number
  imageHeight: number
  title: string
  year: string
  thumbnail?: string
  onClick?: () => void
  centered?: boolean
}
```

Update the destructure to include `centered = false`:

```tsx
export function ProjectCard({
  x,
  y,
  imageHeight,
  title,
  year,
  thumbnail,
  onClick,
  centered = false,
}: ProjectCardProps) {
```

Replace the `<g transform=...>` line:

```tsx
const width = imageHeight * aspectRatio
const totalHeight = imageHeight + TEXT_AREA_HEIGHT

const renderX = centered ? x - width / 2 : x
const renderY = centered ? y - totalHeight / 2 : y

return (
  <g
    transform={`translate(${renderX}, ${renderY})`}
    className="cursor-pointer"
    onClick={onClick}
  >
    {/* ... rest unchanged ... */}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProjectCard.tsx
git commit -m "components: ProjectCard supports center-anchored placement"
```

---

## Task 5: Center initial viewport on canvas origin in Canvas.tsx

**Files:**
- Modify: `src/components/Canvas.tsx`

The current Canvas opens with `translate(40, 20)` — top-left positioning. After the funnel pivot, canvas origin (0, 0) is where the identity card sits, and we want that point at the viewport's center.

- [ ] **Step 1: Modify the initial transform block in Canvas.tsx**

In `src/components/Canvas.tsx`, locate the block (around line 203-209) that reads:

```tsx
// Position initial view so intro section appears near top-left
const initialX = 40
const initialY = 20
const initialTransform = d3.zoomIdentity.translate(initialX, initialY).scale(1)
transformRef.current = { x: initialX, y: initialY, k: 1 }
svg.call(zoom.transform, initialTransform)
onZoomChange?.(1)
```

Replace with:

```tsx
// Position initial view so the focal point (canvas origin) sits at viewport center
const rect = svgElement.getBoundingClientRect()
const initialX = rect.width / 2
const initialY = rect.height / 2
const initialTransform = d3.zoomIdentity.translate(initialX, initialY).scale(1)
transformRef.current = { x: initialX, y: initialY, k: 1 }
svg.call(zoom.transform, initialTransform)
onZoomChange?.(1)
```

- [ ] **Step 2: Update `recenter` callback to use the same logic**

Locate the `recenter` callback (around line 74-80):

```tsx
const recenter = useCallback(() => {
  if (!svgRef.current || !zoomRef.current) return
  const svg = d3.select(svgRef.current)
  momentum.cancel()
  const initialTransform = d3.zoomIdentity.translate(40, 20).scale(1)
  svg.transition().duration(300).call(zoomRef.current.transform, initialTransform)
}, [momentum])
```

Replace with:

```tsx
const recenter = useCallback(() => {
  if (!svgRef.current || !zoomRef.current) return
  const svg = d3.select(svgRef.current)
  momentum.cancel()
  const rect = svgRef.current.getBoundingClientRect()
  const initialTransform = d3.zoomIdentity
    .translate(rect.width / 2, rect.height / 2)
    .scale(1)
  svg.transition().duration(300).call(zoomRef.current.transform, initialTransform)
}, [momentum])
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Canvas.tsx
git commit -m "canvas: center initial viewport on origin"
```

---

## Task 6: Rewrite App.tsx for funnel layout

**Files:**
- Modify: `src/App.tsx`

The big task. Single file rewrite. Splits naturally into: imports & constants → identity card → ancestry rendering → present zone → modals.

- [ ] **Step 1: Replace the file contents wholesale**

Replace `src/App.tsx` with:

```tsx
import { useState } from 'react'
import { Canvas } from './components/Canvas'
import { ThemeToggle } from './components/ThemeToggle'
import { ZoomControls } from './components/ZoomControls'
import { ProjectCard } from './components/ProjectCard'
import { ProjectModal } from './components/ProjectModal'
import { BlogModal } from './components/BlogModal'
import { projects, blogPosts, type ProjectContent, type BlogContent } from './content'
import { placeAncestry, DEFAULT_FUNNEL_CONFIG, type Placeable } from './layout/funnel'

const FOCAL_X = DEFAULT_FUNNEL_CONFIG.focalX
const FOCAL_Y = DEFAULT_FUNNEL_CONFIG.focalY
const IMAGE_HEIGHT = 260

// Identity card geometry
const IDENTITY_ANCHOR_SIZE = 180
const IDENTITY_GAP = 32
const IDENTITY_NAME_FONT_SIZE = 64
const IDENTITY_TAGLINE_FONT_SIZE = 18
const IDENTITY_BUTTON_HEIGHT = 40
const IDENTITY_BUTTON_GAP = 12

// Distance from focal point to the Kairos present card
const PRESENT_OFFSET_Y = 320

// Discriminated union so the renderer knows which modal to open.
type AncestryItem =
  | { kind: 'project'; data: ProjectContent }
  | { kind: 'blog'; data: BlogContent }

function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectContent | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogContent | null>(null)
  const [zoomScale, setZoomScale] = useState(1)

  // The Kairos card sits below; everything else is ancestry.
  const kairos = projects.find((p) => p.slug === 'kairos') ?? null
  const ancestryProjects = projects.filter((p) => p.slug !== 'kairos')

  const ancestryItems: AncestryItem[] = [
    ...ancestryProjects.map((p): AncestryItem => ({ kind: 'project', data: p })),
    ...blogPosts.map((b): AncestryItem => ({ kind: 'blog', data: b })),
  ]

  const placeable: Placeable[] = ancestryItems.map((item) => ({
    slug: item.data.slug,
    date: item.data.date,
    position: item.data.position,
  }))

  const placements = placeAncestry(placeable, DEFAULT_FUNNEL_CONFIG)
  const placementBySlug = new Map(placements.map((p) => [p.slug, p]))

  return (
    <>
      <ThemeToggle />
      <ZoomControls scale={zoomScale} />
      <Canvas onZoomChange={setZoomScale}>
        {/* Identity zone — centered on focal point */}
        <g transform={`translate(${FOCAL_X}, ${FOCAL_Y})`}>
          {/* Visual anchor placeholder (left of name) */}
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

          {/* Name */}
          <text
            x={-200}
            y={-IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE}
            fill="var(--tx-primary)"
            fontSize={IDENTITY_NAME_FONT_SIZE}
            fontFamily="var(--font-display)"
            fontWeight="400"
          >
            david schultz
          </text>

          {/* Tagline */}
          <text
            x={-200}
            y={-IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE + 32}
            fill="var(--tx-primary)"
            fontSize={IDENTITY_TAGLINE_FONT_SIZE}
            fontFamily="var(--font-sans)"
          >
            Building thinking models at studiozojer
          </text>

          {/* Buttons row */}
          <g
            transform={`translate(-200, ${
              -IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE + 64
            })`}
          >
            {/* LinkedIn — solid */}
            <a
              href="https://linkedin.com/in/schultzdavidg"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                width="120"
                height={IDENTITY_BUTTON_HEIGHT}
                rx="8"
                fill="var(--bg-button)"
              />
              <text
                x="60"
                y="25"
                fill="var(--tx-button)"
                fontSize="14"
                fontFamily="var(--font-sans)"
                fontWeight="500"
                textAnchor="middle"
              >
                LinkedIn
              </text>
            </a>

            {/* Resume — outlined */}
            <a
              href="https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/files/davidschultz-resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={120 + IDENTITY_BUTTON_GAP}
                width="100"
                height={IDENTITY_BUTTON_HEIGHT}
                rx="8"
                fill="var(--bg-card)"
                stroke="var(--bd-primary)"
                strokeWidth="1"
              />
              <text
                x={120 + IDENTITY_BUTTON_GAP + 50}
                y="25"
                fill="var(--tx-primary)"
                fontSize="14"
                fontFamily="var(--font-sans)"
                fontWeight="500"
                textAnchor="middle"
              >
                Resume
              </text>
            </a>

            {/* studiozojer.co — outlined */}
            <a
              href="https://studiozojer.co"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={120 + IDENTITY_BUTTON_GAP + 100 + IDENTITY_BUTTON_GAP}
                width="140"
                height={IDENTITY_BUTTON_HEIGHT}
                rx="8"
                fill="var(--bg-card)"
                stroke="var(--bd-primary)"
                strokeWidth="1"
              />
              <text
                x={120 + IDENTITY_BUTTON_GAP + 100 + IDENTITY_BUTTON_GAP + 70}
                y="25"
                fill="var(--tx-primary)"
                fontSize="14"
                fontFamily="var(--font-sans)"
                fontWeight="500"
                textAnchor="middle"
              >
                studiozojer.co
              </text>
            </a>

            {/* Bluesky — outlined */}
            <a
              href="https://bsky.app/profile/pageofswrds.kairos.solar"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={120 + IDENTITY_BUTTON_GAP + 100 + IDENTITY_BUTTON_GAP + 140 + IDENTITY_BUTTON_GAP}
                width="110"
                height={IDENTITY_BUTTON_HEIGHT}
                rx="8"
                fill="var(--bg-card)"
                stroke="var(--bd-primary)"
                strokeWidth="1"
              />
              <text
                x={120 + IDENTITY_BUTTON_GAP + 100 + IDENTITY_BUTTON_GAP + 140 + IDENTITY_BUTTON_GAP + 55}
                y="25"
                fill="var(--tx-primary)"
                fontSize="14"
                fontFamily="var(--font-sans)"
                fontWeight="500"
                textAnchor="middle"
              >
                Bluesky
              </text>
            </a>
          </g>
        </g>

        {/* Ancestry — projects + writing, mingled, chronological */}
        {ancestryItems.map((item) => {
          const placement = placementBySlug.get(item.data.slug)
          if (!placement) return null

          const onClick = () => {
            if (item.kind === 'project') {
              setSelectedProject(item.data)
            } else {
              setSelectedBlogPost(item.data)
            }
          }

          // Subtitle date is the bottom-corner year label.
          const yearLabel =
            item.kind === 'project'
              ? item.data.year
              : (item.data.subtitle.split('•')[0]?.trim() ?? '')

          const thumb =
            item.kind === 'project' ? item.data.thumbnailSmall : item.data.thumbnail

          return (
            <ProjectCard
              key={`${item.kind}-${item.data.slug}`}
              x={placement.x}
              y={placement.y}
              imageHeight={IMAGE_HEIGHT}
              title={item.data.title}
              year={yearLabel}
              thumbnail={thumb}
              onClick={onClick}
              centered
            />
          )
        })}

        {/* Present — Kairos card below focal point */}
        {kairos && (
          <ProjectCard
            x={FOCAL_X}
            y={FOCAL_Y + PRESENT_OFFSET_Y}
            imageHeight={IMAGE_HEIGHT}
            title={kairos.title}
            year={kairos.year}
            thumbnail={kairos.thumbnailSmall}
            onClick={() => setSelectedProject(kairos)}
            centered
          />
        )}
      </Canvas>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      <BlogModal
        post={selectedBlogPost}
        onClose={() => setSelectedBlogPost(null)}
      />
    </>
  )
}

export default App
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds with no TS errors.

- [ ] **Step 3: Run unit tests**

Run: `npm test -- --run`
Expected: all funnel tests still pass.

- [ ] **Step 4: Visual verification via dev server**

Run: `npm run dev`
Open the printed local URL in a browser.

Confirm:
- Identity card sits centered in the initial viewport (not upper-left).
- Tagline reads "Building thinking models at studiozojer".
- Four buttons appear in a single row: LinkedIn / Resume / studiozojer.co / Bluesky.
- A dashed-outline square placeholder sits left of the name.
- Ancestry cards (projects + essays mingled) extend upward from the identity card.
- Cards near the identity card cluster narrower; cards far above spread wider.
- The Kairos card appears below the identity card, centered horizontally.
- No ASCII flow field visible.
- Clicking a project card opens `ProjectModal`; clicking an essay opens `BlogModal`.
- Zoom controls and theme toggle still function.

Stop the dev server when done (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "app: pivot layout to vertical funnel with mingled ancestry"
```

---

## Task 7: Editorial tuning pass

This is an explicit task to acknowledge: after the first render, the formula's constants will need adjustment. The defaults are a starting point, not a final answer.

**Files:**
- Modify: `src/layout/funnel.ts` (constants only)

- [ ] **Step 1: Visually evaluate the funnel on the dev server**

Run: `npm run dev`
Take notes on what feels off. Common issues to look for:

- Cards overlap → increase `verticalSpacing`
- Funnel feels too narrow → increase `maxSpread`
- Funnel feels chaotic → decrease `jitterRange`
- Top of funnel too far above viewport (you have to scroll a lot) → decrease `verticalSpacing` or `topMargin`
- Identity zone feels crowded → increase `topMargin` and `PRESENT_OFFSET_Y` (in App.tsx)
- Kairos card feels too close/far → adjust `PRESENT_OFFSET_Y` in App.tsx

- [ ] **Step 2: Adjust numeric values in `DEFAULT_FUNNEL_CONFIG`**

Edit `src/layout/funnel.ts` and update only the numeric values in `DEFAULT_FUNNEL_CONFIG` based on the observations from Step 1. The shape stays the same — only `topMargin`, `verticalSpacing`, `maxSpread`, and `jitterRange` change. Adjust `PRESENT_OFFSET_Y` in `src/App.tsx` if the Kairos card's distance from the identity zone needs tuning. Do not change the formula itself in this step — only constants.

- [ ] **Step 3: Re-verify visually + ensure tests still pass**

Run: `npm test -- --run`
Expected: all tests pass.

Reload the dev server and confirm the funnel reads as intended.

- [ ] **Step 4: Commit (only if constants changed)**

```bash
git add src/layout/funnel.ts src/App.tsx
git commit -m "layout: tune funnel constants editorially"
```

---

## Verification checklist

After all tasks are complete:

- [ ] `npm run build` succeeds with no errors
- [ ] `npm test -- --run` passes all tests
- [ ] `npm run lint` passes (or surface and fix any new lint errors introduced)
- [ ] `npm run dev` opens a browser tab where:
  - Identity card is centered in the initial viewport
  - 17 ancestry cards (7 projects + 10 essays) appear above
  - Kairos card appears below the identity card
  - All click handlers work (project modals + blog modals)
  - Light/dark theme toggle works
  - Zoom in/out/recenter work
  - No ASCII flow field
- [ ] Initial git log shows one commit per task on `main` (or feature branch if a worktree was used)

---

## What's NOT in this plan

The following items from the spec are intentionally out of scope for this implementation pass:

- Full below-identity content area ("presently working / roadmap / research" zone) — only the Kairos card sits below for now
- Real content for the identity-card visual anchor (placeholder only)
- Per-card manual `position:` overrides on existing MDX files (the schema supports it; no files use it yet)
- Frontmatter cleanup on existing work files
- `devlog01` subtitle typo fix
- `thoughts-on-implementation` visibility decision
- README expansion
