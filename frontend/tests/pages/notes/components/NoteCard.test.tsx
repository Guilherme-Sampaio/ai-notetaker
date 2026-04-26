import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteCard } from '../../../../src/pages/notes/components/NoteCard'
import type { Note } from '../../../../src/types/summary.types'

const baseNote: Note = {
  id: '1',
  createdAt: '2026-06-15T14:30:00.000Z',
  transcript: 't',
  summary: {
    keyDecisions: ['First decision', 'Second decision'],
    upcomingDeadlines: ['May 1 deadline'],
    followUpTasks: [],
    resourcesMentioned: [],
  },
}

describe('NoteCard', () => {
  it('shows first two preview lines from decisions, deadlines, and tasks', () => {
    const onClick = vi.fn()
    render(<NoteCard note={baseNote} onClick={onClick} />)
    expect(screen.getByText(/• First decision/)).toBeInTheDocument()
    expect(screen.getByText(/• Second decision/)).toBeInTheDocument()
    expect(screen.queryByText(/May 1/)).not.toBeInTheDocument()
  })

  it('shows empty message when no preview items', () => {
    const note: Note = {
      ...baseNote,
      summary: {
        keyDecisions: [],
        upcomingDeadlines: [],
        followUpTasks: [],
        resourcesMentioned: ['Only resource'],
      },
    }
    render(<NoteCard note={note} onClick={vi.fn()} />)
    expect(screen.getByText('No summary items')).toBeInTheDocument()
  })

  it('invokes onClick when card is activated', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<NoteCard note={baseNote} onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: /View note from/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
