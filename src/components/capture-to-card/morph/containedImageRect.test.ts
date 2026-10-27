import { describe, expect, it } from 'vitest'
import { getContainedImageRect } from './containedImageRect'

function mockImage(
  box: DOMRect,
  naturalWidth: number,
  naturalHeight: number,
): HTMLImageElement {
  return {
    getBoundingClientRect: () => box,
    naturalWidth,
    naturalHeight,
  } as HTMLImageElement
}

describe('getContainedImageRect', () => {
  it('letterboxes a wide image in a square thumb', () => {
    const rect = getContainedImageRect(
      mockImage(new DOMRect(10, 20, 52, 52), 1600, 900),
    )
    expect(rect.width).toBe(52)
    expect(rect.height).toBeCloseTo(29.25)
    expect(rect.left).toBe(10)
    expect(rect.top).toBeCloseTo(31.375)
  })

  it('pillarboxes a tall image in a wide box', () => {
    const rect = getContainedImageRect(mockImage(new DOMRect(0, 0, 200, 100), 400, 800))
    expect(rect.height).toBe(100)
    expect(rect.width).toBe(50)
    expect(rect.left).toBe(75)
    expect(rect.top).toBe(0)
  })

  it('falls back to the element box when natural size is missing', () => {
    const box = new DOMRect(5, 5, 40, 40)
    const rect = getContainedImageRect(mockImage(box, 0, 0))
    expect(rect).toEqual({
      left: 5,
      top: 5,
      width: 40,
      height: 40,
    })
  })
})
