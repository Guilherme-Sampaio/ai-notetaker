import type { ProcessResponse } from '../types/summary.types'
import { getUploadUrl, uploadToS3 } from './storage.api'

const API_BASE = '/api'

export async function summarizeAudio(
  blob: Blob,
  customInstructions?: string,
): Promise<ProcessResponse> {
  const mimeType = blob.type || 'audio/webm'

  const { uploadUrl, key } = await getUploadUrl(mimeType)
  await uploadToS3(uploadUrl, blob)

  const res = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, customInstructions: customInstructions?.trim() || undefined }),
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
    throw Object.assign(new Error(message), { status: res.status })
  }

  return res.json() as Promise<ProcessResponse>
}
