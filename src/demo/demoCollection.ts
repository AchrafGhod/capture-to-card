import type { CaptureToCardItem } from '../components/capture-to-card/captureToCardItem'
import landscapeSrc from '../assets/landscape-960x540.png'

export type DemoCollectionItem = CaptureToCardItem & {
  id: string
}

export const DEMO_COLLECTION_SEED: DemoCollectionItem[] = [
  {
    id: 'seed-aurora-ridge',
    imageSrc: landscapeSrc,
    title: 'aurora-ridge.png',
    width: 960,
    height: 540,
    dimensionsLabel: '960 × 540',
    formatSizeLabel: 'PNG · 4.2 KB',
    modifiedLabel: 'Oct 12, 2026, 3:40 PM',
  },
]

export function cloneDemoCollectionSeed(): DemoCollectionItem[] {
  return DEMO_COLLECTION_SEED.map((entry) => ({ ...entry }))
}

export function createSessionCollectionItem(
  item: CaptureToCardItem,
  sessionKey: string,
): DemoCollectionItem {
  return {
    id: `session-${sessionKey}`,
    ...item,
  }
}
