import { afterEach, describe, expect, it, vi } from 'vitest'
import { installMockWebAnimations } from '../../../test/mockWebAnimations'
import {
  cancelAnimations,
  finishBackMorph,
  finishForwardMorph,
  runBackMorph,
  runForwardMorph,
  waitForMorphSettled,
  defaultMorphTiming,
} from './runMorphAnimations'

function forwardMeasure() {
  return {
    imageFrom: { left: 0, top: 0, width: 40, height: 40 },
    imageTo: { left: 10, top: 10, width: 200, height: 100 },
    titleFrom: { left: 50, top: 10, width: 80, height: 20 },
    titleTo: { left: 10, top: 120, width: 180, height: 24 },
    titleFontFrom: '14px',
    titleFontTo: '17px',
    titleWeightFrom: '500',
    titleWeightTo: '600',
    titleLetterSpacingFrom: 'normal',
    titleLetterSpacingTo: '-0.17px',
    imageSrc: '/x.png',
    titleText: 'file.png',
  }
}

describe('runMorphAnimations', () => {
  let animMock: ReturnType<typeof installMockWebAnimations>

  afterEach(() => {
    animMock?.restore()
    vi.restoreAllMocks()
  })

  it('settles forward morph animations without rejecting', async () => {
    animMock = installMockWebAnimations()
    document.body.innerHTML = `
      <div id="fly"></div>
      <div id="source">
        <img id="thumb" />
        <span id="name">file.png</span>
      </div>
      <article id="shell"></article>
      <img id="card-image" width="100" height="50" />
      <h2 id="card-title">file.png</h2>
      <dl id="details">
        <div></div>
        <div></div>
        <div></div>
      </dl>
    `

    const imageFly = document.createElement('img')
    const titleFly = document.createElement('h2')
    const flyRoot = document.getElementById('fly') as HTMLDivElement

    const animations = runForwardMorph({
      timing: defaultMorphTiming,
      measure: forwardMeasure(),
      dom: {
        flyRoot,
        imageFly,
        titleFly,
        sourceLayer: document.getElementById('source')!,
        cardShell: document.getElementById('shell')!,
        cardDetails: document.getElementById('details')!,
        cardImage: document.getElementById('card-image') as HTMLImageElement,
        cardTitle: document.getElementById('card-title')!,
        sourceThumb: document.getElementById('thumb')!,
        sourceName: document.getElementById('name')!,
      },
    })

    await expect(waitForMorphSettled(animations)).resolves.toBeUndefined()
    expect(animMock.handles.length).toBeGreaterThan(0)
    expect(document.getElementById('thumb')!.style.visibility).toBe('hidden')
    expect(document.getElementById('name')!.style.visibility).toBe('hidden')
  })

  it('reveals the card shell with opacity only (no shell FLIP)', () => {
    animMock = installMockWebAnimations()
    document.body.innerHTML = `
      <div id="fly"></div>
      <div id="source"></div>
      <article id="shell"></article>
      <img id="card-image" />
      <h2 id="card-title">file.png</h2>
      <dl id="details"></dl>
    `
    runForwardMorph({
      timing: defaultMorphTiming,
      measure: forwardMeasure(),
      dom: {
        flyRoot: document.getElementById('fly') as HTMLDivElement,
        imageFly: document.createElement('img'),
        titleFly: document.createElement('h2'),
        sourceLayer: document.getElementById('source')!,
        cardShell: document.getElementById('shell')!,
        cardDetails: document.getElementById('details')!,
        cardImage: document.getElementById('card-image') as HTMLImageElement,
        cardTitle: document.getElementById('card-title')!,
      },
    })

    const shellCall = vi
      .mocked(Element.prototype.animate)
      .mock.calls.find(
        (call) =>
          call[1] &&
          (call[1] as KeyframeAnimationOptions).delay ===
            defaultMorphTiming.cardShellDelayMs,
      )
    expect(shellCall).toBeTruthy()
    const frames = shellCall![0] as Keyframe[]
    expect(frames[0]?.opacity).toBe(0)
    expect(frames[1]?.opacity).toBe(1)
    expect(
      frames.some((frame) => String(frame.transform ?? '').includes('scale')),
    ).toBe(false)
  })

  it('does not scale the filename while it travels to the title', () => {
    animMock = installMockWebAnimations()
    document.body.innerHTML = `
      <div id="fly"></div>
      <div id="source"></div>
      <article id="shell"></article>
      <img id="card-image" />
      <h2 id="card-title">file.png</h2>
      <dl id="details"></dl>
    `
    const titleFly = document.createElement('h2')
    runForwardMorph({
      timing: defaultMorphTiming,
      measure: forwardMeasure(),
      dom: {
        flyRoot: document.getElementById('fly') as HTMLDivElement,
        imageFly: document.createElement('img'),
        titleFly,
        sourceLayer: document.getElementById('source')!,
        cardShell: document.getElementById('shell')!,
        cardDetails: document.getElementById('details')!,
        cardImage: document.getElementById('card-image') as HTMLImageElement,
        cardTitle: document.getElementById('card-title')!,
      },
    })

    const titleCall = vi
      .mocked(Element.prototype.animate)
      .mock.calls.find((call) => call[0] && (call[0] as Keyframe[])[0]?.fontSize)
    expect(titleCall).toBeTruthy()
    const frames = titleCall![0] as Keyframe[]
    expect(
      frames.some((frame) => String(frame.transform ?? '').includes('scale')),
    ).toBe(false)
    expect(frames[0]?.left).toBe('50px')
    expect(frames[0]?.width).toBe('80px')
    expect(frames[0]?.fontSize).toBe('14px')
    expect(frames[frames.length - 1]?.fontSize).toBe('17px')
  })

  it('ignores rejections from Animation.finished after cancel()', async () => {
    const aborted = Promise.reject(
      new DOMException('Aborted', 'AbortError'),
    ) as Promise<void>
    await expect(
      waitForMorphSettled([{ finished: aborted } as unknown as Animation]),
    ).resolves.toBeUndefined()
  })

  it('clears transform on card details when finishing forward morph', () => {
    animMock = installMockWebAnimations()
    document.body.innerHTML = `
      <div id="source"></div>
      <article id="shell"></article>
      <img id="card-image" />
      <h2 id="card-title"></h2>
      <dl id="details" style="transform: translateY(6px)">
        <div style="opacity: 0; transform: translateY(8px)"></div>
      </dl>
    `
    finishForwardMorph({
      sourceLayer: document.getElementById('source')!,
      cardShell: document.getElementById('shell')!,
      cardDetails: document.getElementById('details')!,
      cardImage: document.getElementById('card-image') as HTMLImageElement,
      cardTitle: document.getElementById('card-title')!,
    })
    const details = document.getElementById('details')!
    expect(details.style.transform).toBe('')
    expect(details.style.opacity).toBe('')
    const row = details.firstElementChild as HTMLElement
    expect(row.style.transform).toBe('')
    expect(row.style.opacity).toBe('')
  })

  it('keeps the destination at opacity 0 when back-morph fill:forwards is cancelled', () => {
    animMock = installMockWebAnimations()
    document.body.innerHTML = `
      <div id="source"></div>
      <div id="dest"></div>
    `
    const sourceLayer = document.getElementById('source')!
    const destinationLayer = document.getElementById('dest')!
    const animations = runBackMorph({
      timing: defaultMorphTiming,
      sourceLayer,
      destinationLayer,
    })
    const [destinationAnimation, sourceAnimation] = animations
    destinationLayer.getAnimations = () => [destinationAnimation]
    sourceLayer.getAnimations = () => [sourceAnimation]

    let destinationOpacityWhenCancelled = ''
    const originalCancel = destinationAnimation.cancel.bind(destinationAnimation)
    destinationAnimation.cancel = () => {
      destinationOpacityWhenCancelled = destinationLayer.style.opacity
      originalCancel()
    }

    finishBackMorph({
      timing: defaultMorphTiming,
      sourceLayer,
      destinationLayer,
    })

    expect(destinationOpacityWhenCancelled).toBe('0')
    expect(destinationLayer.style.opacity).toBe('0')
    expect(sourceLayer.style.opacity).toBe('')
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
