import { instantBuildReveal } from './runCellBuildReveal'
import {
  instantSkeletonReveal,
  revealSkeletonContent,
  resetSkeletonReveal,
} from './cellBuildDom'

const DEST_EXTRA_SELECTOR =
  ':scope > .capture-to-card__zone-label, :scope > .capture-to-card__actions--card'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export type ForwardMorphDomTarget = {
  destinationLayer: HTMLElement
  cardShell: HTMLElement
  cardImage: HTMLImageElement
  cardTitle: HTMLElement
  cardDetails: HTMLElement
}

function destinationExtras(destinationLayer: HTMLElement) {
  return [...destinationLayer.querySelectorAll<HTMLElement>(DEST_EXTRA_SELECTOR)]
}

function cardMediaElement(cardShell: HTMLElement) {
  return cardShell.querySelector<HTMLElement>('.capture-to-card__card-media')
}

export function prepareDomForCellBuildReveal(dom: ForwardMorphDomTarget) {
  dom.cardImage.style.visibility = 'hidden'
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
  clearElementAnimationStyles(
    dom.cardImage,
    dom.cardTitle,
    dom.cardDetails,
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
}

export function finishForwardMorph(dom: ForwardMorphDomTarget) {
  finishForwardMorphTravel(dom)
  dom.cardImage.style.visibility = ''
  resetCardChrome(dom.cardShell)
  revealSkeletonContent(dom.cardShell)
}

function safeFinished(animation: Animation): Promise<void> {
  return animation.finished.then(() => undefined).catch(() => undefined)
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
