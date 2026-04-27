import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { saveNote } from '../../../services/notes.api'
import type { SummaryOutput } from '../../../types/summary.types'
import { ToolbarBtn } from './ToolbarBtn'

interface EditableSectionProps {
  title: string
  items: string[]
  onChange: (items: string[]) => void
}

function EditableSection({ title, items, onChange }: EditableSectionProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">{title}</label>
      <textarea
        id={id}
        value={items.join('\n')}
        onChange={e => onChange(e.target.value.split('\n'))}
        rows={3}
        placeholder="One item per line"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}

interface Props {
  transcript: string
  summary: SummaryOutput
  onSaved: () => void
  onDiscard: () => void
}

export function NoteEditorPanel({ transcript, summary, onSaved, onDiscard }: Props) {
  const [keyDecisions, setKeyDecisions] = useState(summary.keyDecisions)
  const [upcomingDeadlines, setUpcomingDeadlines] = useState(summary.upcomingDeadlines)
  const [followUpTasks, setFollowUpTasks] = useState(summary.followUpTasks)
  const [resourcesMentioned, setResourcesMentioned] = useState(summary.resourcesMentioned)
  const [saving, setSaving] = useState(false)
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveNote(transcript, {
        keyDecisions: keyDecisions.filter(Boolean),
        upcomingDeadlines: upcomingDeadlines.filter(Boolean),
        followUpTasks: followUpTasks.filter(Boolean),
        resourcesMentioned: resourcesMentioned.filter(Boolean),
      })
      toast.success('Note saved')
      onSaved()
    } catch {
      toast.error('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 py-8 px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review &amp; Edit Summary</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Edit the sections below before saving.</p>
      </div>

      <div className="flex flex-col gap-4">
        <EditableSection title="Key Decisions" items={keyDecisions} onChange={setKeyDecisions} />
        <EditableSection title="Upcoming Deadlines" items={upcomingDeadlines} onChange={setUpcomingDeadlines} />
        <EditableSection title="Follow-up Tasks" items={followUpTasks} onChange={setFollowUpTasks} />
        <EditableSection title="Resources Mentioned" items={resourcesMentioned} onChange={setResourcesMentioned} />
      </div>

      <div className="text-sm">
        <button
          type="button"
          aria-expanded={transcriptOpen}
          aria-controls="editor-transcript"
          onClick={() => setTranscriptOpen(v => !v)}
          className="cursor-pointer text-muted-foreground hover:text-foreground select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {transcriptOpen ? 'Hide transcript' : 'View transcript'}
        </button>
        {transcriptOpen && (
          <p id="editor-transcript" className="mt-2 text-foreground bg-muted rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
            {transcript}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <ToolbarBtn
          onClick={onDiscard}
          icon={<ArrowLeft size={16} />}
          label="Record again"
          disabled={saving}
        />
        <ToolbarBtn
          onClick={() => void handleSave()}
          icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          label={saving ? 'Saving…' : 'Save note'}
          primary
          disabled={saving}
        />
      </div>
    </div>
  )
}
