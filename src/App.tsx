import { useState, useEffect } from 'react'
import { Canvas } from './components/Canvas'
import { ThemeToggle } from './components/ThemeToggle'
import { ZoomControls } from './components/ZoomControls'
import { ProjectCard } from './components/ProjectCard'
import { ProjectModal } from './components/ProjectModal'
import { BlogModal } from './components/BlogModal'
import { AsciiFlowField } from './components/AsciiFlowField'
import { projects, blogPosts, type ProjectContent, type BlogContent } from './content'

// Consistent image height for all cards
const IMAGE_HEIGHT = 260
const CARD_HEIGHT = IMAGE_HEIGHT + 96 // image + text area
const VERTICAL_GAP = 40
const VERTICAL_SPACING = CARD_HEIGHT + VERTICAL_GAP
const DEFAULT_ASPECT_RATIO = 16 / 10

// Starting position for the project stack
const STACK_START_X = 100
const STACK_START_Y = 520

// Organic horizontal offsets for each card (adds visual interest)
const HORIZONTAL_OFFSETS = [0, 180, 60, 220, 120, 40, 200, 100, 160]

// Generate position for a project card
function getProjectPosition(index: number) {
  const xOffset = HORIZONTAL_OFFSETS[index % HORIZONTAL_OFFSETS.length]
  return {
    x: STACK_START_X + xOffset,
    y: STACK_START_Y + index * VERTICAL_SPACING,
  }
}

// Blog section - horizontal row extending right from intro
const BLOG_START_X = 900 // Well clear of the intro text/buttons
const BLOG_START_Y = 160 // Same level as intro
const BLOG_GAP = 80 // Consistent gap between blog cards

// Organic vertical offsets for blog cards (adds visual interest to horizontal row)
const VERTICAL_OFFSETS = [0, 60, 20, 80, 40, 10, 70, 30, 50]

function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectContent | null>(null)
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogContent | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [blogAspectRatios, setBlogAspectRatios] = useState<Record<string, number>>({})

  // Load blog thumbnail dimensions to calculate card widths
  useEffect(() => {
    blogPosts.forEach((post) => {
      if (!post.thumbnail) return
      const img = new Image()
      img.onload = () => {
        setBlogAspectRatios((prev) => ({
          ...prev,
          [post.id]: img.naturalWidth / img.naturalHeight,
        }))
      }
      img.src = post.thumbnail
    })
  }, [])

  // Calculate cumulative x positions for blog cards based on actual widths
  const blogPositions = blogPosts.reduce<number[]>((positions, _post, index) => {
    if (index === 0) {
      positions.push(BLOG_START_X)
    } else {
      const prevPost = blogPosts[index - 1]
      const prevAspectRatio = blogAspectRatios[prevPost.id] || DEFAULT_ASPECT_RATIO
      const prevWidth = IMAGE_HEIGHT * prevAspectRatio
      const prevX = positions[index - 1]
      positions.push(prevX + prevWidth + BLOG_GAP)
    }
    return positions
  }, [])

  return (
    <>
      <ThemeToggle />
      <ZoomControls scale={zoomScale} />
      <Canvas onZoomChange={setZoomScale}>
        {/* ASCII flow field - top left, away from main content */}
        <AsciiFlowField x={-1100} y={100} cols={120} rows={50} />

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
            designer, developer, claude code cli cave dweller, etc.
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
              href="https://schultzdavidg-portfolio.s3.us-west-1.amazonaws.com/files/davidschultz-resume.pdf"
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

            {/* Zojer Studio button */}
            <a
              href="https://zojer.studio"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="267"
                width="125"
                height="40"
                rx="8"
                fill="var(--bg-card)"
                stroke="var(--bd-primary)"
                strokeWidth="1"
              />
              {/* Zojer logo */}
              <g transform="translate(281, 12)">
                <g transform="scale(0.025) translate(-75, -80)">
                  <path
                    d="M352.304 159.097C358.618 143.914 376.046 136.724 391.229 143.038C392.916 143.739 393.731 144.048 395.346 144.701C396.807 145.291 398.661 146.062 400.801 147.136L401.473 147.474L402.129 147.845C408.296 151.343 414.889 156.149 420.316 160.236C431.609 167.716 449.174 180.34 458.691 190.121C458.586 190.013 458.851 190.286 459.96 191.267C461.031 192.215 462.171 193.196 463.876 194.682C467.06 197.458 471.246 201.156 475.721 205.56C484.526 214.223 495.436 226.545 503.26 242.199C507.643 250.97 523.772 276.523 524.183 307.937C524.307 317.391 525.268 334.315 519.692 352.725C514.849 368.716 504.016 391.885 493.39 408.075C483.893 422.545 473.564 437.558 464.561 450.627C451.13 470.124 432.413 495.527 422.822 507.169C415.168 516.461 395.442 538.049 362.034 566.123C346.228 579.405 334.164 589.361 325.849 596.112C321.703 599.478 318.421 602.102 316.042 603.965C314.868 604.885 313.801 605.707 312.907 606.373C312.473 606.697 311.935 607.092 311.369 607.486C311.347 607.502 309.541 608.805 307.268 609.941C292.561 617.295 274.676 611.332 267.322 596.624C260.518 583.016 265.114 566.689 277.489 558.499C277.864 558.217 278.465 557.757 279.331 557.08C281.327 555.517 284.309 553.134 288.315 549.881C296.305 543.395 308.102 533.662 323.724 520.534C354.647 494.549 371.749 475.512 376.861 469.306C384.901 459.546 402.526 435.713 415.523 416.845C424.569 403.714 434.53 389.23 443.607 375.4C451.298 363.683 459.609 345.672 462.701 335.462C465.062 327.667 464.799 320.87 464.639 308.717C464.454 294.549 457.793 284.425 449.994 268.822C446.298 261.426 440.462 254.408 433.957 248.007C430.778 244.879 427.666 242.115 424.745 239.568C422.496 237.608 418.578 234.285 416.014 231.65C411.19 226.692 397.831 216.717 386.756 209.43L385.944 208.897L385.17 208.311C380.097 204.477 376.268 201.758 373.614 200.151C373.472 200.091 373.288 200.013 373.048 199.916C372.3 199.614 370.366 198.855 368.364 198.022C353.181 191.708 345.991 174.28 352.304 159.097Z"
                    fill="var(--tx-primary)"
                  />
                  <path
                    d="M257.355 253.64C287.729 252.206 307.633 252.7 322.179 253.987C336.202 255.227 346.41 257.463 350.874 258.154C359.754 259.529 368.893 262.092 376.751 264.458C385.497 267.091 391.993 269.256 399.281 271.305C417.202 276.344 437.845 285.781 455.097 293.713C474.638 302.697 490.747 315.056 508.601 329.191C539.537 353.684 550.685 372.611 560.33 385.182C570.557 398.512 580.259 415.894 587.827 429.646C597.551 447.314 607.661 466.568 619.193 489.333L621.855 494.597L622.156 495.278C631.306 515.914 642.044 539.376 645.017 546.965C645.706 548.592 646.595 550.399 648.041 553.292C655.395 567.999 649.433 585.884 634.726 593.238C620.018 600.592 602.133 594.63 594.779 579.923C593.435 577.234 591.562 573.516 589.922 569.567L589.721 569.083L589.536 568.591C587.862 564.123 578.547 543.819 568.034 520.124C555.885 496.059 545.508 476.257 535.657 458.357C527.734 443.959 520.111 430.588 513.085 421.43C501.175 405.907 495.307 394.619 471.637 375.879C453.51 361.527 442.483 353.453 430.222 347.816C411.886 339.386 395.705 332.157 383.162 328.631C375.428 326.456 366.179 323.464 359.582 321.477C352.097 319.223 346.294 317.703 341.76 317.001C332.633 315.587 328.547 314.332 316.932 313.304C305.839 312.323 288.759 311.772 260.162 313.122C251.835 313.515 235.448 313.411 214.948 313.449C193.79 313.488 166.66 313.662 135.065 314.547C122.669 314.894 115.827 315.178 112.06 315.367C110.201 315.46 109.079 315.53 108.39 315.576C108.138 315.592 107.628 315.627 107.335 315.645C107.126 315.658 106.14 315.723 105 315.723C88.5562 315.723 75.2256 302.393 75.2256 285.949C75.2257 269.905 87.9162 256.827 103.807 256.201C103.954 256.192 104.174 256.176 104.482 256.156C105.446 256.093 106.878 256.004 109.079 255.893C113.433 255.675 120.743 255.377 133.397 255.022C165.724 254.117 193.429 253.94 214.838 253.9C236.906 253.859 250.821 253.949 257.355 253.64Z"
                    fill="var(--tx-primary)"
                  />
                  <path
                    d="M274.812 80.5007C284.105 78.8338 294.036 81.6019 301.2 88.8014C303.828 91.4426 309.613 97.638 311.238 107.686L311.622 110.066L311.619 112.476C311.611 118.857 309.99 124.413 307.946 128.846L306.79 131.352L305.194 133.603C302.226 137.787 294.965 146.304 282.126 149.84C279.298 150.62 274.94 151.566 269.824 151.397C264.547 151.223 256.691 149.766 249.504 143.878C249.247 143.667 246.954 141.856 244.772 139.518C242.456 137.037 238.909 132.599 236.841 126.115C235.853 123.018 231.244 107.709 242.688 93.9977L243.494 93.0495C244.538 91.8524 246.27 89.9885 248.49 88.1784C251.394 85.8096 257.378 81.6555 266.063 80.6979L267.087 80.5934C269.384 80.3784 271.025 80.3561 271.887 80.3561C272.874 80.3561 273.85 80.4068 274.812 80.5007Z"
                    fill="var(--tx-primary)"
                  />
                  <path
                    d="M651.801 646.02C653.46 645.943 656.152 645.929 659.335 646.518C660.622 646.756 663.489 647.344 666.898 648.953C672.316 649.89 676.224 651.929 677.871 652.811C680.577 654.261 684.288 656.594 687.841 660L688.549 660.695L689.687 661.84L690.693 663.101C696.674 670.591 700.712 680.92 699.589 692.494C699.603 692.348 699.604 692.299 699.582 692.614C699.568 692.815 699.528 693.405 699.48 693.99C699.381 695.179 699.168 697.404 698.591 700.003C697.359 705.548 694.172 714.003 685.763 720.596C679.913 725.183 668.423 732.24 653.606 730.781C651.734 730.596 648.148 730.245 644.53 729.399C641.528 728.697 633.612 726.647 626.844 719.869C623.343 716.363 616.734 708.775 614.889 697.057C614.119 692.168 612.652 679.59 619.948 667.01L620.732 665.674C621.701 664.053 623.209 661.67 625.074 659.377C627.347 656.583 633.133 650.1 643.076 647.433L643.961 647.205C646.106 646.672 648.803 646.16 651.801 646.02Z"
                    fill="var(--tx-primary)"
                  />
                </g>
              </g>
              <text
                x="347"
                y="25"
                fill="var(--tx-primary)"
                fontSize="14"
                fontFamily="var(--font-sans)"
                fontWeight="500"
                textAnchor="middle"
              >
                zojer.studio
              </text>
            </a>
          </g>
        </g>

        {/* Projects section label */}
        <text
          x={STACK_START_X}
          y={STACK_START_Y - 20}
          fill="var(--tx-tertiary)"
          fontSize="14"
          fontFamily="var(--font-mono)"
          fontWeight="400"
        >
          projects ↓
        </text>

        {/* Project cards in vertical stack with organic horizontal variation */}
        {projects.map((project, index) => {
          const pos = getProjectPosition(index)
          return (
            <ProjectCard
              key={project.id}
              x={pos.x}
              y={pos.y}
              imageHeight={IMAGE_HEIGHT}
              title={project.title}
              year={project.year}
              thumbnail={project.thumbnailSmall}
              onClick={() => setSelectedProject(project)}
            />
          )
        })}

        {/* Blog section label */}
        <text
          x={BLOG_START_X}
          y={BLOG_START_Y - 20}
          fill="var(--tx-tertiary)"
          fontSize="14"
          fontFamily="var(--font-mono)"
          fontWeight="400"
        >
          writing →
        </text>

        {/* Blog cards - horizontal row with organic vertical variation */}
        {blogPosts.map((post, index) => {
          const yOffset = VERTICAL_OFFSETS[index % VERTICAL_OFFSETS.length]
          return (
            <ProjectCard
              key={post.id}
              x={blogPositions[index] ?? BLOG_START_X}
              y={BLOG_START_Y + yOffset}
              imageHeight={IMAGE_HEIGHT}
              title={post.title}
              year={post.subtitle.split('•')[0]?.trim() || ''}
              thumbnail={post.thumbnail}
              onClick={() => setSelectedBlogPost(post)}
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
