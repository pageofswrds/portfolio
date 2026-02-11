declare module '*.mdx' {
  import type { ComponentType } from 'react'

  export const frontmatter: {
    title?: string
    subtitle?: string
    published?: string
    location?: string
    thumbnail?: string
    order?: number
    visible?: boolean
  }

  const MDXComponent: ComponentType
  export default MDXComponent
}
