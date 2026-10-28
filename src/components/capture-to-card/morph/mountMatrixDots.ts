import { getContainedImageRect } from './containedImageRect'

export function computeDotGrid(
  width: number,
  height: number,
  targetCellPx = 7,
): { cols: number; rows: number } {
  if (width <= 0 || height <= 0) {
    return { cols: 16, rows: 10 }
  }
  const cols = Math.min(32, Math.max(8, Math.round(width / targetCellPx)))
  const rows = Math.min(32, Math.max(6, Math.round(height / targetCellPx)))
  return { cols, rows }
}

function appendDots(container: HTMLElement, count: number) {
  clearMatrixDots(container)
  for (let i = 0; i < count; i++) {
    container.appendChild(document.createElement('i'))
  }
}

export function mountMatrixGrid(container: HTMLElement, cols: number, rows: number) {
  container.style.setProperty('--matrix-cols', String(cols))
  container.style.setProperty('--matrix-rows', String(rows))
  appendDots(container, cols * rows)
}

export function mountMatrixLoader(container: HTMLElement, cols = 4, rows = 4) {
  mountMatrixGrid(container, cols, rows)
}

export function mountMediaDotField(container: HTMLElement, cols: number, rows: number) {
  container.style.setProperty('--ctc-media-dots-cols', String(cols))
  container.style.setProperty('--ctc-media-dots-rows', String(rows))
  appendDots(container, cols * rows)
}

export function clearMatrixDots(container: HTMLElement) {
  container.querySelectorAll('i').forEach((dot) => dot.remove())
}

/** Size the dot field to the painted `object-fit: contain` image and fill it with a grid. */
export function layoutMediaDotField(
  media: HTMLElement,
  dotField: HTMLElement,
  image: HTMLImageElement,
) {
  const mediaBox = media.getBoundingClientRect()
  const painted = getContainedImageRect(image)

  const left = painted.left - mediaBox.left
  const top = painted.top - mediaBox.top

  dotField.style.inset = 'auto'
  dotField.style.left = `${left}px`
  dotField.style.top = `${top}px`
  dotField.style.width = `${painted.width}px`
  dotField.style.height = `${painted.height}px`

  const { cols, rows } = computeDotGrid(painted.width, painted.height)
  mountMediaDotField(dotField, cols, rows)
}
