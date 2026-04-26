import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotesListPage } from '../../../src/pages/notes/NotesListPage'
import * as notesApi from '../../../src/services/notes.api'
import { toast } from 'sonner'

vi.mock('../../../src/services/notes.api', () => ({
  getNotes: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const summary = {
  keyDecisions: ['d1'],
  upcomingDeadlines: [] as string[],
  followUpTasks: [] as string[],
  resourcesMentioned: [] as string[],
}

describe('NotesListScreen', () => {
  beforeEach(() => {
    vi.mocked(notesApi.getNotes).mockReset()
    vi.mocked(toast.error).mockClear()
  })

  it('shows spinner then empty state when there are no notes', async () => {
    vi.mocked(notesApi.getNotes).mockResolvedValueOnce([])
    render(<NotesListPage />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('No notes yet')).toBeInTheDocument()
    })
    expect(screen.getByText('Record a meeting to get started.')).toBeInTheDocument()
  })

  it('toasts when load fails', async () => {
    vi.mocked(notesApi.getNotes).mockRejectedValueOnce(new Error('network'))
    render(<NotesListPage />)
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load notes')
    })
  })

  it('lists notes and opens modal on card click', async () => {
    const user = userEvent.setup()
    const note = {
      id: 'n1',
      createdAt: '2026-01-01T12:00:00.000Z',
      transcript: 'Meeting text',
      summary,
    }
    vi.mocked(notesApi.getNotes).mockResolvedValueOnce([note])
    render(<NotesListPage />)
    await waitFor(() => {
      expect(screen.getByText('Saved Notes')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /View note from/ }))
    expect(screen.getByRole('dialog', { name: 'Note details' })).toBeInTheDocument()
    expect(screen.getByText('Meeting text')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Note details' })).not.toBeInTheDocument()
    })
  })
})
