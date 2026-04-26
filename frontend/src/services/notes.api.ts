import type { Note, SummaryOutput } from '../types/summary.types'

const API_BASE = '/api'

export async function saveNote(transcript: string, summary: SummaryOutput): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, summary }),
  })
  if (!res.ok) throw new Error('Failed to save note')
  return res.json() as Promise<Note>
}

export async function getNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/notes`)
  if (!res.ok) throw new Error('Failed to load notes')
  const data = await res.json() as { notes: Note[] }
  return data.notes
}
