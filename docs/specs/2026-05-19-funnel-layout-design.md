---
title: Funnel layout
status: approved
date: 2026-05-19
authors: [david, tycho]
---

# Funnel layout

## Concept

The portfolio shifts from a column-and-row layout to a single-axis vertical funnel. An identity card sits at a fixed focal point. Ancestry artifacts — past projects and writing, mingled as siblings — extend *upward* from the focal point, spread wider farther from it, narrowing as they approach. Present work extends *downward*. The shape maps content to time: read up through deeper ancestry, down toward current direction.

The metaphor is structural, not decorative. The eye traces a vector instead of scanning a museum.

## Spatial system

### Focal point

The identity card sits at fixed canvas coordinates. The initial viewport opens centered on these coordinates — the funnel is the first thing visitors see, not the upper-left corner.

### Ancestry zone (above focal point)

All non-Kairos artifacts — 7 projects + ~10 visible blog posts — combine into a single chronologically-sorted set, oldest first. Cards extend upward. Cards farther from the focal point spread wider horizontally; cards near the focal point sit narrower. The visual funnel emerges from this spread function.

Projects and writing mingle — both are artifacts of thought, both use the same `ProjectCard` visual treatment, both deserve sibling status in the ancestry. Click routing distinguishes them: projects open `ProjectModal`, writing opens `BlogModal`.

### Present zone (below focal point)

A single Kairos card sits below the focal point, centered on focal X. Distance matches the closest ancestry card so the funnel reads symmetric — present mirrors just-above-ancestry.

A future "presently working / roadmap / research" content area will sit below Kairos in the same vertical axis. Out of scope for this pass.

## Placement formula

Approach: data-driven with curated overrides. The default placement is procedural; any card can opt into a hand-tuned position via frontmatter.

### Default (procedural)

Sort ancestry artifacts by date ascending (oldest first). For card at index `i` of `N` total:

```
distance = (N - 1) - i
         // 0 = newest (closest to focal point), N-1 = oldest (top of canvas)

baseY = focalY - topMargin - distance * verticalSpacing
spreadAmount = maxSpread * easeOutQuad(distance / (N - 1))
         // 0 near focal point, maxSpread at top

side = slugHash(card) % 2 ? +1 : -1
baseX = focalX + side * spreadAmount

jitterX = ((slugHash(card) >>  8) % jitterRange) - jitterRange / 2
jitterY = ((slugHash(card) >> 16) % jitterRange) - jitterRange / 2

finalX = baseX + jitterX
finalY = baseY + jitterY
```

Slug-seeded hashing keeps positions stable across builds — adding a new card doesn't reshuffle existing ones.

Tunable constants: `verticalSpacing`, `maxSpread`, `topMargin`, `jitterRange`. Initial values picked during implementation; tuned editorially after first render.

### Override (curated)

Any MDX file can opt out of the formula via frontmatter:

```yaml
position:
  x: -340
  y: -1800
```

Coordinates are relative to the focal point. When `position` is set, the formula skips that card. Used sparingly — most cards take the default; hero pieces get hand-placed.

Not used in the initial implementation. Available for editorial tuning after seeing the first render.

## Identity card

A single composed unit centered on the focal point.

### Visual anchor (left)

Roughly square slot, ~160-200px, sitting left of the name text. Ships with a soft-bordered empty placeholder. Real content (image / 3d / ASCII / etc.) lands in a follow-up; the slot's geometry is the load-bearing decision today, not what's inside it.

### Name (right of anchor, top)

"david schultz" — lowercase, 64pt, display font (Whyte Inktrap). Unchanged from current.

### Tagline (below name)

"Building thinking models at studiozojer"

Replaces the current "designer, developer, claude code cli cave dweller, etc." Same font as current (Whyte, 18pt) — only the copy changes.

### Buttons (below tagline)

Four buttons, single row:

| Label | Destination |
|---|---|
| LinkedIn | https://linkedin.com/in/schultzdavidg |
| Resume | https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/files/davidschultz-resume.pdf |
| studiozojer.co | https://studiozojer.co |
| Bluesky | https://bsky.app/profile/pageofswrds.kairos.solar |

Note: the `studiozojer.co` button replaces the current `zojer.studio` button — both label and href change.

### Layout structure

Whole identity zone is one SVG `<g>` transform centered at focal point coordinates. Replaces the current `<g transform="translate(100, 160)">` block. No explicit card boundary; the identity reads as a *place* on the canvas rather than a literal card.

## What changes

- **`App.tsx`** — layout rewrite. Single mingled `[...projects, ...blogPosts].sort(byDate)` loop replaces the separate projects-column and writing-row blocks. Funnel placement function lives here, or extracted to `src/layout/funnel.ts`.
- **`src/content/index.ts`** and **`src/content/blog/index.ts`** — type definitions gain optional `position?: { x: number; y: number }` field.
- **Initial viewport** — opens centered on focal point coordinates instead of (0, 0).
- **Tagline copy** — updated in `App.tsx`.
- **Button trio → quartet** — adds Bluesky button; renames third button to `studiozojer.co`.
- **ASCII flow field** — removed from canvas. `AsciiFlowField` component file stays in the repo as compost (no current usage).

## What's preserved

- Infinite zoomable canvas (`Canvas` component)
- Theme toggle and zoom controls (corner positions)
- Custom cursors
- `ProjectCard`, `ProjectModal`, `BlogModal` components
- All existing MDX frontmatter fields (`order`, `visible`, etc.) — `order` becomes moot under chronological placement but stays as a field
- Fonts, color tokens, theme variables (`index.css` unchanged)

## Out of scope for this pass

- Full below-identity content area ("presently working / roadmap / research")
- Real content for identity-card visual anchor
- Manual `position:` overrides on cards (start with pure formula; tune editorially after seeing the result)
- Frontmatter cleanup on existing work files (the `order: 1` collisions stop mattering under chronological)
- `devlog01` subtitle typo ("Feb 23, 204")
- `thoughts-on-implementation` visibility decision (still `visible: false`)
- README expansion

## Success criteria

- The funnel is the first thing visitors see — viewport opens on focal point, not upper-left
- All 17 ancestry cards (7 projects + 10 visible essays) place automatically from chronological order without manual coordinates
- Cards near the focal point cluster narrower; cards far from the focal point spread wider
- Identity zone shows the new tagline, four buttons including Bluesky, and a placeholder visual anchor
- Kairos sits alone below the focal point
- Adding a new MDX file to `src/content/work/` or `src/content/blog/` auto-places without further configuration
- ASCII flow field no longer appears on the canvas; its component file remains in the repo
