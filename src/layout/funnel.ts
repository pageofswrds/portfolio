export interface Placeable {
  slug: string
  date: string
  position?: { x: number; y: number }
}

export interface FunnelConfig {
  focalX: number
  focalY: number
  topMargin: number
  verticalSpacing: number
  maxSpread: number
  jitterRange: number
}

export const DEFAULT_FUNNEL_CONFIG: FunnelConfig = {
  focalX: 0,
  focalY: 0,
  topMargin: 280,
  verticalSpacing: 280,
  maxSpread: 480,
  jitterRange: 60,
}

export function slugHash(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

export function placeAncestry(
  cards: Placeable[],
  config: FunnelConfig = DEFAULT_FUNNEL_CONFIG,
): Array<{ slug: string; x: number; y: number }> {
  const sorted = [...cards].sort((a, b) => a.date.localeCompare(b.date))
  const N = sorted.length

  return sorted.map((card, i) => {
    if (card.position) {
      return {
        slug: card.slug,
        x: config.focalX + card.position.x,
        y: config.focalY + card.position.y,
      }
    }

    const distance = N - 1 - i

    const baseY = config.focalY - config.topMargin - distance * config.verticalSpacing

    const spreadRatio = N <= 1 ? 0 : distance / (N - 1)
    const spreadAmount = config.maxSpread * easeOutQuad(spreadRatio)

    const hash = slugHash(card.slug)
    const side = hash % 2 === 0 ? 1 : -1
    const baseX = config.focalX + side * spreadAmount

    const jitterX =
      config.jitterRange === 0
        ? 0
        : ((hash >> 8) % config.jitterRange) - config.jitterRange / 2
    const jitterY =
      config.jitterRange === 0
        ? 0
        : ((hash >> 16) % config.jitterRange) - config.jitterRange / 2

    return {
      slug: card.slug,
      x: baseX + jitterX,
      y: baseY + jitterY,
    }
  })
}
