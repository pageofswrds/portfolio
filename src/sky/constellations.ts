import type { SkyCoord } from './projection'
import { STARS as GEN_STARS, CONSTELLATIONS as GEN_CONSTELLATIONS } from './sky.generated'

export interface Star extends SkyCoord {
  id: string
  mag: number // brightest near -1.5 (Sirius) .. catalog cutoff
  /** spectral color from B-V index (precomputed), e.g. "rgb(202, 216, 255)" */
  color: string
  /** proper name, shown as a hover label (only set for notable stars) */
  name?: string
}

/** A constellation figure: named coordinate polylines + a label centroid. */
export interface Constellation {
  name: string
  /** one or more polylines; each is a list of [lon, lat] vertices in degrees */
  paths: [number, number][][]
  /** mean direction of all vertices — anchors the label / edge indicator */
  center: SkyCoord
}

// Data is generated from d3-celestial (BSD) by scripts/build-sky.mjs.
export const STARS: Star[] = GEN_STARS
export const CONSTELLATIONS: Constellation[] = GEN_CONSTELLATIONS

const STAR_INDEX = new Map(STARS.map((s) => [s.id, s]))

export function starById(id: string): Star | undefined {
  return STAR_INDEX.get(id)
}

export const MIN_MAG = Math.min(...STARS.map((s) => s.mag))
export const MAX_MAG = Math.max(...STARS.map((s) => s.mag))

/** 1 for the brightest star, ~0 for the faintest. Drives size/alpha (depth-by-magnitude). */
export function brightness(mag: number): number {
  if (MAX_MAG === MIN_MAG) return 1
  return (MAX_MAG - mag) / (MAX_MAG - MIN_MAG)
}
