import { describe, it, expect } from 'vitest'
import { projectOrthographic, type ViewRotation } from './projection'

const center: ViewRotation = { lon: 0, lat: 0 }

describe('projectOrthographic', () => {
  it('projects the view-center to the origin, front-facing', () => {
    const p = projectOrthographic({ lon: 0, lat: 0 }, center)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(0, 6)
    expect(p.front).toBe(true)
  })

  it('projects +90deg longitude on the equator to the right limb', () => {
    const p = projectOrthographic({ lon: 90, lat: 0 }, center)
    expect(p.x).toBeCloseTo(1, 6)
    expect(p.y).toBeCloseTo(0, 6)
    expect(p.front).toBe(true) // on the limb (cosc == 0) counts as front
  })

  it('culls the antipode as back-facing', () => {
    const p = projectOrthographic({ lon: 180, lat: 0 }, center)
    expect(p.front).toBe(false)
  })

  it('projects +90deg latitude to the top, regardless of longitude', () => {
    const p = projectOrthographic({ lon: 137, lat: 90 }, center)
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(1, 6)
    expect(p.front).toBe(true)
  })

  it('rotating the view re-centers that coordinate to the origin', () => {
    const p = projectOrthographic({ lon: 40, lat: 20 }, { lon: 40, lat: 20 })
    expect(p.x).toBeCloseTo(0, 6)
    expect(p.y).toBeCloseTo(0, 6)
    expect(p.front).toBe(true)
  })
})
