import { useNavigate } from 'react-router-dom'
import { usePipeline } from '../../hooks/usePipeline'
import { NoteEditorPanel } from './components/NoteEditorPanel'
import { RecorderPanel } from './components/RecorderPanel'
import { ReviewPanel } from './components/ReviewPanel'

export function PipelinePage() {
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
