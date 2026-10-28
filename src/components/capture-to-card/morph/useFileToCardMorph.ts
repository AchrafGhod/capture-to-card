import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import type { CaptureToCardItem } from '../captureToCardItem'
import { getContainedImageRect } from './containedImageRect'
import {
  defaultCollectionInsertTiming,
  finishCollectionInsertMorph,
  queryCollectionTiles,
  runCollectionInsertMorph,
  waitForCollectionInsertSettled,
} from './runCollectionInsertMorph'
import {
  runCellBuildReveal,
  teardownBuildRevealDom,
  type CellBuildRevealHandle,
} from './runCellBuildReveal'
import {
  abortMorphFlyout,
  buildForwardFlyout,
  prepareDomForCellBuildReveal,
  finishForwardMorph,
  finishForwardMorphTravel,
  prefersReducedMotion,
  runForwardMorph,
  runReducedForwardMorph,
  waitForMorphSettled,
  type ForwardMorphMeasure,
  defaultMorphTiming,
} from './runMorphAnimations'
import { applyInPlacePreviewReady, resetSkeletonReveal } from './cellBuildDom'

export type MorphPhase = 'idle' | 'to-card' | 'hold-build' | 'to-collection'

export type MorphPresentation = 'preview' | 'card'

export type CollectionInsertPayload = CaptureToCardItem & { id: string }

export type MorphDomRefs = {
  stageRef: RefObject<HTMLDivElement | null>
  previewLayerRef: RefObject<HTMLDivElement | null>
  previewRowRef: RefObject<HTMLDivElement | null>
  previewThumbRef: RefObject<HTMLImageElement | null>
  destinationLayerRef: RefObject<HTMLDivElement | null>
  collectionGridRef: RefObject<HTMLDivElement | null>
  cardShellRef: RefObject<HTMLElement | null>
  cardMediaRef: RefObject<HTMLDivElement | null>
  cardImageRef: RefObject<HTMLImageElement | null>
  cardTitleRef: RefObject<HTMLHeadingElement | null>
  cardDetailsRef: RefObject<HTMLDListElement | null>
}

export type CollectionInsertConfig = {
  createItem: () => CollectionInsertPayload
  onCommit: (item: CollectionInsertPayload) => void
  onComplete?: () => void
  holdAfterBuildMs?: number
}

export type MorphStudyScene = 'file-to-card' | 'collection-insert'

export type UseFileToCardMorphOptions = {
  presentation: MorphPresentation
  imageSrc: string
  morphItemKey: string
  onPresentationChange: (next: MorphPresentation) => void
  createCardSessionLocked: boolean
  studyScene?: MorphStudyScene
  collectionInsert?: CollectionInsertConfig
  /** When forward build finishes and no collection insert is configured. */
  onCellBuildComplete?: () => void
  /** Cell reveal study: single card + in-place build (no file→build travel). */
  inPlaceCellReveal?: boolean
}

function viewRectFromElement(el: Element) {
  const rect = el.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

export function useFileToCardMorph(options: UseFileToCardMorphOptions) {
  const {
    presentation,
    imageSrc,
    morphItemKey,
    onPresentationChange,
    createCardSessionLocked,
    studyScene = 'file-to-card',
    collectionInsert,
    onCellBuildComplete,
    inPlaceCellReveal = false,
  } = options

  const stageRef = useRef<HTMLDivElement>(null)
  const previewLayerRef = useRef<HTMLDivElement>(null)
  const previewRowRef = useRef<HTMLDivElement>(null)
  const previewThumbRef = useRef<HTMLImageElement>(null)
  const destinationLayerRef = useRef<HTMLDivElement>(null)
  const collectionGridRef = useRef<HTMLDivElement>(null)
  const cardShellRef = useRef<HTMLElement>(null)
  const cardMediaRef = useRef<HTMLDivElement>(null)
  const cardImageRef = useRef<HTMLImageElement>(null)
  const cardTitleRef = useRef<HTMLHeadingElement>(null)
  const cardDetailsRef = useRef<HTMLDListElement>(null)

  const [morphPhase, setMorphPhaseState] = useState<MorphPhase>('idle')
  const morphPhaseRef = useRef(morphPhase)
  const setMorphPhase = (phase: MorphPhase) => {
    morphPhaseRef.current = phase
    setMorphPhaseState(phase)
  }

  const activeAnimations = useRef<Animation[]>([])
  const flyRootRef = useRef<HTMLDivElement | null>(null)
  const morphGeneration = useRef(0)
  const stageMinHeightRef = useRef<number | null>(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const insertHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buildRevealRef = useRef<CellBuildRevealHandle | null>(null)
  const collectionInsertRef = useRef(collectionInsert)
  collectionInsertRef.current = collectionInsert
  const onCellBuildCompleteRef = useRef(onCellBuildComplete)
  onCellBuildCompleteRef.current = onCellBuildComplete
  const collectionInsertStartedRef = useRef(false)

  function finishForwardBuildWithoutInsert() {
    onCellBuildCompleteRef.current?.()
    setMorphPhase('idle')
    requestAnimationFrame(() => {
      clearStageMinHeight()
    })
  }

  const morphRefs: MorphDomRefs = {
    stageRef,
    previewLayerRef,
    previewRowRef,
    previewThumbRef,
    destinationLayerRef,
    collectionGridRef,
    cardShellRef,
    cardMediaRef,
    cardImageRef,
    cardTitleRef,
    cardDetailsRef,
  }

  function forwardDomTarget(requirePreviewLayer = true) {
    const cardImage = cardImageRef.current
    const cardTitle = cardTitleRef.current
    const cardDetails = cardDetailsRef.current
    const previewLayer = previewLayerRef.current
    const destinationLayer = destinationLayerRef.current
    const cardShell = cardShellRef.current
    if (!cardImage || !cardTitle || !cardDetails || !destinationLayer || !cardShell) {
      return null
    }
    if (requirePreviewLayer && !previewLayer) {
      return null
    }
    return {
      cardImage,
      cardTitle,
      cardDetails,
      previewLayer: previewLayer ?? undefined,
      destinationLayer,
      cardShell,
    }
  }

  function clearBuildReveal() {
    buildRevealRef.current?.cancel()
    buildRevealRef.current = null
  }

  function clearRevealTimeout() {
    if (revealTimeoutRef.current !== null) {
      clearTimeout(revealTimeoutRef.current)
      revealTimeoutRef.current = null
    }
  }

  function clearInsertHoldTimeout() {
    if (insertHoldTimeoutRef.current !== null) {
      clearTimeout(insertHoldTimeoutRef.current)
      insertHoldTimeoutRef.current = null
    }
  }

  function clearStageMinHeight() {
    const stage = stageRef.current
    if (stage) {
      stage.style.minHeight = ''
    }
    stageMinHeightRef.current = null
  }

  function pinStageHeight() {
    const stage = stageRef.current
    if (!stage) return
    const height = stage.getBoundingClientRect().height
    stageMinHeightRef.current = height
    stage.style.minHeight = `${height}px`
  }

  function expandStageHeightToDestination() {
    const stage = stageRef.current
    if (!stage || stageMinHeightRef.current === null) return
    const destHeight = stage.getBoundingClientRect().height
    stage.style.minHeight = `${Math.max(stageMinHeightRef.current, destHeight)}px`
  }

  function bumpMorphGeneration() {
    morphGeneration.current += 1
    return morphGeneration.current
  }

  function cancelFlyoutOnly() {
    clearRevealTimeout()
    clearInsertHoldTimeout()
    clearBuildReveal()
    abortMorphFlyout(activeAnimations.current, flyRootRef.current)
    activeAnimations.current = []
    flyRootRef.current = null
  }

  function resetBuildCardDom() {
    const cardShell = cardShellRef.current
    const cardMedia = cardMediaRef.current
    clearBuildReveal()
    if (cardShell) {
      resetSkeletonReveal(cardShell)
      teardownBuildRevealDom(cardShell, cardMedia)
    }
    cardMedia?.classList.remove('is-revealed')
    cardShell?.classList.remove('is-build-complete')
    if (cardShell) {
      cardShell.style.opacity = ''
      cardShell.style.transition = ''
      cardShell.style.background = ''
      cardShell.style.borderColor = ''
      cardShell.style.boxShadow = ''
      cardShell.style.transform = ''
    }
    if (cardMedia) {
      cardMedia.style.background = ''
    }
    const cardImage = cardImageRef.current
    if (cardImage) {
      cardImage.style.visibility = ''
    }
  }

  function syncInPlacePreviewReady() {
    if (!inPlaceCellReveal) return
    if (presentation !== 'preview' || morphPhaseRef.current !== 'idle') return
    const cardShell = cardShellRef.current
    const cardMedia = cardMediaRef.current
    const cardImage = cardImageRef.current
    if (!cardShell || !cardMedia || !cardImage) return
    applyInPlacePreviewReady(cardShell, cardMedia, cardImage)
  }

  function runCellBuildPass(generation: number) {
    const dom = forwardDomTarget(inPlaceCellReveal ? false : true)
    if (!dom) {
      abortMorph(true)
      setMorphPhase('idle')
      onPresentationChange(inPlaceCellReveal ? 'preview' : 'preview')
      return
    }

    const cardMedia = cardMediaRef.current
    const mediaDotField = cardMedia?.querySelector<HTMLElement>(
      '.capture-to-card__media-dot-field',
    )
    if (!cardMedia || !mediaDotField) {
      finishForwardMorph(dom)
      if (collectionInsertRef.current) {
        scheduleCollectionInsertHold(generation)
      } else {
        finishForwardBuildWithoutInsert()
      }
      return
    }

    clearBuildReveal()
    const revealHandle = runCellBuildReveal({
      cardShell: dom.cardShell,
      cardMedia,
      cardImage: dom.cardImage,
      mediaDotField,
    })
    buildRevealRef.current = revealHandle

    void revealHandle.finished.then(() => {
      if (morphGeneration.current !== generation) return
      buildRevealRef.current = null
      dom.cardShell.classList.add('is-build-complete')
      if (collectionInsertRef.current) {
        const holdMs =
          collectionInsertRef.current.holdAfterBuildMs ??
          defaultCollectionInsertTiming.holdAfterBuildMs
        if (holdMs <= 0) {
          runCollectionInsertPass(generation)
        } else {
          scheduleCollectionInsertHold(generation)
        }
      } else {
        finishForwardBuildWithoutInsert()
      }
    })
  }

  function abortMorph(restoreDom: boolean) {
    bumpMorphGeneration()
    cancelFlyoutOnly()
    collectionInsertStartedRef.current = false
    if (restoreDom) {
      const dom = forwardDomTarget(false)
      if (dom) {
        finishForwardMorph(dom)
      }
      const grid = collectionGridRef.current
      if (grid) {
        finishCollectionInsertMorph(queryCollectionTiles(grid))
      }
      resetBuildCardDom()
      clearStageMinHeight()
    }
  }

  function interruptMorphIfActive() {
    if (morphPhaseRef.current === 'idle') return
    abortMorph(true)
    setMorphPhase('idle')
  }

  function completeMorphSession(generation: number, onDone: () => void) {
    if (morphGeneration.current !== generation) return
    onDone()
    setMorphPhase('idle')
    requestAnimationFrame(() => {
      clearStageMinHeight()
    })
  }

  function scheduleCollectionInsertHold(generation: number) {
    if (!collectionInsertRef.current) return
    setMorphPhase('hold-build')
    clearInsertHoldTimeout()
    insertHoldTimeoutRef.current = setTimeout(() => {
      insertHoldTimeoutRef.current = null
      runCollectionInsertPass(generation)
    }, collectionInsertRef.current?.holdAfterBuildMs ?? defaultCollectionInsertTiming.holdAfterBuildMs)
  }

  function runCollectionInsertPass(forwardGeneration: number) {
    if (morphGeneration.current !== forwardGeneration) return
    const insertConfig = collectionInsertRef.current
    if (!insertConfig || collectionInsertStartedRef.current) return
    collectionInsertStartedRef.current = true
    setMorphPhase('to-collection')

    const grid = collectionGridRef.current
    const buildShell = cardShellRef.current
    if (!grid || !buildShell) {
      abortMorph(true)
      setMorphPhase('idle')
      onPresentationChange('preview')
      collectionInsertStartedRef.current = false
      return
    }

    const buildShellFrom = viewRectFromElement(buildShell)
    const beforeTiles = queryCollectionTiles(grid)
    const neighborFrom = beforeTiles.map((el) => ({
      id: el.dataset.collectionId ?? '',
      from: viewRectFromElement(el),
    }))

    const insertItem = insertConfig.createItem()
    flushSync(() => {
      insertConfig.onCommit(insertItem)
    })

    const tiles = queryCollectionTiles(grid)
    const newTile = tiles.find((el) => el.dataset.collectionId === insertItem.id)
    if (!newTile) {
      abortMorph(true)
      setMorphPhase('idle')
      onPresentationChange('preview')
      collectionInsertStartedRef.current = false
      return
    }

    buildShell.style.opacity = '0'

    const neighbors = neighborFrom
      .map(({ id, from }) => {
        const el = tiles.find((tile) => tile.dataset.collectionId === id)
        return el ? { id, el, from } : null
      })
      .filter(
        (
          entry,
        ): entry is {
          id: string
          el: HTMLElement
          from: ReturnType<typeof viewRectFromElement>
        } => entry !== null,
      )

    const generation = bumpMorphGeneration()
    cancelFlyoutOnly()

    if (prefersReducedMotion()) {
      finishCollectionInsertMorph(tiles)
      resetBuildCardDom()
      onPresentationChange('preview')
      insertConfig.onComplete?.()
      setMorphPhase('idle')
      collectionInsertStartedRef.current = false
      requestAnimationFrame(() => {
        clearStageMinHeight()
      })
      return
    }

    const animations = runCollectionInsertMorph(
      { buildShellFrom, newTile, neighbors },
      defaultCollectionInsertTiming,
    )
    activeAnimations.current = animations

    void waitForCollectionInsertSettled(animations).then(() => {
      completeMorphSession(generation, () => {
        finishCollectionInsertMorph(tiles)
        resetBuildCardDom()
        onPresentationChange('preview')
        insertConfig.onComplete?.()
        collectionInsertStartedRef.current = false
      })
    })
  }

  function commitInstantCollectionInsert() {
    const insertConfig = collectionInsertRef.current
    if (!insertConfig) return
    const grid = collectionGridRef.current
    const buildShell = cardShellRef.current
    if (!grid || !buildShell) return

    const insertItem = insertConfig.createItem()
    flushSync(() => {
      insertConfig.onCommit(insertItem)
    })
    resetBuildCardDom()
    onPresentationChange('preview')
    insertConfig.onComplete?.()
  }

  function measureForwardSource(): ForwardMorphMeasure | null {
    const row = previewRowRef.current
    const thumb = previewThumbRef.current
    const cardShell = cardShellRef.current
    const cardImage = cardImageRef.current
    if (!row || !thumb || !cardShell || !cardImage) return null

    const rowStyle = getComputedStyle(row)
    const cardStyle = getComputedStyle(cardShell)

    return {
      surfaceFrom: viewRectFromElement(row),
      surfaceRadiusFrom: rowStyle.borderRadius,
      surfaceBackgroundFrom: rowStyle.backgroundColor,
      imageFrom: getContainedImageRect(thumb),
      imageTo: getContainedImageRect(cardImage),
      surfaceTo: viewRectFromElement(cardShell),
      surfaceRadiusTo: cardStyle.borderRadius,
      surfaceBackgroundTo: cardStyle.backgroundColor,
      surfaceShadowTo: cardStyle.boxShadow,
      imageSrc,
    }
  }

  function requestCollectionInsertOnly() {
    if (createCardSessionLocked) return
    if (!collectionInsertRef.current) return
    if (studyScene !== 'collection-insert') return
    if (morphPhaseRef.current !== 'idle') {
      abortMorph(true)
      setMorphPhase('idle')
    }

    if (prefersReducedMotion()) {
      if (presentation !== 'card') {
        flushSync(() => onPresentationChange('card'))
      }
      commitInstantCollectionInsert()
      return
    }

    if (presentation !== 'card') {
      flushSync(() => onPresentationChange('card'))
    }

    pinStageHeight()
    const generation = bumpMorphGeneration()
    runCollectionInsertPass(generation)
  }

  function requestForwardMorph() {
    if (studyScene === 'collection-insert') return
    if (createCardSessionLocked) return
    if (morphPhaseRef.current !== 'idle') {
      abortMorph(true)
      setMorphPhase('idle')
    }

    if (prefersReducedMotion()) {
      onPresentationChange('card')
      const reducedDom = forwardDomTarget(inPlaceCellReveal ? false : true)
      if (reducedDom) runReducedForwardMorph(reducedDom)
      if (collectionInsertRef.current) {
        commitInstantCollectionInsert()
      } else {
        finishForwardBuildWithoutInsert()
      }
      return
    }

    if (inPlaceCellReveal) {
      const dom = forwardDomTarget(false)
      if (!dom) return
      pinStageHeight()
      flushSync(() => {
        setMorphPhase('to-card')
        onPresentationChange('card')
      })
      prepareDomForCellBuildReveal(dom)
      finishForwardMorphTravel(dom)
      const generation = bumpMorphGeneration()
      runCellBuildPass(generation)
      return
    }

    const previewLayer = previewLayerRef.current
    const stage = stageRef.current
    if (!previewLayer || !stage) return

    const previewReady =
      previewRowRef.current && previewThumbRef.current && previewLayerRef.current
    if (!previewReady) return

    pinStageHeight()
    flushSync(() => {
      setMorphPhase('to-card')
      onPresentationChange('card')
    })
    const cardImage = cardImageRef.current
    if (cardImage) {
      cardImage.style.visibility = 'hidden'
    }
  }

  function requestResetDemo() {
    interruptMorphIfActive()
    collectionInsertStartedRef.current = false
    resetBuildCardDom()
    onPresentationChange(studyScene === 'collection-insert' ? 'card' : 'preview')
    requestAnimationFrame(() => {
      syncInPlacePreviewReady()
    })
  }

  const previousMorphItemKeyRef = useRef(morphItemKey)
  useEffect(() => {
    if (previousMorphItemKeyRef.current === morphItemKey) return
    previousMorphItemKeyRef.current = morphItemKey
    interruptMorphIfActive()
    resetBuildCardDom()
    if (presentation !== 'preview') {
      onPresentationChange('preview')
    }
    requestAnimationFrame(() => {
      syncInPlacePreviewReady()
    })
  }, [morphItemKey, onPresentationChange, presentation])

  useLayoutEffect(() => {
    if (presentation !== 'card') return

    if (prefersReducedMotion() && morphPhase === 'idle') {
      const reducedDom = forwardDomTarget(inPlaceCellReveal ? false : true)
      if (reducedDom) runReducedForwardMorph(reducedDom)
      return
    }
    if (inPlaceCellReveal) return
    if (morphPhase !== 'to-card') return

    const sourceMeasure = measureForwardSource()
    const stage = stageRef.current
    const dom = forwardDomTarget(true)

    if (!sourceMeasure || !stage || !dom) {
      abortMorph(true)
      setMorphPhase('idle')
      onPresentationChange('preview')
      return
    }

    expandStageHeightToDestination()

    const generation = bumpMorphGeneration()
    cancelFlyoutOnly()

    const flyRoot = document.createElement('div')
    flyRoot.className = 'ctc-morph-fly'
    flyRoot.setAttribute('aria-hidden', 'true')
    const { surfaceFly, imageFly } = buildForwardFlyout(sourceMeasure)
    flyRoot.append(surfaceFly, imageFly)
    stage.appendChild(flyRoot)
    flyRootRef.current = flyRoot

    const animations = runForwardMorph({
      timing: defaultMorphTiming,
      measure: sourceMeasure,
      dom: {
        flyRoot,
        surfaceFly,
        imageFly,
        ...dom,
      },
    })
    activeAnimations.current = animations

    void waitForMorphSettled(animations).then(() => {
      if (morphGeneration.current !== generation) return
      finishForwardMorphTravel(dom)
      flyRoot.remove()
      flyRootRef.current = null
      activeAnimations.current = []

      runCellBuildPass(generation)
    })
  }, [morphPhase, presentation, onPresentationChange, inPlaceCellReveal])

  useLayoutEffect(() => {
    syncInPlacePreviewReady()
  }, [inPlaceCellReveal, presentation, morphItemKey, imageSrc])

  useEffect(() => {
    return () => {
      abortMorph(true)
    }
  }, [])

  useEffect(() => {
    const onInterrupt = () => {
      interruptMorphIfActive()
    }

    window.addEventListener('resize', onInterrupt)
    window.addEventListener('scroll', onInterrupt, { capture: true })

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    motionQuery?.addEventListener('change', onInterrupt)

    return () => {
      window.removeEventListener('resize', onInterrupt)
      window.removeEventListener('scroll', onInterrupt, { capture: true })
      motionQuery?.removeEventListener('change', onInterrupt)
    }
  }, [])

  const isMorphing = morphPhase !== 'idle'
  const showPreviewLayer = true
  const showDestinationLayer = true
  const previewLayerInert = isMorphing
  const destinationLayerInert = isMorphing
  const collectionLayerInert = isMorphing
  const showEmptyBuildSlot =
    !inPlaceCellReveal && presentation === 'preview' && morphPhase === 'idle'
  const showCardSurface =
    inPlaceCellReveal ||
    presentation === 'card' ||
    morphPhase === 'to-card' ||
    morphPhase === 'hold-build' ||
    morphPhase === 'to-collection'

  return {
    morphRefs,
    morphPhase,
    isMorphing,
    showPreviewLayer,
    showDestinationLayer,
    showEmptyBuildSlot,
    showCardSurface,
    previewLayerInert,
    destinationLayerInert,
    collectionLayerInert,
    requestForwardMorph,
    requestCollectionInsertOnly,
    requestResetDemo,
    interruptMorphIfActive,
  }
}
