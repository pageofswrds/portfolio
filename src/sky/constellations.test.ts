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
