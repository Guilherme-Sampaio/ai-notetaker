import type { ProcessResponse } from '../types/summary.types'

const API_BASE = '/api'

export async function summarizeAudio(
  blob: Blob,
  customInstructions?: string,
): Promise<ProcessResponse> {
  const form = new FormData()
  form.append('audio', blob, 'recording.webm')
  if (customInstructions?.trim()) {
    form.append('customInstructions', customInstructions.trim())
  }

  const res = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let message: string
    try {
      const json = JSON.parse(body)
      message = json.message ?? json.error ?? 'Processing failed. Please try again.'
    } catch {
      message = 'Processing failed. Please try again.'
    }
    throw new Error(message)
  }

  return res.json() as Promise<ProcessResponse>
}
