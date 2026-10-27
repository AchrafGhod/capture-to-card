import type { CaptureToCardItem } from '../captureToCardItem'

/** Stable identity for morph interruption when the displayed file changes. */
export function itemMorphKey(item: CaptureToCardItem): string {
  return [
    item.imageSrc,
    item.title,
    item.width,
    item.height,
    item.dimensionsLabel,
    item.formatSizeLabel,
    item.modifiedLabel,
  ].join('\0')
}
