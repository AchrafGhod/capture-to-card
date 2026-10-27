import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { getContainedImageRect, type ViewRect } from './containedImageRect'
import {
  abortMorphFlyout,
  buildForwardFlyout,
  finishBackMorph,
  finishForwardMorph,
  prefersReducedMotion,
  runBackMorph,
  runForwardMorph,
  runReducedForwardMorph,
  waitForMorphSettled,
  type ForwardMorphMeasure,
  defaultMorphTiming,
} from './runMorphAnimations'

export type MorphPhase = 'idle' | 'to-card' | 'to-source'

export type MorphPresentation = 'source' | 'card'

type ForwardMorphSourceMeasure = {
  imageFrom: ViewRect
  titleFrom: ViewRect
  titleFontFrom: string
  titleWeightFrom: string
  titleLetterSpacingFrom: string
  imageSrc: string
  titleText: string
}

export type MorphDomRefs = {
  stageRef: RefObject<HTMLDivElement | null>
  sourceLayerRef: RefObject<HTMLDivElement | null>
  destinationLayerRef: RefObject<HTMLDivElement | null>
  sourceThumbImageRef: RefObject<HTMLImageElement | null>
  sourceNameRef: RefObject<HTMLSpanElement | null>
  cardShellRef: RefObject<HTMLElement | null>
  cardImageRef: RefObject<HTMLImageElement | null>
  cardTitleRef: RefObject<HTMLHeadingElement | null>
  cardDetailsRef: RefObject<HTMLDListElement | null>
}

export type UseFileToCardMorphOptions = {
  presentation: MorphPresentation
  imageSrc: string
  title: string
  /** Stable identity for morph interruption when the displayed file changes. */
  morphItemKey: string
  onPresentationChange: (next: MorphPresentation) => void
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
  const { presentation, imageSrc, title, morphItemKey, onPresentationChange } = options

  const stageRef = useRef<HTMLDivElement>(null)
  const sourceLayerRef = useRef<HTMLDivElement>(null)
  const destinationLayerRef = useRef<HTMLDivElement>(null)
  const sourceThumbImageRef = useRef<HTMLImageElement>(null)
  const sourceNameRef = useRef<HTMLSpanElement>(null)
  const cardShellRef = useRef<HTMLElement>(null)
  const cardImageRef = useRef<HTMLImageElement>(null)
  const cardTitleRef = useRef<HTMLHeadingElement>(null)
  const cardDetailsRef = useRef<HTMLDListElement>(null)

  const [morphPhase, setMorphPhaseState] = useState<MorphPhase>('idle')
  const morphPhaseRef = useRef(morphPhase)
  const setMorphPhase = (phase: MorphPhase) => {
    morphPhaseRef.current = phase
    setMorphPhaseState(phase)
  }

  const pendingForwardMeasure = useRef<ForwardMorphSourceMeasure | null>(null)
  const activeAnimations = useRef<Animation[]>([])
  const flyRootRef = useRef<HTMLDivElement | null>(null)
  const morphGeneration = useRef(0)
  const stageMinHeightRef = useRef<number | null>(null)

  const morphRefs: MorphDomRefs = {
    stageRef,
    sourceLayerRef,
    destinationLayerRef,
    sourceThumbImageRef,
    sourceNameRef,
    cardShellRef,
    cardImageRef,
    cardTitleRef,
    cardDetailsRef,
  }

  function forwardDomTarget() {
    const cardImage = cardImageRef.current
    const cardTitle = cardTitleRef.current
    const cardDetails = cardDetailsRef.current
    const sourceLayer = sourceLayerRef.current
    const cardShell = cardShellRef.current
    if (!cardImage || !cardTitle || !cardDetails || !sourceLayer || !cardShell) {
      return null
    }
    return {
      cardImage,
      cardTitle,
      cardDetails,
      sourceLayer,
      cardShell,
      sourceThumb: sourceThumbImageRef.current ?? undefined,
      sourceName: sourceNameRef.current ?? undefined,
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
    abortMorphFlyout(activeAnimations.current, flyRootRef.current)
    activeAnimations.current = []
    flyRootRef.current = null
  }

  /** Cancel in-flight WAAPI, drop flyout, restore DOM + stage height when requested. */
  function abortMorph(restoreDom: boolean) {
    bumpMorphGeneration()
    cancelFlyoutOnly()
    pendingForwardMeasure.current = null
    if (restoreDom) {
      const phase = morphPhaseRef.current
      const sourceLayer = sourceLayerRef.current
      const destinationLayer = destinationLayerRef.current

      if (phase === 'to-source' && sourceLayer && destinationLayer) {
        finishBackMorph({
          timing: defaultMorphTiming,
          sourceLayer,
          destinationLayer,
        })
      } else {
        const dom = forwardDomTarget()
        if (dom) {
          finishForwardMorph(dom)
        }
      }

      if (destinationLayer) {
        destinationLayer.style.display = ''
      }
      clearStageMinHeight()
    }
  }

  function interruptMorphIfActive() {
    if (morphPhaseRef.current === 'idle') return
    abortMorph(true)
    setMorphPhase('idle')
  }

  function settleStageHeightAfterBack(destinationLayer: HTMLElement) {
    const stage = stageRef.current
    if (!stage) return
    destinationLayer.style.display = 'none'
    const nextHeight = stage.getBoundingClientRect().height
    stage.style.minHeight = `${nextHeight}px`
    stageMinHeightRef.current = nextHeight
  }

  function completeMorphSession(generation: number, onDone: () => void) {
    if (morphGeneration.current !== generation) return
    onDone()
    setMorphPhase('idle')
    requestAnimationFrame(() => {
      clearStageMinHeight()
    })
  }

  function requestForwardMorph() {
    if (morphPhaseRef.current !== 'idle') {
      abortMorph(true)
      setMorphPhase('idle')
    }

    const thumb = sourceThumbImageRef.current
    const nameEl = sourceNameRef.current
    const sourceLayer = sourceLayerRef.current
    const stage = stageRef.current

    if (!thumb || !nameEl || !sourceLayer || !stage) {
      onPresentationChange('card')
      return
    }

    if (prefersReducedMotion()) {
      onPresentationChange('card')
      return
    }

    pinStageHeight()

    pendingForwardMeasure.current = {
      imageFrom: getContainedImageRect(thumb),
      titleFrom: viewRectFromElement(nameEl),
      titleFontFrom: getComputedStyle(nameEl).fontSize,
      titleWeightFrom: getComputedStyle(nameEl).fontWeight,
      titleLetterSpacingFrom: getComputedStyle(nameEl).letterSpacing,
      imageSrc,
      titleText: title,
    }

    setMorphPhase('to-card')
    onPresentationChange('card')
  }

  function requestBackMorph() {
    if (morphPhaseRef.current !== 'idle') {
      abortMorph(true)
      setMorphPhase('idle')
    }

    const destinationLayer = destinationLayerRef.current
    const stage = stageRef.current

    if (!destinationLayer || !stage) {
      onPresentationChange('source')
      return
    }

    if (prefersReducedMotion()) {
      onPresentationChange('source')
      return
    }

    pinStageHeight()
    setMorphPhase('to-source')
    onPresentationChange('source')
  }

  const previousMorphItemKeyRef = useRef(morphItemKey)
  useEffect(() => {
    if (previousMorphItemKeyRef.current === morphItemKey) return
    previousMorphItemKeyRef.current = morphItemKey
    interruptMorphIfActive()
  }, [morphItemKey])

  useLayoutEffect(() => {
    if (morphPhase !== 'to-card' || presentation !== 'card') return

    const sourceMeasure = pendingForwardMeasure.current
    const stage = stageRef.current
    const dom = forwardDomTarget()

    if (!sourceMeasure || !stage || !dom) {
      abortMorph(true)
      setMorphPhase('idle')
      return
    }

    const measure: ForwardMorphMeasure = {
      ...sourceMeasure,
      imageTo: getContainedImageRect(dom.cardImage),
      titleTo: viewRectFromElement(dom.cardTitle),
      titleFontTo: getComputedStyle(dom.cardTitle).fontSize,
      titleWeightTo: getComputedStyle(dom.cardTitle).fontWeight,
      titleLetterSpacingTo: getComputedStyle(dom.cardTitle).letterSpacing,
    }

    expandStageHeightToDestination()

    const generation = bumpMorphGeneration()
    cancelFlyoutOnly()

    if (prefersReducedMotion()) {
      runReducedForwardMorph(dom)
      pendingForwardMeasure.current = null
      completeMorphSession(generation, () => undefined)
      return
    }

    const flyRoot = document.createElement('div')
    flyRoot.className = 'ctc-morph-fly'
    flyRoot.setAttribute('aria-hidden', 'true')
    const { imageFly, titleFly } = buildForwardFlyout(measure)
    flyRoot.append(imageFly, titleFly)
    stage.appendChild(flyRoot)
    flyRootRef.current = flyRoot

    const animations = runForwardMorph({
      timing: defaultMorphTiming,
      measure,
      dom: {
        flyRoot,
        imageFly,
        titleFly,
        ...dom,
      },
    })
    activeAnimations.current = animations
    pendingForwardMeasure.current = null

    void waitForMorphSettled(animations).then(() => {
      completeMorphSession(generation, () => {
        flyRoot.remove()
        flyRootRef.current = null
        activeAnimations.current = []
        finishForwardMorph(dom)
      })
    })
  }, [morphPhase, presentation])

  useLayoutEffect(() => {
    if (morphPhase !== 'to-source' || presentation !== 'source') return

    const sourceLayer = sourceLayerRef.current
    const destinationLayer = destinationLayerRef.current
    const stage = stageRef.current

    if (!sourceLayer || !destinationLayer || !stage) {
      abortMorph(true)
      setMorphPhase('idle')
      return
    }

    const generation = bumpMorphGeneration()

    const animations = runBackMorph({
      timing: defaultMorphTiming,
      sourceLayer,
      destinationLayer,
    })
    activeAnimations.current = animations

    void waitForMorphSettled(animations).then(() => {
      completeMorphSession(generation, () => {
        activeAnimations.current = []
        finishBackMorph({
          timing: defaultMorphTiming,
          sourceLayer,
          destinationLayer,
        })
        settleStageHeightAfterBack(destinationLayer)
      })
    })
  }, [morphPhase, presentation])

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

  const showSourceLayer =
    presentation === 'source' || morphPhase === 'to-card' || morphPhase === 'to-source'
  const showDestinationLayer =
    presentation === 'card' || morphPhase === 'to-card' || morphPhase === 'to-source'

  const sourceLayerInert =
    showDestinationLayer && (presentation === 'card' || morphPhase === 'to-card')
  const destinationLayerInert =
    showSourceLayer && (presentation === 'source' || morphPhase === 'to-source')

  const isMorphing = morphPhase !== 'idle'

  return {
    morphRefs,
    morphPhase,
    isMorphing,
    showSourceLayer,
    showDestinationLayer,
    sourceLayerInert,
    destinationLayerInert,
    requestForwardMorph,
    requestBackMorph,
  }
}
