import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CopyButton } from './CopyButton'

function clipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  return writeText
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('CopyButton', () => {
  it('confirms a real write, ignores concurrent clicks, and resets after success', async () => {
    vi.useFakeTimers()
    let finish!: () => void
    const write = clipboard(
      vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve
          }),
      ),
    )
    render(<CopyButton text="A Windows app link" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copying…' }))
    expect(write).toHaveBeenCalledExactlyOnceWith('A Windows app link')
    expect(screen.getByRole('status')).not.toHaveTextContent('Copied')
    await act(async () => finish())
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Copied to clipboard.')
    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })

  it('shows failure without a false confirmation and allows retry', async () => {
    const write = clipboard(
      vi.fn().mockRejectedValueOnce(new Error('Denied')).mockResolvedValue(undefined),
    )
    render(<CopyButton text="Hello" />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })))
    expect(screen.getByRole('status')).toHaveTextContent('Couldn’t copy.')
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Try again' })),
    )
    expect(write).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('status')).toHaveTextContent('Copied to clipboard.')
  })

  it('discards old feedback when text changes and clears the reset on unmount', async () => {
    vi.useFakeTimers()
    let finish!: () => void
    const write = clipboard(
      vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<void>((resolve) => {
              finish = resolve
            }),
        )
        .mockResolvedValue(undefined),
    )
    const view = render(<CopyButton text="Old" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    view.rerender(<CopyButton text="New" />)
    await act(async () => finish())
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })))
    expect(write).toHaveBeenLastCalledWith('New')
    expect(screen.getByRole('status')).toHaveTextContent('Copied to clipboard.')
    view.rerender(<CopyButton text="Another" />)
    view.rerender(<CopyButton text="New" />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
