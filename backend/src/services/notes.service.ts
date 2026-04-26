import { notesStore, type Note } from '../db/notes.store.js'

export type { Note }

export function saveNote(data: Omit<Note, 'id' | 'createdAt'>): Note {
  const note: Note = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  }
  notesStore.insert(note)
  return note
}

export function listNotes(): Note[] {
  return notesStore
    .findAll()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
