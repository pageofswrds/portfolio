import { describe, it, expect } from 'vitest'
import { eclipticPoint, sphericalCentroid, OBLIQUITY } from './lines'

describe('eclipticPoint', () => {
  it('crosses the equator at the equinoxes (lon 0 and 180)', () => {
    const spring = eclipticPoint(0)
    expect(spring.lon).toBeCloseTo(0, 4)
    expect(spring.lat).toBeCloseTo(0, 4)

    const autumn = eclipticPoint(180)
    expect(autumn.lon).toBeCloseTo(180, 4)
    expect(autumn.lat).toBeCloseTo(0, 4)
  })

  it('reaches max/min declination = obliquity at the solstices', () => {
    const summer = eclipticPoint(90)
    expect(summer.lat).toBeCloseTo(OBLIQUITY, 4)
    expect(summer.lon).toBeCloseTo(90, 4)

    const winter = eclipticPoint(270)
    expect(winter.lat).toBeCloseTo(-OBLIQUITY, 4)
    expect(winter.lon).toBeCloseTo(270, 4)
  })
})

describe('sphericalCentroid', () => {
  it('averages two equatorial points to the midpoint longitude', () => {
    const c = sphericalCentroid([
      { lon: 0, lat: 0 },
      { lon: 90, lat: 0 },
    ])
    expect(c.lon).toBeCloseTo(45, 4)
    expect(c.lat).toBeCloseTo(0, 4)
  })

  it('averages symmetric latitudes back to the equator', () => {
    const c = sphericalCentroid([
      { lon: 10, lat: 70 },
      { lon: 10, lat: -70 },
    ])
    expect(c.lon).toBeCloseTo(10, 4)
    expect(c.lat).toBeCloseTo(0, 4)
  })
})
