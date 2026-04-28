import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getUploadUrl, uploadToS3 } from '../../src/services/storage.api'

describe('storage.api', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getUploadUrl', () => {
    it('returns JSON on ok response', async () => {
      const payload = { uploadUrl: 'https://s3.example/put', key: 'uploads/u.webm' }
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(payload),
      })

      await expect(getUploadUrl('audio/webm')).resolves.toEqual(payload)
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/upload-url?mimeType=' + encodeURIComponent('audio/webm'),
      )
    })

    it('throws when response is not ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValueOnce({}),
      })

      await expect(getUploadUrl('audio/webm')).rejects.toThrow('Failed to get upload URL')
    })
  })

  describe('uploadToS3', () => {
    it('PUTs blob with Content-Type from blob.type', async () => {
      const blob = new Blob(['x'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({ ok: true })

      await uploadToS3('https://s3.example/put', blob)

      expect(fetchMock).toHaveBeenCalledWith('https://s3.example/put', {
        method: 'PUT',
        headers: { 'Content-Type': 'audio/webm' },
        body: blob,
      })
    })

    it('defaults Content-Type to audio/webm when blob.type is empty', async () => {
      const blob = new Blob(['x'])
      fetchMock.mockResolvedValueOnce({ ok: true })

      await uploadToS3('https://s3.example/put', blob)

      expect(fetchMock).toHaveBeenCalledWith('https://s3.example/put', {
        method: 'PUT',
        headers: { 'Content-Type': 'audio/webm' },
        body: blob,
      })
    })

    it('throws when PUT is not ok', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false })

      await expect(uploadToS3('https://s3.example/put', new Blob())).rejects.toThrow(
        'Failed to upload audio to storage',
      )
    })
  })
})
