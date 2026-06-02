import { describe, it, expect } from 'vitest'
import { STARS, CONSTELLATIONS } from './constellations'

describe('sky data', () => {
  it('has a populated star catalog with valid coordinates and magnitudes', () => {
    expect(STARS.length).toBeGreaterThan(1000)
    for (const s of STARS) {
      expect(s.lon).toBeGreaterThanOrEqual(0)
      expect(s.lon).toBeLessThan(360)
      expect(s.lat).toBeGreaterThanOrEqual(-90)
      expect(s.lat).toBeLessThanOrEqual(90)
      // magnitudes can be negative — Sirius is -1.44. Bound it sanely.
      expect(s.mag).toBeGreaterThanOrEqual(-2)
      expect(s.mag).toBeLessThanOrEqual(6)
    }
  })

  it('has unique star ids', () => {
    const ids = new Set(STARS.map((s) => s.id))
    expect(ids.size).toBe(STARS.length)
  })

  it('labels a recognizable handful of stars', () => {
    const named = STARS.filter((s) => s.name)
    expect(named.length).toBeGreaterThan(20)
    expect(named.some((s) => s.name === 'Sirius')).toBe(true)
  })

  it('has the full constellation set, each with valid figure polylines', () => {
    expect(CONSTELLATIONS.length).toBeGreaterThanOrEqual(88)
    for (const c of CONSTELLATIONS) {
      expect(c.name.length, `${c.name} name`).toBeGreaterThan(0)
      expect(c.paths.length, `${c.name} paths`).toBeGreaterThan(0)
      for (const path of c.paths) {
        expect(path.length, `${c.name} polyline`).toBeGreaterThanOrEqual(2)
        for (const [lon, lat] of path) {
          expect(lon).toBeGreaterThanOrEqual(0)
          expect(lon).toBeLessThan(360)
          expect(lat).toBeGreaterThanOrEqual(-90)
          expect(lat).toBeLessThanOrEqual(90)
        }
      }
    }
  })

  it('gives every constellation a label centroid in range', () => {
    for (const c of CONSTELLATIONS) {
      expect(c.center.lon).toBeGreaterThanOrEqual(0)
      expect(c.center.lon).toBeLessThan(360)
      expect(c.center.lat).toBeGreaterThanOrEqual(-90)
      expect(c.center.lat).toBeLessThanOrEqual(90)
    }
  })
})
