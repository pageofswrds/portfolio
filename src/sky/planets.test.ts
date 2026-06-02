import { describe, it, expect } from 'vitest'
import { planetPositions } from './planets'

describe('planetPositions', () => {
  const planets = planetPositions(new Date('2000-01-01T12:00:00Z'))

  it('returns the Sun, Moon, and the planets', () => {
    expect(planets.length).toBe(10)
    expect(planets.map((p) => p.name)).toContain('Sun')
    expect(planets.map((p) => p.name)).toContain('Pluto')
  })

  it('places the Sun at its known J2000-epoch position', () => {
    const sun = planets.find((p) => p.name === 'Sun')!
    expect(sun.lon).toBeGreaterThan(278) // ~281.3 deg RA
    expect(sun.lon).toBeLessThan(284)
    expect(sun.lat).toBeLessThan(-22) // ~ -23 deg dec (near winter solstice)
    expect(sun.lat).toBeGreaterThan(-24)
  })

  it('gives every body valid coordinates and a color', () => {
    for (const p of planets) {
      expect(p.lon).toBeGreaterThanOrEqual(0)
      expect(p.lon).toBeLessThan(360)
      expect(p.lat).toBeGreaterThanOrEqual(-90)
      expect(p.lat).toBeLessThanOrEqual(90)
      expect(p.color).toMatch(/^rgb\(/)
    }
  })

  it('never marks the Sun or Moon retrograde', () => {
    expect(planets.find((p) => p.name === 'Sun')!.retrograde).toBe(false)
    expect(planets.find((p) => p.name === 'Moon')!.retrograde).toBe(false)
  })
})
