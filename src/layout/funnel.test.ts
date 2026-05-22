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

describe('placeAncestry', () => {
  const config = {
    focalX: 0,
    focalY: 0,
    topMargin: 200,
    verticalSpacing: 100,
    maxSpread: 400,
    jitterRange: 0,
  }

  it('returns an entry per input card', () => {
    const cards: Placeable[] = [
      { slug: 'old', date: '2022-01-01' },
      { slug: 'newer', date: '2024-01-01' },
      { slug: 'newest', date: '2025-01-01' },
    ]
    const result = placeAncestry(cards, config)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.slug).sort()).toEqual(['newer', 'newest', 'old'])
  })

  it('places the newest card closest to the focal point (smallest |y|)', () => {
    const cards: Placeable[] = [
      { slug: 'old', date: '2022-01-01' },
      { slug: 'newer', date: '2024-01-01' },
      { slug: 'newest', date: '2025-01-01' },
    ]
    const result = placeAncestry(cards, config)
    const newest = result.find((r) => r.slug === 'newest')!
    const old = result.find((r) => r.slug === 'old')!
    expect(Math.abs(newest.y - config.focalY)).toBeLessThan(
      Math.abs(old.y - config.focalY),
    )
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
    const old = result.find((r) => r.slug === 'old')!
    const newest = result.find((r) => r.slug === 'newest')!
    expect(Math.abs(old.x - config.focalX)).toBeGreaterThanOrEqual(
      Math.abs(newest.x - config.focalX),
    )
  })

  it('honors explicit position override from frontmatter', () => {
    const cards: Placeable[] = [
      { slug: 'star', date: '2024-01-01', position: { x: 999, y: -1234 } },
      { slug: 'other', date: '2024-02-01' },
    ]
    const result = placeAncestry(cards, config)
    const star = result.find((r) => r.slug === 'star')!
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

  it('reordering input array does not change positions (date-based ranking)', () => {
    const baseConfig = { ...config }
    const a: Placeable = { slug: 'a', date: '2024-01-01' }
    const b: Placeable = { slug: 'b', date: '2024-02-01' }
    const before = placeAncestry([a, b], baseConfig)
    const reordered = placeAncestry([b, a], baseConfig)
    const beforeA = before.find((r) => r.slug === 'a')!
    const reorderedA = reordered.find((r) => r.slug === 'a')!
    expect(reorderedA).toEqual(beforeA)
  })

  it('places left or right of focal point deterministically by slug', () => {
    const a = placeAncestry([{ slug: 'a', date: '2024-01-01' }], config)
    const b = placeAncestry([{ slug: 'b', date: '2024-01-01' }], config)
    expect(typeof a[0].x).toBe('number')
    expect(typeof b[0].x).toBe('number')
  })

  it('extends downward when direction is "down"', () => {
    const downConfig = { ...config, direction: 'down' as const }
    const cards: Placeable[] = [
      { slug: 'a', date: '2024-01-01' },
      { slug: 'b', date: '2024-02-01' },
    ]
    const result = placeAncestry(cards, downConfig)
    for (const card of result) {
      expect(card.y).toBeGreaterThan(downConfig.focalY)
    }
  })

  it('still places newest closest to focal when direction is "down"', () => {
    const downConfig = { ...config, direction: 'down' as const }
    const cards: Placeable[] = [
      { slug: 'old', date: '2022-01-01' },
      { slug: 'newest', date: '2025-01-01' },
    ]
    const result = placeAncestry(cards, downConfig)
    const newest = result.find((r) => r.slug === 'newest')!
    const old = result.find((r) => r.slug === 'old')!
    expect(Math.abs(newest.y - downConfig.focalY)).toBeLessThan(
      Math.abs(old.y - downConfig.focalY),
    )
  })
})
