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

const TEXT_AREA_HEIGHT = 96
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

  return (
    <g
      transform={`translate(${renderX}, ${renderY})`}
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
