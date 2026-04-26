import { usePipeline } from '../hooks/usePipeline'
import { RecorderPanel } from './RecorderPanel'
import { ReviewPanel } from './ReviewPanel'

export function PipelineScreen() {
  const pipeline = usePipeline()
  const { state } = pipeline

  if (state.status === 'review' || state.status === 'processing') {
    return <ReviewPanel state={state} submit={pipeline.submit} discard={pipeline.discard} />
  }

  return <RecorderPanel {...pipeline} />
}
