export const ROOT_IDS = ['past-work', 'product', 'research'] as const

export type RootId = (typeof ROOT_IDS)[number]

export interface RootDefinition {
  id: RootId
  label: string
  members: string[]
}

export const ROOTS: Record<RootId, RootDefinition> = {
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
    ],
  },
  product: {
    id: 'product',
    label: 'Product',
    members: [
      'devlog01',
      'devlog02',
      'capstone-planning',
      'calculated-risk',
      'rapid-refactoring',
    ],
  },
  research: {
    id: 'research',
    label: 'Research',
    members: [
      'position-in-time',
      'a-plan-for-deep-work',
      'constraints-in-xr',
      'is-xr-in-search-of-a-problem',
      'embodied-interfaces',
    ],
  },
}

export function rootFor(slug: string): RootId | null {
  for (const id of ROOT_IDS) {
    if (ROOTS[id].members.includes(slug)) return id
  }
  return null
}
