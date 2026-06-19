import { describe, it, expect } from 'vitest'
import { placeSubgraph, type GraphNode, type SubgraphLayout } from './graph'

const LAYOUT: SubgraphLayout = {
  centerX: 100,
  top: 500,
  rowStep: 100,
  amplitude: 50,
  phase: 1,
  phase0: 0,
}

const NODES: GraphNode[] = [
  { slug: 'c', date: '2024-03-01' },
  { slug: 'a', date: '2024-01-01' },
  { slug: 'b', date: '2024-02-01' },
]

describe('placeSubgraph', () => {
  it('orders nodes newest-first and steps down one row each', () => {
    const { placements } = placeSubgraph(NODES, LAYOUT)
    expect(placements.map((p) => p.slug)).toEqual(['c', 'b', 'a'])
    expect(placements.map((p) => p.y)).toEqual([500, 600, 700])
  })

  it('waves x around centerX by the amplitude', () => {
    const { placements } = placeSubgraph(NODES, LAYOUT)
    // first node sits at phase0 = 0 → sin(0) = 0 → exactly centerX
    expect(placements[0].x).toBeCloseTo(100, 6)
    for (const p of placements) {
      expect(Math.abs(p.x - 100)).toBeLessThanOrEqual(50 + 1e-9)
    }
  })

  it('chains consecutive nodes in date order (newest to oldest)', () => {
    const { edges } = placeSubgraph(NODES, LAYOUT)
    expect(edges).toEqual([
      { from: 'c', to: 'b' },
      { from: 'b', to: 'a' },
    ])
  })

  it('is deterministic across runs', () => {
    expect(placeSubgraph(NODES, LAYOUT)).toEqual(placeSubgraph(NODES, LAYOUT))
  })
})
