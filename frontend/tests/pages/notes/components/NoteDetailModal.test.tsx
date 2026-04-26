import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteDetailModal } from '../../../../src/pages/notes/components/NoteDetailModal'
import type { Note } from '../../../../src/types/summary.types'

const note: Note = {
  id: '1',
  createdAt: '2026-03-10T10:00:00.000Z',
  transcript: 'Line one\nLine two',
  summary: {
    keyDecisions: ['Stay enrolled'],
    upcomingDeadlines: [],
    followUpTasks: [],
    resourcesMentioned: [],
  },
}

describe('NoteDetailModal', () => {
  it('closes when Close is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<NoteDetailModal note={note} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<NoteDetailModal note={note} onClose={onClose} />)
    screen.getByRole('dialog', { name: 'Note details' }).focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('expands transcript section', async () => {
    const user = userEvent.setup()
    render(<NoteDetailModal note={note} onClose={vi.fn()} />)
    expect(screen.getByText(/Line one/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show full transcript' }))
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument()
  })
})
