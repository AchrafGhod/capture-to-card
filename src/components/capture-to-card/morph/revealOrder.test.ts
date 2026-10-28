import { describe, expect, it } from 'vitest'
import { diagonalRevealOrder, windowProgress } from './revealOrder'

describe('revealOrder', () => {
  it('orders cells on a diagonal wave with stable jitter', () => {
    const first = diagonalRevealOrder(4, 3)
    const second = diagonalRevealOrder(4, 3)
    expect(first).toEqual(second)
    expect(first[0]).toBe(0)
    expect(new Set(first).size).toBe(12)
  })

  it('maps global progress through timing windows', () => {
    expect(windowProgress(0.1, 0.2, 0.8)).toBe(0)
    expect(windowProgress(0.5, 0.2, 0.8)).toBeCloseTo(0.5)
    expect(windowProgress(0.9, 0.2, 0.8)).toBe(1)
  })
})
