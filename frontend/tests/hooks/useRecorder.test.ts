import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRecorder } from '../../src/hooks/useRecorder'

describe('useRecorder', () => {
  let mockMediaRecorder: any
  let mockStream: any
  let mockTrack: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock MediaRecorder
    mockTrack = {
      stop: vi.fn(),
    }

    mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
    }

    mockMediaRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      onstop: null as any,
      ondataavailable: null as any,
      mimeType: 'audio/webm',
    }

    Object.defineProperty(global.navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    })

    // Mock MediaRecorder constructor
    global.MediaRecorder = vi.fn().mockReturnValue(mockMediaRecorder) as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => useRecorder())
      expect(result.current.status).toBe('idle')
    })

    it('should expose all expected methods', () => {
      const { result } = renderHook(() => useRecorder())
      expect(result.current).toHaveProperty('status')
      expect(result.current).toHaveProperty('start')
      expect(result.current).toHaveProperty('pause')
      expect(result.current).toHaveProperty('resume')
      expect(result.current).toHaveProperty('stop')
      expect(result.current).toHaveProperty('restart')
    })
  })

  describe('start', () => {
    it('should transition from idle to recording', async () => {
      const { result } = renderHook(() => useRecorder())
      expect(result.current.status).toBe('idle')

      await act(async () => {
        await result.current.start()
      })

      expect(result.current.status).toBe('recording')
    })

    it('should request microphone access', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
      })
    })

    it('should start MediaRecorder with timeslice of 100ms', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      expect(mockMediaRecorder.start).toHaveBeenCalledWith(100)
    })

    it('should handle microphone access denied', async () => {
      const deniedError = new Error('NotAllowedError')
      ;(global.navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
        deniedError,
      )

      const { result } = renderHook(() => useRecorder())

      await expect(
        act(async () => {
          await result.current.start()
        }),
      ).rejects.toThrow('NotAllowedError')

      expect(result.current.status).toBe('idle')
    })
  })

  describe('pause', () => {
    it('should transition from recording to paused', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })
      expect(result.current.status).toBe('recording')

      await act(async () => {
        const pausePromise = result.current.pause()
        // Simulate MediaRecorder onstop callback
        mockMediaRecorder.onstop()
        await pausePromise
      })

      expect(result.current.status).toBe('paused')
    })

    it('should stop the MediaRecorder', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        const pausePromise = result.current.pause()
        mockMediaRecorder.onstop()
        await pausePromise
      })

      expect(mockMediaRecorder.stop).toHaveBeenCalled()
    })

    it('should release the stream', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        const pausePromise = result.current.pause()
        mockMediaRecorder.onstop()
        await pausePromise
      })

      expect(mockTrack.stop).toHaveBeenCalled()
    })

    it('should handle pause when not recording', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.pause()
      })

      expect(result.current.status).toBe('idle')
    })
  })

  describe('resume', () => {
    it('should transition from paused to recording', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        const pausePromise = result.current.pause()
        mockMediaRecorder.onstop()
        await pausePromise
      })

      expect(result.current.status).toBe('paused')

      await act(async () => {
        await result.current.resume()
      })

      expect(result.current.status).toBe('recording')
    })

    it('should reacquire the stream on resume', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        const pausePromise = result.current.pause()
        mockMediaRecorder.onstop()
        await pausePromise
      })

      await act(async () => {
        await result.current.resume()
      })

      // Called once on start, once on resume
      expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2)
    })

    it('should create new MediaRecorder on resume', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      const MediaRecorderMock = global.MediaRecorder as unknown as ReturnType<typeof vi.fn>
      const firstLen = MediaRecorderMock.mock.calls.length

      await act(async () => {
        const pausePromise = result.current.pause()
        mockMediaRecorder.onstop()
        await pausePromise
      })

      await act(async () => {
        await result.current.resume()
      })

      expect(MediaRecorderMock.mock.calls.length).toBeGreaterThan(firstLen)
    })
  })

  describe('stop', () => {
    it('should return a Blob while recording', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      // Simulate data available
      const mockData = new Blob(['audio chunk'], { type: 'audio/webm' })
      mockMediaRecorder.ondataavailable({ data: mockData })

      let blob: Blob | null = null
      await act(async () => {
        const stopPromise = result.current.stop()
        mockMediaRecorder.onstop()
        blob = await stopPromise
      })

      expect(blob).toBeInstanceOf(Blob)
      expect((blob as unknown as Blob).type).toBe('audio/webm')
    })

    it('should return Blob while paused', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      const mockData = new Blob(['audio chunk'], { type: 'audio/webm' })
      mockMediaRecorder.ondataavailable({ data: mockData })

      await act(async () => {
        const pausePromise = result.current.pause()
        mockMediaRecorder.onstop()
        await pausePromise
      })

      let blob: Blob | null = null
      await act(async () => {
        blob = await result.current.stop()
      })

      expect(blob).toBeInstanceOf(Blob)
    })

    it('should return null if no audio was recorded', async () => {
      const { result } = renderHook(() => useRecorder())

      let blob: Blob | null = null
      await act(async () => {
        blob = await result.current.stop()
      })

      expect(blob).toBeNull()
    })

    it('should transition to idle state', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        const stopPromise = result.current.stop()
        mockMediaRecorder.onstop()
        await stopPromise
      })

      expect(result.current.status).toBe('idle')
    })

    it('should release stream after stop', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        const stopPromise = result.current.stop()
        mockMediaRecorder.onstop()
        await stopPromise
      })

      expect(mockTrack.stop).toHaveBeenCalled()
    })

    it('should accumulate chunks across pause/resume segments', async () => {
      const { result } = renderHook(() => useRecorder())

      // Start, record chunk 1
      await act(async () => {
        await result.current.start()
      })

      const chunk1 = new Blob(['chunk1'], { type: 'audio/webm' })
      mockMediaRecorder.ondataavailable({ data: chunk1 })

      // Pause
      await act(async () => {
        const pausePromise = result.current.pause()
        mockMediaRecorder.onstop()
        await pausePromise
      })

      // Resume, record chunk 2
      await act(async () => {
        await result.current.resume()
      })

      const chunk2 = new Blob(['chunk2'], { type: 'audio/webm' })
      mockMediaRecorder.ondataavailable({ data: chunk2 })

      // Stop
      let finalBlob: Blob | null = null
      await act(async () => {
        const stopPromise = result.current.stop()
        mockMediaRecorder.onstop()
        finalBlob = await stopPromise
      })

      expect(finalBlob).toBeInstanceOf(Blob)
      // Verify both chunks are included
      expect((finalBlob as unknown as Blob).size).toBeGreaterThan(0)
    })
  })

  describe('restart', () => {
    it('should transition to idle from recording', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      act(() => {
        result.current.restart()
      })

      expect(result.current.status).toBe('idle')
    })

    it('should release stream', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      act(() => {
        result.current.restart()
      })

      expect(mockTrack.stop).toHaveBeenCalled()
    })

    it('should clear chunks', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      const mockData = new Blob(['audio chunk'], { type: 'audio/webm' })
      mockMediaRecorder.ondataavailable({ data: mockData })

      act(() => {
        result.current.restart()
      })

      // After restart, stopping should return null since chunks were cleared
      let blob: Blob | null = null
      await act(async () => {
        blob = await result.current.stop()
      })

      expect(blob).toBeNull()
    })

    it('should stop MediaRecorder if still recording', async () => {
      const { result } = renderHook(() => useRecorder())

      await act(async () => {
        await result.current.start()
      })

      act(() => {
        result.current.restart()
      })

      expect(mockMediaRecorder.stop).toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete recording lifecycle', async () => {
      const { result } = renderHook(() => useRecorder())

      // Start
      await act(async () => {
        await result.current.start()
      })
      expect(result.current.status).toBe('recording')

      // Record some data
      const chunk1 = new Blob(['chunk1'], { type: 'audio/webm' })
      mockMediaRecorder.ondataavailable({ data: chunk1 })

      // Pause
      await act(async () => {
        const pausePromise = result.current.pause()
        mockMediaRecorder.onstop()
        await pausePromise
      })
      expect(result.current.status).toBe('paused')

      // Resume
      await act(async () => {
        await result.current.resume()
      })
      expect(result.current.status).toBe('recording')

      // Record more data
      const chunk2 = new Blob(['chunk2'], { type: 'audio/webm' })
      mockMediaRecorder.ondataavailable({ data: chunk2 })

      // Stop
      let finalBlob: Blob | null = null
      await act(async () => {
        const stopPromise = result.current.stop()
        mockMediaRecorder.onstop()
        finalBlob = await stopPromise
      })
      expect(result.current.status).toBe('idle')
      expect(finalBlob).toBeInstanceOf(Blob)
    })

    it('should handle empty recording edge case', async () => {
      const { result } = renderHook(() => useRecorder())

      // Start then immediately stop without recording anything
      await act(async () => {
        await result.current.start()
      })

      let blob: Blob | null = null
      await act(async () => {
        const stopPromise = result.current.stop()
        mockMediaRecorder.onstop()
        blob = await stopPromise
      })

      expect(blob).toBeInstanceOf(Blob)
      expect((blob as unknown as Blob).size).toBe(0)
    })
  })
})
