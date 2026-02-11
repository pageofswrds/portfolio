import type { MDXComponents } from 'mdx/types'

// MDX component props type
interface MDXContentProps {
  components?: MDXComponents
}

// Glob import all blog MDX files at build time
const mdxModules = import.meta.glob<{
  default: React.ComponentType<MDXContentProps>
  frontmatter: {
    title?: string
    subtitle?: string
    year?: number
    date?: string
    thumbnail?: string
    order?: number | null
    visible?: boolean
  }
}>('./*.mdx', { eager: true })

export interface BlogContent {
  id: string
  slug: string
  title: string
  subtitle: string
  date: string
  thumbnail: string
  visible: boolean
  Component: React.ComponentType<MDXContentProps>
}

// Process and export all blog posts
export const blogPosts: BlogContent[] = Object.entries(mdxModules)
  .map(([path, module]) => {
    const slug = path.replace('./', '').replace('.mdx', '')
    const { frontmatter } = module

    return {
      id: slug,
      slug,
      title: frontmatter.title || slug,
      subtitle: frontmatter.subtitle || '',
      date: frontmatter.date || '',
      thumbnail: frontmatter.thumbnail || '',
      visible: frontmatter.visible ?? true,
      Component: module.default,
    }
  })
  .filter((p) => p.visible)
  .sort((a, b) => {
    // Sort by date, newest first
    if (!a.date || !b.date) return 0
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

// Get a single blog post by ID
export function getBlogPost(id: string): BlogContent | undefined {
  return blogPosts.find((p) => p.id === id)
}
