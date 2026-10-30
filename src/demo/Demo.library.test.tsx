import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Demo } from './Demo'

describe('Library categories', () => {
  it('filters by motion type and supports overlapping component categories', () => {
    render(<Demo />)
    const filters = screen.getByRole('group', { name: 'Component categories' })

    expect(screen.getByRole('button', { name: 'Cell reveal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grid insert' })).toBeInTheDocument()

    fireEvent.click(within(filters).getByRole('button', { name: 'Animations' }))
    expect(screen.getByRole('button', { name: 'Cell reveal' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Grid insert' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pixel Reveal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SVG Logo Reveal' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('5 components in Animations.')

    fireEvent.click(within(filters).getByRole('button', { name: 'Transition' }))
    expect(
      screen.queryByRole('button', { name: 'Cell reveal' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grid insert' })).toBeInTheDocument()

    fireEvent.click(within(filters).getByRole('button', { name: 'Card' }))
    expect(screen.getByRole('button', { name: 'Cell reveal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grid insert' })).toBeInTheDocument()
    expect(within(filters).getByRole('button', { name: 'Card' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(filters).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('opens Copy Button from its category and preserves the filter on return', () => {
    render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: 'Button' }))

    expect(screen.getByRole('status')).toHaveTextContent('1 component in Button.')
    expect(
      screen.queryByRole('button', { name: 'Cell reveal' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Copy Button' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Copy Button' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('button', { name: 'Button' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByRole('button', { name: 'Cell reveal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grid insert' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('keeps the filter when returning from a study or Docs', () => {
    render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: 'Transition' }))
    fireEvent.click(screen.getByRole('button', { name: 'Grid insert' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Grid insert' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'React' })).toBeEnabled()
    expect(screen.getByRole('tab', { name: 'CSS' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(
      screen.queryByRole('button', { name: 'Cell reveal' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Transition' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Docs' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Docs' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'CompoMotion — Library' }))
    expect(screen.getByRole('button', { name: 'Grid insert' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Transition' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
