import { afterEach, describe, expect, it, vi } from 'vitest'
import { installMockWebAnimations } from '../../../test/mockWebAnimations'
import {
  cancelAnimations,
  finishForwardMorph,
  runReducedForwardMorph,
  waitForMorphSettled,
} from './runMorphAnimations'

function mountBuildDom() {
  document.body.innerHTML = `
    <div id="dest">
      <p class="capture-to-card__zone-label">Card</p>
      <article id="shell">
        <div class="capture-to-card__card-media">
          <div class="capture-to-card__media-dot-field"></div>
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

  return {
    destinationLayer: document.getElementById('dest')!,
    cardShell: document.getElementById('shell')!,
    cardDetails: document.getElementById('details')!,
    cardImage: document.getElementById('card-image') as HTMLImageElement,
    cardTitle: document.getElementById('card-title')!,
  }
}

describe('runMorphAnimations', () => {
  let animMock: ReturnType<typeof installMockWebAnimations>

  afterEach(() => {
    animMock?.restore()
    vi.restoreAllMocks()
  })

  it('ignores rejections from Animation.finished after cancel()', async () => {
    const aborted = Promise.reject(
      new DOMException('Aborted', 'AbortError'),
    ) as Promise<void>
    await expect(
      waitForMorphSettled([{ finished: aborted } as unknown as Animation]),
    ).resolves.toBeUndefined()
  })

  it('restores DOM when finishing cell build prep', () => {
    animMock = installMockWebAnimations()
    const dom = mountBuildDom()
    dom.cardImage.style.visibility = 'hidden'

    finishForwardMorph(dom)

    expect(dom.cardImage.style.visibility).toBe('')
    expect(
      dom.cardShell.querySelector('.ctc-build')?.classList.contains('is-revealed'),
    ).toBe(true)
  })

  it('reveals skeleton content immediately under reduced motion', () => {
    animMock = installMockWebAnimations()
    const dom = mountBuildDom()

    runReducedForwardMorph(dom)

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
