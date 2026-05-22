export const ROOT_IDS = ['core-details', 'product', 'research', 'past-work'] as const

export type RootId = (typeof ROOT_IDS)[number]

export interface RootDefinition {
  id: RootId
  label: string
  members: string[]
}

export const ROOTS: Record<RootId, RootDefinition> = {
  'core-details': {
    id: 'core-details',
    label: 'Core details',
    members: [],
  },
  product: {
    id: 'product',
    label: 'Product',
    members: ['kairos'],
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
    ],
  },
  'past-work': {
    id: 'past-work',
    label: 'Past work',
    members: [
      'acquire',
      'sureui',
      'arboretum',
      'cycles',
      'terrariumxr',
      'layer',
      'layerpitch',
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
