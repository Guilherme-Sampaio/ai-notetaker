import { FileText, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getNotes } from '../services/notes.api'
import type { Note } from '../types/summary.types'
import { NoteCard } from './NoteCard'
import { NoteDetailModal } from './NoteDetailModal'

export function NotesListScreen() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  useEffect(() => {
    getNotes()
      .then(setNotes)
      .catch(() => toast.error('Failed to load notes'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <FileText size={40} className="text-muted-foreground" />
        <p className="text-foreground font-medium">No notes yet</p>
        <p className="text-sm text-muted-foreground">Record a meeting to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 py-6 px-4">
        <h2 className="text-lg font-semibold text-foreground">Saved Notes</h2>
        <div className="flex flex-col gap-3">
          {notes.map(note => (
            <NoteCard key={note.id} note={note} onClick={() => setSelectedNote(note)} />
          ))}
        </div>
      </div>

      {selectedNote && (
        <NoteDetailModal note={selectedNote} onClose={() => setSelectedNote(null)} />
      )}
    </>
  )
}
