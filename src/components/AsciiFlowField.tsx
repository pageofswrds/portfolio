import { useEffect, useRef, useState, useCallback } from 'react'

interface AsciiFlowFieldProps {
  x: number
  y: number
  cols?: number
  rows?: number
  cellSize?: number
}

// Characters ordered by visual density (sparse to dense)
const DENSITY_CHARS = [' ', '·', ':', '-', '~', '+', '=', '#', '@']

function getMagnitudeChar(magnitude: number): string {
  // Map magnitude to character index
  const normalized = Math.min(magnitude / 3, 1) // normalize, cap at 1
  const index = Math.floor(normalized * (DENSITY_CHARS.length - 1))
  return DENSITY_CHARS[index]
}

export function AsciiFlowField({
  x,
  y,
  cols = 40,
  rows = 25,
  cellSize = 12,
}: AsciiFlowFieldProps) {
  const cellHeight = cellSize
  const height = rows * cellHeight
  const padding = 16

  const [grid, setGrid] = useState<{ vx: number; vy: number }[][]>(() =>
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ vx: 0, vy: 0 }))
    )
  )

  const prevMouseRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const gridRef = useRef(grid)
  const animationRef = useRef<number | undefined>(undefined)

  // Keep gridRef in sync
  useEffect(() => {
    gridRef.current = grid
  }, [grid])

  // Physics update loop
  useEffect(() => {
    let lastTime = performance.now()

    const update = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05) // cap delta time
      lastTime = currentTime

      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })))

        // Apply diffusion and damping
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const cell = newGrid[row][col]

            // Diffuse from neighbors
            let avgVx = 0
            let avgVy = 0
            let neighborCount = 0

            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue
                const nr = row + dr
                const nc = col + dc
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                  avgVx += prevGrid[nr][nc].vx
                  avgVy += prevGrid[nr][nc].vy
                  neighborCount++
                }
              }
            }

            if (neighborCount > 0) {
              const diffusionRate = 2.0 * dt
              cell.vx += (avgVx / neighborCount - cell.vx) * diffusionRate
              cell.vy += (avgVy / neighborCount - cell.vy) * diffusionRate
            }

            // Apply damping
            const damping = Math.exp(-1.5 * dt)
            cell.vx *= damping
            cell.vy *= damping
          }
        }

        return newGrid
      })

      animationRef.current = requestAnimationFrame(update)
    }

    animationRef.current = requestAnimationFrame(update)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [rows, cols])

  // Handle mouse movement
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Calculate actual cell width from rendered element
    const actualCellWidth = rect.width / cols
    const actualCellHeight = rect.height / rows
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const now = performance.now()

    if (prevMouseRef.current) {
      const dt = (now - prevMouseRef.current.time) / 1000
      if (dt > 0 && dt < 0.1) { // ignore if too slow (probably first frame after pause)
        const velX = (mouseX - prevMouseRef.current.x) / dt / 50 // scale down
        const velY = (mouseY - prevMouseRef.current.y) / dt / 50

        // Apply force to nearby cells
        const col = Math.floor(mouseX / actualCellWidth)
        const row = Math.floor(mouseY / actualCellHeight)
        const radius = 3

        setGrid(prevGrid => {
          const newGrid = prevGrid.map(r => r.map(c => ({ ...c })))

          for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
              const nr = row + dr
              const nc = col + dc
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const dist = Math.sqrt(dr * dr + dc * dc)
                const falloff = Math.max(0, 1 - dist / radius)
                newGrid[nr][nc].vx += velX * falloff * 0.3
                newGrid[nr][nc].vy += velY * falloff * 0.3
              }
            }
          }

          return newGrid
        })
      }
    }

    prevMouseRef.current = { x: mouseX, y: mouseY, time: now }
  }, [rows, cols])

  const handleMouseLeave = useCallback(() => {
    prevMouseRef.current = null
  }, [])

  // Render grid to ASCII
  const asciiContent = grid
    .map(row =>
      row.map(cell => {
        const magnitude = Math.sqrt(cell.vx * cell.vx + cell.vy * cell.vy)
        return getMagnitudeChar(magnitude)
      }).join('')
    )
    .join('\n')

  // Estimate width for foreignObject (will be sized by content)
  const estimatedWidth = cols * cellSize + padding * 2

  return (
    <g>
      <text
        x={x}
        y={y - 12}
        fill="var(--tx-tertiary)"
        fontSize="14"
        fontFamily="var(--font-mono)"
      >
        interact with me! (desktop cursors only rn)
      </text>
      <foreignObject x={x} y={y} width={estimatedWidth} height={height + padding * 2 + 2}>
        <div
          // @ts-expect-error xmlns is valid for foreignObject content
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--bd-primary)',
            borderRadius: 16,
            padding,
            boxSizing: 'border-box',
          }}
        >
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            height,
            overflow: 'hidden',
            cursor: 'crosshair',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: cellSize * 0.9,
              lineHeight: `${cellHeight}px`,
              color: 'var(--tx-primary)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {asciiContent}
          </pre>
        </div>
      </div>
    </foreignObject>
    </g>
  )
}
