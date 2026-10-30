export type PixelRevealDirection =
  'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top'

function noise(value: number, seed: number) {
  let hash = Math.imul(value + seed, 0x45d9f3b)
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b)
  return ((hash ^ (hash >>> 16)) >>> 0) / 0x100000000
}

/** Bounded grid with broad random lobes and smaller scattered edge pixels. */
export function pixelRevealGrid(
  width: number,
  height: number,
  pixelSize: number,
  direction: PixelRevealDirection,
  seed = 0,
) {
  const size = Number.isFinite(pixelSize) ? Math.max(8, pixelSize) : 24
  let columns = Math.max(1, Math.ceil(width / size))
  let rows = Math.max(1, Math.ceil(height / size))
  const scale = Math.min(1, Math.sqrt(600 / (columns * rows)))
  columns = Math.max(1, Math.floor(columns * scale))
  rows = Math.max(1, Math.floor(rows * scale))
  const vertical = direction === 'top-to-bottom' || direction === 'bottom-to-top'
  const length = vertical ? rows : columns
  const reverse = direction === 'right-to-left' || direction === 'bottom-to-top'
  const roughness = Math.max(1, length * 0.32)
  const cells = Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const position = vertical ? row : column
    const sweepPosition = reverse ? length - 1 - position : position
    const lane = (vertical ? column : row) / 3
    const group = Math.floor(lane)
    const fraction = lane - group
    const blend = fraction * fraction * (3 - 2 * fraction)
    const lobe =
      noise(group + 101, seed) * (1 - blend) + noise(group + 102, seed) * blend
    const scatter = (noise(index + 1001, seed) - 0.5) * Math.min(1.5, roughness * 0.35)
    return {
      x: column / columns,
      y: row / rows,
      width: 1 / columns,
      height: 1 / rows,
      delay: sweepPosition + (lobe - 0.5) * roughness + scatter,
      fade: noise(index + 2001, seed),
    }
  })
  // Keep every seed inside the selected duration, including leading outliers.
  const first = Math.min(...cells.map((cell) => cell.delay))
  const last = Math.max(...cells.map((cell) => cell.delay))
  return cells.map((cell) => ({
    ...cell,
    delay: (cell.delay - first) / (last - first + 0.001),
  }))
}
