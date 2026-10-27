import { useState, type ComponentProps } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sampleCaptureToCardItem } from '../../test/fixtures/captureToCardFixture'
import { installMockWebAnimations } from '../../test/mockWebAnimations'
import { CaptureToCard, type CaptureToCardPresentation } from './CaptureToCard'

type ControlledProps = Omit<
  ComponentProps<typeof CaptureToCard>,
  'presentation' | 'onPresentationChange'
> & {
  initialPresentation?: CaptureToCardPresentation
  onPresentationChange?: (next: CaptureToCardPresentation) => void
}

function CaptureToCardControlled({
  initialPresentation = 'source',
  onPresentationChange: onPresentationChangeProp,
  ...props
}: ControlledProps) {
  const [presentation, setPresentation] = useState(initialPresentation)
  return (
    <CaptureToCard
      {...props}
      presentation={presentation}
      onPresentationChange={(next) => {
        onPresentationChangeProp?.(next)
        setPresentation(next)
      }}
    />
  )
}

function stageElement() {
  return document.querySelector('.capture-to-card__stage') as HTMLElement | null
}

function expectMorphSessionClean(presentation: CaptureToCardPresentation) {
  expect(document.querySelector('.ctc-morph-fly')).toBeNull()
  expect(stageElement()?.style.minHeight).toBe('')
  expect(document.querySelector('.capture-to-card')).not.toHaveAttribute(
    'data-morphing',
  )

  if (presentation === 'source') {
    expect(document.querySelector('.capture-to-card__destination')).toBeNull()
    expect(screen.getByRole('button', { name: 'Create card' })).not.toBeDisabled()
  } else {
    expect(
      screen.getByRole('heading', { name: sampleCaptureToCardItem.title, level: 2 }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Back to file list' })).not.toBeDisabled()
  }
}

describe('CaptureToCard morph', () => {
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
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 120,
      width: 200,
      height: 120,
      toJSON: () => ({}),
    })
  })

  afterEach(() => {
    animMock.restore()
    vi.restoreAllMocks()
  })

  it('requests card presentation on Create card and completes forward morph', async () => {
    const user = userEvent.setup()
    const onPresentationChange = vi.fn()
    render(
      <CaptureToCardControlled
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPresentationChange={onPresentationChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create card' }))
    expect(onPresentationChange).toHaveBeenCalledWith('card')

    await waitFor(() => {
      expectMorphSessionClean('card')
    })
  })

  it('does not move focus to Back until forward morph finishes', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    const user = userEvent.setup()
    render(
      <CaptureToCardControlled item={sampleCaptureToCardItem} sourceSelected={true} />,
    )

    await user.click(screen.getByRole('button', { name: 'Create card' }))

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    expect(screen.getByRole('button', { name: 'Back to file list' })).not.toHaveFocus()

    animMock.finishAll()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to file list' })).toHaveFocus()
    })
  })

  it('requests source presentation on Back and completes back morph with focus on file row', async () => {
    const user = userEvent.setup()
    const onPresentationChange = vi.fn()
    render(
      <CaptureToCardControlled
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPresentationChange={onPresentationChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create card' }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Back to file list' }),
      ).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: 'Back to file list' }))
    expect(onPresentationChange).toHaveBeenLastCalledWith('source')

    await waitFor(() => {
      expectMorphSessionClean('source')
      expect(screen.getByRole('button', { name: 'sample.png' })).toHaveFocus()
    })
  })

  it('does not move focus to the file row until back morph finishes', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    const user = userEvent.setup()
    render(
      <CaptureToCardControlled item={sampleCaptureToCardItem} sourceSelected={true} />,
    )

    await user.click(screen.getByRole('button', { name: 'Create card' }))
    animMock.finishAll()
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Back to file list' }),
      ).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: 'Back to file list' }))

    await waitFor(() => {
      expect(animMock.handles.some((h) => h.playState === 'running')).toBe(true)
    })

    expect(screen.getByRole('button', { name: 'sample.png' })).not.toHaveFocus()

    animMock.finishAll()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'sample.png' })).toHaveFocus()
    })
  })

  it('uses instant presentation change when reduced motion is preferred', async () => {
    const user = userEvent.setup()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    const onPresentationChange = vi.fn()
    render(
      <CaptureToCardControlled
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPresentationChange={onPresentationChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create card' }))
    expect(onPresentationChange).toHaveBeenCalledWith('card')
    expect(animMock.handles).toHaveLength(0)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to file list' })).toHaveFocus()
    })
  })

  it('interrupts an in-flight forward morph when the image changes', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    const user = userEvent.setup()
    const { rerender } = render(
      <CaptureToCardControlled item={sampleCaptureToCardItem} sourceSelected={true} />,
    )

    await user.click(screen.getByRole('button', { name: 'Create card' }))

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    rerender(
      <CaptureToCardControlled
        item={{ ...sampleCaptureToCardItem, imageSrc: '/other.png' }}
        sourceSelected={true}
      />,
    )

    await waitFor(() => {
      expectMorphSessionClean('card')
    })
  })

  it('cleans up forward morph on resize interrupt', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    const user = userEvent.setup()
    render(
      <CaptureToCardControlled item={sampleCaptureToCardItem} sourceSelected={true} />,
    )

    await user.click(screen.getByRole('button', { name: 'Create card' }))

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    window.dispatchEvent(new Event('resize'))

    await waitFor(() => {
      expectMorphSessionClean('card')
    })
  })

  it('cleans up back morph on scroll interrupt', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    const user = userEvent.setup()
    render(
      <CaptureToCardControlled item={sampleCaptureToCardItem} sourceSelected={true} />,
    )

    await user.click(screen.getByRole('button', { name: 'Create card' }))
    animMock.finishAll()
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Back to file list' }),
      ).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: 'Back to file list' }))

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    window.dispatchEvent(new Event('scroll'))

    await waitFor(() => {
      expectMorphSessionClean('source')
      expect(screen.getByRole('button', { name: 'sample.png' })).toHaveFocus()
    })
  })
})
