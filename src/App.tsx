import { useState } from 'react'
import { Canvas } from './components/Canvas'
import { ThemeToggle } from './components/ThemeToggle'
import { ZoomControls } from './components/ZoomControls'
import { ProjectCard } from './components/ProjectCard'
import { ProjectModal } from './components/ProjectModal'
import { BlogModal } from './components/BlogModal'
import { projects, blogPosts, type ProjectContent, type BlogContent } from './content'
import { placeAncestry, DEFAULT_FUNNEL_CONFIG, type Placeable } from './layout/funnel'

const FOCAL_X = DEFAULT_FUNNEL_CONFIG.focalX
const FOCAL_Y = DEFAULT_FUNNEL_CONFIG.focalY
const IMAGE_HEIGHT = 260

const IDENTITY_ANCHOR_SIZE = 180
const IDENTITY_GAP = 32
const IDENTITY_NAME_FONT_SIZE = 64
const IDENTITY_TAGLINE_FONT_SIZE = 18
const IDENTITY_BUTTON_HEIGHT = 40
const IDENTITY_BUTTON_GAP = 12

const PRESENT_OFFSET_Y = 320

type AncestryItem =
  | { kind: 'project'; data: ProjectContent }
  | { kind: 'blog'; data: BlogContent }

function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectContent | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogContent | null>(null)
  const [zoomScale, setZoomScale] = useState(1)

  const kairos = projects.find((p) => p.slug === 'kairos') ?? null
  const ancestryProjects = projects.filter((p) => p.slug !== 'kairos')

  const ancestryItems: AncestryItem[] = [
    ...ancestryProjects.map((p): AncestryItem => ({ kind: 'project', data: p })),
    ...blogPosts.map((b): AncestryItem => ({ kind: 'blog', data: b })),
  ]

  const placeable: Placeable[] = ancestryItems.map((item) => ({
    slug: item.data.slug,
    date: item.data.date,
    position: item.data.position,
  }))

  const placements = placeAncestry(placeable, DEFAULT_FUNNEL_CONFIG)
  const placementBySlug = new Map(placements.map((p) => [p.slug, p]))

  return (
    <>
      <ThemeToggle />
      <ZoomControls scale={zoomScale} />
      <Canvas onZoomChange={setZoomScale}>
        {/* Identity zone — centered on focal point */}
        <g transform={`translate(${FOCAL_X}, ${FOCAL_Y})`}>
          {/* Visual anchor placeholder (left of name) */}
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

        {/* Ancestry — projects + writing, mingled, chronological */}
        {ancestryItems.map((item) => {
          const placement = placementBySlug.get(item.data.slug)
          if (!placement) return null

          const onClick = () => {
            if (item.kind === 'project') {
              setSelectedProject(item.data)
            } else {
              setSelectedBlogPost(item.data)
            }
          }

          const yearLabel =
            item.kind === 'project'
              ? item.data.year
              : (item.data.subtitle.split('•')[0]?.trim() ?? '')

          const thumb =
            item.kind === 'project' ? item.data.thumbnailSmall : item.data.thumbnail

          return (
            <ProjectCard
              key={`${item.kind}-${item.data.slug}`}
              x={placement.x}
              y={placement.y}
              imageHeight={IMAGE_HEIGHT}
              title={item.data.title}
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
