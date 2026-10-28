import { describe, expect, it } from 'vitest'
import {
  cloneDemoCollectionSeed,
  createSessionCollectionItem,
  DEMO_COLLECTION_SEED,
} from './demoCollection'
import { sampleCaptureToCardItem } from '../test/fixtures/captureToCardFixture'

describe('demoCollection', () => {
  it('keeps stable seed ids and order', () => {
    expect(DEMO_COLLECTION_SEED.map((entry) => entry.id)).toEqual(['seed-aurora-ridge'])
  })

  it('clones seed items without sharing object references', () => {
    const clone = cloneDemoCollectionSeed()
    expect(clone).toEqual(DEMO_COLLECTION_SEED)
    expect(clone[0]).not.toBe(DEMO_COLLECTION_SEED[0])
  })

  it('creates session items with deterministic ids from the session key', () => {
    const sessionItem = createSessionCollectionItem(sampleCaptureToCardItem, '42')
    expect(sessionItem.id).toBe('session-42')
    expect(sessionItem.title).toBe(sampleCaptureToCardItem.title)
    expect(sessionItem.imageSrc).toBe(sampleCaptureToCardItem.imageSrc)
  })
})
