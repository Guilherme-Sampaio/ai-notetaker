import type { SummaryOutput } from '../prompts/summarize.schema.js'

export type Note = {
  id: string
  transcript: string
  summary: SummaryOutput
  createdAt: string
}

const notes = new Map<string, Note>()

export const notesStore = {
  insert(note: Note): void {
    notes.set(note.id, note)
  },
  findAll(): Note[] {
    return Array.from(notes.values())
  },
  findById(id: string): Note | undefined {
    return notes.get(id)
  },
  clear(): void {
    notes.clear()
  },
}
