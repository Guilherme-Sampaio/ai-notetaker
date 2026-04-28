import { ApiError } from '../utils/ApiError'

const API_BASE = '/api'

export async function getUploadUrl(mimeType: string): Promise<{ uploadUrl: string; key: string }> {
  const res = await fetch(`${API_BASE}/upload-url?mimeType=${encodeURIComponent(mimeType)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.message ?? 'Failed to get upload URL', res.status)
  }
  return res.json()
}

export async function uploadToS3(uploadUrl: string, blob: Blob): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type || 'audio/webm' },
    body: blob,
  })
  if (!res.ok) throw new ApiError('Failed to upload audio to storage', res.status)
}
