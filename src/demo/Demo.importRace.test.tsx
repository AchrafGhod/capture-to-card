import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Demo } from './Demo'
import * as demoImageImport from './demoImageImport'
import type { CaptureToCardItem } from '../components/capture-to-card/captureToCardItem'
import type { LocalImageImportResult } from './demoImageImport'
import { MULTIPLE_FILES_MESSAGE } from './demoImageImport'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function successItem(title: string, objectUrl: string): CaptureToCardItem {
  return {
    imageSrc: objectUrl,
    title,
    width: 640,
    height: 480,
    dimensionsLabel: '640 × 480',
    formatSizeLabel: 'PNG · 1 KB',
    modifiedLabel: 'Jan 1, 2024, 12:00 PM',
  }
}

describe('Demo import race', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not apply a slower import after a newer file was chosen', async () => {
    const first = deferred<LocalImageImportResult>()
    const second = deferred<LocalImageImportResult>()

    const importMock = vi
      .spyOn(demoImageImport, 'importLocalImageFile')
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)

    const revokeSpy = vi.spyOn(demoImageImport, 'revokeObjectUrlIfNeeded')

    render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: 'Cell reveal' }))

    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const slowFile = new File(['slow'], 'slow.png', { type: 'image/png' })
    const fastFile = new File(['fast'], 'fast.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [slowFile] } })
    fireEvent.change(input, { target: { files: [fastFile] } })

    second.resolve({
      item: successItem('fast.png', 'blob:fast'),
      objectUrl: 'blob:fast',
    })

    await waitFor(() => {
      expect(screen.getByText('fast.png')).toBeInTheDocument()
    })

    first.resolve({
      item: successItem('slow.png', 'blob:slow'),
      objectUrl: 'blob:slow',
    })

    await waitFor(() => {
      expect(revokeSpy).toHaveBeenCalledWith('blob:slow', expect.any(String))
    })

    expect(screen.getByText('fast.png')).toBeInTheDocument()
    expect(screen.queryByText('slow.png')).not.toBeInTheDocument()

    importMock.mockRestore()
    revokeSpy.mockRestore()
  })

  it('discards a finishing import after the demo unmounts', async () => {
    const pending = deferred<LocalImageImportResult>()
    vi.spyOn(demoImageImport, 'importLocalImageFile').mockReturnValue(pending.promise)
    const revokeSpy = vi.spyOn(demoImageImport, 'revokeObjectUrlIfNeeded')

    const { unmount } = render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: 'Cell reveal' }))
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'late.png', { type: 'image/png' })] },
    })
    unmount()

    pending.resolve({
      item: successItem('late.png', 'blob:late'),
      objectUrl: 'blob:late',
    })

    await waitFor(() => {
      expect(revokeSpy).toHaveBeenCalledWith('blob:late', expect.any(String))
    })
    expect(
      screen.queryByRole('heading', { name: 'late.png', level: 2 }),
    ).not.toBeInTheDocument()
  })

  it('rejects multiple files at once without importing', async () => {
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
  })
})
