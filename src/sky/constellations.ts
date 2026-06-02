import type { SkyCoord } from './projection'

export interface Star extends SkyCoord {
  id: string
  mag: number // brightest near -1.5 (Sirius) .. ~3.5 (faint)
  /** proper name, shown as a hover label (only set for notable stars) */
  name?: string
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
  { id: 'ori-betelgeuse', lon: 88, lat: 7, mag: 0.5, name: 'Betelgeuse' },
  { id: 'ori-bellatrix', lon: 81, lat: 6, mag: 1.6, name: 'Bellatrix' },
  { id: 'ori-alnitak', lon: 85, lat: -1, mag: 1.8 },
  { id: 'ori-alnilam', lon: 84, lat: -1.2, mag: 1.7, name: 'Alnilam' },
  { id: 'ori-mintaka', lon: 83, lat: -0.3, mag: 2.2 },
  { id: 'ori-saiph', lon: 87, lat: -9, mag: 2.1 },
  { id: 'ori-rigel', lon: 81, lat: -8, mag: 0.1, name: 'Rigel' },

  // Ursa Major — the Big Dipper (centered ~lon 185, lat 57)
  { id: 'uma-dubhe', lon: 165, lat: 62, mag: 1.8, name: 'Dubhe' },
  { id: 'uma-merak', lon: 165, lat: 56, mag: 2.3 },
  { id: 'uma-phecda', lon: 178, lat: 54, mag: 2.4 },
  { id: 'uma-megrez', lon: 183, lat: 57, mag: 3.3 },
  { id: 'uma-alioth', lon: 193, lat: 56, mag: 1.7 },
  { id: 'uma-mizar', lon: 201, lat: 55, mag: 2.2, name: 'Mizar' },
  { id: 'uma-alkaid', lon: 207, lat: 49, mag: 1.8, name: 'Alkaid' },

  // Ursa Minor — the Little Dipper, Polaris near the pole (centered ~lon 40, lat 80)
  { id: 'umi-polaris', lon: 38, lat: 89, mag: 1.9, name: 'Polaris' },
  { id: 'umi-yildun', lon: 70, lat: 86, mag: 3.0 },
  { id: 'umi-epsilon', lon: 110, lat: 82, mag: 3.2 },
  { id: 'umi-zeta', lon: 130, lat: 78, mag: 3.0 },
  { id: 'umi-kochab', lon: 110, lat: 74, mag: 2.0, name: 'Kochab' },
  { id: 'umi-pherkad', lon: 95, lat: 72, mag: 3.0 },

  // Cassiopeia — the W (centered ~lon 14, lat 60)
  { id: 'cas-segin', lon: 28, lat: 63, mag: 3.3 },
  { id: 'cas-ruchbah', lon: 21, lat: 60, mag: 2.7 },
  { id: 'cas-gamma', lon: 14, lat: 60, mag: 2.2 },
  { id: 'cas-schedar', lon: 10, lat: 56, mag: 2.2, name: 'Schedar' },
  { id: 'cas-caph', lon: 2, lat: 59, mag: 2.3, name: 'Caph' },

  // Scorpius — zodiac (centered ~lon 245, lat -28)
  { id: 'sco-antares', lon: 247, lat: -26, mag: 1.0, name: 'Antares' },
  { id: 'sco-graffias', lon: 241, lat: -20, mag: 2.6 },
  { id: 'sco-dschubba', lon: 240, lat: -22, mag: 2.3 },
  { id: 'sco-pi', lon: 239, lat: -26, mag: 2.9 },
  { id: 'sco-sigma', lon: 245, lat: -25, mag: 2.9 },
  { id: 'sco-tau', lon: 248, lat: -28, mag: 2.8 },
  { id: 'sco-shaula', lon: 263, lat: -37, mag: 1.6, name: 'Shaula' },
  { id: 'sco-lesath', lon: 262, lat: -37, mag: 2.7 },

  // Leo — zodiac, the Sickle + triangle (centered ~lon 160, lat 16)
  { id: 'leo-regulus', lon: 152, lat: 12, mag: 1.4, name: 'Regulus' },
  { id: 'leo-eta', lon: 152, lat: 17, mag: 3.5 },
  { id: 'leo-algieba', lon: 154, lat: 20, mag: 2.0, name: 'Algieba' },
  { id: 'leo-zosma', lon: 168, lat: 20, mag: 2.6 },
  { id: 'leo-denebola', lon: 177, lat: 15, mag: 2.1, name: 'Denebola' },
  { id: 'leo-chort', lon: 168, lat: 15, mag: 3.3 },

  // Cygnus — the Northern Cross (centered ~lon 305, lat 40)
  { id: 'cyg-deneb', lon: 310, lat: 45, mag: 1.25, name: 'Deneb' },
  { id: 'cyg-sadr', lon: 306, lat: 40, mag: 2.2, name: 'Sadr' },
  { id: 'cyg-gienah', lon: 312, lat: 34, mag: 2.5 },
  { id: 'cyg-delta', lon: 296, lat: 45, mag: 2.9 },
  { id: 'cyg-albireo', lon: 293, lat: 28, mag: 3.1, name: 'Albireo' },

  // Lyra — Vega + the parallelogram (centered ~lon 282, lat 36)
  { id: 'lyr-vega', lon: 279, lat: 39, mag: 0.03, name: 'Vega' },
  { id: 'lyr-sheliak', lon: 282, lat: 33, mag: 3.4 },
  { id: 'lyr-sulafat', lon: 285, lat: 33, mag: 3.3 },
  { id: 'lyr-delta', lon: 284, lat: 37, mag: 3.5 },
  { id: 'lyr-zeta', lon: 281, lat: 38, mag: 3.5 },

  // Gemini — the twins (centered ~lon 108, lat 24)
  { id: 'gem-castor', lon: 114, lat: 32, mag: 1.6, name: 'Castor' },
  { id: 'gem-pollux', lon: 116, lat: 28, mag: 1.15, name: 'Pollux' },
  { id: 'gem-alhena', lon: 99, lat: 16, mag: 1.9, name: 'Alhena' },
  { id: 'gem-mebsuta', lon: 101, lat: 25, mag: 3.0 },
  { id: 'gem-wasat', lon: 110, lat: 22, mag: 3.5 },
  { id: 'gem-tejat', lon: 96, lat: 22, mag: 2.9 },

  // Taurus — zodiac, the Hyades V + horns + Pleiades (centered ~lon 70, lat 18)
  { id: 'tau-aldebaran', lon: 69, lat: 16.5, mag: 0.85, name: 'Aldebaran' },
  { id: 'tau-elnath', lon: 82, lat: 28.6, mag: 1.65, name: 'Elnath' },
  { id: 'tau-zeta', lon: 84, lat: 21, mag: 3.0 },
  { id: 'tau-gamma', lon: 65, lat: 15.6, mag: 3.4 },
  { id: 'tau-pleiades', lon: 57, lat: 24, mag: 1.6, name: 'Pleiades' },

  // Sagittarius — zodiac, the Teapot (centered ~lon 281, lat -29)
  { id: 'sgr-kaus-australis', lon: 276, lat: -34, mag: 1.85, name: 'Kaus Australis' },
  { id: 'sgr-nunki', lon: 284, lat: -26, mag: 2.05, name: 'Nunki' },
  { id: 'sgr-kaus-media', lon: 275, lat: -30, mag: 2.7 },
  { id: 'sgr-kaus-borealis', lon: 276, lat: -25, mag: 2.8 },
  { id: 'sgr-ascella', lon: 286, lat: -30, mag: 2.6 },
  { id: 'sgr-phi', lon: 281, lat: -27, mag: 3.2 },

  // Canis Major — Sirius, the brightest star (centered ~lon 104, lat -22)
  { id: 'cma-sirius', lon: 101, lat: -16.7, mag: -1.46, name: 'Sirius' },
  { id: 'cma-mirzam', lon: 96, lat: -18, mag: 2.0, name: 'Mirzam' },
  { id: 'cma-wezen', lon: 107, lat: -26, mag: 1.83, name: 'Wezen' },
  { id: 'cma-adhara', lon: 105, lat: -29, mag: 1.5, name: 'Adhara' },
  { id: 'cma-aludra', lon: 111, lat: -29, mag: 2.4 },

  // Crux — the Southern Cross (centered ~lon 187, lat -60)
  { id: 'cru-acrux', lon: 187, lat: -63, mag: 0.77, name: 'Acrux' },
  { id: 'cru-mimosa', lon: 192, lat: -60, mag: 1.25, name: 'Mimosa' },
  { id: 'cru-gacrux', lon: 188, lat: -57, mag: 1.6, name: 'Gacrux' },
  { id: 'cru-delta', lon: 184, lat: -59, mag: 2.8 },
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
  {
    name: 'Cygnus',
    labelStar: 'cyg-sadr',
    lines: [
      ['cyg-deneb', 'cyg-sadr'],
      ['cyg-sadr', 'cyg-albireo'],
      ['cyg-delta', 'cyg-sadr'],
      ['cyg-sadr', 'cyg-gienah'],
    ],
  },
  {
    name: 'Lyra',
    labelStar: 'lyr-vega',
    lines: [
      ['lyr-vega', 'lyr-zeta'],
      ['lyr-zeta', 'lyr-delta'],
      ['lyr-delta', 'lyr-sulafat'],
      ['lyr-sulafat', 'lyr-sheliak'],
      ['lyr-sheliak', 'lyr-zeta'],
    ],
  },
  {
    name: 'Gemini',
    labelStar: 'gem-pollux',
    lines: [
      ['gem-castor', 'gem-pollux'],
      ['gem-castor', 'gem-mebsuta'],
      ['gem-mebsuta', 'gem-tejat'],
      ['gem-pollux', 'gem-wasat'],
      ['gem-wasat', 'gem-alhena'],
    ],
  },
  {
    name: 'Taurus',
    labelStar: 'tau-aldebaran',
    lines: [
      ['tau-gamma', 'tau-aldebaran'],
      ['tau-aldebaran', 'tau-elnath'],
      ['tau-aldebaran', 'tau-zeta'],
    ],
  },
  {
    name: 'Sagittarius',
    labelStar: 'sgr-nunki',
    lines: [
      ['sgr-kaus-borealis', 'sgr-kaus-media'],
      ['sgr-kaus-media', 'sgr-kaus-australis'],
      ['sgr-kaus-borealis', 'sgr-phi'],
      ['sgr-phi', 'sgr-nunki'],
      ['sgr-nunki', 'sgr-ascella'],
      ['sgr-ascella', 'sgr-kaus-media'],
    ],
  },
  {
    name: 'Canis Major',
    labelStar: 'cma-sirius',
    lines: [
      ['cma-sirius', 'cma-mirzam'],
      ['cma-sirius', 'cma-wezen'],
      ['cma-wezen', 'cma-adhara'],
      ['cma-wezen', 'cma-aludra'],
    ],
  },
  {
    name: 'Crux',
    labelStar: 'cru-acrux',
    lines: [
      ['cru-acrux', 'cru-gacrux'],
      ['cru-mimosa', 'cru-delta'],
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
