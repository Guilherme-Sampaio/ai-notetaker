import type { SummaryOutput } from '../types/summary.types'
import { ApiError } from '../utils/ApiError'
import { getUploadUrl, uploadToS3 } from './storage.api'

const API_BASE = '/api'

export type SseEvent =
  | { event: 'stage'; stage: 'uploading' | 'transcribing' | 'summarizing' }
  | { event: 'done'; transcript: string; summary: SummaryOutput }
  | { event: 'error'; message: string }

export async function* streamSummarize(
  blob: Blob,
  customInstructions?: string,
): AsyncGenerator<SseEvent> {
  const mimeType = blob.type || 'audio/webm'

  yield { event: 'stage', stage: 'uploading' }
  const { uploadUrl, key } = await getUploadUrl(mimeType)
  await uploadToS3(uploadUrl, blob)

  const res = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, customInstructions: customInstructions?.trim() || undefined }),
  })

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.message ?? 'Processing failed. Please try again.', res.status)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // SSE parsing loop
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const eventLine = part.match(/^event: (.+)$/m)?.[1]
      const dataLine = part.match(/^data: (.+)$/m)?.[1]
      if (!eventLine || !dataLine) continue
      yield { event: eventLine, ...JSON.parse(dataLine) } as SseEvent
    }
  }
}
