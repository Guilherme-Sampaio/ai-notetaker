import type { PipelineState } from '../types/pipeline.types'

interface RecorderStatus {
  statusLabel: string
  micColor: string
}

export function getRecorderStatus(state: PipelineState): RecorderStatus {
  const isRecording = state.status === 'recording'
  const isPaused = state.status === 'paused'
  const isError = state.status === 'error'

  const statusLabel =
    state.status === 'idle'      ? 'Ready to record' :
    state.status === 'recording' ? 'Recording…'       :
    state.status === 'paused'    ? 'Paused'            :
    isError                      ? state.message       : ''

  const micColor =
    isRecording ? 'bg-red-500 text-white shadow-red-200' :
    isPaused    ? 'bg-amber-400 text-white shadow-amber-200' :
    isError     ? 'bg-destructive text-destructive-foreground shadow-destructive/20' :
    'bg-primary text-primary-foreground shadow-primary/20'

  return { statusLabel, micColor }
}
