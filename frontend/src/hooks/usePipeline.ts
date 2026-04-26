import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { summarizeAudio } from '../services/api'
import type { PipelineState } from '../types/pipeline.types'
import { useRecorder } from './useRecorder'

export interface UsePipelineReturn {
  state: PipelineState
  start: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  restart: () => void
  finish: (durationSeconds: number) => Promise<void>
  submit: (customInstructions?: string) => Promise<void>
  discard: () => void
}

export function usePipeline(): UsePipelineReturn {
  const [state, setState] = useState<PipelineState>({ status: 'idle' })
  const recorder = useRecorder()

  const start = useCallback(async () => {
    try {
      await recorder.start()
      setState({ status: 'recording' })
    } catch {
      setState({ status: 'error', stage: 'recording', message: 'Microphone access denied. Please allow microphone access and try again.' })
    }
  }, [recorder])

  const pause = useCallback(async () => {
    await recorder.pause()
    setState({ status: 'paused' })
  }, [recorder])

  const resume = useCallback(async () => {
    try {
      await recorder.resume()
      setState({ status: 'recording' })
    } catch {
      setState({ status: 'error', stage: 'recording', message: 'Could not resume recording.' })
    }
  }, [recorder])

  const restart = useCallback(() => {
    recorder.restart()
    setState({ status: 'idle' })
  }, [recorder])

  const finish = useCallback(async (durationSeconds: number) => {
    const blob = await recorder.stop()
    if (!blob) {
      setState({ status: 'error', stage: 'recording', message: 'No audio was recorded.' })
      return
    }
    setState({ status: 'review', blob, durationSeconds })
  }, [recorder])

  const submit = useCallback(async (customInstructions?: string) => {
    if (state.status !== 'review') return
    const { blob, durationSeconds } = state
    setState({ status: 'processing' })
    try {
      const result = await summarizeAudio(blob, customInstructions)
      setState({ status: 'done', transcript: result.transcript, summary: result.summary })
    } catch (err) {
      const message = (err as Error).message
      toast.error('Processing failed', { description: message })
      setState({ status: 'review', blob, durationSeconds })
    }
  }, [state])

  const discard = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  return { state, start, pause, resume, restart, finish, submit, discard }
}
