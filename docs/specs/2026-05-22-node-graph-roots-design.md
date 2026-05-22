---
title: Node graph with three category roots
status: approved
date: 2026-05-22
authors: [david, tycho]
supersedes: docs/specs/2026-05-19-funnel-layout-design.md
---

# Node graph with three category roots

## Concept

The portfolio shifts again — this time from "everything visible in a funnel" to **a node graph with three category roots**. Default state is a clean five-node graph: three root nodes above the identity card, identity at center, Kairos below. Clicking a root expands its chain of artifacts; clicking another root collapses the first and opens the second. Visitors land on legibility, not on a wall of 18 cards.

This builds on the v1 funnel spec rather than replacing it wholesale. Identity zone, Kairos placement, Canvas centering, the `position` frontmatter field, and `funnel.ts` as a placement library all carry forward. The interaction model and top-zone topology are what change.

## What changes from v1

| Aspect | v1 (funnel) | v2 (node graph) |
|---|---|---|
| Top zone default state | 17 cards visible, all chronological | 3 root nodes visible |
| Expansion | n/a | Click root → reveal chain above it; one-at-a-time |
| Card width | Natural image aspect ratio (variable) | Fixed 16:10 (uniform) |
| Spatial logic | One large funnel narrowing toward focal | Per-chain narrow column with light jitter |
| Edges | Implicit via spread | Implicit via chain order; no drawn edges yet |

## What stays the same as v1

- Identity zone (anchor placeholder, name, tagline, four buttons)
- Kairos as sole below-identity card
- Canvas initial viewport centers on focal point (0, 0)
- `ProjectCard` `centered` prop
- `position?: { x, y }` frontmatter field on `ProjectContent` / `BlogContent`
- vitest infrastructure
- ASCII flow field removed from canvas (still in repo as compost)
- Tagline copy ("Building thinking models at studiozojer")
- Button quartet (LinkedIn / Resume / studiozojer.co / Bluesky)

## Three roots

| Root | Slug | Members (chronological, oldest → newest) |
|---|---|---|
| Past work | `past-work` | acquire, sureui, arboretum, cycles, terrariumxr, layer, layerpitch |
| Product | `product` | devlog01, devlog02, capstone-planning, calculated-risk, rapid-refactoring |
| Research | `research` | position-in-time, a-plan-for-deep-work, constraints-in-xr, is-xr-in-search-of-a-problem, embodied-interfaces |

Mapping is editorial and provisional — David will reorganize over time. The mapping itself lives in `src/content/categories.ts` so it's easy to amend without touching MDX frontmatter.

## Root node visual

Each root is a small clickable indicator — type-only, no thumbnail, visually distinct from artifact cards:

- Label text (root name, sentence case): rendered in the mono font, ~16pt
- Small chevron or caret indicating expansion state (`▾` collapsed, `▴` expanded) — using Unicode glyphs is fine here since these are UI affordances, not astrological symbols
- Click target: the whole root group (label + chevron + invisible padding rect)
- Position: row of three above the identity card, evenly spaced

## Chain layout

When a root expands, its chain renders **above the root**:

- Cards stack vertically in a single column centered on the root's X coordinate
- Sort: chronological ascending (oldest at top, newest just above the root)
- Vertical spacing: constant (cards are now uniform height)
- Horizontal jitter: small (~24px range) for organic feel; deterministic via `slugHash`
- Implementation: reuse `placeAncestry` from `funnel.ts` with a tight per-chain `FunnelConfig` (small `maxSpread`, small `jitterRange`)

## Interaction state

`activeRoot: 'past-work' | 'product' | 'research' | null`

- Initial: `null` (no chain visible)
- Clicking a root: if `activeRoot` equals that root, set to `null` (collapse); otherwise set to that root (switch)
- Smooth visual change is nice-to-have; not required for v2

No URL persistence in v2 — page reload returns to collapsed state. Could be added later via react-router (already in deps).

## Card aspect ratio

All artifact cards constrained to **16:10** (1.6). Implementation: `ProjectCard` width derivation changes from `imageHeight * naturalAspect` to `imageHeight * FIXED_ASPECT_RATIO`. The image `<image>` element keeps `preserveAspectRatio="xMidYMid slice"` so narrower/wider thumbnails crop instead of distorting.

Side effect: `useEffect` that loaded image natural dimensions becomes unused → remove for tidiness.

## Edges

None drawn. The chain's vertical order *is* the implicit edge (a → b → c by date). Drawn edges revisit later if/when they reveal what they want to connect.

## Files

**Create:**
- `src/content/categories.ts` — the slug-to-category map; exports a typed const

**Modify:**
- `src/App.tsx` — replace ancestry rendering with 3 roots + conditional chain; add `activeRoot` state
- `src/components/ProjectCard.tsx` — fix aspect ratio at 16:10; remove image-natural-dimensions effect

**Touch nothing:**
- Canvas, Theme*, Zoom*, Modals, content/*.ts (schemas), funnel.ts (reused as-is), MDX content files, index.css, fonts

## Out of scope for this pass

- Animation on chain expand/collapse
- URL persistence of active root
- Drawn edges between nodes
- "Studio" root or any fourth root (deferred — David flagged reorganization happens later)
- Visual indicator of which artifacts are projects vs. essays inside a chain (the modal routing still works; visual differentiation can come later if useful)
- Editorial tuning of category membership (the map is provisional)
- The "below identity" content area (still just Kairos)

## Success criteria

- Page loads with exactly five nodes visible: three roots + identity + Kairos
- Clicking a root expands its chain above the root with cards sorted oldest-at-top
- Clicking the active root collapses it (back to clean five-node state)
- Clicking a different root collapses the first and opens the second (one-at-a-time)
- All artifact cards have identical 16:10 dimensions regardless of thumbnail
- All click handlers route correctly (projects open ProjectModal, essays open BlogModal)
- vitest tests still pass (funnel.ts logic unchanged)
- Build clean, no new lint errors
