import { useRef, useState, type ComponentProps } from 'react'
import { Demo } from '../../demo/Demo'
import { cloneDemoCollectionSeed } from '../../demo/demoCollection'
import * as demoImageImport from '../../demo/demoImageImport'
import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockWebAnimations } from '../../test/mockWebAnimations'
import { sampleCaptureToCardItem } from '../../test/fixtures/captureToCardFixture'
import { MULTIPLE_FILES_MESSAGE } from '../../demo/demoImageImport'
import { CaptureToCard } from './CaptureToCard'
import type { MorphPresentation } from './morph/useFileToCardMorph'

function CaptureToCardHarness(
  props: Partial<ComponentProps<typeof CaptureToCard>> & {
    initialPresentation?: MorphPresentation
  },
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [presentation, setPresentation] = useState<MorphPresentation>(
    props.initialPresentation ?? 'preview',
  )
  const [collectionItems, setCollectionItems] = useState(cloneDemoCollectionSeed)
  const [sessionLocked, setSessionLocked] = useState(false)

  return (
    <CaptureToCard
      {...props}
      studyScene={props.studyScene ?? 'file-to-card'}
      showCollection={props.showCollection ?? false}
      item={props.item ?? sampleCaptureToCardItem}
      presentation={presentation}
      onPresentationChange={setPresentation}
      collectionItems={collectionItems}
      createCardSessionLocked={sessionLocked}
      onCellBuildComplete={() => setSessionLocked(true)}
      fileInputId="test-file"
      fileInputRef={fileInputRef}
      onFileInputChange={props.onFileInputChange ?? vi.fn()}
      onFilesDropped={props.onFilesDropped ?? vi.fn()}
      onDemoReset={() => {
        setSessionLocked(false)
        setCollectionItems(cloneDemoCollectionSeed())
        props.onDemoReset?.()
      }}
    />
  )
}

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

  it('shows Animate before the cell build runs', () => {
    render(<CaptureToCardHarness />)

    expect(screen.getByRole('button', { name: 'Animate' })).toBeInTheDocument()
    expect(screen.getByLabelText('Change image')).toBeInTheDocument()
  })

  it('forwards a single dropped file on the cell reveal study', () => {
    const onFilesDropped = vi.fn()
    render(<CaptureToCardHarness onFilesDropped={onFilesDropped} />)

    const zone = document.querySelector('[data-image-drop-zone]')!
    const file = new File(['x'], 'one.png', { type: 'image/png' })
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'] } })
    const drop = createEvent.drop(zone)
    Object.assign(drop, {
      dataTransfer: { types: ['Files'], files: [file] },
    })
    fireEvent(zone, drop)

    expect(onFilesDropped).toHaveBeenCalledTimes(1)
    const [files] = onFilesDropped.mock.calls[0]!
    expect(files[0]?.name).toBe('one.png')
  })

  it('does not call import when multiple files are dropped from the demo shell', () => {
    const importMock = vi.spyOn(demoImageImport, 'importLocalImageFile')
    render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: 'Cell reveal' }))
    const zone = document.querySelector('[data-image-drop-zone]')!
    fireEvent.drop(zone, {
      clientX: 10,
      clientY: 10,
      dataTransfer: {
        types: ['Files'],
        files: [
          new File(['a'], 'a.png', { type: 'image/png' }),
          new File(['b'], 'b.png', { type: 'image/png' }),
        ],
      },
    })
    expect(screen.getByRole('alert')).toHaveTextContent(MULTIPLE_FILES_MESSAGE)
    expect(importMock).not.toHaveBeenCalled()
    importMock.mockRestore()
  })

  it('shows import errors with a retry action', () => {
    const onImportRetry = vi.fn()
    render(
      <CaptureToCardHarness
        importError="Could not read file."
        onImportRetry={onImportRetry}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onImportRetry).toHaveBeenCalled()
  })

  it('locks the session after Animate completes the cell build', async () => {
    const user = userEvent.setup()
    render(<CaptureToCardHarness />)

    await user.click(screen.getByRole('button', { name: 'Animate' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset demo' })).toBeInTheDocument()
    })
  })
})
