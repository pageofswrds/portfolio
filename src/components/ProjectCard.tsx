import { useState, useEffect } from 'react'

interface ProjectCardProps {
  x: number
  y: number
  imageHeight: number
  title: string
  year: string
  thumbnail?: string
  onClick?: () => void
}

const TEXT_AREA_HEIGHT = 96
const DEFAULT_ASPECT_RATIO = 16 / 10

export function ProjectCard({
  x,
  y,
  imageHeight,
  title,
  year,
  thumbnail,
  onClick
}: ProjectCardProps) {
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO)

  // Load image to get natural dimensions
  useEffect(() => {
    if (!thumbnail) return

    const img = new Image()
    img.onload = () => {
      setAspectRatio(img.naturalWidth / img.naturalHeight)
    }
    img.src = thumbnail
  }, [thumbnail])

  const width = imageHeight * aspectRatio
  const totalHeight = imageHeight + TEXT_AREA_HEIGHT

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer"
      onClick={onClick}
    >
      {/* Card background */}
      <rect
        width={width}
        height={totalHeight}
        rx="16"
        fill="var(--bg-card)"
      />

      {/* Thumbnail image (if provided) */}
      {thumbnail && (
        <>
          <defs>
            <clipPath id={`clip-${title.replace(/\s/g, '-')}`}>
              <rect
                x="0"
                y="0"
                width={width}
                height={imageHeight}
                rx="16"
              />
            </clipPath>
          </defs>
          <image
            href={thumbnail}
            x="0"
            y="0"
            width={width}
            height={imageHeight}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#clip-${title.replace(/\s/g, '-')})`}
          />
        </>
      )}

      {/* Title and Year - using foreignObject for text wrapping */}
      <foreignObject
        x="0"
        y={imageHeight}
        width={width}
        height={TEXT_AREA_HEIGHT}
      >
        <div
          style={{
            padding: '20px 16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              color: 'var(--tx-primary)',
              fontSize: '18px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              lineHeight: 1.2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: 'var(--tx-tertiary)',
              fontSize: '15px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {year}
          </div>
        </div>
      </foreignObject>
    </g>
  )
}
