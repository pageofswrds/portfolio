export const ROOT_IDS = ['about', 'product', 'research'] as const

export type RootId = (typeof ROOT_IDS)[number]

export interface RootDefinition {
  id: RootId
  label: string
  members: string[]
}

export const ROOTS: Record<RootId, RootDefinition> = {
  about: {
    id: 'about',
    label: 'About',
    members: [],
  },
  product: {
    id: 'product',
    label: 'Product',
    // Rendered as a 2-column grid in this exact order (left→right, top→down).
    members: [
      'kairos',
      'terrariumxr',
      'layer',
      'layerpitch',
      'acquire',
      'sureui',
      'arboretum',
      'cycles',
    ],
  },
  research: {
    id: 'research',
    label: 'Research',
    members: [
      'position-in-time',
      'constraints-in-xr',
      'is-xr-in-search-of-a-problem',
      'calculated-risk',
      'embodied-interfaces',
      'rapid-refactoring',
      // reading.supply essays
      'meaning-lives-in-between-the-gaps-of-language-pt1',
      'diverse-forms-of-intelligence',
      'entropy-duality',
      'the-vessel-shapes-the-decision',
      'minimizing-entropy-in-intelligent-systems-pt2',
      'the-groove-that-passes-for-rigor',
      'the-cognitive-lightcone',
      // field notes (hidden) — not in the AI tree, so they fall into the
      // field-notes bucket. Old past-work blogs parked here.
      'devlog01',
      'devlog02',
      'capstone-planning',
    ],
  },
}

export function rootFor(slug: string): RootId | null {
  for (const id of ROOT_IDS) {
    if (ROOTS[id].members.includes(slug)) return id
  }
  return null
}
