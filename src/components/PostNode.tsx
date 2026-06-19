interface PostNodeProps {
  x: number
  y: number
  /** Bounding-box width the pill is centered within (and wraps at, max). */
  maxWidth: number
  /** Bounding-box height the pill is centered within. */
  boxHeight: number
  title: string
  meta?: string
  onClick?: () => void
}

/**
 * A text node for the Research graph: a rounded pill that hugs its own title
 * (variable width), with a short meta line beneath. Anchored on its center
 * (x, y) so edges connect node centers; the surrounding foreignObject is just a
 * generous bounding box the pill is centered within.
 */
export function PostNode({
  x,
  y,
  maxWidth,
  boxHeight,
  title,
  meta,
  onClick,
}: PostNodeProps) {
  return (
    <g
      transform={`translate(${x - maxWidth / 2}, ${y - boxHeight / 2})`}
      className="post-node cursor-pointer"
      onClick={onClick}
    >
      {/* Hover scale lives on this SVG group, never on the HTML inside the
          foreignObject — transforming foreignObject content makes Chrome/WebKit
          drop its layer mid-animation, which read as the node flickering out. */}
      <g className="post-node-content">
        <foreignObject x={0} y={0} width={maxWidth} height={boxHeight}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              className="post-node-pill"
              style={{ maxWidth: `${maxWidth - 12}px` }}
            >
              <span className="post-node-title">{title}</span>
              {meta && <span className="post-node-meta">{meta}</span>}
            </div>
          </div>
        </foreignObject>
      </g>
    </g>
  )
}
