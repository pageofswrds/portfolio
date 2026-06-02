---
title: Celestial-sphere identity box — interactive ASCII star explorer
status: approved (design)
created: 2026-06-01
updated: 2026-06-01
author: tycho (with david)
---

# Celestial-sphere identity box

## Summary

Replace the empty dashed placeholder rect to the left of the name/tagline header
(`src/App.tsx:197–207`, the `IDENTITY_ANCHOR`) with an interactive ASCII
celestial sphere that expands into a full-page, pannable star explorer.

The portfolio's thesis — *"Building thinking models at studiozojer,"* a tool *"for
studying the stars"* — is currently **stated** on the page. This feature makes the
page **perform** it: the hero element becomes a literal window onto the sky you
bring into focus and study.

## States

The element has three states, driven by one source of star data:

1. **Rest** — a quiet ASCII box in the identity slot. A faint sphere outline,
   slowly drifting, so it reads as alive rather than broken.
2. **Hover** — the ASCII celestial sphere resolves and slowly rotates. The dots on
   the sphere are **not random twinkle** — they are the actual constellations,
   projected onto a small rotating globe. The hover is a thumbnail of the sky
   behind the door.
3. **Expanded (click)** — the box FLIP-expands to a full-page overlay and the ASCII
   *resolves into rendered stars*. You are now inside the sphere, looking out, and
   can pan the sky. Esc or click collapses it back to the box (reverse transition).

## Design decisions

### No parallax — stars at infinity

A real sky has **no parallax**: the stars are effectively at infinity, which is
*why* the sky reads as a dome over the observer rather than a space flown through.
Parallax would make it feel like a sci-fi starfield, not the sky one studies.
Depth is conveyed by **magnitude** instead: brighter stars are larger and warmer,
fainter stars smaller and cooler.

### Pan model — inside the dome, looking out

The viewpoint sits at the **center** of the celestial sphere; stars are fixed on
its inner surface. Dragging rotates the gaze (azimuth / altitude), the way tipping
the head back and turning does — the planetarium / Stellarium model. This is the
honest payoff of "falling into the sphere": you entered a sphere, so you should be
*inside* one, not panning a flat star-poster.

- Drag-to-look rotates the view direction.
- Momentum reuses the existing `useMomentum` feel (`src/hooks/useMomentum.ts`).
- **Fixed, comfortable field-of-view for v1** — no zoom.
- Projection: gnomonic/stereographic from the current view direction (visible
  hemisphere projected to screen).

### Medium — fully ASCII (decided 2026-06-01, post-v1)

After seeing the v1, the medium decision is **fully ASCII throughout** (the "one
unbroken voice" option), *not* the ASCII→rendered-stars "telescope focus" reveal.
Rationale (David's call): the rendered-sky path has "the shape of a whole product"
— real depth, data, navigation — and that complexity is out of scope for a
portfolio hero. Fully-ASCII keeps it a *gesture*: coherent, one voice, finishable.
It also *removes* complexity — no dual renderer, no media crossfade. The
rendered-star path is parked as a possible future direction.

### The reveal (≈600ms)

1. Capture the box's screen rect on click (FLIP origin).
2. The overlay sphere appears matching the hover-sphere (same projection, size,
   position — seamless handoff).
3. Animate:
   - sphere scales up (growing projected radius) to fill the viewport;
   - the background darkens from transparent → deep blue-black (night falling
     over the live page);
   - chars stay ASCII the whole way; their color lerps from page-ink to starlight
     as the background darkens;
   - constellation `·` trails and names fade in once the sphere has grown.
4. Settle into the interactive explorer (ASCII starfield, drag to rotate).
5. Reverse on close: sphere shrinks back to the box rect, night lifts.

**The discipline (still load-bearing):** every char is placed by the **same
`projectOrthographic`** call against the shared data module. The box, the explorer,
and every frame of the reveal read identical coordinates — so growth reads as one
continuous sphere, never a swap.

### Sky content

A curated, hand-placed set of ~6 recognizable constellations in roughly true
relative positions on the dome:

- Orion
- Ursa Major (Big Dipper)
- Ursa Minor (Polaris)
- Cassiopeia
- A zodiac nod or two (e.g. Scorpius / Leo) — resonant with Kairōs

Constellation lines are drawn between member stars. Names fade in when the gaze
nears a cluster. Contemplative: stars are **not** clickable.

## Architecture

Follows patterns already in the repo.

| Unit | Responsibility | Mirrors |
|------|----------------|---------|
| `src/sky/constellations.ts` | Single source of truth: star spherical-coords + magnitude, constellation line pairs, names. Consumed by **both** the hover sphere and the explorer. | (new) |
| `CelestialBox` | Replaces the dashed `<rect>` at `src/App.tsx:197`. Lives in the SVG `foreignObject` like `AsciiFlowField`; carries `data-block-pan`; owns hover + click; renders the ASCII box & rotating sphere. | `AsciiFlowField.tsx` |
| `StarExplorer` | Full-page overlay, mounted outside the canvas SVG. Receives the box rect as FLIP origin. **Fully-ASCII** sky drawn on a `<canvas>` via `fillText` (only the ~40 stars + line samples are drawn, so the giant empty grid costs nothing); drag-to-rotate; night-darkening background. | `ProjectModal.tsx`, `BlogModal.tsx` |

**Shared projection math** (project a star's spherical coord to screen given a view
direction) lives in a small pure module so the sphere, the explorer, and the
transition all use one implementation — the registration guarantee above depends
on this.

### Why these boundaries

- The data module is pure data + the projection helper — testable in isolation,
  no React. The funnel layout already has a `*.test.ts` precedent
  (`src/layout/funnel.test.ts`), so the projection math gets unit tests the same way.
- `CelestialBox` owns only the in-canvas states (rest/hover) and the click that
  launches the explorer. It knows nothing about the explorer's internals.
- `StarExplorer` owns only the full-page experience. It receives a box rect and
  star data; it does not reach back into the canvas.

## Out of scope for v1 (YAGNI)

These are clean later hooks, not first-cut work:

- Real star catalog (HYG/Yale BSC) — v1 is a stylized hand-placed set.
- Time/location sky simulation.
- Zoom / field-of-view changes inside the explorer.
- Clickable stars or deep-links into Kairōs.
- Constellation search.

## Testing

- **Projection math** — unit tests (Vitest, like `funnel.test.ts`): a star at a
  known spherical coord projects to the expected screen position for a given view
  direction; round-trips and edge cases (behind-viewer culling, poles).
- **Data integrity** — every constellation line references stars that exist in the
  data module; no orphan line endpoints.
- **Behavior** — hand-verified on the real Vite dev server (`npm install` then
  `npm run dev`), David as the eyes on render. The 600ms reveal and the pan feel
  cannot be judged from tests; they get judged live.
- Touch parity: explorer pan works on touch like `AsciiFlowField` already does.

## Open implementation notes (not blockers)

- The hover-sphere and the explorer's initial frame should share the same view
  direction so the handoff is seamless.
- Reduced-motion preference (`prefers-reduced-motion`) should soften/skip the
  rotation drift and shorten the reveal.
