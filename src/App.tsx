import { useState, type ReactNode } from 'react'
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
  icon: ReactNode
}

const ICON_SIZE = 16

const LinkedInIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const ResumeIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-9-7h6v2H9v-2zm0 4h6v2H9v-2z" />
  </svg>
)

const StudioIcon = (
  <img
    src="/zojer-logo.svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    alt=""
    style={{ display: 'block' }}
  />
)

const BlueskyIcon = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
  </svg>
)

const CORE_DETAILS_LINKS: ExternalLink[] = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/schultzdavidg', width: 120, icon: LinkedInIcon },
  {
    label: 'Resume',
    href: 'https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/files/davidschultz-resume.pdf',
    width: 100,
    icon: ResumeIcon,
  },
  { label: 'studiozojer.co', href: 'https://studiozojer.co', width: 140, icon: StudioIcon },
  { label: 'Bluesky', href: 'https://bsky.app/profile/pageofswrds.kairos.solar', width: 110, icon: BlueskyIcon },
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
                        <foreignObject
                          x={-link.width / 2}
                          y={-LINK_HEIGHT / 2}
                          width={link.width}
                          height={LINK_HEIGHT}
                          style={{ pointerEvents: 'none' }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              fontFamily: 'var(--font-sans)',
                              fontSize: `${LINK_FONT_SIZE}px`,
                              fontWeight: 500,
                              color: 'var(--tx-primary)',
                            }}
                          >
                            {link.icon}
                            <span>{link.label}</span>
                          </div>
                        </foreignObject>
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
