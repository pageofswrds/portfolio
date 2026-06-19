import type { BlogContent } from '../content'
import { mdxComponents } from './mdx'
import { Modal } from './Modal'

interface BlogModalProps {
  post: BlogContent | null
  onClose: () => void
}

export function BlogModal({ post, onClose }: BlogModalProps) {
  if (!post) return null

  const { Component } = post

  return (
    <Modal title={post.title} subtitle={post.subtitle} onClose={onClose}>
      <Component components={mdxComponents} />
    </Modal>
  )
}
