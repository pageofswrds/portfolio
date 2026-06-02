import { describe, it, expect } from 'vitest'
import { rasterize, type AsciiPoint } from './ascii'

describe('rasterize', () => {
  it('returns rows x cols grid of spaces when empty', () => {
    const grid = rasterize([], 4, 3)
    expect(grid.length).toBe(3)
    expect(grid.every((r) => r === '    ')).toBe(true)
  })

  it('places a bright point near the grid center for a centered star', () => {
    const pts: AsciiPoint[] = [{ x: 0, y: 0, weight: 1 }]
    const grid = rasterize(pts, 9, 9)
    // center cell is row 4, col 4
    expect(grid[4][4]).not.toBe(' ')
  })

  it('maps unit +x to the right edge and +y to the top', () => {
    const right = rasterize([{ x: 1, y: 0, weight: 1 }], 9, 9)
    expect(right[4][8]).not.toBe(' ')
    const top = rasterize([{ x: 0, y: 1, weight: 1 }], 9, 9)
    expect(top[0][4]).not.toBe(' ')
  })
})
