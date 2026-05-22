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

// Tabs sit inside the identity card group, in the slot where the old buttons lived.
// Sized to match the original button typography lockup: 40 tall, font-sans 14pt 500,
// rx=8, variable widths fitted to each label.
const TAB_ROW_OFFSET_X = -200
const TAB_ROW_OFFSET_Y = -IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE + 64

const TAB_HEIGHT = 40
const TAB_RX = 8
const TAB_GAP = 12
const TAB_FONT_SIZE = 14

const TAB_WIDTHS: Record<RootId, number> = {
  about: 90,
  'past-work': 120,
  product: 100,
  research: 110,
}

// About panel: body copy above, link row below.
const ABOUT_BODY_Y = 110
const ABOUT_BODY_WIDTH = 560
const ABOUT_BODY_HEIGHT = 180
const ABOUT_BODY_FONT_SIZE = 16

const LINK_PANEL_Y = ABOUT_BODY_Y + ABOUT_BODY_HEIGHT + 24
const LINK_HEIGHT = 40
const LINK_RX = 8
const LINK_GAP = 12
const LINK_FONT_SIZE = 14
const LINK_ROW_OFFSET_X = -200

interface ExternalLink {
  label: string
  href: string
  width: number
}

const CORE_DETAILS_LINKS: ExternalLink[] = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/schultzdavidg', width: 120 },
  {
    label: 'Resume',
    href: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/files/davidschultz-resume.pdf',
    width: 100,
  },
  { label: 'studiozojer.co', href: 'https://studiozojer.co', width: 140 },
  { label: 'Bluesky', href: 'https://bsky.app/profile/pageofswrds.kairos.solar', width: 110 },
]

// Chain panel for non-Core-details tabs — pushed further down so the first card
// clears the identity card.
const CHAIN_FOCAL_Y = 180

const CHAIN_CONFIG: Omit<FunnelConfig, 'focalX' | 'focalY'> = {
  topMargin: 120,
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

// Left edge of a tab within the tab-row local coordinate system.
function tabLocalX(id: RootId): number {
  let x = 0
  for (const rootId of ROOT_IDS) {
    if (rootId === id) return x
    x += TAB_WIDTHS[rootId] + TAB_GAP
  }
  return x
}

// Canvas-space x at the center of a tab (used for chain centering).
function tabCenterCanvasX(id: RootId): number {
  return TAB_ROW_OFFSET_X + tabLocalX(id) + TAB_WIDTHS[id] / 2
}

function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectContent | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogContent | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [activeRoot, setActiveRoot] = useState<RootId>('product')

  const activeChain = (() => {
    if (activeRoot === 'about') return null
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
      focalX: tabCenterCanvasX(activeRoot),
      focalY: CHAIN_FOCAL_Y,
    })

    const placementBySlug = new Map(placements.map((p) => [p.slug, p]))

    return { artifacts, placementBySlug }
  })()

  const handleTabClick = (id: RootId) => {
    setActiveRoot(id)
  }

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

          {/* Tab row — inside the identity card, where the buttons used to live */}
          <g transform={`translate(${TAB_ROW_OFFSET_X}, ${TAB_ROW_OFFSET_Y})`}>
            {ROOT_IDS.map((id) => {
              const isActive = activeRoot === id
              const width = TAB_WIDTHS[id]
              const xLeft = tabLocalX(id)
              const label = ROOTS[id].label

              return (
                <g
                  key={id}
                  transform={`translate(${xLeft + width / 2}, ${TAB_HEIGHT / 2})`}
                  className={`root-node ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(id)}
                >
                  <g className="root-content">
                    <rect
                      className="root-bg"
                      x={-width / 2}
                      y={-TAB_HEIGHT / 2}
                      width={width}
                      height={TAB_HEIGHT}
                      rx={TAB_RX}
                    />
                    <text
                      className="root-label"
                      x={0}
                      y={5}
                      fontSize={TAB_FONT_SIZE}
                      fontFamily="var(--font-sans)"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  </g>
                </g>
              )
            })}
          </g>
        </g>

        {/* About panel — body copy above the external links row */}
        {activeRoot === 'about' && (
          <foreignObject
            x={LINK_ROW_OFFSET_X}
            y={ABOUT_BODY_Y}
            width={ABOUT_BODY_WIDTH}
            height={ABOUT_BODY_HEIGHT}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: `${ABOUT_BODY_FONT_SIZE}px`,
                lineHeight: 1.6,
                color: 'var(--tx-primary)',
              }}
            >
              Hi, I'm an Interaction Designer from Seattle currently building Kairōs—a community tool designed for studying the stars. Kairōs is my practical path towards proving out my thesis: that graph architecture is where we'll see the next big steps forward in AI.
            </div>
          </foreignObject>
        )}

        {activeRoot === 'about' && (
          <g transform={`translate(${LINK_ROW_OFFSET_X}, ${LINK_PANEL_Y})`}>
            {(() => {
              let xCursor = 0
              return CORE_DETAILS_LINKS.map((link) => {
                const centerX = xCursor + link.width / 2
                xCursor += link.width + LINK_GAP
                return (
                  <g
                    key={link.label}
                    transform={`translate(${centerX}, ${LINK_HEIGHT / 2})`}
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
                          x={-link.width / 2}
                          y={-LINK_HEIGHT / 2}
                          width={link.width}
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
              })
            })()}
          </g>
        )}

        {/* Artifact chain — cards extending downward from the active tab */}
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
