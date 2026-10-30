import { describe, expect, it } from 'vitest'
import { pixelRevealGrid } from './pixelRevealGrid'

describe('pixelRevealGrid', () => {
  it('covers the image with square cells and a staggered left-to-right sweep', () => {
    const cells = pixelRevealGrid(240, 120, 24, 'left-to-right')
    expect(cells).toHaveLength(50)
    expect(
      cells.reduce((area, cell) => area + cell.width * cell.height, 0),
    ).toBeCloseTo(1)
    expect(cells[0]!.width * 240).toBeCloseTo(cells[0]!.height * 120)
    expect(cells[0]!.delay).toBeLessThan(cells[9]!.delay)
    expect(cells[0]!.delay).not.toBe(cells[10]!.delay)
    expect(cells.every((cell) => cell.delay >= 0 && cell.delay < 1)).toBe(true)
  })

  it('reverses the sweep without changing cell geometry', () => {
    const cells = pixelRevealGrid(240, 120, 24, 'right-to-left')
    expect(cells[0]!.x).toBe(0)
    expect(cells[9]!.x).toBe(0.9)
    expect(cells[0]!.delay).toBeGreaterThan(cells[9]!.delay)
  })

  it('varies the front across several cells and changes its shape with the seed', () => {
    const first = pixelRevealGrid(640, 360, 24, 'top-to-bottom', 42)
    const second = pixelRevealGrid(640, 360, 24, 'top-to-bottom', 97)
    const middleRow = first.filter((cell) => cell.y === first[7 * 27]!.y)
    const spread =
      Math.max(...middleRow.map((cell) => cell.delay)) -
      Math.min(...middleRow.map((cell) => cell.delay))
    expect(spread).toBeGreaterThan(0.1)
    expect(first.map((cell) => cell.delay)).not.toEqual(
      second.map((cell) => cell.delay),
    )
  })

  it('bounds the number of animated cells for large images and invalid sizes', () => {
    for (const size of [0, -10, NaN, 8]) {
      const cells = pixelRevealGrid(3840, 2160, size, 'left-to-right')
      expect(cells.length).toBeLessThanOrEqual(600)
      expect(
        cells.reduce((area, cell) => area + cell.width * cell.height, 0),
      ).toBeCloseTo(1)
    }
  })

  it.each(['top-to-bottom', 'bottom-to-top'] as const)(
    'sweeps vertically: %s',
    (direction) => {
      const cells = pixelRevealGrid(240, 120, 24, direction)
      const top = cells[0]!
      const bottom = cells[40]!
      expect(top.x).toBe(bottom.x)
      expect(top.y).toBeLessThan(bottom.y)
      expect(top.delay < bottom.delay).toBe(direction === 'top-to-bottom')
    },
  )
})
