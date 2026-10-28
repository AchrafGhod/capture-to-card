import { useRef, useState, type ComponentProps } from 'react'
import {
  cloneDemoCollectionSeed,
  createSessionCollectionItem,
} from '../../demo/demoCollection'
import { sampleCaptureToCardItem } from '../../test/fixtures/captureToCardFixture'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockWebAnimations } from '../../test/mockWebAnimations'
import { CaptureToCard } from './CaptureToCard'
import type { MorphPresentation } from './morph/useFileToCardMorph'

type HarnessProps = Partial<ComponentProps<typeof CaptureToCard>> & {
  initialPresentation?: MorphPresentation
}

function CellRevealHarness({
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
      studyScene="file-to-card"
      showCollection={false}
      item={item}
      presentation={presentation}
      onPresentationChange={setPresentation}
      collectionItems={collectionItems}
      createCardSessionLocked={sessionLocked}
      onCellBuildComplete={() => setSessionLocked(true)}
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

function GridInsertHarness(props: Partial<ComponentProps<typeof CaptureToCard>> = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [presentation, setPresentation] = useState<MorphPresentation>('card')
  const [collectionItems, setCollectionItems] = useState(cloneDemoCollectionSeed)
  const [sessionLocked, setSessionLocked] = useState(false)

  return (
    <CaptureToCard
      {...props}
      studyScene="collection-insert"
      item={sampleCaptureToCardItem}
      presentation={presentation}
      onPresentationChange={setPresentation}
      collectionItems={collectionItems}
      createCardSessionLocked={sessionLocked}
      collectionInsert={{
        createItem: () =>
          createSessionCollectionItem(sampleCaptureToCardItem, 'morph-test'),
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
      }}
    />
  )
}

function stageElement() {
  return document.querySelector('.capture-to-card__stage') as HTMLElement | null
}

function expectCellSessionClean() {
  expect(document.querySelector('.ctc-morph-fly')).toBeNull()
  expect(stageElement()?.style.minHeight).toBe('')
  expect(document.querySelector('.capture-to-card')).not.toHaveAttribute(
    'data-morphing',
  )
  expect(screen.queryByRole('button', { name: 'Animate' })).not.toBeInTheDocument()
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

  async function animateCell() {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Animate' }))
  }

  it('runs in-place cell build when Animate is clicked', async () => {
    render(<CellRevealHarness />)
    await animateCell()

    await waitFor(() => {
      expectCellSessionClean()
    })

    expect(
      screen.getAllByRole('heading', { name: sampleCaptureToCardItem.title }).length,
    ).toBeGreaterThan(0)
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

    render(<CellRevealHarness />)
    await animateCell()

    expect(animMock.handles).toHaveLength(0)
    await waitFor(() => {
      expectCellSessionClean()
    })
  })

  it('interrupts an in-flight cell build when the image changes', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    const { rerender } = render(<CellRevealHarness />)
    await animateCell()

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    rerender(
      <CellRevealHarness
        item={{ ...sampleCaptureToCardItem, imageSrc: '/other.png' }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Animate' })).toBeInTheDocument()
    })
  })

  it('cleans up cell build on resize interrupt', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    render(<CellRevealHarness />)
    await animateCell()

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    window.dispatchEvent(new Event('resize'))

    await waitFor(() => {
      expect(document.querySelector('.capture-to-card')).not.toHaveAttribute(
        'data-morphing',
      )
    })
  })

  it('cleans up animations if the card unmounts mid-build', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    const { unmount } = render(<CellRevealHarness />)
    await animateCell()

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    unmount()

    expect(stageElement()).toBeNull()
  })

  it('cleans up cell build on scroll interrupt', async () => {
    animMock.restore()
    animMock = installMockWebAnimations({ autoFinish: false })

    render(<CellRevealHarness />)
    await animateCell()

    await waitFor(() => {
      expect(animMock.handles.length).toBeGreaterThan(0)
    })

    window.dispatchEvent(new Event('scroll'))

    await waitFor(() => {
      expect(document.querySelector('.capture-to-card')).not.toHaveAttribute(
        'data-morphing',
      )
    })
  })

  it('returns to preview on Reset demo without a new import', async () => {
    const user = userEvent.setup()
    render(<CellRevealHarness onDemoReset={vi.fn()} />)
    await animateCell()
    animMock.finishAll()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset demo' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Reset demo' }))

    expect(screen.getByRole('button', { name: 'Animate' })).toBeInTheDocument()
  })

  it('inserts into the collection on Grid insert study', async () => {
    const user = userEvent.setup()
    render(<GridInsertHarness />)

    await user.click(screen.getByRole('button', { name: 'Insert into collection' }))
    animMock.finishAll()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset demo' })).toBeInTheDocument()
    })
    expect(
      screen.getAllByRole('heading', { name: sampleCaptureToCardItem.title }).length,
    ).toBeGreaterThan(1)
  })
})
