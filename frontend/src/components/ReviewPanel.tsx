import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import type { UsePipelineReturn } from '../hooks/usePipeline'
import type { PipelineState } from '../types/pipeline.types'
import { formatTime } from '../utils/formatTime'
import { ToolbarBtn } from './ToolbarBtn'

type Props = Pick<UsePipelineReturn, 'submit' | 'discard'> & {
  state: Extract<PipelineState, { status: 'review' | 'processing' }>
}

export function ReviewPanel({ state, submit, discard }: Props) {
  const [instructions, setInstructions] = useState('')
  const isProcessing = state.status === 'processing'
  const submitError = state.status === 'review' ? state.submitError : undefined

  return (
    <div className="flex flex-col items-center gap-8 py-12 px-6">

      {/* Icon + heading */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 4a7 7 0 017 7" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Recording ready</p>
          {'durationSeconds' in state && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Duration: {formatTime(state.durationSeconds)}
            </p>
          )}
        </div>
      </div>

      {/* Custom instructions */}
      <div className="w-full max-w-md flex flex-col gap-2">
        <label htmlFor="instructions" className="text-sm font-medium text-foreground">
          Custom instructions <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          disabled={isProcessing}
          placeholder='e.g. "Emphasize registration deadlines"'
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full max-w-md">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <ToolbarBtn
            onClick={discard}
            disabled={isProcessing}
            icon={<ArrowLeft size={16} />}
            label="Record again"
            primary={!!submitError}
          />
          <ToolbarBtn
            onClick={() => void submit(instructions)}
            disabled={isProcessing || !!submitError}
            icon={isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            label={isProcessing ? 'Processing…' : 'Send for processing'}
            primary={!submitError}
          />
        </div>
      </div>

      {isProcessing && (
        <div aria-live="polite" className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm text-muted-foreground">Transcribing and summarizing your recording…</p>
          <p className="text-xs text-muted-foreground/70">Keep this tab open — closing it will cancel the process.</p>
        </div>
      )}
    </div>
  )
}
