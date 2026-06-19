import type { ProjectContent } from '../content'
import { mdxComponents } from './mdx'
import { Modal } from './Modal'

interface ProjectModalProps {
  project: ProjectContent | null
  onClose: () => void
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  if (!project) return null

  const { Component } = project

  return (
    <Modal title={project.title} subtitle={project.subtitle} onClose={onClose}>
      <Component components={mdxComponents} />
    </Modal>
  )
}
