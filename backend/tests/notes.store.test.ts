import { beforeEach, describe, expect, it } from 'vitest'
import { notesStore, type Note } from '../src/db/notes.store.js'

const sample: Note = {
  id: 'n1',
  transcript: 't',
  summary: {
    keyDecisions: [],
    upcomingDeadlines: [],
    followUpTasks: [],
    resourcesMentioned: [],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('notesStore', () => {
  beforeEach(() => {
    notesStore.clear()
  })

  it('insert and findById round-trip', () => {
    notesStore.insert(sample)
    expect(notesStore.findById('n1')).toEqual(sample)
  })

  it('findAll returns all values', () => {
    notesStore.insert(sample)
    notesStore.insert({ ...sample, id: 'n2' })
    const all = notesStore.findAll()
    expect(all).toHaveLength(2)
    expect(new Set(all.map((n) => n.id))).toEqual(new Set(['n1', 'n2']))
  })

  it('clear removes all notes', () => {
    notesStore.insert(sample)
    notesStore.clear()
    expect(notesStore.findAll()).toEqual([])
  })
})
