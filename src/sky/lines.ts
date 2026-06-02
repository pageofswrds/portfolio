import type { SkyCoord } from './projection'

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

/** Obliquity of the ecliptic (tilt of the zodiac path to the celestial equator). */
export const OBLIQUITY = 23.44

/**
 * A point on the ecliptic (the Sun's apparent path / the zodiac band) at the
 * given ecliptic longitude, converted to our equatorial-like (lon, lat) frame.
 */
export function eclipticPoint(lambdaDeg: number): SkyCoord {
  const e = OBLIQUITY * DEG
  const lam = lambdaDeg * DEG
  const dec = Math.asin(Math.sin(e) * Math.sin(lam))
  let ra = Math.atan2(Math.cos(e) * Math.sin(lam), Math.cos(lam)) * RAD
  if (ra < 0) ra += 360
  return { lon: ra, lat: dec * RAD }
}

/** The unit-vector mean direction of a set of sphere coords, back as (lon, lat). */
export function sphericalCentroid(coords: SkyCoord[]): SkyCoord {
  let x = 0
  let y = 0
  let z = 0
  for (const c of coords) {
    const lat = c.lat * DEG
    const lon = c.lon * DEG
    x += Math.cos(lat) * Math.cos(lon)
    y += Math.cos(lat) * Math.sin(lon)
    z += Math.sin(lat)
  }
  const lat = Math.atan2(z, Math.hypot(x, y)) * RAD
  let lon = Math.atan2(y, x) * RAD
  if (lon < 0) lon += 360
  return { lon, lat }
}
