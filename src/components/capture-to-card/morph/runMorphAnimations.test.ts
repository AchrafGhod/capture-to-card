import { afterEach, describe, expect, it, vi } from 'vitest'
import { installMockWebAnimations } from '../../../test/mockWebAnimations'
import {
  buildForwardFlyout,
  cancelAnimations,
  finishForwardMorph,
  runForwardMorph,
  runReducedForwardMorph,
  waitForMorphSettled,
  defaultMorphTiming,
} from './runMorphAnimations'

function forwardMeasure() {
  return {
    surfaceFrom: { left: 88, top: 16, width: 204, height: 72 },
    surfaceRadiusFrom: '8px',
    surfaceBackgroundFrom: 'rgb(250, 250, 250)',
    imageFrom: { left: 100, top: 28, width: 48, height: 48 },
    imageTo: { left: 10, top: 10, width: 200, height: 100 },
    surfaceTo: { left: 10, top: 12, width: 360, height: 280 },
    surfaceRadiusTo: '12px',
    surfaceBackgroundTo: 'rgb(255, 255, 255)',
    surfaceShadowTo: '0 1px 2px rgb(15 23 42 / 0.06)',
    imageSrc: '/x.png',
  }
}

function mountForwardDom() {
  document.body.innerHTML = `
    <div id="fly"></div>
    <div id="preview"></div>
    <div id="dest">
      <p class="capture-to-card__zone-label">Card</p>
      <article id="shell">
        <div class="capture-to-card__card-media">
          <img id="card-image" width="100" height="50" />
        </div>
        <h2 id="card-title">
          <span class="ctc-build">
            <span class="ctc-build__dots"><span class="ctc-dot-grid"></span></span>
            <span class="ctc-build__text">file.png</span>
          </span>
        </h2>
        <dl id="details"></dl>
      </article>
      <div class="capture-to-card__actions capture-to-card__actions--card"></div>
    </div>
  `

  const flyRoot = document.getElementById('fly') as HTMLDivElement
  const flyout = buildForwardFlyout(forwardMeasure())
  flyRoot.append(flyout.surfaceFly, flyout.imageFly)

  return {
    flyRoot,
    ...flyout,
    previewLayer: document.getElementById('preview')!,
    destinationLayer: document.getElementById('dest')!,
    cardShell: document.getElementById('shell')!,
    cardDetails: document.getElementById('details')!,
    cardImage: document.getElementById('card-image') as HTMLImageElement,
    cardTitle: document.getElementById('card-title')!,
  }
}

function animateCallsFor(element: Element) {
  const animate = vi.mocked(Element.prototype.animate)
  return animate.mock.calls.filter(
    (_, index) => animate.mock.instances[index] === element,
  )
}

describe('runMorphAnimations', () => {
  let animMock: ReturnType<typeof installMockWebAnimations>

  afterEach(() => {
    animMock?.restore()
    vi.restoreAllMocks()
  })

  it('settles forward morph animations without rejecting', async () => {
    animMock = installMockWebAnimations()
    const dom = mountForwardDom()

    const animations = runForwardMorph({
      timing: defaultMorphTiming,
      measure: forwardMeasure(),
      dom,
    })

    await expect(waitForMorphSettled(animations)).resolves.toBeUndefined()
    expect(animMock.handles.length).toBeGreaterThan(0)
    expect(dom.cardImage.style.visibility).toBe('hidden')
  })

  it('places the fly image at the destination box with FLIP transform', () => {
    const fly = buildForwardFlyout(forwardMeasure())
    expect(fly.imageFly.style.width).toBe('200px')
    expect(fly.imageFly.style.transform).toContain('translate(')
    expect(fly.imageFly.style.transform).toContain('scale(')
    expect(fly.surfaceFly.style.borderRadius).toBe('8px')
  })

  it('animates the surface from the preview row to the card shell', () => {
    animMock = installMockWebAnimations()
    const dom = mountForwardDom()
    runForwardMorph({
      timing: defaultMorphTiming,
      measure: forwardMeasure(),
      dom,
    })

    const surfaceFrames = animateCallsFor(dom.surfaceFly)[0]?.[0] as Keyframe[]
    expect(surfaceFrames[0]?.width).toBe('204px')
    expect(surfaceFrames[0]?.height).toBe('72px')
    expect(surfaceFrames[surfaceFrames.length - 1]?.width).toBe('360px')

    const shellFrames = animateCallsFor(dom.cardShell)
    expect(shellFrames).toHaveLength(0)
  })

  it('ignores rejections from Animation.finished after cancel()', async () => {
    const aborted = Promise.reject(
      new DOMException('Aborted', 'AbortError'),
    ) as Promise<void>
    await expect(
      waitForMorphSettled([{ finished: aborted } as unknown as Animation]),
    ).resolves.toBeUndefined()
  })

  it('restores DOM when finishing forward morph', () => {
    animMock = installMockWebAnimations()
    const dom = mountForwardDom()
    runForwardMorph({
      timing: defaultMorphTiming,
      measure: forwardMeasure(),
      dom,
    })

    finishForwardMorph({
      previewLayer: dom.previewLayer,
      destinationLayer: dom.destinationLayer,
      cardShell: dom.cardShell,
      cardDetails: dom.cardDetails,
      cardImage: dom.cardImage,
      cardTitle: dom.cardTitle,
    })

    expect(dom.cardImage.style.visibility).toBe('')
    expect(dom.previewLayer.style.opacity).toBe('')
    expect(dom.cardShell.classList.contains('is-revealed')).toBe(false)
    expect(
      dom.cardShell.querySelector('.ctc-build')?.classList.contains('is-revealed'),
    ).toBe(true)
  })

  it('reveals skeleton content immediately under reduced motion', () => {
    animMock = installMockWebAnimations()
    const dom = mountForwardDom()

    runReducedForwardMorph({
      previewLayer: dom.previewLayer,
      destinationLayer: dom.destinationLayer,
      cardShell: dom.cardShell,
      cardDetails: dom.cardDetails,
      cardImage: dom.cardImage,
      cardTitle: dom.cardTitle,
    })

    expect(
      dom.cardShell.querySelector('.ctc-build')?.classList.contains('is-revealed'),
    ).toBe(true)
    expect(dom.cardImage.style.visibility).toBe('')
    expect(animMock.handles).toHaveLength(0)
  })

  it('cancels every active animation', () => {
    animMock = installMockWebAnimations()
    const node = document.createElement('div')
    const a = node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10 })
    const b = node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10 })
    cancelAnimations([a, b])
    expect(a.playState).toBe('idle')
    expect(b.playState).toBe('idle')
  })
})
