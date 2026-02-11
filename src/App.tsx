import { useState } from 'react'
import { Canvas } from './components/Canvas'
import { ThemeToggle } from './components/ThemeToggle'
import { ProjectCard } from './components/ProjectCard'
import { ProjectModal } from './components/ProjectModal'
import { projects, type Project } from './data/projects'

// Consistent image height for all cards
const IMAGE_HEIGHT = 260

// Fixed organic positions for project cards - more spread out
const projectPositions = [
  // Projects going down (case studies) - below and slightly right of intro
  { x: 340, y: 480 },
  { x: 80, y: 980 },
  { x: 540, y: 1020 },

  // Projects going right (smaller items) - to the right of intro
  { x: 820, y: 100 },
  { x: 1220, y: 60 },
  { x: 1180, y: 520 },
]

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  return (
    <>
      <ThemeToggle />
      <Canvas>
        {/* Intro section - upper left area */}
        <g transform="translate(100, 160)">
          {/* Greeting */}
          <text
            fill="var(--tx-primary)"
            fontSize="18"
            fontFamily="var(--font-sans)"
            fontWeight="500"
          >
            hellooooo
          </text>

          {/* Name - large, lowercase */}
          <text
            y="70"
            fill="var(--tx-primary)"
            fontSize="64"
            fontFamily="var(--font-display)"
            fontWeight="400"
          >
            david schultz
          </text>

          {/* Description */}
          <text
            y="120"
            fill="var(--tx-primary)"
            fontSize="18"
            fontFamily="var(--font-sans)"
          >
            designer, developer, claude code cli evangelist, etc.
          </text>

          {/* Buttons */}
          <g transform="translate(0, 160)">
            {/* LinkedIn button */}
            <a
              href="https://linkedin.com/in/schultzdavidg"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                width="120"
                height="40"
                rx="8"
                fill="var(--bg-button)"
              />
              {/* LinkedIn icon */}
              <g transform="translate(16, 12)">
                <path
                  d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v12h-4V8zm6.5 0h3.8v1.64h.06c.53-1 1.82-2.04 3.74-2.04 4 0 4.74 2.63 4.74 6.04V20h-4v-5.56c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94V20h-4V8z"
                  fill="var(--tx-button)"
                  transform="scale(0.75)"
                />
              </g>
              <text
                x="72"
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

            {/* Resume button */}
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="136"
                width="115"
                height="40"
                rx="8"
                fill="var(--bg-card)"
                stroke="var(--bd-primary)"
                strokeWidth="1"
              />
              {/* Document icon */}
              <g transform="translate(152, 12)">
                <path
                  d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-9-7h6v2H9v-2zm0 4h6v2H9v-2z"
                  fill="var(--tx-primary)"
                  transform="scale(0.7)"
                />
              </g>
              <text
                x="205"
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
          </g>
        </g>

        {/* Project cards in organic positions */}
        {projects.map((project, index) => {
          const pos = projectPositions[index]
          if (!pos) return null
          return (
            <ProjectCard
              key={project.id}
              x={pos.x}
              y={pos.y}
              imageHeight={IMAGE_HEIGHT}
              title={project.title}
              date={project.date}
              thumbnail={project.thumbnail}
              onClick={() => setSelectedProject(project)}
            />
          )
        })}
      </Canvas>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </>
  )
}

export default App
