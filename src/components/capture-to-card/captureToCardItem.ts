/** Shared data shape for explorer row and destination card (one item per file). */
export type CaptureToCardItem = {
  imageSrc: string
  title: string
  width: number
  height: number
  dimensionsLabel: string
  formatSizeLabel: string
  /** File last-modified time (from `File.lastModified`), not creation or import time. */
  modifiedLabel: string
}
