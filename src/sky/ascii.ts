export interface AsciiPoint {
  x: number // unit-screen [-1,1]
  y: number // unit-screen [-1,1], +y = up
  weight: number // 0..1, brighter -> denser char
}

// sparse -> dense, matching AsciiFlowField's vocabulary
const DENSITY = [' ', '·', ':', '+', '*', '@']

function charFor(weight: number): string {
  const w = Math.max(0, Math.min(1, weight))
  const i = Math.round(w * (DENSITY.length - 1))
  return DENSITY[i]
}

/**
 * Rasterize unit-screen points into an ASCII grid. The unit disc [-1,1]^2 maps
 * to the full grid; +x is right, +y is up. Brighter points win a contested cell.
 */
export function rasterize(points: AsciiPoint[], cols: number, rows: number): string[] {
  const cells: number[] = new Array(cols * rows).fill(-1) // store weight, -1 = empty

  for (const p of points) {
    const col = Math.round(((p.x + 1) / 2) * (cols - 1))
    const row = Math.round((1 - (p.y + 1) / 2) * (rows - 1)) // flip y for screen
    if (col < 0 || col >= cols || row < 0 || row >= rows) continue
    const idx = row * cols + col
    if (p.weight > cells[idx]) cells[idx] = p.weight
  }

  const out: string[] = []
  for (let r = 0; r < rows; r++) {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const w = cells[r * cols + c]
      line += w < 0 ? ' ' : charFor(w)
    }
    out.push(line)
  }
  return out
}
