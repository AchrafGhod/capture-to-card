import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockWebAnimations } from '../../test/mockWebAnimations'
import { PixelReveal } from './PixelReveal'

afterEach(() => vi.restoreAllMocks())

beforeEach(() => {
  vi.mocked(window.matchMedia).mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList)
})

function readyImage(image: HTMLImageElement) {
  Object.defineProperty(image, 'decode', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  })
  vi.spyOn(image.parentElement!, 'getBoundingClientRect').mockReturnValue({
    width: 240,
    height: 120,
  } as DOMRect)
  fireEvent.load(image)
}

describe('PixelReveal lifecycle', () => {
  it('replays safely, clears stale animations, and removes the mask on completion', async () => {
    const mock = installMockWebAnimations({ autoFinish: false })
    const { rerender, container, unmount } = render(
      <PixelReveal src="landscape.png" alt="Mountains" />,
    )
    const image = screen.getByAltText('Mountains') as HTMLImageElement
    readyImage(image)
    await waitFor(() => expect(mock.handles.length).toBe(51))
    expect(vi.mocked(Element.prototype.animate).mock.calls[0]![0]).toEqual(
      expect.arrayContaining([
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: 1 },
      ]),
    )
    expect(container.querySelector('.pixel-reveal__layer rect')).toHaveAttribute(
      'fill',
      '#111111',
    )
    expect(image.parentElement!.style.maskImage).toContain('pixel-reveal-')
    expect(image.style.maskImage).toBe('')
    expect(image.animate).toHaveBeenLastCalledWith(
      [{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
      expect.objectContaining({ duration: 1200, fill: 'both' }),
    )
    rerender(<PixelReveal src="landscape.png" alt="Mountains" replayKey={1} />)
    expect(
      mock.handles.slice(0, 51).every((handle) => handle.playState === 'idle'),
    ).toBe(true)
    readyImage(image)
    await waitFor(() => expect(mock.handles.length).toBe(102))
    await act(async () => mock.finishAll())
    expect(image.parentElement!.style.maskImage).toBe('')
    expect(container.querySelectorAll('mask rect')).toHaveLength(0)
    expect(container.querySelectorAll('.pixel-reveal__layer rect')).toHaveLength(0)
    unmount()
  })

  it('shows the full image without animations when reduced motion is enabled', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
    const mock = installMockWebAnimations()
    render(<PixelReveal src="landscape.png" alt="Mountains" />)
    const image = screen.getByAltText('Mountains') as HTMLImageElement
    readyImage(image)
    await waitFor(() => expect(image.style.visibility).toBe('visible'))
    expect(mock.handles).toHaveLength(0)
    expect(image.parentElement!.style.maskImage).toBe('')
  })

  it('does not start a stale decoded source and cancels on unmount', async () => {
    const mock = installMockWebAnimations({ autoFinish: false })
    const { rerender, unmount } = render(<PixelReveal src="old.png" alt="Mountains" />)
    const image = screen.getByAltText('Mountains') as HTMLImageElement
    let resolveDecode!: () => void
    Object.defineProperty(image, 'decode', {
      configurable: true,
      value: () =>
        new Promise<void>((resolve) => {
          resolveDecode = resolve
        }),
    })
    fireEvent.load(image)
    rerender(<PixelReveal src="new.png" alt="Mountains" />)
    await act(async () => resolveDecode())
    expect(mock.handles).toHaveLength(0)
    readyImage(image)
    await waitFor(() => expect(mock.handles).toHaveLength(51))
    unmount()
    expect(mock.handles.every((handle) => handle.playState === 'idle')).toBe(true)
  })

  it('keeps image failure understandable', () => {
    render(<PixelReveal src="missing.png" alt="Mountains" />)
    fireEvent.error(screen.getByAltText('Mountains'))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This image could not be loaded.',
    )
  })
})
