import { afterEach, describe, expect, it, vi } from 'vitest'
import markup from './skeleton-reveal.html?raw'
import { mountSkeletonReveal } from './skeleton-reveal.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

function fixture() {
  document.body.innerHTML = markup
  const root = document.querySelector<HTMLElement>('.cm-skeleton')!
  const image = root.querySelector('img')!
  Object.defineProperty(image, 'complete', { configurable: true, value: false })
  return { root, image }
}

describe('Skeleton Reveal', () => {
  it('waits for real loading and decoding before exposing content', async () => {
    const { root, image } = fixture()
    let decoded!: () => void
    Object.defineProperty(image, 'decode', {
      value: () =>
        new Promise<void>((resolve) => {
          decoded = resolve
        }),
    })
    const skeleton = mountSkeletonReveal(root, { auto: false })
    const reveal = skeleton.reveal()
    image.dispatchEvent(new Event('load'))
    await Promise.resolve()
    expect(root.dataset.ready).toBe('false')
    decoded()
    await reveal
    expect(root.dataset.ready).toBe('true')
    expect(root.getAttribute('aria-busy')).toBe('false')
    expect(root.querySelector('.cm-skeleton__body')?.hasAttribute('aria-hidden')).toBe(
      false,
    )
    skeleton.destroy()
  })
  it('handles errors and discards completion after reset or cleanup', async () => {
    const { root, image } = fixture()
    const skeleton = mountSkeletonReveal(root, { auto: false })
    const failed = skeleton.reveal()
    image.dispatchEvent(new Event('error'))
    await failed
    expect(root.dataset.error).toBe('true')
    const stale = skeleton.reveal()
    skeleton.reset()
    await stale
    expect(root.dataset.error).toBeUndefined()
    expect(root.dataset.ready).toBe('false')
    const pending = skeleton.reveal()
    skeleton.destroy()
    await pending
    expect(root.dataset.ready).toBe('false')
  })
})
