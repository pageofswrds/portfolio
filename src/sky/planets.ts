import * as Astronomy from 'astronomy-engine'
import type { SkyCoord } from './projection'

export interface Planet extends SkyCoord {
  name: string
  color: string
  /** apparent visual radius hint (Sun/Moon read larger) */
  size: number
  retrograde: boolean
}

const BODIES: { body: Astronomy.Body; name: string; color: string; size: number }[] = [
  { body: Astronomy.Body.Sun, name: 'Sun', color: 'rgb(255, 210, 110)', size: 6 },
  { body: Astronomy.Body.Moon, name: 'Moon', color: 'rgb(228, 232, 240)', size: 5 },
  { body: Astronomy.Body.Mercury, name: 'Mercury', color: 'rgb(190, 188, 178)', size: 3 },
  { body: Astronomy.Body.Venus, name: 'Venus', color: 'rgb(247, 236, 200)', size: 4 },
  { body: Astronomy.Body.Mars, name: 'Mars', color: 'rgb(235, 122, 90)', size: 3.5 },
  { body: Astronomy.Body.Jupiter, name: 'Jupiter', color: 'rgb(228, 202, 158)', size: 4.5 },
  { body: Astronomy.Body.Saturn, name: 'Saturn', color: 'rgb(226, 206, 150)', size: 4 },
  { body: Astronomy.Body.Uranus, name: 'Uranus', color: 'rgb(168, 222, 226)', size: 3 },
  { body: Astronomy.Body.Neptune, name: 'Neptune', color: 'rgb(120, 150, 232)', size: 3 },
  { body: Astronomy.Body.Pluto, name: 'Pluto', color: 'rgb(190, 168, 158)', size: 2.5 },
]

const DAY_MS = 86_400_000

// Geocentric apparent equatorial coords in the J2000 frame (matches our star
// catalog), plus ecliptic longitude (used to detect retrograde motion).
function equatorial(body: Astronomy.Body, date: Date): { lon: number; lat: number; elon: number } {
  const vec = Astronomy.GeoVector(body, date, true)
  const eq = Astronomy.EquatorFromVector(vec)
  let lon = (eq.ra * 15) % 360
  if (lon < 0) lon += 360
  return { lon, lat: eq.dec, elon: Astronomy.Ecliptic(vec).elon }
}

/** Current geocentric positions of the Sun, Moon, and planets for a given moment. */
export function planetPositions(date: Date): Planet[] {
  const next = new Date(date.getTime() + DAY_MS)
  return BODIES.map(({ body, name, color, size }) => {
    const now = equatorial(body, date)
    const soon = equatorial(body, next)
    // ecliptic longitude moving backwards over a day = retrograde
    let dElon = soon.elon - now.elon
    if (dElon > 180) dElon -= 360
    if (dElon < -180) dElon += 360
    const retrograde = dElon < 0 && name !== 'Sun' && name !== 'Moon'
    return { name, lon: now.lon, lat: now.lat, color, size, retrograde }
  })
}
