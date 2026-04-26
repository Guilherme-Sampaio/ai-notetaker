import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePipeline } from '../../src/hooks/usePipeline'
import * as apiModule from '../../src/services/summarize.api'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

vi.mock('../../src/services/summarize.api', () => ({
  summarizeAudio: vi.fn(),
}))

const { mockUseRecorder } = vi.hoisted(() => ({
  mockUseRecorder: vi.fn(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(new Blob()),
    restart: vi.fn(),
  })),
}))

vi.mock('../../src/hooks/useRecorder', () => ({
  useRecorder: mockUseRecorder,
}))

describe('usePipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRecorder.mockReset()
    mockUseRecorder.mockImplementation(() => ({
      start: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn().mockResolvedValue(undefined),
      resume: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(new Blob()),
      restart: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => usePipeline())
      expect(result.current.state).toEqual({ status: 'idle' })
    })

    it('should expose all expected methods', () => {
      const { result } = renderHook(() => usePipeline())
      expect(result.current).toHaveProperty('start')
      expect(result.current).toHaveProperty('pause')
      expect(result.current).toHaveProperty('resume')
      expect(result.current).toHaveProperty('restart')
      expect(result.current).toHaveProperty('finish')
      expect(result.current).toHaveProperty('submit')
      expect(result.current).toHaveProperty('discard')
    })
  })

  describe('start recording', () => {
    it('should transition from idle to recording', async () => {
      const { result } = renderHook(() => usePipeline())
      expect(result.current.state.status).toBe('idle')

      await act(async () => {
        await result.current.start()
      })

      expect(result.current.state.status).toBe('recording')
    })

    it('should handle microphone access denied error', async () => {
      mockUseRecorder.mockReturnValueOnce({
        start: vi.fn().mockRejectedValueOnce(new Error('NotAllowedError')),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn(),
        restart: vi.fn(),
      } as any)

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
      })

      expect(result.current.state.status).toBe('error')
      expect(result.current.state).toMatchObject({
        status: 'error',
        stage: 'recording',
      })
      if (result.current.state.status === 'error') {
        expect(result.current.state.message).toContain('Microphone access denied')
      }
    })
  })

  describe('pause recording', () => {
    it('should transition from recording to paused', async () => {
      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
      })
      expect(result.current.state.status).toBe('recording')

      await act(async () => {
        await result.current.pause()
      })

      expect(result.current.state.status).toBe('paused')
    })
  })

  describe('resume recording', () => {
    it('should transition from paused to recording', async () => {
      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
        await result.current.pause()
      })
      expect(result.current.state.status).toBe('paused')

      await act(async () => {
        await result.current.resume()
      })

      expect(result.current.state.status).toBe('recording')
    })

    it('should handle resume error', async () => {
      const resume = vi.fn().mockRejectedValueOnce(new Error('Resume failed'))
      mockUseRecorder.mockImplementation(() => ({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        resume,
        stop: vi.fn().mockResolvedValue(new Blob()),
        restart: vi.fn(),
      }))

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
        await result.current.pause()
      })

      await act(async () => {
        await result.current.resume()
      })

      expect(result.current.state.status).toBe('error')
      if (result.current.state.status === 'error') {
        expect(result.current.state.message).toContain('Could not resume')
      }
    })
  })

  describe('restart recording', () => {
    it('should reset to idle state', async () => {
      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
      })
      expect(result.current.state.status).toBe('recording')

      act(() => {
        result.current.restart()
      })

      expect(result.current.state.status).toBe('idle')
    })

    it('should reset to idle from paused state', async () => {
      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
        await result.current.pause()
      })
      expect(result.current.state.status).toBe('paused')

      act(() => {
        result.current.restart()
      })

      expect(result.current.state.status).toBe('idle')
    })
  })

  describe('finish recording', () => {
    it('should transition from recording to review with blob and duration', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })

      mockUseRecorder.mockReturnValueOnce({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn().mockResolvedValue(mockBlob),
        restart: vi.fn(),
      } as any)

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        await result.current.finish(42)
      })

      expect(result.current.state.status).toBe('review')
      if (result.current.state.status === 'review') {
        expect(result.current.state.blob).toEqual(mockBlob)
        expect(result.current.state.durationSeconds).toBe(42)
      }
    })

    it('should handle no audio recorded error', async () => {
      mockUseRecorder.mockImplementation(() => ({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        resume: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(null),
        restart: vi.fn(),
      }))

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        await result.current.finish(0)
      })

      expect(result.current.state.status).toBe('error')
      if (result.current.state.status === 'error') {
        expect(result.current.state.message).toContain('No audio')
      }
    })
  })

  describe('submit for processing', () => {
    it('should transition from review to processing to done', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test transcript',
        summary: {
          keyDecisions: ['Decision 1'],
          upcomingDeadlines: ['Deadline 1'],
          followUpTasks: ['Task 1'],
          resourcesMentioned: ['Resource 1'],
        },
      }

      mockUseRecorder.mockReturnValueOnce({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn().mockResolvedValue(mockBlob),
        restart: vi.fn(),
      } as any)

      vi.mocked(apiModule.summarizeAudio).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
        await result.current.finish(10)
      })

      expect(result.current.state.status).toBe('review')

      await act(async () => {
        await result.current.submit()
      })

      expect(result.current.state.status).toBe('done')
      if (result.current.state.status === 'done') {
        expect(result.current.state.transcript).toBe('Test transcript')
        expect(result.current.state.summary).toEqual(mockResponse.summary)
      }
    })

    it('should send custom instructions to API', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test transcript',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }

      mockUseRecorder.mockReturnValueOnce({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn().mockResolvedValue(mockBlob),
        restart: vi.fn(),
      } as any)

      vi.mocked(apiModule.summarizeAudio).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
        await result.current.finish(10)
      })

      const customInstructions = 'Focus on deadlines'
      await act(async () => {
        await result.current.submit(customInstructions)
      })

      expect(apiModule.summarizeAudio).toHaveBeenCalledWith(mockBlob, customInstructions)
    })

    it('should handle processing failure and return to review state', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const errorMessage = 'Network error'

      mockUseRecorder.mockReturnValueOnce({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn().mockResolvedValue(mockBlob),
        restart: vi.fn(),
      } as any)

      vi.mocked(apiModule.summarizeAudio).mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
        await result.current.finish(10)
      })

      expect(result.current.state.status).toBe('review')

      await act(async () => {
        await result.current.submit()
      })

      expect(result.current.state.status).toBe('review')
      expect(toast.error).toHaveBeenCalledWith('Processing failed', expect.any(Object))
      if (result.current.state.status === 'review') {
        expect(result.current.state.blob).toEqual(mockBlob)
        expect(result.current.state.submitError).toBeUndefined()
      }
    })

    it('should set submitError on review when API rejects with status 422', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const msg = 'Recording too short or no clear speech detected.'
      mockUseRecorder.mockReturnValueOnce({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn().mockResolvedValue(mockBlob),
        restart: vi.fn(),
      } as any)

      vi.mocked(apiModule.summarizeAudio).mockRejectedValueOnce(
        Object.assign(new Error(msg), { status: 422 }),
      )

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
        await result.current.finish(10)
      })

      await act(async () => {
        await result.current.submit()
      })

      expect(result.current.state.status).toBe('review')
      if (result.current.state.status === 'review') {
        expect(result.current.state.submitError).toBe(msg)
      }
    })

    it('should not submit if not in review state', async () => {
      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.submit()
      })

      expect(apiModule.summarizeAudio).not.toHaveBeenCalled()
    })
  })

  describe('discard', () => {
    it('should transition from review to idle', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })

      mockUseRecorder.mockReturnValueOnce({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn().mockResolvedValue(mockBlob),
        restart: vi.fn(),
      } as any)

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
        await result.current.finish(10)
      })

      expect(result.current.state.status).toBe('review')

      act(() => {
        result.current.discard()
      })

      expect(result.current.state.status).toBe('idle')
    })

    it('should transition from done to idle', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test transcript',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }

      mockUseRecorder.mockReturnValueOnce({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn().mockResolvedValue(mockBlob),
        restart: vi.fn(),
      } as any)

      vi.mocked(apiModule.summarizeAudio).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => usePipeline())

      await act(async () => {
        await result.current.start()
        await result.current.finish(10)
      })

      expect(result.current.state.status).toBe('review')

      await act(async () => {
        await result.current.submit()
      })

      expect(result.current.state.status).toBe('done')

      act(() => {
        result.current.discard()
      })

      expect(result.current.state.status).toBe('idle')
    })
  })

  describe('state transitions', () => {
    it('should follow complete happy path', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' })
      const mockResponse = {
        transcript: 'Test transcript',
        summary: {
          keyDecisions: ['Decision 1'],
          upcomingDeadlines: ['Deadline 1'],
          followUpTasks: ['Task 1'],
          resourcesMentioned: ['Resource 1'],
        },
      }

      mockUseRecorder.mockReturnValueOnce({
        start: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        resume: vi.fn(),
        stop: vi.fn().mockResolvedValue(mockBlob),
        restart: vi.fn(),
      } as any)

      vi.mocked(apiModule.summarizeAudio).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => usePipeline())

      // idle -> recording
      await act(async () => {
        await result.current.start()
      })
      expect(result.current.state.status).toBe('recording')

      // recording -> paused
      await act(async () => {
        await result.current.pause()
      })
      expect(result.current.state.status).toBe('paused')

      // paused -> recording
      await act(async () => {
        await result.current.resume()
      })
      expect(result.current.state.status).toBe('recording')

      // recording -> review
      await act(async () => {
        await result.current.finish(60)
      })
      expect(result.current.state.status).toBe('review')

      // review -> processing -> done
      await act(async () => {
        await result.current.submit()
      })
      expect(result.current.state.status).toBe('done')

      // done -> idle
      act(() => {
        result.current.discard()
      })
      expect(result.current.state.status).toBe('idle')
    })
  })
})
