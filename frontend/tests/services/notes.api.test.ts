import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getNotes, saveNote } from '../../src/services/notes.api'

const summary = {
  keyDecisions: ['d1'],
  upcomingDeadlines: [] as string[],
  followUpTasks: [] as string[],
  resourcesMentioned: [] as string[],
}

describe('notes.api', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('saveNote', () => {
    it('POSTs JSON to /api/notes and returns note', async () => {
      const note = {
        id: 'n1',
        createdAt: '2026-01-01T00:00:00.000Z',
        transcript: 'hello',
        summary,
      }
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(note),
      })

      const result = await saveNote('hello', summary)

      expect(result).toEqual(note)
      expect(fetchMock).toHaveBeenCalledWith('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: 'hello', summary }),
      })
    })

    it('throws when response is not ok', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 })

      await expect(saveNote('t', summary)).rejects.toThrow('Failed to save note')
    })
  })

  describe('getNotes', () => {
    it('GETs /api/notes and returns notes array', async () => {
      const notes = [
        { id: 'a', createdAt: '2026-01-01T00:00:00.000Z', transcript: 't', summary },
      ]
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ notes }),
      })

      const result = await getNotes()

      expect(result).toEqual(notes)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0]).toBe('/api/notes')
    })

    it('throws when response is not ok', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false })

      await expect(getNotes()).rejects.toThrow('Failed to load notes')
    })
  })
})
