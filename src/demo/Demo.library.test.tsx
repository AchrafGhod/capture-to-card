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
    expect(screen.getByRole('status')).toHaveTextContent('1 component in Animations.')

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

  it('offers a way back from an empty category', () => {
    render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: 'Button' }))

    expect(
      screen.getByRole('heading', { name: 'No components in Button yet.' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('0 components in Button.')

    fireEvent.click(screen.getByRole('button', { name: 'View all components' }))
    expect(screen.getByRole('button', { name: 'Cell reveal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grid insert' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'All' })).toHaveFocus()
  })

  it('keeps the filter when returning from a study or Docs', () => {
    render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: 'Transition' }))
    fireEvent.click(screen.getByRole('button', { name: 'Grid insert' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Grid insert' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'CSS' })).toBeDisabled()
    expect(screen.getByRole('tab', { name: 'React' })).toBeDisabled()

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
