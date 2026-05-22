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

const IDENTITY_ANCHOR_SIZE = 180
const IDENTITY_GAP = 32
const IDENTITY_NAME_FONT_SIZE = 64
const IDENTITY_TAGLINE_FONT_SIZE = 18
const IDENTITY_BUTTON_HEIGHT = 40
const IDENTITY_BUTTON_GAP = 12

const PRESENT_OFFSET_Y = 320

const ROOT_Y = -240
const ROOT_X_SPACING = 500
const ROOT_X_POSITIONS: Record<RootId, number> = {
  'past-work': -ROOT_X_SPACING,
  product: 0,
  research: ROOT_X_SPACING,
}

const ROOT_FONT_SIZE = 18
const ROOT_LABEL_GAP = 8
const ROOT_BUBBLE_WIDTH = 152
const ROOT_BUBBLE_HEIGHT = 44

const CHAIN_CONFIG: Omit<FunnelConfig, 'focalX' | 'focalY'> = {
  topMargin: 80,
  verticalSpacing: 380,
  maxSpread: 24,
  jitterRange: 24,
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

function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectContent | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogContent | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [activeRoot, setActiveRoot] = useState<RootId | null>(null)

  const kairos = projectBySlug.get('kairos') ?? null

  const activeChain = (() => {
    if (!activeRoot) return null
    const root = ROOTS[activeRoot]
    const rootX = ROOT_X_POSITIONS[activeRoot]
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
      focalX: rootX,
      focalY: ROOT_Y,
    })

    const placementBySlug = new Map(placements.map((p) => [p.slug, p]))

    return { artifacts, placementBySlug }
  })()

  const handleRootClick = (id: RootId) => {
    setActiveRoot((current) => (current === id ? null : id))
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

          <g
            transform={`translate(-200, ${
              -IDENTITY_ANCHOR_SIZE / 2 + IDENTITY_NAME_FONT_SIZE + 64
            })`}
          >
            <a
              href="https://linkedin.com/in/schultzdavidg"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                width="120"
                height={IDENTITY_BUTTON_HEIGHT}
                rx="8"
                fill="var(--bg-button)"
              />
              <text
                x="60"
                y="25"
                fill="var(--tx-button)"
                fontSize="14"
                fontFamily="var(--font-sans)"
                fontWeight="500"
                textAnchor="middle"
              >
                LinkedIn
              </text>
            </a>

            <a
              href="https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/files/davidschultz-resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={120 + IDENTITY_BUTTON_GAP}
                width="100"
                height={IDENTITY_BUTTON_HEIGHT}
                rx="8"
                fill="var(--bg-card)"
                stroke="var(--bd-primary)"
                strokeWidth="1"
              />
              <text
                x={120 + IDENTITY_BUTTON_GAP + 50}
                y="25"
                fill="var(--tx-primary)"
                fontSize="14"
                fontFamily="var(--font-sans)"
                fontWeight="500"
                textAnchor="middle"
              >
                Resume
              </text>
            </a>

            <a
              href="https://studiozojer.co"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={120 + IDENTITY_BUTTON_GAP + 100 + IDENTITY_BUTTON_GAP}
                width="140"
                height={IDENTITY_BUTTON_HEIGHT}
                rx="8"
                fill="var(--bg-card)"
                stroke="var(--bd-primary)"
                strokeWidth="1"
              />
              <text
                x={120 + IDENTITY_BUTTON_GAP + 100 + IDENTITY_BUTTON_GAP + 70}
                y="25"
                fill="var(--tx-primary)"
                fontSize="14"
                fontFamily="var(--font-sans)"
                fontWeight="500"
                textAnchor="middle"
              >
                studiozojer.co
              </text>
            </a>

            <a
              href="https://bsky.app/profile/pageofswrds.kairos.solar"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={120 + IDENTITY_BUTTON_GAP + 100 + IDENTITY_BUTTON_GAP + 140 + IDENTITY_BUTTON_GAP}
                width="110"
                height={IDENTITY_BUTTON_HEIGHT}
                rx="8"
                fill="var(--bg-card)"
                stroke="var(--bd-primary)"
                strokeWidth="1"
              />
              <text
                x={120 + IDENTITY_BUTTON_GAP + 100 + IDENTITY_BUTTON_GAP + 140 + IDENTITY_BUTTON_GAP + 55}
                y="25"
                fill="var(--tx-primary)"
                fontSize="14"
                fontFamily="var(--font-sans)"
                fontWeight="500"
                textAnchor="middle"
              >
                Bluesky
              </text>
            </a>
          </g>
        </g>

        {/* Three root nodes — row above identity */}
        {ROOT_IDS.map((id) => {
          const isActive = activeRoot === id
          const rootX = ROOT_X_POSITIONS[id]
          const label = ROOTS[id].label
          const chevron = isActive ? '▴' : '▾'

          return (
            <g
              key={id}
              transform={`translate(${rootX}, ${ROOT_Y})`}
              className={`root-node ${isActive ? 'active' : ''}`}
              onClick={() => handleRootClick(id)}
            >
              <g className="root-content">
                <rect
                  className="root-bg"
                  x={-ROOT_BUBBLE_WIDTH / 2}
                  y={-ROOT_BUBBLE_HEIGHT / 2}
                  width={ROOT_BUBBLE_WIDTH}
                  height={ROOT_BUBBLE_HEIGHT}
                  rx={ROOT_BUBBLE_HEIGHT / 2}
                />
                <text
                  className="root-label"
                  x={-ROOT_LABEL_GAP / 2}
                  y={6}
                  fontSize={ROOT_FONT_SIZE}
                  fontFamily="var(--font-mono)"
                  fontWeight="500"
                  textAnchor="end"
                >
                  {label}
                </text>
                <text
                  className="root-chevron"
                  x={ROOT_LABEL_GAP / 2}
                  y={6}
                  fontSize={ROOT_FONT_SIZE}
                  fontFamily="var(--font-mono)"
                  textAnchor="start"
                >
                  {chevron}
                </text>
              </g>
            </g>
          )
        })}

        {/* Active chain — cards above the active root */}
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

        {/* Present — Kairos card below focal point */}
        {kairos && (
          <ProjectCard
            x={FOCAL_X}
            y={FOCAL_Y + PRESENT_OFFSET_Y}
            imageHeight={IMAGE_HEIGHT}
            title={kairos.title}
            year={kairos.year}
            thumbnail={kairos.thumbnailSmall}
            onClick={() => setSelectedProject(kairos)}
            centered
          />
        )}
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
