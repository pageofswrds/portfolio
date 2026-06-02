import type { SkyCoord } from './projection'

export interface Star extends SkyCoord {
  id: string
  mag: number // 0 (bright) .. ~3.5 (faint)
}

export interface Constellation {
  name: string
  /** undirected segments between star ids */
  lines: [string, string][]
  /** star id the name label anchors to */
  labelStar: string
}

// Stylized, recognizable shapes in roughly-true relative positions on the
// sphere. Coordinates are hand-placed, not catalog-exact.
export const STARS: Star[] = [
  // Orion (centered ~lon 85, lat 0)
  { id: 'ori-betelgeuse', lon: 88, lat: 7, mag: 0.5 },
  { id: 'ori-bellatrix', lon: 81, lat: 6, mag: 1.6 },
  { id: 'ori-alnitak', lon: 85, lat: -1, mag: 1.8 },
  { id: 'ori-alnilam', lon: 84, lat: -1.2, mag: 1.7 },
  { id: 'ori-mintaka', lon: 83, lat: -0.3, mag: 2.2 },
  { id: 'ori-saiph', lon: 87, lat: -9, mag: 2.1 },
  { id: 'ori-rigel', lon: 81, lat: -8, mag: 0.1 },

  // Ursa Major — the Big Dipper (centered ~lon 185, lat 57)
  { id: 'uma-dubhe', lon: 165, lat: 62, mag: 1.8 },
  { id: 'uma-merak', lon: 165, lat: 56, mag: 2.3 },
  { id: 'uma-phecda', lon: 178, lat: 54, mag: 2.4 },
  { id: 'uma-megrez', lon: 183, lat: 57, mag: 3.3 },
  { id: 'uma-alioth', lon: 193, lat: 56, mag: 1.7 },
  { id: 'uma-mizar', lon: 201, lat: 55, mag: 2.2 },
  { id: 'uma-alkaid', lon: 207, lat: 49, mag: 1.8 },

  // Ursa Minor — the Little Dipper, Polaris near the pole (centered ~lon 40, lat 80)
  { id: 'umi-polaris', lon: 38, lat: 89, mag: 1.9 },
  { id: 'umi-yildun', lon: 70, lat: 86, mag: 3.0 },
  { id: 'umi-epsilon', lon: 110, lat: 82, mag: 3.2 },
  { id: 'umi-zeta', lon: 130, lat: 78, mag: 3.0 },
  { id: 'umi-kochab', lon: 110, lat: 74, mag: 2.0 },
  { id: 'umi-pherkad', lon: 95, lat: 72, mag: 3.0 },

  // Cassiopeia — the W (centered ~lon 14, lat 60)
  { id: 'cas-segin', lon: 28, lat: 63, mag: 3.3 },
  { id: 'cas-ruchbah', lon: 21, lat: 60, mag: 2.7 },
  { id: 'cas-gamma', lon: 14, lat: 60, mag: 2.2 },
  { id: 'cas-schedar', lon: 10, lat: 56, mag: 2.2 },
  { id: 'cas-caph', lon: 2, lat: 59, mag: 2.3 },

  // Scorpius — zodiac nod (centered ~lon 245, lat -28)
  { id: 'sco-antares', lon: 247, lat: -26, mag: 1.0 },
  { id: 'sco-graffias', lon: 241, lat: -20, mag: 2.6 },
  { id: 'sco-dschubba', lon: 240, lat: -22, mag: 2.3 },
  { id: 'sco-pi', lon: 239, lat: -26, mag: 2.9 },
  { id: 'sco-sigma', lon: 245, lat: -25, mag: 2.9 },
  { id: 'sco-tau', lon: 248, lat: -28, mag: 2.8 },
  { id: 'sco-shaula', lon: 263, lat: -37, mag: 1.6 },
  { id: 'sco-lesath', lon: 262, lat: -37, mag: 2.7 },

  // Leo — zodiac nod, the Sickle + triangle (centered ~lon 160, lat 16)
  { id: 'leo-regulus', lon: 152, lat: 12, mag: 1.4 },
  { id: 'leo-eta', lon: 152, lat: 17, mag: 3.5 },
  { id: 'leo-algieba', lon: 154, lat: 20, mag: 2.0 },
  { id: 'leo-zosma', lon: 168, lat: 20, mag: 2.6 },
  { id: 'leo-denebola', lon: 177, lat: 15, mag: 2.1 },
  { id: 'leo-chort', lon: 168, lat: 15, mag: 3.3 },
]

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Orion',
    labelStar: 'ori-betelgeuse',
    lines: [
      ['ori-betelgeuse', 'ori-alnitak'],
      ['ori-bellatrix', 'ori-mintaka'],
      ['ori-alnitak', 'ori-alnilam'],
      ['ori-alnilam', 'ori-mintaka'],
      ['ori-alnitak', 'ori-saiph'],
      ['ori-mintaka', 'ori-rigel'],
      ['ori-betelgeuse', 'ori-bellatrix'],
    ],
  },
  {
    name: 'Ursa Major',
    labelStar: 'uma-alioth',
    lines: [
      ['uma-dubhe', 'uma-merak'],
      ['uma-merak', 'uma-phecda'],
      ['uma-phecda', 'uma-megrez'],
      ['uma-megrez', 'uma-dubhe'],
      ['uma-megrez', 'uma-alioth'],
      ['uma-alioth', 'uma-mizar'],
      ['uma-mizar', 'uma-alkaid'],
    ],
  },
  {
    name: 'Ursa Minor',
    labelStar: 'umi-polaris',
    lines: [
      ['umi-polaris', 'umi-yildun'],
      ['umi-yildun', 'umi-epsilon'],
      ['umi-epsilon', 'umi-zeta'],
      ['umi-zeta', 'umi-kochab'],
      ['umi-kochab', 'umi-pherkad'],
      ['umi-pherkad', 'umi-epsilon'],
    ],
  },
  {
    name: 'Cassiopeia',
    labelStar: 'cas-gamma',
    lines: [
      ['cas-segin', 'cas-ruchbah'],
      ['cas-ruchbah', 'cas-gamma'],
      ['cas-gamma', 'cas-schedar'],
      ['cas-schedar', 'cas-caph'],
    ],
  },
  {
    name: 'Scorpius',
    labelStar: 'sco-antares',
    lines: [
      ['sco-graffias', 'sco-dschubba'],
      ['sco-dschubba', 'sco-pi'],
      ['sco-pi', 'sco-antares'],
      ['sco-antares', 'sco-sigma'],
      ['sco-sigma', 'sco-tau'],
      ['sco-tau', 'sco-shaula'],
      ['sco-shaula', 'sco-lesath'],
    ],
  },
  {
    name: 'Leo',
    labelStar: 'leo-regulus',
    lines: [
      ['leo-regulus', 'leo-eta'],
      ['leo-eta', 'leo-algieba'],
      ['leo-regulus', 'leo-chort'],
      ['leo-chort', 'leo-zosma'],
      ['leo-zosma', 'leo-denebola'],
      ['leo-denebola', 'leo-chort'],
    ],
  },
]

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
