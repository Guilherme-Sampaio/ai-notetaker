import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Note } from '../types/summary.types'
import { SummarySection } from './SummarySection'

interface Props {
  note: Note
  onClose: () => void
}

export function NoteDetailModal({ note, onClose }: Props) {
  const [transcriptExpanded, setTranscriptExpanded] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const date = new Date(note.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      aria-modal="true"
      role="dialog"
      aria-label="Note details"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-xl overflow-hidden focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">

          {/* Summary */}
          <section aria-label="Note summary">
            <h3 className="text-sm font-semibold text-foreground mb-3">Summary</h3>
            <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-4">
              <SummarySection title="Key Decisions" items={note.summary.keyDecisions} />
              <SummarySection title="Upcoming Deadlines" items={note.summary.upcomingDeadlines} />
              <SummarySection title="Follow-up Tasks" items={note.summary.followUpTasks} />
              <SummarySection title="Resources Mentioned" items={note.summary.resourcesMentioned} />
            </div>
          </section>

          {/* Transcript */}
          <section aria-label="Meeting transcript">
            <h3 className="text-sm font-semibold text-foreground mb-3">Transcript</h3>
            <div className="rounded-xl border border-border bg-background">
              <div
                className={[
                  'overflow-y-auto transition-all px-4 py-3',
                  transcriptExpanded ? 'max-h-96' : 'max-h-28',
                ].join(' ')}
              >
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {note.transcript}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTranscriptExpanded(v => !v)}
                className="w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground border-t border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-b-xl"
              >
                {transcriptExpanded ? 'Show less' : 'Show full transcript'}
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
