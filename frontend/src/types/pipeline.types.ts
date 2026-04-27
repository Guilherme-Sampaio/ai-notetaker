import type { SummaryOutput } from './summary.types'

export type PipelineState =
  | { status: 'idle' }
  | { status: 'recording' }
  | { status: 'paused' }
  | { status: 'review'; blob: Blob; durationSeconds: number; submitError?: string }
  | { status: 'processing'; stage: 'uploading' | 'transcribing' | 'summarizing' }
  | { status: 'done'; transcript: string; summary: SummaryOutput }
  | { status: 'error'; stage: string; message: string }
