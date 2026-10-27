import type { ViewRect } from './containedImageRect'

export type MorphTiming = {
  imageMs: number
  titleMs: number
  sourceFadeMs: number
  cardShellMs: number
  cardShellDelayMs: number
  detailsDelayMs: number
  detailsStaggerMs: number
  detailsMs: number
  backMs: number
}

export const defaultMorphTiming: MorphTiming = {
  imageMs: 560,
  titleMs: 500,
  sourceFadeMs: 140,
  cardShellMs: 360,
  cardShellDelayMs: 140,
  detailsDelayMs: 200,
  detailsStaggerMs: 55,
  detailsMs: 240,
  backMs: 200,
}

const easeOut = 'cubic-bezier(0.22, 1, 0.36, 1)'
const easeInOut = 'cubic-bezier(0.4, 0, 0.2, 1)'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export type ForwardMorphDomTarget = {
  sourceLayer: HTMLElement
  cardShell: HTMLElement
  cardDetails: HTMLElement
  cardImage: HTMLImageElement
  cardTitle: HTMLElement
  sourceThumb?: HTMLElement
  sourceName?: HTMLElement
}

export type ForwardMorphMeasure = {
  imageFrom: ViewRect
  imageTo: ViewRect
  titleFrom: ViewRect
  titleTo: ViewRect
  titleFontFrom: string
  titleFontTo: string
  titleWeightFrom: string
  titleWeightTo: string
  titleLetterSpacingFrom: string
  titleLetterSpacingTo: string
  imageSrc: string
  titleText: string
}

function placeFixedRect(el: HTMLElement, rect: ViewRect) {
  el.style.left = `${rect.left}px`
  el.style.top = `${rect.top}px`
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
}

function flipDelta(from: ViewRect, to: ViewRect) {
  const dx = from.left - to.left
  const dy = from.top - to.top
  const sx = to.width > 0 ? from.width / to.width : 1
  const sy = to.height > 0 ? from.height / to.height : 1
  return { dx, dy, sx, sy }
}

function imageTravelKeyframes(from: ViewRect, to: ViewRect) {
  const { dx, dy, sx, sy } = flipDelta(from, to)
  return [
    {
      offset: 0,
      transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
    },
    {
      offset: 1,
      transform: 'translate(0, 0) scale(1, 1)',
    },
  ]
}

function titleTravelKeyframes(
  from: ViewRect,
  to: ViewRect,
  fontFrom: string,
  fontTo: string,
  weightFrom: string,
  weightTo: string,
  letterSpacingFrom: string,
  letterSpacingTo: string,
) {
  return [
    {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      fontSize: fontFrom,
      fontWeight: weightFrom,
      letterSpacing: letterSpacingFrom,
    },
    {
      left: `${to.left}px`,
      top: `${to.top}px`,
      width: `${to.width}px`,
      height: `${to.height}px`,
      fontSize: fontTo,
      fontWeight: weightTo,
      letterSpacing: letterSpacingTo,
    },
  ]
}

function safeFinished(animation: Animation): Promise<void> {
  return animation.finished.then(() => undefined).catch(() => undefined)
}

export function buildForwardFlyout(measure: ForwardMorphMeasure) {
  const imageFly = document.createElement('img')
  imageFly.className = 'ctc-morph-fly__image'
  imageFly.src = measure.imageSrc
  imageFly.alt = ''
  imageFly.decoding = 'sync'
  placeFixedRect(imageFly, measure.imageTo)

  const titleFly = document.createElement('h2')
  titleFly.className = 'ctc-morph-fly__title capture-to-card__card-title'
  titleFly.textContent = measure.titleText
  placeFixedRect(titleFly, measure.titleFrom)

  return { imageFly, titleFly }
}

export type RunForwardMorphParams = {
  timing: MorphTiming
  measure: ForwardMorphMeasure
  dom: {
    flyRoot: HTMLDivElement
    imageFly: HTMLImageElement
    titleFly: HTMLHeadingElement
    sourceLayer: HTMLElement
    cardShell: HTMLElement
    cardDetails: HTMLElement
    cardImage: HTMLImageElement
    cardTitle: HTMLElement
    sourceThumb?: HTMLElement
    sourceName?: HTMLElement
  }
}

export function runForwardMorph(params: RunForwardMorphParams): Animation[] {
  const { timing, measure, dom } = params
  const animations: Animation[] = []

  if (dom.sourceThumb) dom.sourceThumb.style.visibility = 'hidden'
  if (dom.sourceName) dom.sourceName.style.visibility = 'hidden'
  dom.cardImage.style.visibility = 'hidden'
  dom.cardTitle.style.visibility = 'hidden'
  const cardBody = dom.cardTitle.parentElement
  if (cardBody instanceof HTMLElement) {
    cardBody.style.visibility = 'hidden'
  }
  dom.cardDetails.style.opacity = '0'
  dom.cardDetails.style.transform = ''
  dom.cardShell.style.opacity = '0'
  dom.sourceLayer.style.pointerEvents = 'none'

  const shellAnim = dom.cardShell.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: timing.cardShellMs,
    delay: timing.cardShellDelayMs,
    easing: easeOut,
    fill: 'forwards',
  })
  animations.push(shellAnim)

  const imageAnim = dom.imageFly.animate(
    imageTravelKeyframes(measure.imageFrom, measure.imageTo),
    { duration: timing.imageMs, easing: easeOut, fill: 'forwards' },
  )
  animations.push(imageAnim)

  const titleAnim = dom.titleFly.animate(
    titleTravelKeyframes(
      measure.titleFrom,
      measure.titleTo,
      measure.titleFontFrom,
      measure.titleFontTo,
      measure.titleWeightFrom,
      measure.titleWeightTo,
      measure.titleLetterSpacingFrom,
      measure.titleLetterSpacingTo,
    ),
    { duration: timing.titleMs, easing: easeOut, fill: 'forwards' },
  )
  animations.push(titleAnim)

  const sourceFade = dom.sourceLayer.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: timing.sourceFadeMs,
    easing: easeInOut,
    fill: 'forwards',
  })
  animations.push(sourceFade)

  const detailRows = [...dom.cardDetails.querySelectorAll<HTMLElement>(':scope > *')]
  const detailTargets = detailRows.length > 0 ? detailRows : [dom.cardDetails]
  for (const [index, row] of detailTargets.entries()) {
    row.style.opacity = '0'
    const detailsAnim = row.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: timing.detailsMs,
        delay: timing.detailsDelayMs + index * timing.detailsStaggerMs,
        easing: easeOut,
        fill: 'forwards',
      },
    )
    animations.push(detailsAnim)
  }

  return animations
}

function clearElementAnimationStyles(...elements: HTMLElement[]) {
  for (const element of elements) {
    if (typeof element.getAnimations !== 'function') continue
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.cancel()
    }
  }
}

/** Idempotent: cancel WAAPI fills and drop temporary inline styles from a morph. */
export function finishForwardMorph(dom: ForwardMorphDomTarget) {
  clearElementAnimationStyles(
    dom.cardImage,
    dom.cardTitle,
    dom.cardDetails,
    dom.sourceLayer,
    dom.cardShell,
  )
  if (dom.sourceThumb) dom.sourceThumb.style.visibility = ''
  if (dom.sourceName) dom.sourceName.style.visibility = ''
  dom.cardImage.style.visibility = ''
  dom.cardTitle.style.visibility = ''
  const cardBody = dom.cardTitle.parentElement
  if (cardBody instanceof HTMLElement) {
    cardBody.style.visibility = ''
  }
  dom.cardDetails.style.opacity = ''
  dom.cardDetails.style.transform = ''
  for (const child of dom.cardDetails.children) {
    if (child instanceof HTMLElement) {
      child.style.opacity = ''
      child.style.transform = ''
    }
  }
  dom.sourceLayer.style.pointerEvents = ''
  dom.sourceLayer.style.opacity = ''
  dom.cardShell.style.opacity = ''
}

export function cancelAnimations(animations: Animation[]) {
  for (const animation of animations) {
    animation.cancel()
  }
}

export async function waitForMorphSettled(animations: Animation[]) {
  await Promise.all(animations.map(safeFinished))
}

export function runReducedForwardMorph(dom: ForwardMorphDomTarget) {
  dom.sourceLayer.style.opacity = '0'
  dom.cardShell.style.opacity = '1'
  dom.cardDetails.style.opacity = '1'
  finishForwardMorph(dom)
}

export type RunBackMorphParams = {
  timing: MorphTiming
  sourceLayer: HTMLElement
  destinationLayer: HTMLElement
}

export function runBackMorph(params: RunBackMorphParams): Animation[] {
  const { timing, sourceLayer, destinationLayer } = params
  sourceLayer.style.opacity = '0'
  destinationLayer.style.opacity = '1'

  const destFade = destinationLayer.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: timing.backMs,
    easing: easeInOut,
    fill: 'forwards',
  })
  const sourceFade = sourceLayer.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: timing.backMs,
    easing: easeInOut,
    fill: 'forwards',
  })
  return [destFade, sourceFade]
}

export function finishBackMorph(params: RunBackMorphParams) {
  params.destinationLayer.style.opacity = '0'
  params.sourceLayer.style.opacity = '1'
  clearElementAnimationStyles(params.sourceLayer, params.destinationLayer)
  params.sourceLayer.style.opacity = ''
}

/** Drop flyout + cancel tracked animations without restoring card DOM. */
export function abortMorphFlyout(animations: Animation[], flyRoot: HTMLElement | null) {
  cancelAnimations(animations)
  flyRoot?.remove()
}
