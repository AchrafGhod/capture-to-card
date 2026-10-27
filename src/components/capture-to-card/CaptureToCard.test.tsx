import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockWebAnimations } from '../../test/mockWebAnimations'
import { sampleCaptureToCardItem } from '../../test/fixtures/captureToCardFixture'
import { CaptureToCard } from './CaptureToCard'

describe('CaptureToCard', () => {
  let animMock: ReturnType<typeof installMockWebAnimations>

  beforeEach(() => {
    animMock = installMockWebAnimations()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    animMock.restore()
  })

  it('keeps Create card disabled until a file is selected', () => {
    render(
      <CaptureToCard
        presentation="source"
        item={sampleCaptureToCardItem}
        sourceSelected={false}
        onPresentationChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Create card' })).toBeDisabled()
    expect(screen.getByText('Select an image to continue.')).toBeInTheDocument()
  })

  it('does not move focus on the first render', () => {
    render(
      <CaptureToCard
        presentation="source"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPresentationChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'sample.png' })).not.toHaveFocus()
  })

  it('moves focus to Back when the parent sets presentation to card without morph', () => {
    const onPresentationChange = vi.fn()
    const { rerender } = render(
      <CaptureToCard
        presentation="source"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPresentationChange={onPresentationChange}
      />,
    )

    rerender(
      <CaptureToCard
        presentation="card"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPresentationChange={onPresentationChange}
      />,
    )

    expect(screen.getByRole('button', { name: 'Back to file list' })).toHaveFocus()
  })

  it('moves focus to the file row when the parent sets presentation to source without morph', () => {
    const onPresentationChange = vi.fn()
    const { rerender } = render(
      <CaptureToCard
        presentation="card"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPresentationChange={onPresentationChange}
      />,
    )

    rerender(
      <CaptureToCard
        presentation="source"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPresentationChange={onPresentationChange}
      />,
    )

    expect(screen.getByRole('button', { name: 'sample.png' })).toHaveFocus()
  })
})
