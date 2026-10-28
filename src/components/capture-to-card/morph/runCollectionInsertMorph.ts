import type { ViewRect } from './containedImageRect'
import { prefersReducedMotion } from './runMorphAnimations'

export type CollectionInsertTiming = {
  holdAfterBuildMs: number
  insertMs: number
  neighborMs: number
  ease: string
}

export const defaultCollectionInsertTiming: CollectionInsertTiming = {
  holdAfterBuildMs: 300,
  insertMs: 640,
  neighborMs: 520,
  ease: 'cubic-bezier(0.33, 0, 0.12, 1)',
}

function viewRect(el: Element): ViewRect {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

function flipDelta(from: ViewRect, to: ViewRect) {
  const dx = from.left - to.left
  const dy = from.top - to.top
  const sx = to.width > 0 ? from.width / to.width : 1
  const sy = to.height > 0 ? from.height / to.height : 1
  return { dx, dy, sx, sy }
}

function flipKeyframes(from: ViewRect, to: ViewRect) {
  const { dx, dy, sx, sy } = flipDelta(from, to)
  return [
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
    { transform: 'translate(0, 0) scale(1, 1)' },
  ]
}

function safeFinished(animation: Animation): Promise<void> {
  return animation.finished.then(() => undefined).catch(() => undefined)
}

export type CollectionNeighborFlip = {
  id: string
  el: HTMLElement
  from: ViewRect
}

export type CollectionInsertMeasure = {
  buildShellFrom: ViewRect
  newTile: HTMLElement
  neighbors: CollectionNeighborFlip[]
}

export function queryCollectionTiles(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-collection-tile]'))
}

export function runCollectionInsertMorph(
  measure: CollectionInsertMeasure,
  timing: CollectionInsertTiming,
): Animation[] {
  if (prefersReducedMotion()) return []

  const fill = { fill: 'forwards' as const }
  const animations: Animation[] = []
  const newTileTo = viewRect(measure.newTile)

  measure.newTile.style.transformOrigin = 'top left'
  measure.newTile.style.willChange = 'transform'

  animations.push(
    measure.newTile.animate(flipKeyframes(measure.buildShellFrom, newTileTo), {
      duration: timing.insertMs,
      easing: timing.ease,
      ...fill,
    }),
  )

  for (const neighbor of measure.neighbors) {
    const to = viewRect(neighbor.el)
    neighbor.el.style.transformOrigin = 'top left'
    neighbor.el.style.willChange = 'transform'
    animations.push(
      neighbor.el.animate(flipKeyframes(neighbor.from, to), {
        duration: timing.neighborMs,
        easing: timing.ease,
        ...fill,
      }),
    )
  }

  return animations
}

export function finishCollectionInsertMorph(elements: HTMLElement[]) {
  for (const el of elements) {
    el.style.transform = ''
    el.style.transformOrigin = ''
    el.style.willChange = ''
  }
}

export async function waitForCollectionInsertSettled(animations: Animation[]) {
  await Promise.all(animations.map(safeFinished))
}
