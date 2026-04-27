import { FileText } from 'lucide-react'
import type { Note } from '../../../types/summary.types'

interface Props {
  note: Note
  onClick: () => void
}

export function NoteCard({ note, onClick }: Props) {
  const date = new Date(note.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const preview = [
    ...note.summary.keyDecisions,
    ...note.summary.upcomingDeadlines,
    ...note.summary.followUpTasks,
  ].slice(0, 2)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View note from ${date}`}
      className="w-full text-left rounded-xl border border-border bg-card p-4 flex flex-col gap-2 shadow-sm hover:border-primary/50 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <FileText size={14} aria-hidden />
        <span className="text-xs">{date}</span>
      </div>
      {preview.length > 0 ? (
        <ul className="text-sm text-foreground space-y-0.5">
          {preview.map((item, i) => (
            <li key={i} className="truncate">• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">No summary items</p>
      )}
    </button>
  )
}
