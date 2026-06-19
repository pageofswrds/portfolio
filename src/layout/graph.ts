// Per-subgraph layout for the Research section.
//
// Each subgraph is an independent constellation: its posts are laid along a
// gentle vertical serpentine in publish-date order (one node per row, so the
// variable-width pills never collide), and edges connect consecutive posts —
// a date-threaded path through that body of work. Subgraphs do not link to
// each other.
//
// Deterministic: positions are a pure function of (node order, layout), so the
// graph renders identically every load — no force sim.

export interface GraphNode {
  slug: string
  date: string
}

export interface SubgraphLayout {
  /** Horizontal center the serpentine waves around. */
  centerX: number
  /** Canvas-y of the first (oldest) node. */
  top: number
  /** Vertical gap between consecutive nodes. */
  rowStep: number
  /** Horizontal swing of the wave. */
  amplitude: number
  /** Radians of phase advance per row (wave frequency). */
  phase: number
  /** Phase at the first node. */
  phase0?: number
}

export interface PlacedNode {
  slug: string
  x: number
  y: number
}

export interface GraphEdge {
  from: string
  to: string
}

/**
 * Place one subgraph's nodes along a date-ordered serpentine and chain them.
 * Returns node placements (centers) and the consecutive-date edges.
 */
export function placeSubgraph(
  nodes: GraphNode[],
  layout: SubgraphLayout,
): { placements: PlacedNode[]; edges: GraphEdge[] } {
  const { centerX, top, rowStep, amplitude, phase, phase0 = 0 } = layout

  // Newest first: the top (first) node is the most recent post, reading down
  // toward the oldest.
  const sorted = [...nodes].sort((a, b) => b.date.localeCompare(a.date))

  const placements: PlacedNode[] = sorted.map((node, i) => ({
    slug: node.slug,
    x: centerX + amplitude * Math.sin(phase0 + i * phase),
    y: top + i * rowStep,
  }))

  const edges: GraphEdge[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    edges.push({ from: sorted[i].slug, to: sorted[i + 1].slug })
  }

  return { placements, edges }
}
