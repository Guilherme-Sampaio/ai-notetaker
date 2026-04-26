import { useNavigate } from 'react-router-dom'
import { usePipeline } from '../hooks/usePipeline'
import { NoteEditorPanel } from './NoteEditorPanel'
import { RecorderPanel } from './RecorderPanel'
import { ReviewPanel } from './ReviewPanel'

export function PipelineScreen() {
  const navigate = useNavigate()
  const pipeline = usePipeline()
  const { state } = pipeline

  if (state.status === 'done') {
    return (
      <NoteEditorPanel
        transcript={state.transcript}
        summary={state.summary}
        onSaved={() => navigate('/notes')}
        onDiscard={pipeline.restart}
      />
    )
  }

  if (state.status === 'review' || state.status === 'processing') {
    return <ReviewPanel state={state} submit={pipeline.submit} discard={pipeline.discard} />
  }

  return <RecorderPanel {...pipeline} />
}
