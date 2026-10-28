import { describe, expect, it } from 'vitest'
import { sampleCaptureToCardItem } from '../../../test/fixtures/captureToCardFixture'
import { itemMorphKey } from './itemMorphKey'

describe('itemMorphKey', () => {
  it('changes when any displayed file field changes', () => {
    const base = itemMorphKey(sampleCaptureToCardItem)
    expect(itemMorphKey({ ...sampleCaptureToCardItem, title: 'other.png' })).not.toBe(
      base,
    )
    expect(
      itemMorphKey({ ...sampleCaptureToCardItem, dimensionsLabel: '1 × 1' }),
    ).not.toBe(base)
  })
})
