import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { summarizeAudio } from '../../src/services/api'

describe('summarizeAudio', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('successful requests', () => {
    it('should send audio blob to API with multipart/form-data', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test transcript',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      })

      const result = await summarizeAudio(audioBlob)

      expect(result).toEqual(mockResponse)
      expect(fetchMock).toHaveBeenCalledWith('/api/summarize', {
        method: 'POST',
        body: expect.any(FormData),
      })
    })

    it('should include audio blob in FormData', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }

      const appendSpy = vi.spyOn(FormData.prototype, 'append')

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      })

      await summarizeAudio(audioBlob)

      // Verify FormData.append was called with audio blob
      expect(appendSpy).toHaveBeenCalledWith('audio', audioBlob, 'recording.webm')

      appendSpy.mockRestore()
    })

    it('should include custom instructions when provided', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const customInstructions = 'Focus on deadlines'
      const mockResponse = {
        transcript: 'Test',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }

      const appendSpy = vi.spyOn(FormData.prototype, 'append')

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      })

      await summarizeAudio(audioBlob, customInstructions)

      expect(appendSpy).toHaveBeenCalledWith('customInstructions', customInstructions)

      appendSpy.mockRestore()
    })

    it('should trim custom instructions before sending', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const customInstructions = '  Focus on deadlines  '
      const mockResponse = {
        transcript: 'Test',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }

      const appendSpy = vi.spyOn(FormData.prototype, 'append')

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      })

      await summarizeAudio(audioBlob, customInstructions)

      expect(appendSpy).toHaveBeenCalledWith(
        'customInstructions',
        'Focus on deadlines',
      )

      appendSpy.mockRestore()
    })

    it('should not send custom instructions if empty or whitespace only', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }

      const appendSpy = vi.spyOn(FormData.prototype, 'append')

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      })

      await summarizeAudio(audioBlob, '   ')

      // Should only append audio, not customInstructions
      const calls = appendSpy.mock.calls
      expect(calls.some(call => call[0] === 'customInstructions')).toBe(false)

      appendSpy.mockRestore()
    })

    it('should parse and return successful response', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Complete transcript text',
        summary: {
          keyDecisions: ['Decision A', 'Decision B'],
          upcomingDeadlines: ['Deadline 1', 'Deadline 2'],
          followUpTasks: ['Task 1'],
          resourcesMentioned: ['Resource 1', 'Resource 2'],
        },
      }

      const jsonMock = vi.fn().mockResolvedValueOnce(mockResponse)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jsonMock,
      })

      const result = await summarizeAudio(audioBlob)

      expect(result).toEqual(mockResponse)
      expect(jsonMock).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should throw error on non-ok response status', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValueOnce('Internal Server Error'),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Processing failed')
    })

    it('should extract error message from JSON response', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const errorBody = JSON.stringify({ message: 'Invalid audio format' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValueOnce(errorBody),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Invalid audio format')
    })

    it('should fallback to error field if message not present', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const errorBody = JSON.stringify({ error: 'Audio too long' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValueOnce(errorBody),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Audio too long')
    })

    it('should use generic message if JSON parsing fails', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValueOnce('Not JSON'),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow(
        'Processing failed. Please try again.',
      )
    })

    it('should use generic message if response.text() fails', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockRejectedValueOnce(new Error('Network error')),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow(
        'Processing failed. Please try again.',
      )
    })

    it('should throw if fetch itself fails', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })

      fetchMock.mockRejectedValueOnce(new Error('Network timeout'))

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Network timeout')
    })

    it('should handle 400 Bad Request', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValueOnce(
          JSON.stringify({ message: 'Bad request body' }),
        ),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Bad request body')
    })

    it('should handle 413 Payload Too Large', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 413,
        text: vi.fn().mockResolvedValueOnce(
          JSON.stringify({ message: 'Audio file exceeds size limit' }),
        ),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow(
        'Audio file exceeds size limit',
      )
    })

    it('should handle 415 Unsupported Media Type', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/unknown' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 415,
        text: vi.fn().mockResolvedValueOnce(
          JSON.stringify({ message: 'Unsupported audio format' }),
        ),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow(
        'Unsupported audio format',
      )
    })

    it('should handle 429 Too Many Requests', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValueOnce(
          JSON.stringify({ message: 'Rate limited' }),
        ),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow('Rate limited')
    })

    it('should handle empty response body', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })

      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValueOnce(''),
      })

      await expect(summarizeAudio(audioBlob)).rejects.toThrow(
        'Processing failed. Please try again.',
      )
    })
  })

  describe('API endpoint', () => {
    it('should call /api/summarize endpoint', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      })

      await summarizeAudio(audioBlob)

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/summarize'),
        expect.any(Object),
      )
    })

    it('should use POST method', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      })

      await summarizeAudio(audioBlob)

      const callArgs = fetchMock.mock.calls[0][1]
      expect(callArgs.method).toBe('POST')
    })
  })

  describe('type safety', () => {
    it('should return ProcessResponse type', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test transcript',
        summary: {
          keyDecisions: ['Decision 1'],
          upcomingDeadlines: ['Deadline 1'],
          followUpTasks: ['Task 1'],
          resourcesMentioned: ['Resource 1'],
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      })

      const result = await summarizeAudio(audioBlob)

      expect(result).toHaveProperty('transcript')
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('keyDecisions')
      expect(result.summary).toHaveProperty('upcomingDeadlines')
      expect(result.summary).toHaveProperty('followUpTasks')
      expect(result.summary).toHaveProperty('resourcesMentioned')
    })
  })
})
