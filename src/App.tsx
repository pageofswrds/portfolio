import { useState } from 'react'
import { Canvas } from './components/Canvas'
import { ThemeToggle } from './components/ThemeToggle'
import { ZoomControls } from './components/ZoomControls'
import { ProjectCard } from './components/ProjectCard'
import { ProjectModal } from './components/ProjectModal'
import { BlogModal } from './components/BlogModal'
import { projects, blogPosts, type ProjectContent, type BlogContent } from './content'
import { ROOT_IDS, ROOTS, type RootId } from './content/categories'
import { placeAncestry, type FunnelConfig, type Placeable } from './layout/funnel'

const FOCAL_X = 0
const FOCAL_Y = 0
const IMAGE_HEIGHT = 260

// Identity card geometry
const IDENTITY_ANCHOR_SIZE = 180
const IDENTITY_GAP = 32
const IDENTITY_NAME_FONT_SIZE = 64
const IDENTITY_TAGLINE_FONT_SIZE = 18

// Tab row sits below the identity card
const TAB_Y = 170
const TAB_SPACING = 160
const TAB_WIDTH = 140
const TAB_HEIGHT = 44
const TAB_RX = 8
const TAB_FONT_SIZE = 18

// Active tab's content panel sits below the tab row
const PANEL_Y = TAB_Y + 60

// Core details external links — small button nodes in a horizontal row
const LINK_WIDTH = 120
const LINK_HEIGHT = 36
const LINK_GAP = 12
const LINK_RX = 8
const LINK_FONT_SIZE = 14

interface ExternalLink {
  label: string
  href: string
}

const CORE_DETAILS_LINKS: ExternalLink[] = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/schultzdavidg' },
  {
    label: 'Resume',
    href: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/files/davidschultz-resume.pdf',
  },
  { label: 'studiozojer.co', href: 'https://studiozojer.co' },
  { label: 'Bluesky', href: 'https://bsky.app/profile/pageofswrds.kairos.solar' },
]

// Per-chain placement: narrow vertical column extending downward with light jitter
const CHAIN_CONFIG: Omit<FunnelConfig, 'focalX' | 'focalY'> = {
  topMargin: 40,
  verticalSpacing: 380,
  maxSpread: 24,
  jitterRange: 24,
  direction: 'down',
}

const projectBySlug = new Map(projects.map((p) => [p.slug, p]))
const blogBySlug = new Map(blogPosts.map((b) => [b.slug, b]))

type Artifact =
  | { kind: 'project'; data: ProjectContent }
  | { kind: 'blog'; data: BlogContent }

function lookupArtifact(slug: string): Artifact | null {
  const proj = projectBySlug.get(slug)
  if (proj) return { kind: 'project', data: proj }
  const blog = blogBySlug.get(slug)
  if (blog) return { kind: 'blog', data: blog }
  return null
}

function tabX(id: RootId): number {
  const idx = ROOT_IDS.indexOf(id)
  return (idx - (ROOT_IDS.length - 1) / 2) * TAB_SPACING
}

function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectContent | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogContent | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [activeRoot, setActiveRoot] = useState<RootId>('core-details')

  const activeChain = (() => {
    if (activeRoot === 'core-details') return null
    const root = ROOTS[activeRoot]
    const artifacts = root.members
      .map(lookupArtifact)
      .filter((a): a is Artifact => a !== null)

    const placeable: Placeable[] = artifacts.map((a) => ({
      slug: a.data.slug,
      date: a.data.date,
      position: a.data.position,
    }))

    const placements = placeAncestry(placeable, {
      ...CHAIN_CONFIG,
      focalX: tabX(activeRoot),
      focalY: PANEL_Y,
    })

    const placementBySlug = new Map(placements.map((p) => [p.slug, p]))

    return { artifacts, placementBySlug }
  })()

  // Tabs are now exclusive — clicking switches; clicking the active tab is a no-op
  const handleTabClick = (id: RootId) => {
    setActiveRoot(id)
  }

  // Compute total link-row width to center it under x=0
  const linkRowWidth =
    CORE_DETAILS_LINKS.length * LINK_WIDTH + (CORE_DETAILS_LINKS.length - 1) * LINK_GAP
  const linkRowStartX = -linkRowWidth / 2

  return (
    <>
      <ThemeToggle />
      <ZoomControls scale={zoomScale} />
      <Canvas onZoomChange={setZoomScale}>
        {/* Identity zone — centered on focal point */}
        <g transform={`translate(${FOCAL_X}, ${FOCAL_Y})`}>
          <rect
            x={-(IDENTITY_ANCHOR_SIZE + IDENTITY_GAP + 200)}
            y={-IDENTITY_ANCHOR_SIZE / 2}
            width={IDENTITY_ANCHOR_SIZE}
            height={IDENTITY_ANCHOR_SIZE}
            rx="12"
            fill="var(--bg-card)"
            stroke="var(--bd-primary)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          <text
            x={-200}
            y={-IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE}
            fill="var(--tx-primary)"
            fontSize={IDENTITY_NAME_FONT_SIZE}
            fontFamily="var(--font-display)"
            fontWeight="400"
          >
            david schultz
          </text>

          <text
            x={-200}
            y={-IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE + 32}
            fill="var(--tx-primary)"
            fontSize={IDENTITY_TAGLINE_FONT_SIZE}
            fontFamily="var(--font-sans)"
          >
            Building thinking models at studiozojer
          </text>
        </g>

        {/* Tab row — below identity card */}
        {ROOT_IDS.map((id) => {
          const isActive = activeRoot === id
          const x = tabX(id)
          const label = ROOTS[id].label

          return (
            <g
              key={id}
              transform={`translate(${x}, ${TAB_Y})`}
              className={`root-node ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(id)}
            >
              <g className="root-content">
                <rect
                  className="root-bg"
                  x={-TAB_WIDTH / 2}
                  y={-TAB_HEIGHT / 2}
                  width={TAB_WIDTH}
                  height={TAB_HEIGHT}
                  rx={TAB_RX}
                />
                <text
                  className="root-label"
                  x={0}
                  y={6}
                  fontSize={TAB_FONT_SIZE}
                  fontFamily="var(--font-mono)"
                  fontWeight="500"
                  textAnchor="middle"
                >
                  {label}
                </text>
              </g>
            </g>
          )
        })}

        {/* Core details panel — 4 external links in a horizontal row */}
        {activeRoot === 'core-details' &&
          CORE_DETAILS_LINKS.map((link, i) => {
            const x = linkRowStartX + i * (LINK_WIDTH + LINK_GAP) + LINK_WIDTH / 2
            return (
              <g
                key={link.label}
                transform={`translate(${x}, ${PANEL_Y})`}
                className="root-node"
              >
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <g className="root-content">
                    <rect
                      className="root-bg"
                      x={-LINK_WIDTH / 2}
                      y={-LINK_HEIGHT / 2}
                      width={LINK_WIDTH}
                      height={LINK_HEIGHT}
                      rx={LINK_RX}
                    />
                    <text
                      className="root-label"
                      x={0}
                      y={5}
                      fontSize={LINK_FONT_SIZE}
                      fontFamily="var(--font-sans)"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {link.label}
                    </text>
                  </g>
                </a>
              </g>
            )
          })}

        {/* Artifact chain — cards extending downward from tab row */}
        {activeChain &&
          activeChain.artifacts.map((artifact) => {
            const placement = activeChain.placementBySlug.get(artifact.data.slug)
            if (!placement) return null

            const onClick = () => {
              if (artifact.kind === 'project') {
                setSelectedProject(artifact.data)
              } else {
                setSelectedBlogPost(artifact.data)
              }
            }

            const yearLabel =
              artifact.kind === 'project'
                ? artifact.data.year
                : (artifact.data.subtitle.split('•')[0]?.trim() ?? '')

            const thumb =
              artifact.kind === 'project'
                ? artifact.data.thumbnailSmall
                : artifact.data.thumbnail

            return (
              <ProjectCard
                key={`${artifact.kind}-${artifact.data.slug}`}
                x={placement.x}
                y={placement.y}
                imageHeight={IMAGE_HEIGHT}
                title={artifact.data.title}
                year={yearLabel}
                thumbnail={thumb}
                onClick={onClick}
                centered
              />
            )
          })}
      </Canvas>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      <BlogModal
        post={selectedBlogPost}
        onClose={() => setSelectedBlogPost(null)}
      />
    </>
  )
}

export default App
