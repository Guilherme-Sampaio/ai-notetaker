import { useEffect } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { NavigationConfirm } from '../../components/NavigationConfirm'
import { usePipeline } from '../../hooks/usePipeline'
import { NoteEditorPanel } from './components/NoteEditorPanel'
import { RecorderPanel } from './components/RecorderPanel'
import { ReviewPanel } from './components/ReviewPanel'

const WARN_STATUSES = new Set(['recording', 'paused', 'review', 'processing'])

export function PipelinePage() {
  const navigate = useNavigate()
  const pipeline = usePipeline()
  const { state } = pipeline

  const shouldBlock = WARN_STATUSES.has(state.status)

  useEffect(() => {
    if (!shouldBlock) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [shouldBlock])

  const blocker = useBlocker(shouldBlock)

  const confirm = blocker.state === 'blocked'
    ? <NavigationConfirm onConfirm={() => blocker.proceed()} onCancel={() => blocker.reset()} />
    : null

  if (state.status === 'done') {
    return (
      <>
        <NoteEditorPanel
          transcript={state.transcript}
          summary={state.summary}
          onSaved={() => navigate('/notes')}
          onDiscard={pipeline.restart}
        />
        {confirm}
      </>
    )
  }

  if (state.status === 'review' || state.status === 'processing') {
    return (
      <>
        <ReviewPanel state={state} submit={pipeline.submit} discard={pipeline.discard} />
        {confirm}
      </>
    )
  }

  return (
    <>
      <RecorderPanel {...pipeline} />
      {confirm}
    </>
  )
}

