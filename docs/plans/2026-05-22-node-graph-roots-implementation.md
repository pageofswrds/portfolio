# Node graph roots — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v1 funnel's flat 17-card ancestry with three clickable category root nodes that expand to reveal chains of artifacts. Constrain all artifact cards to a 16:10 aspect ratio.

**Architecture:** A static category map (`src/content/categories.ts`) assigns each artifact to one of three roots. `App.tsx` renders the three roots in a row above the identity card with click-to-expand state (`activeRoot`). When a root is active, its members render above it as a single-column chain via `placeAncestry` with a per-chain `FunnelConfig`. `ProjectCard` width becomes derived from a fixed aspect ratio.

**Tech Stack:** Same as v1 — Vite + React 19 + TypeScript + MDX + vitest.

**Spec:** `docs/specs/2026-05-22-node-graph-roots-design.md`

**Branches off:** the `funnel-layout` branch as it stands after the v1 implementation (commits `cf9cccc` through `a92ed8c`).

---

## File Structure

**Create:**
- `src/content/categories.ts` — typed const mapping slugs to root nodes

**Modify:**
- `src/components/ProjectCard.tsx` — fix aspect ratio at 16:10; remove unused image-loading effect
- `src/App.tsx` — replace ancestry rendering with 3 roots + chain

**Touch nothing else.** Canvas, modals, theme/zoom controls, content schemas, funnel.ts, MDX content, css/fonts — all preserved.

---

## Task 1: Create the categories map

**Files:**
- Create: `src/content/categories.ts`

- [ ] **Step 1: Write the categories module**

Create `src/content/categories.ts`:

```ts
export const ROOT_IDS = ['past-work', 'product', 'research'] as const

export type RootId = (typeof ROOT_IDS)[number]

export interface RootDefinition {
  id: RootId
  label: string
  members: string[]  // artifact slugs, chronological ascending
}

export const ROOTS: Record<RootId, RootDefinition> = {
  'past-work': {
    id: 'past-work',
    label: 'Past work',
    members: [
      'acquire',
      'sureui',
      'arboretum',
      'cycles',
      'terrariumxr',
      'layer',
      'layerpitch',
    ],
  },
  product: {
    id: 'product',
    label: 'Product',
    members: [
      'devlog01',
      'devlog02',
      'capstone-planning',
      'calculated-risk',
      'rapid-refactoring',
    ],
  },
  research: {
    id: 'research',
    label: 'Research',
    members: [
      'position-in-time',
      'a-plan-for-deep-work',
      'constraints-in-xr',
      'is-xr-in-search-of-a-problem',
      'embodied-interfaces',
    ],
  },
}

export function rootFor(slug: string): RootId | null {
  for (const id of ROOT_IDS) {
    if (ROOTS[id].members.includes(slug)) return id
  }
  return null
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/content/categories.ts
git commit -m "content: add category-to-artifact map for three roots"
```

---

## Task 2: Fix ProjectCard aspect ratio at 16:10

**Files:**
- Modify: `src/components/ProjectCard.tsx`

- [ ] **Step 1: Replace the dynamic aspect-ratio logic with a fixed constant**

In `src/components/ProjectCard.tsx`:

- Remove the `useState` import for `aspectRatio` and the `useEffect` that loads natural image dimensions
- Replace `DEFAULT_ASPECT_RATIO` with a fixed `FIXED_ASPECT_RATIO`
- Compute `width` directly from `imageHeight * FIXED_ASPECT_RATIO`

The file becomes:

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

const TEXT_AREA_HEIGHT = 96
const FIXED_ASPECT_RATIO = 16 / 10

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
  const width = imageHeight * FIXED_ASPECT_RATIO
  const totalHeight = imageHeight + TEXT_AREA_HEIGHT

  const renderX = centered ? x - width / 2 : x
  const renderY = centered ? y - totalHeight / 2 : y

  return (
    <g
      transform={`translate(${renderX}, ${renderY})`}
      className="cursor-pointer"
      onClick={onClick}
    >
      {/* Card background */}
      <rect
        width={width}
        height={totalHeight}
        rx="16"
        fill="var(--bg-card)"
      />

      {/* Thumbnail image (if provided) */}
      {thumbnail && (
        <>
          <defs>
            <clipPath id={`clip-${title.replace(/\s/g, '-')}`}>
              <rect
                x="0"
                y="0"
                width={width}
                height={imageHeight}
                rx="16"
              />
            </clipPath>
          </defs>
          <image
            href={thumbnail}
            x="0"
            y="0"
            width={width}
            height={imageHeight}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#clip-${title.replace(/\s/g, '-')})`}
          />
        </>
      )}

      {/* Title and Year - using foreignObject for text wrapping */}
      <foreignObject
        x="0"
        y={imageHeight}
        width={width}
        height={TEXT_AREA_HEIGHT}
      >
        <div
          style={{
            padding: '20px 16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              color: 'var(--tx-primary)',
              fontSize: '18px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              lineHeight: 1.2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: 'var(--tx-tertiary)',
              fontSize: '15px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {year}
          </div>
        </div>
      </foreignObject>
    </g>
  )
}
```

Remove the `useState, useEffect` import (the component no longer uses them).

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProjectCard.tsx
git commit -m "components: ProjectCard uses fixed 16:10 aspect ratio"
```

---

## Task 3: Rewrite App.tsx for three roots + expandable chains

**Files:**
- Modify: `src/App.tsx`

The existing ancestry-rendering block (the `ancestryItems.map(...)` over the placement function) gets replaced. The identity card, Kairos card, and chrome stay the same.

- [ ] **Step 1: Replace App.tsx with the new layout**

Replace `src/App.tsx` contents with:

```tsx
import { useState } from 'react'
import { Canvas } from './components/Canvas'
import { ThemeToggle } from './components/ThemeToggle'
import { ZoomControls } from './components/ZoomControls'
import { ProjectCard } from './components/ProjectCard'
import { ProjectModal } from './components/ProjectModal'
import { BlogModal } from './components/BlogModal'
import { projects, blogPosts, type ProjectContent, type BlogContent } from './content'
import { ROOT_IDS, ROOTS, type RootId } from './content/categories'
import { placeAncestry, type FunnelConfig, type Placeable } from './layout/funnel'

const FOCAL_X = 0
const FOCAL_Y = 0
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

// Root nodes — row of three above the identity card
const ROOT_Y = -240
const ROOT_X_SPACING = 500
const ROOT_X_POSITIONS: Record<RootId, number> = {
  'past-work': -ROOT_X_SPACING,
  product: 0,
  research: ROOT_X_SPACING,
}

const ROOT_FONT_SIZE = 18
const ROOT_LABEL_GAP = 8  // gap between label text and chevron

// Per-chain placement: narrow vertical column with light jitter
const CHAIN_CONFIG: Omit<FunnelConfig, 'focalX' | 'focalY'> = {
  topMargin: 80,
  verticalSpacing: 380,
  maxSpread: 24,
  jitterRange: 24,
}

// Lookup helpers
const projectBySlug = new Map(projects.map((p) => [p.slug, p]))
const blogBySlug = new Map(blogPosts.map((b) => [b.slug, b]))

type Artifact =
  | { kind: 'project'; data: ProjectContent }
  | { kind: 'blog'; data: BlogContent }

function lookupArtifact(slug: string): Artifact | null {
  const proj = projectBySlug.get(slug)
  if (proj) return { kind: 'project', data: proj }
  const blog = blogBySlug.get(slug)
  if (blog) return { kind: 'blog', data: blog }
  return null
}

function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectContent | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogContent | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [activeRoot, setActiveRoot] = useState<RootId | null>(null)

  const kairos = projectBySlug.get('kairos') ?? null

  // Resolve active chain — artifacts + their placements
  const activeChain = (() => {
    if (!activeRoot) return null
    const root = ROOTS[activeRoot]
    const rootX = ROOT_X_POSITIONS[activeRoot]
    const artifacts = root.members
      .map(lookupArtifact)
      .filter((a): a is Artifact => a !== null)

    const placeable: Placeable[] = artifacts.map((a) => ({
      slug: a.data.slug,
      date: a.data.date,
      position: a.data.position,
    }))

    const placements = placeAncestry(placeable, {
      ...CHAIN_CONFIG,
      focalX: rootX,
      focalY: ROOT_Y,
    })

    return { artifacts, placements }
  })()

  const handleRootClick = (id: RootId) => {
    setActiveRoot((current) => (current === id ? null : id))
  }

  return (
    <>
      <ThemeToggle />
      <ZoomControls scale={zoomScale} />
      <Canvas onZoomChange={setZoomScale}>
        {/* Identity zone — centered on focal point */}
        <g transform={`translate(${FOCAL_X}, ${FOCAL_Y})`}>
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

          <text
            x={-200}
            y={-IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE + 32}
            fill="var(--tx-primary)"
            fontSize={IDENTITY_TAGLINE_FONT_SIZE}
            fontFamily="var(--font-sans)"
          >
            Building thinking models at studiozojer
          </text>

          <g
            transform={`translate(-200, ${
              -IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE + 64
            })`}
          >
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

        {/* Three root nodes — row above identity */}
        {ROOT_IDS.map((id) => {
          const isActive = activeRoot === id
          const rootX = ROOT_X_POSITIONS[id]
          const label = ROOTS[id].label
          const chevron = isActive ? '▴' : '▾'

          return (
            <g
              key={id}
              transform={`translate(${rootX}, ${ROOT_Y})`}
              className="cursor-pointer"
              onClick={() => handleRootClick(id)}
            >
              {/* Invisible click target — generous padding */}
              <rect
                x={-80}
                y={-20}
                width={160}
                height={40}
                fill="transparent"
              />
              <text
                x={-ROOT_LABEL_GAP / 2}
                y={6}
                fill="var(--tx-primary)"
                fontSize={ROOT_FONT_SIZE}
                fontFamily="var(--font-mono)"
                fontWeight="500"
                textAnchor="end"
              >
                {label}
              </text>
              <text
                x={ROOT_LABEL_GAP / 2}
                y={6}
                fill="var(--tx-tertiary)"
                fontSize={ROOT_FONT_SIZE}
                fontFamily="var(--font-mono)"
                textAnchor="start"
              >
                {chevron}
              </text>
            </g>
          )
        })}

        {/* Active chain — cards above the active root */}
        {activeChain &&
          activeChain.artifacts.map((artifact, i) => {
            const placement = activeChain.placements[i]
            if (!placement) return null

            const onClick = () => {
              if (artifact.kind === 'project') {
                setSelectedProject(artifact.data)
              } else {
                setSelectedBlogPost(artifact.data)
              }
            }

            const yearLabel =
              artifact.kind === 'project'
                ? artifact.data.year
                : (artifact.data.subtitle.split('•')[0]?.trim() ?? '')

            const thumb =
              artifact.kind === 'project'
                ? artifact.data.thumbnailSmall
                : artifact.data.thumbnail

            return (
              <ProjectCard
                key={`${artifact.kind}-${artifact.data.slug}`}
                x={placement.x}
                y={placement.y}
                imageHeight={IMAGE_HEIGHT}
                title={artifact.data.title}
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

Note: `placeAncestry` is called with `{ ...CHAIN_CONFIG, focalX: rootX, focalY: ROOT_Y }` — using each root's X as the chain's center so cards stack above that root.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds with no TS errors.

- [ ] **Step 3: Run unit tests**

Run: `npm test -- --run`
Expected: all 11 funnel tests still pass (funnel.ts is unchanged).

- [ ] **Step 4: Visual verification via dev server**

The dev server may already be running from the v1 implementation. Hot reload should pick up the changes; if not, restart:

Run: `npm run dev`

Confirm in browser:
- Page loads showing exactly: 3 root labels in a row above the identity card, the identity card, and Kairos below
- No artifact cards visible by default
- Clicking a root label expands a vertical chain of cards above it
- Clicking the same root again collapses the chain
- Clicking a different root collapses the first and opens the second
- All cards have identical 16:10 dimensions
- Project cards open ProjectModal; essay cards open BlogModal
- Theme toggle, zoom, recenter still work

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "app: three-root node graph with expandable chains"
```

---

## Task 4: Editorial tuning

After the first render, tune root positions, chain spacing, and root visual weight as needed.

**Files:**
- Modify: `src/App.tsx` (constants only)

- [ ] **Step 1: Visually evaluate**

Common things to look for:
- Roots too close to identity → increase `|ROOT_Y|` (more negative)
- Roots too close to each other → increase `ROOT_X_SPACING`
- Chain too tight vertically → increase `CHAIN_CONFIG.verticalSpacing`
- Jitter too chaotic → decrease `CHAIN_CONFIG.jitterRange` (or `maxSpread`)
- Root labels feel too small/large → adjust `ROOT_FONT_SIZE`

- [ ] **Step 2: Adjust constants in App.tsx**

Update only the numeric constants at the top of App.tsx based on observation. No structural changes.

- [ ] **Step 3: Re-verify tests + build**

Run: `npm test -- --run && npm run build`
Expected: both pass.

- [ ] **Step 4: Commit (only if constants changed)**

```bash
git add src/App.tsx
git commit -m "app: tune root + chain constants editorially"
```

---

## Verification checklist

- [ ] `npm run build` succeeds with no errors
- [ ] `npm test -- --run` passes all 11 tests
- [ ] `npm run lint` passes (or surface only pre-existing errors)
- [ ] Default page shows 5 nodes: 3 roots + identity + Kairos
- [ ] Each root expands its chain on click
- [ ] One-at-a-time expansion behavior works
- [ ] Same-root click collapses
- [ ] All artifact cards uniform 16:10
- [ ] Project modals + blog modals both work from chain cards
- [ ] Theme / zoom / recenter unaffected

## What's NOT in this plan

- Animation on expansion (deferred)
- URL persistence of `activeRoot` (deferred)
- Drawn edges between nodes (deferred)
- Reorganization of category membership (David will adjust later in `src/content/categories.ts` — no code changes needed)
- "Studio" root or any fourth root
- Differentiating projects vs. essays inside a chain visually
- The "below identity" content area
