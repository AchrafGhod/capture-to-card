import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { sampleCaptureToCardItem } from '../../test/fixtures/captureToCardFixture'
import { CaptureToCard } from './CaptureToCard'

describe('CaptureToCard', () => {
  it('keeps Create card disabled until a file is selected', () => {
    render(
      <CaptureToCard
        presentation="source"
        item={sampleCaptureToCardItem}
        sourceSelected={false}
      />,
    )

    expect(screen.getByRole('button', { name: 'Create card' })).toBeDisabled()
    expect(screen.getByText('Select an image to continue.')).toBeInTheDocument()
  })

  it('shows card content after Create card and returns to the file list', async () => {
    const user = userEvent.setup()
    const onPrimaryAction = vi.fn()
    const { rerender } = render(
      <CaptureToCard
        presentation="source"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPrimaryAction={onPrimaryAction}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create card' }))
    expect(onPrimaryAction).toHaveBeenCalled()

    rerender(
      <CaptureToCard
        presentation="card"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
        onPrimaryAction={onPrimaryAction}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'sample.png', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Last modified')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to file list' }))
    expect(onPrimaryAction).toHaveBeenCalledTimes(2)
  })

  it('moves focus to Back to file list when the card opens', () => {
    const { rerender } = render(
      <CaptureToCard
        presentation="source"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
      />,
    )

    rerender(
      <CaptureToCard
        presentation="card"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
      />,
    )

    expect(screen.getByRole('button', { name: 'Back to file list' })).toHaveFocus()
  })

  it('moves focus to the file row when returning to the list', () => {
    const { rerender } = render(
      <CaptureToCard
        presentation="card"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
      />,
    )

    rerender(
      <CaptureToCard
        presentation="source"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
      />,
    )

    expect(screen.getByRole('button', { name: 'sample.png' })).toHaveFocus()
  })

  it('does not move focus on the first render', () => {
    render(
      <CaptureToCard
        presentation="source"
        item={sampleCaptureToCardItem}
        sourceSelected={true}
      />,
    )

    expect(screen.getByRole('button', { name: 'sample.png' })).not.toHaveFocus()
  })
})
