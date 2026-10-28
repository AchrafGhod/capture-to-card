import { afterEach, describe, expect, it, vi } from 'vitest'
import { installMockWebAnimations } from '../../../test/mockWebAnimations'
import {
  defaultBuildRevealTiming,
  runCellBuildReveal,
  teardownBuildRevealDom,
} from './runCellBuildReveal'

function mountBuildDom() {
  document.body.innerHTML = `
    <article id="shell">
      <div class="capture-to-card__card-media">
        <div class="capture-to-card__media-dot-field" style="--ctc-media-dots-cols: 4">
          <i></i><i></i><i></i><i></i>
          <i></i><i></i><i></i><i></i>
        </div>
        <img id="img" class="capture-to-card__card-image" width="40" height="20" />
      </div>
      <h2>
        <span class="ctc-build ctc-build--title">
          <span class="ctc-build__dots"><span class="ctc-dot-grid"><i></i><i></i></span></span>
          <span class="ctc-build__text">Title</span>
        </span>
      </h2>
    </article>
  `
  const cardShell = document.getElementById('shell')!
  const cardMedia = cardShell.querySelector(
    '.capture-to-card__card-media',
  ) as HTMLElement
  return {
    cardShell,
    cardMedia,
    cardImage: document.getElementById('img') as HTMLImageElement,
    mediaDotField: cardShell.querySelector(
      '.capture-to-card__media-dot-field',
    ) as HTMLElement,
  }
}

describe('runCellBuildReveal', () => {
  let animMock: ReturnType<typeof installMockWebAnimations>

  afterEach(() => {
    animMock?.restore()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('reveals cells and finishes with a complete card', async () => {
    animMock = installMockWebAnimations({ autoFinish: true })
    const dom = mountBuildDom()
    const handle = runCellBuildReveal(dom, {
      durationMs: 40,
      ease: 'linear',
      mediaStart: 0,
      mediaEnd: 1,
      titleStart: 0,
      titleEnd: 1,
      detailsStart: 0,
      detailsEnd: 1,
    })

    await handle.finished

    expect(dom.cardMedia.classList.contains('is-revealed')).toBe(true)
    expect(
      dom.cardShell.querySelector('.ctc-build')?.classList.contains('is-revealed'),
    ).toBe(true)
    expect(dom.cardShell.querySelector('.ctc-reveal-defs')).toBeNull()
    expect(dom.cardImage.style.mask).toBe('')
  })

  it('cleans up when cancelled', () => {
    animMock = installMockWebAnimations({ autoFinish: false })
    const dom = mountBuildDom()
    const handle = runCellBuildReveal(dom, {
      ...defaultBuildRevealTiming,
      durationMs: 5000,
    })
    handle.cancel()
    expect(dom.cardShell.querySelector('.ctc-reveal-defs')).toBeNull()
    teardownBuildRevealDom(dom.cardShell, dom.cardMedia)
    expect(dom.cardImage.style.webkitMask).toBe('')
  })
})
