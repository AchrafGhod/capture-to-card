import type { ViewRect } from './containedImageRect'
import { instantBuildReveal } from './runCellBuildReveal'
import {
  instantSkeletonReveal,
  revealSkeletonContent,
  resetSkeletonReveal,
} from './cellBuildDom'

export type MorphTiming = {
  travelMs: number
  sourceFadeMs: number
  travelEase: string
  fadeEase: string
}

export const defaultMorphTiming: MorphTiming = {
  travelMs: 920,
  sourceFadeMs: 220,
  travelEase: 'cubic-bezier(0.33, 0, 0.12, 1)',
  fadeEase: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
}

const DEST_EXTRA_SELECTOR =
  ':scope > .capture-to-card__zone-label, :scope > .capture-to-card__actions--card'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export type ForwardMorphDomTarget = {
  previewLayer?: HTMLElement
  destinationLayer: HTMLElement
  cardShell: HTMLElement
  cardImage: HTMLImageElement
  cardTitle: HTMLElement
  cardDetails: HTMLElement
}

export type ForwardMorphMeasure = {
  surfaceFrom: ViewRect
  surfaceTo: ViewRect
  surfaceRadiusFrom: string
  surfaceRadiusTo: string
  surfaceBackgroundFrom: string
  surfaceBackgroundTo: string
  surfaceShadowTo: string
  imageFrom: ViewRect
  imageTo: ViewRect
  imageSrc: string
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

export function computeMediaPhaseRect(
  cardShell: HTMLElement,
  cardMedia: HTMLElement,
): ViewRect {
  const shell = cardShell.getBoundingClientRect()
  const media = cardMedia.getBoundingClientRect()
  const padBottom = Number.parseFloat(getComputedStyle(cardShell).paddingBottom) || 0
  return {
    left: shell.left,
    top: shell.top,
    width: shell.width,
    height: Math.max(media.bottom - shell.top + padBottom, media.height),
  }
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

function surfaceTravelKeyframes(measure: ForwardMorphMeasure) {
  return [
    {
      left: `${measure.surfaceFrom.left}px`,
      top: `${measure.surfaceFrom.top}px`,
      width: `${measure.surfaceFrom.width}px`,
      height: `${measure.surfaceFrom.height}px`,
      borderRadius: measure.surfaceRadiusFrom,
      backgroundColor: measure.surfaceBackgroundFrom,
      boxShadow: 'none',
    },
    {
      left: `${measure.surfaceTo.left}px`,
      top: `${measure.surfaceTo.top}px`,
      width: `${measure.surfaceTo.width}px`,
      height: `${measure.surfaceTo.height}px`,
      borderRadius: measure.surfaceRadiusTo,
      backgroundColor: measure.surfaceBackgroundTo,
      boxShadow: measure.surfaceShadowTo,
    },
  ]
}

function safeFinished(animation: Animation): Promise<void> {
  return animation.finished.then(() => undefined).catch(() => undefined)
}

export function buildForwardFlyout(measure: ForwardMorphMeasure) {
  const surfaceFly = document.createElement('div')
  surfaceFly.className = 'ctc-morph-fly__surface'
  placeFixedRect(surfaceFly, measure.surfaceFrom)
  surfaceFly.style.borderRadius = measure.surfaceRadiusFrom
  surfaceFly.style.backgroundColor = measure.surfaceBackgroundFrom
  surfaceFly.style.boxShadow = 'none'

  const imageFly = document.createElement('img')
  imageFly.className = 'ctc-morph-fly__image'
  imageFly.src = measure.imageSrc
  imageFly.alt = ''
  imageFly.decoding = 'sync'
  placeFixedRect(imageFly, measure.imageTo)
  const imageDelta = flipDelta(measure.imageFrom, measure.imageTo)
  imageFly.style.transform = `translate(${imageDelta.dx}px, ${imageDelta.dy}px) scale(${imageDelta.sx}, ${imageDelta.sy})`

  return { surfaceFly, imageFly }
}

export type RunForwardMorphParams = {
  timing: MorphTiming
  measure: ForwardMorphMeasure
  dom: ForwardMorphDomTarget & {
    flyRoot: HTMLDivElement
    surfaceFly: HTMLElement
    imageFly: HTMLImageElement
  }
}

function destinationExtras(destinationLayer: HTMLElement) {
  return [...destinationLayer.querySelectorAll<HTMLElement>(DEST_EXTRA_SELECTOR)]
}

function cardMediaElement(cardShell: HTMLElement) {
  return cardShell.querySelector<HTMLElement>('.capture-to-card__card-media')
}

export function prepareDomForCellBuildReveal(dom: ForwardMorphDomTarget) {
  dom.cardImage.style.visibility = 'hidden'
  dom.previewLayer?.style.setProperty('pointer-events', 'none')
  resetSkeletonReveal(dom.cardShell)
  dom.cardShell.classList.remove('is-build-complete')

  dom.cardShell.style.transition = 'none'
  dom.cardShell.style.background = 'transparent'
  dom.cardShell.style.borderColor = 'transparent'
  dom.cardShell.style.boxShadow = 'none'
  dom.cardShell.style.transform = 'none'
  const cardMedia = cardMediaElement(dom.cardShell)
  if (cardMedia) {
    cardMedia.style.background = 'transparent'
    cardMedia.classList.remove('is-revealed')
  }
}

export function runForwardMorph(params: RunForwardMorphParams): Animation[] {
  const { timing, measure, dom } = params
  const animations: Animation[] = []
  const fill = { fill: 'forwards' as const }

  prepareDomForCellBuildReveal(dom)

  const extras = destinationExtras(dom.destinationLayer)
  for (const extra of extras) {
    extra.style.opacity = '0'
  }

  const travel = {
    duration: timing.travelMs,
    easing: timing.travelEase,
    ...fill,
  }

  animations.push(dom.surfaceFly.animate(surfaceTravelKeyframes(measure), travel))
  animations.push(
    dom.imageFly.animate(
      imageTravelKeyframes(measure.imageFrom, measure.imageTo),
      travel,
    ),
  )

  if (dom.previewLayer) {
    animations.push(
      dom.previewLayer.animate([{ opacity: 1 }, { opacity: 0.25 }], {
        duration: timing.sourceFadeMs,
        easing: timing.fadeEase,
        ...fill,
      }),
    )
  }

  const bodyFade = {
    duration: timing.travelMs * 0.38,
    delay: timing.travelMs * 0.42,
    easing: timing.fadeEase,
    ...fill,
  }
  for (const extra of extras) {
    animations.push(extra.animate([{ opacity: 0 }, { opacity: 1 }], bodyFade))
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

function resetCardChrome(cardShell: HTMLElement) {
  cardShell.style.transition = ''
  cardShell.style.background = ''
  cardShell.style.borderColor = ''
  cardShell.style.boxShadow = ''
  cardShell.style.transform = ''
  cardShell.style.opacity = ''
  const cardMedia = cardMediaElement(cardShell)
  if (cardMedia) {
    cardMedia.style.background = ''
    cardMedia.classList.add('is-revealed')
  }
}

function resetDestinationExtras(destinationLayer: HTMLElement) {
  for (const extra of destinationExtras(destinationLayer)) {
    extra.style.opacity = ''
  }
}

export function finishForwardMorphTravel(dom: ForwardMorphDomTarget) {
  const previewLayer = dom.previewLayer
  clearElementAnimationStyles(
    dom.cardImage,
    dom.cardTitle,
    dom.cardDetails,
    ...(previewLayer ? [previewLayer] : []),
    dom.cardShell,
    dom.destinationLayer,
  )
  resetDestinationExtras(dom.destinationLayer)
  dom.cardShell.style.transition = ''
  dom.cardShell.style.background = ''
  dom.cardShell.style.borderColor = ''
  dom.cardShell.style.boxShadow = ''
  dom.cardShell.style.transform = ''
  dom.cardShell.style.opacity = ''
  const cardMedia = cardMediaElement(dom.cardShell)
  if (cardMedia) {
    cardMedia.style.background = ''
  }
  if (previewLayer) {
    previewLayer.style.pointerEvents = ''
    previewLayer.style.opacity = ''
  }
}

export function finishForwardMorph(dom: ForwardMorphDomTarget) {
  finishForwardMorphTravel(dom)
  dom.cardImage.style.visibility = ''
  resetCardChrome(dom.cardShell)
  revealSkeletonContent(dom.cardShell)
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
  const cardMedia = cardMediaElement(dom.cardShell)
  const mediaDotField = cardMedia?.querySelector<HTMLElement>(
    '.capture-to-card__media-dot-field',
  )
  if (cardMedia && mediaDotField) {
    instantBuildReveal({
      cardShell: dom.cardShell,
      cardMedia,
      cardImage: dom.cardImage,
      mediaDotField,
    })
  } else {
    instantSkeletonReveal(dom.cardShell)
  }
  finishForwardMorph(dom)
}

export function abortMorphFlyout(animations: Animation[], flyRoot: HTMLElement | null) {
  cancelAnimations(animations)
  flyRoot?.remove()
}
