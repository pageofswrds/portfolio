/** A fixed point on the celestial sphere. Degrees. */
export interface SkyCoord {
  lon: number // 0..360
  lat: number // -90..90
}

/** The current gaze direction = the sphere coord at screen-center. Degrees. */
export interface ViewRotation {
  lon: number
  lat: number
}

/** Result of projecting a SkyCoord. x,y are unit-screen coords in [-1,1]. */
export interface Projected {
  x: number
  y: number
  /** true when on the near hemisphere (cos of angular distance >= 0). */
  front: boolean
}

const DEG = Math.PI / 180
// Limb-inclusive tolerance: at the exact limb/pole cosc is mathematically 0 but
// floating-point can land a hair negative. Treat near-zero as front-facing.
const FRONT_EPS = 1e-9

/**
 * Orthographic projection of a point on the unit sphere, viewed with the sphere
 * rotated so `view` sits at screen-center. y is screen-up positive.
 *
 * INSIDE-THE-DOME convention: we are inside the celestial sphere looking out (the
 * naked-eye view), NOT looking at a globe from outside. That means east-west is
 * mirrored vs. the textbook orthographic — longitude/RA increases to the LEFT
 * (hence the `-` on x). Without this flip every constellation renders as its
 * mirror image (Orion's belt and the Dipper's handle reversed).
 *
 * This single projection serves the hover sphere, the full-page explorer, and
 * the expand transition — at different pixel radii. Because all three read the
 * same coordinates, the ASCII chars register exactly across the reveal.
 */
export function projectOrthographic(coord: SkyCoord, view: ViewRotation): Projected {
  const lat = coord.lat * DEG
  const lat0 = view.lat * DEG
  const dLon = (coord.lon - view.lon) * DEG

  const cosLat = Math.cos(lat)
  const x = -cosLat * Math.sin(dLon) // inside-the-dome: RA increases to the left
  const y = Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * cosLat * Math.cos(dLon)
  const cosc = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * cosLat * Math.cos(dLon)

  return { x, y, front: cosc >= -FRONT_EPS }
}
