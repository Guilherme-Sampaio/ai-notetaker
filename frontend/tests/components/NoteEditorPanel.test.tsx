import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { NoteEditorPanel } from '../../src/components/NoteEditorPanel'
import * as notesApi from '../../src/services/notes.api'
import { toast } from 'sonner'

vi.mock('../../src/services/notes.api', () => ({
  saveNote: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const summary = {
  keyDecisions: ['a'],
  upcomingDeadlines: ['b'],
  followUpTasks: [] as string[],
  resourcesMentioned: [] as string[],
}

function EditorRoute() {
  const navigate = useNavigate()
  return (
    <NoteEditorPanel
      transcript="hello"
      summary={summary}
      onSaved={() => navigate('/notes')}
      onDiscard={() => navigate('/record')}
    />
  )
}

describe('NoteEditorPanel', () => {
  beforeEach(() => {
    vi.mocked(notesApi.saveNote).mockReset()
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it('submits edited summary and navigates on success', async () => {
    const user = userEvent.setup()
    vi.mocked(notesApi.saveNote).mockResolvedValueOnce({
      id: 'saved',
      createdAt: '2026-01-01T00:00:00.000Z',
      transcript: 'hello',
      summary,
    })
    render(
      <MemoryRouter initialEntries={['/edit']}>
        <Routes>
          <Route path="/edit" element={<EditorRoute />} />
          <Route path="/notes" element={<div data-testid="notes-route">ok</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /Review & Edit Summary/i })).toBeInTheDocument()

    const areas = screen.getAllByPlaceholderText('One item per line')
    await user.clear(areas[0])
    await user.type(areas[0], 'new-line')

    await user.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(() => {
      expect(notesApi.saveNote).toHaveBeenCalledWith('hello', {
        keyDecisions: ['new-line'],
        upcomingDeadlines: ['b'],
        followUpTasks: [],
        resourcesMentioned: [],
      })
    })
    expect(toast.success).toHaveBeenCalledWith('Note saved')
    expect(await screen.findByTestId('notes-route')).toBeInTheDocument()
  })

  it('toasts error when save fails', async () => {
    const user = userEvent.setup()
    vi.mocked(notesApi.saveNote).mockRejectedValueOnce(new Error('fail'))
    render(
      <MemoryRouter initialEntries={['/edit']}>
        <Routes>
          <Route path="/edit" element={<EditorRoute />} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save note')
    })
  })

  it('calls onDiscard from Record again', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/edit']}>
        <Routes>
          <Route path="/edit" element={<EditorRoute />} />
          <Route path="/record" element={<div data-testid="record-route">r</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Record again' }))
    expect(await screen.findByTestId('record-route')).toBeInTheDocument()
  })
})
