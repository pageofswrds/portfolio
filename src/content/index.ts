import type { MDXComponents } from 'mdx/types'

// MDX component props type
interface MDXContentProps {
  components?: MDXComponents
}

// Glob import all MDX files at build time
const mdxModules = import.meta.glob<{
  default: React.ComponentType<MDXContentProps>
  frontmatter: {
    title?: string
    subtitle?: string
    published?: string
    year?: string
    location?: string
    thumbnail?: string
    thumbnailSmall?: string
    order?: number
    visible?: boolean
  }
}>('./work/*.mdx', { eager: true })

export interface ProjectContent {
  id: string
  slug: string
  title: string
  subtitle: string
  date: string
  year: string
  location: string
  thumbnail: string
  thumbnailSmall: string
  order: number
  visible: boolean
  Component: React.ComponentType<MDXContentProps>
}

// Process and export all projects
export const projects: ProjectContent[] = Object.entries(mdxModules)
  .map(([path, module]) => {
    const slug = path.replace('./work/', '').replace('.mdx', '')
    const { frontmatter } = module

    return {
      id: slug,
      slug,
      title: frontmatter.title || slug,
      subtitle: frontmatter.subtitle || '',
      date: frontmatter.published || '',
      year: frontmatter.year || '',
      location: frontmatter.location || '',
      thumbnail: frontmatter.thumbnail || '',
      thumbnailSmall: frontmatter.thumbnailSmall || frontmatter.thumbnail || '',
      order: frontmatter.order ?? 999,
      visible: frontmatter.visible ?? true,
      Component: module.default,
    }
  })
  .filter((p) => p.visible)
  .sort((a, b) => a.order - b.order)

// Get a single project by ID
export function getProject(id: string): ProjectContent | undefined {
  return projects.find((p) => p.id === id)
}

// Re-export blog content
export { blogPosts, getBlogPost, type BlogContent } from './blog'
