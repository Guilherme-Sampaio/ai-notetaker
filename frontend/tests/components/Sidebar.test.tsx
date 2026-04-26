import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Sidebar } from '../../src/components/Sidebar'

describe('Sidebar', () => {
  it('marks Record as current on /record', () => {
    render(
      <MemoryRouter initialEntries={['/record']}>
        <Sidebar />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Record' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Notes' })).not.toHaveAttribute('aria-current')
  })

  it('marks Notes as current on /notes', () => {
    render(
      <MemoryRouter initialEntries={['/notes']}>
        <Sidebar />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Notes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Record' })).not.toHaveAttribute('aria-current')
  })

  it('navigates when nav items are clicked', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/record']}>
        <Routes>
          <Route path="/record" element={<Sidebar />} />
          <Route path="/notes" element={<div data-testid="notes-page">Notes page</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Notes' }))
    expect(await screen.findByTestId('notes-page')).toBeInTheDocument()
  })
})
