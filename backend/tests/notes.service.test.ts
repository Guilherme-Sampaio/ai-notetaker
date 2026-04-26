import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notesStore } from '../src/db/notes.store.js'
import { listNotes, saveNote } from '../src/services/notes.service.js'

const validSummary = {
  keyDecisions: ['d'],
  upcomingDeadlines: [] as string[],
  followUpTasks: [] as string[],
  resourcesMentioned: [] as string[],
}

describe('notes.service', () => {
  beforeEach(() => {
    notesStore.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('saveNote inserts and returns note with id and createdAt', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001')
    const note = saveNote({ transcript: 't1', summary: validSummary })

    expect(note).toMatchObject({
      id: '00000000-0000-4000-8000-000000000001',
      transcript: 't1',
      summary: validSummary,
    })
    expect(note.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(notesStore.findById(note.id)).toEqual(note)
  })

  it('listNotes returns newest first', () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00.000Z') })
    const uuidSpy = vi.spyOn(crypto, 'randomUUID')
    uuidSpy.mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
    const older = saveNote({ transcript: 'old', summary: validSummary })

    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'))
    uuidSpy.mockReturnValueOnce('22222222-2222-4222-8222-222222222222')
    const newer = saveNote({ transcript: 'new', summary: validSummary })

    const listed = listNotes()
    expect(listed.map((n) => n.id)).toEqual([newer.id, older.id])
  })
})
