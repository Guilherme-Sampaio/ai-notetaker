const API_BASE = '/api'

export async function getUploadUrl(mimeType: string): Promise<{ uploadUrl: string; key: string }> {
  const res = await fetch(`${API_BASE}/upload-url?mimeType=${encodeURIComponent(mimeType)}`)
  if (!res.ok) throw new Error('Failed to get upload URL')
  return res.json()
}

export async function uploadToS3(uploadUrl: string, blob: Blob): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type || 'audio/webm' },
    body: blob,
  })
  if (!res.ok) throw new Error('Failed to upload audio to storage')
}
