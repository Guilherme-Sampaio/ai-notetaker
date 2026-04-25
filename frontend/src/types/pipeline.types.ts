import type { SummaryOutput } from './summary.types'

export type PipelineState =
  | { status: 'idle' }
  | { status: 'recording' }
  | { status: 'paused' }
  | { status: 'processing' }
  | { status: 'done'; transcript: string; summary: SummaryOutput }
  | { status: 'error'; stage: string; message: string }
