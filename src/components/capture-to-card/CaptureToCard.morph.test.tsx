import { useRef, useState, type ComponentProps } from 'react'
import {
  cloneDemoCollectionSeed,
  createSessionCollectionItem,
} from '../../demo/demoCollection'
import { sampleCaptureToCardItem } from '../../test/fixtures/captureToCardFixture'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockWebAnimations } from '../../test/mockWebAnimations'
import { CaptureToCard } from './CaptureToCard'
import type { MorphPresentation } from './morph/useFileToCardMorph'

type HarnessProps = Partial<ComponentProps<typeof CaptureToCard>> & {
  initialPresentation?: MorphPresentation
}

function CaptureToCardMorphHarness({
  initialPresentation = 'preview',
  item = sampleCaptureToCardItem,
  ...props
}: HarnessProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [presentation, setPresentation] =
    useState<MorphPresentation>(initialPresentation)
  const [collectionItems, setCollectionItems] = useState(cloneDemoCollectionSeed)
  const [sessionLocked, setSessionLocked] = useState(false)

  return (
    <CaptureToCard
      {...props}
      item={item}
      presentation={presentation}
      onPresentationChange={setPresentation}
      collectionItems={collectionItems}
      createCardSessionLocked={sessionLocked}
      collectionInsert={{
        createItem: () => createSessionCollectionItem(item, 'morph-test'),
        onCommit: (insertItem) => setCollectionItems((prev) => [insertItem, ...prev]),
        onComplete: () => setSessionLocked(true),
        holdAfterBuildMs: 0,
      }}
      fileInputId="morph-file"
      fileInputRef={fileInputRef}
      onFileInputChange={vi.fn()}
      onFilesDropped={vi.fn()}
      onDemoReset={() => {
        setSessionLocked(false)
        setCollectionItems(cloneDemoCollectionSeed())
        props.onDemoReset?.()
      }}
    />
  )
}

function stageElement() {
  return document.querySelector('.capture-to-card__stage') as HTMLElement | null
}

function expectMorphSessionClean() {
  expect(document.querySelector('.ctc-morph-fly')).toBeNull()
  expect(stageElement()?.style.minHeight).toBe('')
  expect(document.querySelector('.capture-to-card')).not.toHaveAttribute(
    'data-morphing',
  )
  expect(screen.queryByRole('button', { name: 'Create card' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reset demo' })).toBeInTheDocument()
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

  async function createCard() {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Create card' }))
  }

  it('runs forward morph and collection insert when Create card is clicked', async () => {
    render(<CaptureToCardMorphHarness />)
    await createCard()

    await waitFor(() => {
      expectMorphSessionClean()
    })

    expect(
      screen.getAllByRole('heading', { name: sampleCaptureToCardItem.title }).length,
    ).toBeGreaterThan(0)
  })

  it('mounts a flyout while forward morph is in flight', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    render(<CaptureToCardMorphHarness />)
    await createCard()

    await waitFor(() => {
      expect(document.querySelector('.ctc-morph-fly')).not.toBeNull()
    })
  })

  it('uses instant card layout when reduced motion is preferred', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    render(<CaptureToCardMorphHarness />)
    await createCard()

    expect(animMock.handles).toHaveLength(0)
    await waitFor(() => {
      expectMorphSessionClean()
    })
  })

  it('interrupts an in-flight forward morph when the image changes', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    const { rerender } = render(<CaptureToCardMorphHarness />)
    await createCard()

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    rerender(
      <CaptureToCardMorphHarness
        item={{ ...sampleCaptureToCardItem, imageSrc: '/other.png' }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create card' })).toBeInTheDocument()
    })
  })

  it('cleans up forward morph on resize interrupt', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    render(<CaptureToCardMorphHarness />)
    await createCard()

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    window.dispatchEvent(new Event('resize'))

    await waitFor(() => {
      expect(document.querySelector('.ctc-morph-fly')).toBeNull()
    })
  })

  it('removes flyout if the card unmounts mid-morph', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    const { unmount } = render(<CaptureToCardMorphHarness />)
    await createCard()

    await waitFor(() => {
      expect(document.querySelector('.ctc-morph-fly')).not.toBeNull()
    })

    unmount()

    expect(document.querySelector('.ctc-morph-fly')).toBeNull()
  })

  it('cleans up forward morph on scroll interrupt', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    render(<CaptureToCardMorphHarness />)
    await createCard()

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    window.dispatchEvent(new Event('scroll'))

    await waitFor(() => {
      expect(document.querySelector('.ctc-morph-fly')).toBeNull()
    })
  })

  it('returns to preview on Reset demo without a new import', async () => {
    const user = userEvent.setup()
    render(<CaptureToCardMorphHarness onDemoReset={vi.fn()} />)
    await createCard()
    animMock.finishAll()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset demo' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Reset demo' }))

    expect(screen.getByRole('button', { name: 'Create card' })).toBeInTheDocument()
    const build = document.querySelector('.capture-to-card__destination') as HTMLElement
    expect(within(build).queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})
