interface ProjectCardProps {
  x: number
  y: number
  imageHeight: number
  title: string
  year: string
  thumbnail?: string
  onClick?: () => void
  centered?: boolean
}

// Caption sized to a single-line title + year (no opaque card background).
const TEXT_AREA_HEIGHT = 62
const FIXED_ASPECT_RATIO = 16 / 10

export function ProjectCard({
  x,
  y,
  imageHeight,
  title,
  year,
  thumbnail,
  onClick,
  centered = false,
}: ProjectCardProps) {
  const width = imageHeight * FIXED_ASPECT_RATIO
  const totalHeight = imageHeight + TEXT_AREA_HEIGHT

  const renderX = centered ? x - width / 2 : x
  const renderY = centered ? y - totalHeight / 2 : y

  const clipId = `clip-${title.replace(/[^a-zA-Z0-9]/g, '-')}`

  return (
    <g
      transform={`translate(${renderX}, ${renderY})`}
      className="cursor-pointer"
      onClick={onClick}
    >
      {/* Image (rounded). Falls back to a plain rounded panel if no thumbnail. */}
      {thumbnail ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={width} height={imageHeight} rx="16" />
            </clipPath>
          </defs>
          <image
            href={thumbnail}
            x="0"
            y="0"
            width={width}
            height={imageHeight}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
        </>
      ) : (
        <rect
          x="0"
          y="0"
          width={width}
          height={imageHeight}
          rx="16"
          fill="var(--bg-card)"
        />
      )}

      {/* Caption — transparent background, hugs its content */}
      <foreignObject
        x="0"
        y={imageHeight}
        width={width}
        height={TEXT_AREA_HEIGHT}
      >
        <div
          style={{
            padding: '14px 2px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
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
