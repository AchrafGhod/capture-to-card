import { diagonalRevealOrder, windowProgress } from './revealOrder'
import { layoutMediaDotField } from './mountMatrixDots'
import { instantSkeletonReveal } from './cellBuildDom'

let revealInstanceSeq = 0

export type BuildRevealTiming = {
  durationMs: number
  ease: string
  mediaStart: number
  mediaEnd: number
  titleStart: number
  titleEnd: number
  detailsStart: number
  detailsEnd: number
}

export const defaultBuildRevealTiming: BuildRevealTiming = {
  durationMs: 1680,
  ease: 'cubic-bezier(0.33, 0, 0.12, 1)',
  mediaStart: 0,
  mediaEnd: 0.58,
  titleStart: 0.26,
  titleEnd: 0.72,
  detailsStart: 0.4,
  detailsEnd: 0.96,
}

type MaskRegion = {
  element: HTMLElement
  dots: HTMLElement[]
  cols: number
  rows: number
  order: number[]
  rects: SVGRectElement[]
  maskId: string
}

type BuildRevealDom = {
  cardShell: HTMLElement
  cardMedia: HTMLElement
  cardImage: HTMLImageElement
  mediaDotField: HTMLElement
}

function readMediaGrid(dotField: HTMLElement) {
  const style = getComputedStyle(dotField)
  return {
    cols: Number.parseInt(style.getPropertyValue('--ctc-media-dots-cols') || '14', 10),
    rows: Number.parseInt(style.getPropertyValue('--ctc-media-dots-rows') || '8', 10),
  }
}

function readMatrixGrid(dotsLayer: HTMLElement) {
  const matrix = dotsLayer.querySelector('.ctc-dot-grid')
  if (!matrix) {
    return { cols: 4, rows: 4 }
  }
  const style = getComputedStyle(matrix)
  return {
    cols: Number.parseInt(style.getPropertyValue('--matrix-cols') || '4', 10),
    rows: Number.parseInt(style.getPropertyValue('--matrix-rows') || '4', 10),
  }
}

function nextMaskId(prefix: string) {
  revealInstanceSeq += 1
  return `ctc-${prefix}-${revealInstanceSeq}`
}

function createMaskDefs(
  svg: SVGSVGElement,
  maskId: string,
  cols: number,
  rows: number,
) {
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask')
  mask.setAttribute('id', maskId)
  mask.setAttribute('maskUnits', 'objectBoundingBox')
  mask.setAttribute('maskContentUnits', 'objectBoundingBox')

  const cellW = 1 / cols
  const cellH = 1 / rows
  const rects: SVGRectElement[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', String(col * cellW))
      rect.setAttribute('y', String(row * cellH))
      rect.setAttribute('width', String(cellW))
      rect.setAttribute('height', String(cellH))
      rect.setAttribute('fill', 'black')
      rects.push(rect)
      mask.appendChild(rect)
    }
  }

  defs.appendChild(mask)
  svg.appendChild(defs)
  return rects
}

function mountMaskRegion(
  element: HTMLElement,
  dotsContainer: HTMLElement,
  cols: number,
  rows: number,
  defsHost: SVGSVGElement,
  idPrefix: string,
): MaskRegion {
  const maskId = nextMaskId(idPrefix)
  const rects = createMaskDefs(defsHost, maskId, cols, rows)
  element.style.mask = `url(#${maskId})`
  element.style.webkitMask = `url(#${maskId})`

  const dots = [...dotsContainer.querySelectorAll<HTMLElement>('i')]
  const order = diagonalRevealOrder(cols, rows)

  return { element, dots, cols, rows, order, rects, maskId }
}

function applyRegionProgress(region: MaskRegion, localProgress: number) {
  const total = region.order.length
  if (total === 0) return
  const scaled = Math.min(1, Math.max(0, localProgress)) * total
  const full = Math.floor(scaled)
  const partial = scaled - full

  for (let rank = 0; rank < total; rank++) {
    const cellIdx = region.order[rank]!
    const rect = region.rects[cellIdx]
    const dot = region.dots[cellIdx]
    if (!rect) continue

    if (rank < full) {
      rect.setAttribute('fill', 'white')
      dot?.classList.add('is-gap')
    } else if (rank === full && partial > 0.02) {
      rect.setAttribute('fill', `rgba(255,255,255,${partial.toFixed(3)})`)
      dot?.classList.remove('is-gap')
    } else {
      rect.setAttribute('fill', 'black')
      dot?.classList.remove('is-gap')
    }
  }
}

function finalizeRegion(region: MaskRegion) {
  for (const rect of region.rects) {
    rect.setAttribute('fill', 'white')
  }
  for (const dot of region.dots) {
    dot.classList.add('is-gap')
  }
}

function clearRegionMask(region: MaskRegion, keepDotGaps = false) {
  region.element.style.mask = ''
  region.element.style.webkitMask = ''
  if (keepDotGaps) return
  for (const dot of region.dots) {
    dot.classList.remove('is-gap')
  }
}

function dismissAllDotLayers(cardShell: HTMLElement, cardMedia: HTMLElement) {
  cardShell.classList.add('is-build-complete')
  cardMedia.classList.add('is-revealed')
  for (const wrap of cardShell.querySelectorAll<HTMLElement>('.ctc-build')) {
    wrap.classList.add('is-resetting')
    wrap.classList.add('is-revealed')
    wrap.classList.remove('is-building')
    void wrap.offsetWidth
    wrap.classList.remove('is-resetting')
  }
}

export type CellBuildRevealHandle = {
  cancel: () => void
  finished: Promise<void>
}

export function runCellBuildReveal(
  dom: BuildRevealDom,
  timing: BuildRevealTiming = defaultBuildRevealTiming,
): CellBuildRevealHandle {
  const skelRoots = [...dom.cardShell.querySelectorAll<HTMLElement>('.ctc-build')]
  const titleSkel = skelRoots.find((el) => el.classList.contains('ctc-build--title'))
  const detailSkels = skelRoots.filter((el) =>
    el.classList.contains('ctc-build--detail'),
  )

  const defsHost = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  defsHost.setAttribute('aria-hidden', 'true')
  defsHost.classList.add('ctc-reveal-defs')
  defsHost.style.position = 'absolute'
  defsHost.style.width = '0'
  defsHost.style.height = '0'
  defsHost.style.overflow = 'hidden'
  dom.cardShell.appendChild(defsHost)

  dom.cardImage.style.visibility = ''
  dom.cardMedia.classList.remove('is-revealed')

  layoutMediaDotField(dom.cardMedia, dom.mediaDotField, dom.cardImage)
  const { cols: mediaCols, rows: mediaRows } = readMediaGrid(dom.mediaDotField)

  const regions: MaskRegion[] = [
    mountMaskRegion(
      dom.cardImage,
      dom.mediaDotField,
      mediaCols,
      mediaRows,
      defsHost,
      'media',
    ),
  ]

  if (titleSkel) {
    titleSkel.classList.add('is-building')
    const content = titleSkel.querySelector<HTMLElement>('.ctc-build__text')
    const skeleton = titleSkel.querySelector<HTMLElement>('.ctc-build__dots')
    if (content && skeleton) {
      const { cols, rows } = readMatrixGrid(skeleton)
      regions.push(mountMaskRegion(content, skeleton, cols, rows, defsHost, 'title'))
    }
  }

  for (const detailSkel of detailSkels) {
    detailSkel.classList.add('is-building')
    const content = detailSkel.querySelector<HTMLElement>('.ctc-build__text')
    const skeleton = detailSkel.querySelector<HTMLElement>('.ctc-build__dots')
    if (content && skeleton) {
      const { cols, rows } = readMatrixGrid(skeleton)
      regions.push(mountMaskRegion(content, skeleton, cols, rows, defsHost, 'detail'))
    }
  }

  let rafId = 0
  let cancelled = false
  const driver = document.createElement('div')
  const animation = driver.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: timing.durationMs,
    easing: timing.ease,
    fill: 'forwards',
  })

  const applyGlobalProgress = (global: number) => {
    applyRegionProgress(
      regions[0]!,
      windowProgress(global, timing.mediaStart, timing.mediaEnd),
    )
    if (regions[1]) {
      applyRegionProgress(
        regions[1],
        windowProgress(global, timing.titleStart, timing.titleEnd),
      )
    }
    for (let i = 2; i < regions.length; i++) {
      applyRegionProgress(
        regions[i]!,
        windowProgress(global, timing.detailsStart, timing.detailsEnd),
      )
    }
  }

  const cleanupArtifacts = (finalize: boolean) => {
    if (finalize) {
      applyGlobalProgress(1)
      for (const region of regions) {
        finalizeRegion(region)
      }
      dismissAllDotLayers(dom.cardShell, dom.cardMedia)
      for (const region of regions) {
        clearRegionMask(region, true)
      }
    } else {
      for (const region of regions) {
        clearRegionMask(region, false)
      }
      for (const skel of skelRoots) {
        skel.classList.remove('is-building')
      }
    }
    defsHost.remove()
    animation.cancel()
  }

  let resolveFinished: () => void
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve
  })

  const tick = () => {
    if (cancelled) return
    const duration = animation.effect?.getTiming().duration
    const totalMs = typeof duration === 'number' ? duration : timing.durationMs
    const time = Number(animation.currentTime ?? 0)
    const progress = totalMs > 0 ? Math.min(1, time / totalMs) : 1
    applyGlobalProgress(progress)
    if (animation.playState === 'finished' || progress >= 1) {
      cleanupArtifacts(true)
      resolveFinished()
      return
    }
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  return {
    cancel: () => {
      if (cancelled) return
      cancelled = true
      cancelAnimationFrame(rafId)
      cleanupArtifacts(false)
      resolveFinished()
    },
    finished,
  }
}

export function instantBuildReveal(dom: BuildRevealDom) {
  dom.cardImage.style.visibility = ''
  dom.cardImage.style.mask = ''
  dom.cardImage.style.webkitMask = ''
  dom.cardMedia.classList.add('is-revealed')
  for (const dot of dom.mediaDotField.querySelectorAll('i')) {
    dot.classList.add('is-gap')
  }
  instantSkeletonReveal(dom.cardShell)
}

export function teardownBuildRevealDom(
  cardShell: HTMLElement,
  cardMedia: HTMLElement | null,
) {
  cardShell.classList.remove('is-build-complete')
  cardShell.querySelector('.ctc-reveal-defs')?.remove()
  cardMedia?.classList.remove('is-revealed')
  const image = cardShell.querySelector<HTMLImageElement>(
    '.capture-to-card__card-image',
  )
  if (image) {
    image.style.mask = ''
    image.style.webkitMask = ''
  }
  for (const content of cardShell.querySelectorAll<HTMLElement>('.ctc-build__text')) {
    content.style.mask = ''
    content.style.webkitMask = ''
  }
  const dotField = cardMedia?.querySelector<HTMLElement>(
    '.capture-to-card__media-dot-field',
  )
  if (dotField) {
    dotField.style.inset = ''
    dotField.style.left = ''
    dotField.style.top = ''
    dotField.style.width = ''
    dotField.style.height = ''
  }
  for (const dot of cardShell.querySelectorAll('i')) {
    dot.classList.remove('is-gap')
  }
}
