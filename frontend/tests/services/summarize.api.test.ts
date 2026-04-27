import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { summarizeAudio } from '../../src/services/summarize.api'
import { getUploadUrl, uploadToS3 } from '../../src/services/storage.api'

vi.mock('../../src/services/storage.api', () => ({
  getUploadUrl: vi.fn(),
  uploadToS3: vi.fn(),
}))

describe('summarizeAudio', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  const mockSummaryResponse = {
    transcript: 'Test transcript',
    summary: {
      keyDecisions: [] as string[],
      upcomingDeadlines: [] as string[],
      followUpTasks: [] as string[],
      resourcesMentioned: [] as string[],
    },
  }

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
    vi.mocked(getUploadUrl).mockResolvedValue({
      uploadUrl: 'https://s3.example/presigned',
      key: 'uploads/test-id.webm',
    })
    vi.mocked(uploadToS3).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('successful requests', () => {
    it('gets presigned URL, uploads to S3, then POSTs summarize with JSON body', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockSummaryResponse),
      })

      const result = await summarizeAudio(audioBlob)

      expect(getUploadUrl).toHaveBeenCalledWith('audio/webm')
      expect(uploadToS3).toHaveBeenCalledWith('https://s3.example/presigned', audioBlob)
      expect(result).toEqual(mockSummaryResponse)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'uploads/test-id.webm' }),
      })
    })

    it('uses audio/webm when blob.type is empty', async () => {
      const audioBlob = new Blob(['audio data'])
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ ...mockSummaryResponse, transcript: 'T' }),
      })

      await summarizeAudio(audioBlob)

      expect(getUploadUrl).toHaveBeenCalledWith('audio/webm')
    })

    it('includes trimmed customInstructions in JSON body', async () => {
      const audioBlob = new Blob(['x'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockSummaryResponse),
      })

      await summarizeAudio(audioBlob, '  Focus on deadlines  ')

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(JSON.parse(init.body as string)).toEqual({
        key: 'uploads/test-id.webm',
        customInstructions: 'Focus on deadlines',
      })
    })

    it('omits customInstructions when empty or whitespace only', async () => {
      const audioBlob = new Blob(['x'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockSummaryResponse),
      })

      await summarizeAudio(audioBlob, '   ')

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(JSON.parse(init.body as string)).toEqual({
        key: 'uploads/test-id.webm',
      })
    })
  })

  describe('error handling', () => {
    it('throws error on non-ok summarize response', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValueOnce('Internal Server Error'),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Processing failed')
    })

    it('extracts error message from JSON response', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValueOnce(JSON.stringify({ message: 'Invalid audio format' })),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Invalid audio format')
    })

    it('fallback to error field if message not present', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValueOnce(JSON.stringify({ error: 'Audio too long' })),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Audio too long')
    })

    it('uses generic message if JSON parsing fails', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValueOnce('Not JSON'),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Processing failed. Please try again.')
    })

    it('uses generic message if response.text() fails', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockRejectedValueOnce(new Error('Network error')),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Processing failed. Please try again.')
    })

    it('throws if summarize fetch fails', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockRejectedValueOnce(new Error('Network timeout'))

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Network timeout')
    })

    it('attaches HTTP status to the thrown Error', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: vi.fn().mockResolvedValueOnce(JSON.stringify({ message: 'Unprocessable' })),
      })
      try {
        await summarizeAudio(audioBlob)
        expect.fail('expected rejection')
      } catch (e) {
        expect(e).toBeInstanceOf(Error)
        expect((e as Error & { status?: number }).status).toBe(422)
        expect((e as Error).message).toBe('Unprocessable')
      }
    })

    it('handles empty error body', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValueOnce(''),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Processing failed. Please try again.')
    })
  })

  describe('API endpoint', () => {
    it('calls /api/summarize with POST', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockSummaryResponse),
      })

      await summarizeAudio(audioBlob)

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/summarize'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })
})
