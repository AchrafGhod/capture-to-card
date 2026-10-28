const SKEL_ROOT = '.ctc-build'

export function resetSkeletonReveal(cardShell: HTMLElement) {
  for (const wrap of cardShell.querySelectorAll<HTMLElement>(SKEL_ROOT)) {
    wrap.classList.add('is-resetting')
    wrap.classList.remove('is-revealed')
    void wrap.offsetWidth
    wrap.classList.remove('is-resetting')
  }
}

export function revealSkeletonContent(cardShell: HTMLElement) {
  for (const wrap of cardShell.querySelectorAll<HTMLElement>(SKEL_ROOT)) {
    wrap.classList.add('is-revealed')
  }
}

export function instantSkeletonReveal(cardShell: HTMLElement) {
  resetSkeletonReveal(cardShell)
  revealSkeletonContent(cardShell)
}

/** Idle in-place cell reveal: show final card chrome without running build animation. */
export function applyInPlacePreviewReady(
  cardShell: HTMLElement,
  cardMedia: HTMLElement,
  cardImage: HTMLImageElement,
) {
  cardShell.classList.add('is-build-complete')
  cardImage.style.visibility = ''
  cardMedia.classList.add('is-revealed')
  instantSkeletonReveal(cardShell)
}
