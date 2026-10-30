import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StudyWorkspace } from './StudyWorkspace'
import { Demo } from './Demo'

afterEach(() => vi.unstubAllGlobals())

describe('Study source view', () => {
  it('imports a custom SVG, updates its HTML and ignores a read completed after reset', async () => {
    render(<Demo />)
    fireEvent.click(screen.getByRole('button', { name: 'SVG Logo Reveal' }))
    const file = new File(['svg'], 'own-logo.svg', { type: 'image/svg+xml' })
    Object.defineProperty(file, 'text', {
      value: async () =>
        '<svg viewBox="0 0 100 100"><path d="M10 10H90V90H10Z" fill="#d32f2f"/></svg>',
    })
    fireEvent.change(screen.getByLabelText('Choose SVG file'), {
      target: { files: [file] },
    })
    expect(await screen.findByRole('img', { name: 'own-logo' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'HTML' }))
    expect(
      await screen.findByLabelText('Source code: logo-reveal.html'),
    ).toHaveTextContent('own-logo')
    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    let finish!: (value: string) => void
    const late = new File(['svg'], 'late.svg', { type: 'image/svg+xml' })
    Object.defineProperty(late, 'text', {
      value: () =>
        new Promise<string>((resolve) => {
          finish = resolve
        }),
    })
    fireEvent.change(screen.getByLabelText('Choose SVG file'), {
      target: { files: [late] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Use sample' }))
    finish('<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>')
    await waitFor(() =>
      expect(screen.queryByRole('img', { name: 'late' })).not.toBeInTheDocument(),
    )
    expect(screen.queryByRole('button', { name: 'Use sample' })).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'own-logo' })).not.toBeInTheDocument()
  })
  it('shows actual files, copies the selected source and keeps the preview mounted', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(
      <StudyWorkspace studyId="logo-reveal">
        <button type="button">Preview action</button>
      </StudyWorkspace>,
    )
    const original = screen.getByRole('button', { name: 'Preview action' })
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Preview' }), {
      key: 'End',
    })
    expect(screen.getByRole('tab', { name: 'CSS' })).toHaveFocus()
    expect(screen.queryByRole('tab', { name: 'Code' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Use this component' }),
    ).not.toBeInTheDocument()
    const code = (await screen.findByLabelText('Source code: LogoReveal.css'))
      .textContent
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledExactlyOnceWith(code))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(screen.getByRole('button', { name: 'Preview action' })).toBe(original)
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument()
  })
})
