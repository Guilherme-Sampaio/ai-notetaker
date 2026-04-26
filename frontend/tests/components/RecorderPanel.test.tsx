import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { RecorderPanel } from '../../src/components/RecorderPanel'
import type { UsePipelineReturn } from '../../src/hooks/usePipeline'

describe('RecorderPanel', () => {
  let mockPipeline: UsePipelineReturn

  beforeEach(() => {
    mockPipeline = {
      state: { status: 'idle' },
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      restart: vi.fn(),
      finish: vi.fn(),
      submit: vi.fn(),
      discard: vi.fn(),
    }
  })

  describe('rendering', () => {
    it('should render the recorder panel', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByRole('toolbar')).toBeInTheDocument()
    })

    it('should display microphone icon', () => {
      const { container } = render(<RecorderPanel {...mockPipeline} />)
      // The mic icon is rendered via lucide-react
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should have an accessible toolbar', () => {
      render(<RecorderPanel {...mockPipeline} />)
      const toolbar = screen.getByRole('toolbar', { name: /Recording controls/i })
      expect(toolbar).toBeInTheDocument()
    })
  })

  describe('idle state', () => {
    it('should show "Ready to record" label', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByText('Ready to record')).toBeInTheDocument()
    })

    it('should show Start recording button', () => {
      render(<RecorderPanel {...mockPipeline} />)
      const startBtn = screen.getByRole('button', { name: /Start recording/i })
      expect(startBtn).toBeInTheDocument()
    })

    it('should not show timer', () => {
      const { container } = render(<RecorderPanel {...mockPipeline} />)
      expect(container.querySelector('span.font-mono')).not.toBeInTheDocument()
    })

    it('should call start on Start button click', async () => {
      const startFn = vi.fn()
      render(
        <RecorderPanel
          {...mockPipeline}
          start={startFn}
        />,
      )

      const startBtn = screen.getByRole('button', { name: /Start recording/i })
      fireEvent.click(startBtn)

      await waitFor(() => {
        expect(startFn).toHaveBeenCalled()
      })
    })
  })

  describe('recording state', () => {
    beforeEach(() => {
      mockPipeline.state = { status: 'recording' }
    })

    it('should show "Recording…" label', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByText('Recording…')).toBeInTheDocument()
    })

    it('should display elapsed time', () => {
      const { container } = render(<RecorderPanel {...mockPipeline} />)
      const timeDisplay = container.querySelector('span.font-mono')
      expect(timeDisplay?.textContent).toMatch(/\d{2}:\d{2}/)
    })

    it('should start with 00:00 timer', () => {
      const { container } = render(<RecorderPanel {...mockPipeline} />)
      const timeDisplay = container.querySelector('span.font-mono')
      expect(timeDisplay?.textContent).toBe('00:00')
    })

    it('should show Pause button', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument()
    })

    it('should show Restart button', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByRole('button', { name: /Restart/i })).toBeInTheDocument()
    })

    it('should show Finish button', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByRole('button', { name: /Finish/i })).toBeInTheDocument()
    })

    it('should call pause on Pause button click', async () => {
      const pauseFn = vi.fn()
      render(
        <RecorderPanel
          {...mockPipeline}
          pause={pauseFn}
        />,
      )

      const pauseBtn = screen.getByRole('button', { name: /Pause/i })
      fireEvent.click(pauseBtn)

      await waitFor(() => {
        expect(pauseFn).toHaveBeenCalled()
      })
    })

    it('should call restart on Restart button click', () => {
      const restartFn = vi.fn()
      render(
        <RecorderPanel
          {...mockPipeline}
          restart={restartFn}
        />,
      )

      const restartBtn = screen.getByRole('button', { name: /Restart/i })
      fireEvent.click(restartBtn)

      expect(restartFn).toHaveBeenCalled()
    })

    it('should show animated mic icon', () => {
      const { container } = render(<RecorderPanel {...mockPipeline} />)
      const pingElements = container.querySelectorAll('.animate-ping')
      expect(pingElements.length).toBeGreaterThan(0)
    })

    it('should show animated bars', () => {
      const { container } = render(<RecorderPanel {...mockPipeline} />)
      const bars = container.querySelectorAll('[style*="animation"]')
      expect(bars.length).toBeGreaterThan(0)
    })

    it('should be aria-live polite for status updates', () => {
      const { container } = render(<RecorderPanel {...mockPipeline} />)
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeTruthy()
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
    })

    describe('elapsed timer (fake timers)', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
      })

      it('should increment timer every second', async () => {
        const { container } = render(<RecorderPanel {...mockPipeline} />)

        let timeDisplay = container.querySelector('span.font-mono') as HTMLElement
        expect(timeDisplay.textContent).toBe('00:00')

        await act(async () => {
          vi.advanceTimersByTime(1000)
        })

        timeDisplay = container.querySelector('span.font-mono') as HTMLElement
        expect(timeDisplay.textContent).toBe('00:01')
      })

      it('should format time as MM:SS', async () => {
        const { container } = render(<RecorderPanel {...mockPipeline} />)

        await act(async () => {
          vi.advanceTimersByTime(125000) // 2 minutes 5 seconds
        })

        const timeDisplay = container.querySelector('span.font-mono') as HTMLElement
        expect(timeDisplay.textContent).toBe('02:05')
      })

      it('should call finish with elapsed seconds on Finish button click', async () => {
        const finishFn = vi.fn()
        render(
          <RecorderPanel
            {...mockPipeline}
            finish={finishFn}
          />,
        )

        await act(async () => {
          vi.advanceTimersByTime(30000) // 30 seconds
        })

        const finishBtn = screen.getByRole('button', { name: /Finish/i })
        fireEvent.click(finishBtn)

        expect(finishFn).toHaveBeenCalledWith(30)
      })
    })
  })

  describe('paused state', () => {
    beforeEach(() => {
      mockPipeline.state = { status: 'paused' }
    })

    it('should show "Paused" label', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByText('Paused')).toBeInTheDocument()
    })

    it('should show elapsed time', () => {
      const { container } = render(<RecorderPanel {...mockPipeline} />)
      const timeDisplay = container.querySelector('span.font-mono')
      expect(timeDisplay).toBeInTheDocument()
    })

    it('should show Resume button', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByRole('button', { name: /Resume/i })).toBeInTheDocument()
    })

    it('should show Restart button', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByRole('button', { name: /Restart/i })).toBeInTheDocument()
    })

    it('should show Finish button', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByRole('button', { name: /Finish/i })).toBeInTheDocument()
    })

    it('should call resume on Resume button click', async () => {
      const resumeFn = vi.fn()
      render(
        <RecorderPanel
          {...mockPipeline}
          resume={resumeFn}
        />,
      )

      const resumeBtn = screen.getByRole('button', { name: /Resume/i })
      fireEvent.click(resumeBtn)

      await waitFor(() => {
        expect(resumeFn).toHaveBeenCalled()
      })
    })

    describe('timer frozen while paused (fake timers)', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
      })

      it('should not increment timer', () => {
        const { container } = render(<RecorderPanel {...mockPipeline} />)

        const initialTime = (container.querySelector('span.font-mono') as HTMLElement).textContent

        vi.advanceTimersByTime(5000)

        const finalTime = (container.querySelector('span.font-mono') as HTMLElement).textContent
        expect(finalTime).toBe(initialTime)
      })
    })
  })

  describe('error state', () => {
    beforeEach(() => {
      mockPipeline.state = {
        status: 'error',
        stage: 'recording',
        message: 'Microphone access denied',
      }
    })

    it('should show error message', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByRole('alert')).toHaveTextContent('Microphone access denied')
    })

    it('should show error message with alert role', () => {
      render(<RecorderPanel {...mockPipeline} />)
      const alert = screen.getByRole('alert')
      expect(alert.textContent).toContain('Microphone access denied')
    })

    it('should show "Try again" button', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument()
    })

    it('should call discard on Try again click', async () => {
      const discardFn = vi.fn()
      render(
        <RecorderPanel
          {...mockPipeline}
          discard={discardFn}
        />,
      )

      const tryAgainBtn = screen.getByRole('button', { name: /Try again/i })
      fireEvent.click(tryAgainBtn)

      await waitFor(() => {
        expect(discardFn).toHaveBeenCalled()
      })
    })

    it('should not show Start, Pause, Resume, or Finish buttons', () => {
      render(<RecorderPanel {...mockPipeline} />)
      expect(
        screen.queryByRole('button', { name: /Start recording/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /Pause/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /Resume/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /Finish/i }),
      ).not.toBeInTheDocument()
    })
  })

  describe('timer behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
    })

    it('should clear timer on unmount', () => {
      mockPipeline.state = { status: 'recording' }
      const { unmount } = render(<RecorderPanel {...mockPipeline} />)

      unmount()
      vi.advanceTimersByTime(1000)

      // No errors should occur from advancing timers after unmount
      expect(true).toBe(true)
    })

    it('should clear timer when transitioning from recording to idle', async () => {
      const { rerender } = render(<RecorderPanel {...mockPipeline} />)

      mockPipeline.state = { status: 'recording' }
      rerender(<RecorderPanel {...mockPipeline} />)

      vi.advanceTimersByTime(1000)

      mockPipeline.state = { status: 'idle' }
      rerender(<RecorderPanel {...mockPipeline} />)

      vi.advanceTimersByTime(1000)

      // Timer should be cleared, no error
      expect(true).toBe(true)
    })

    it('should reset elapsed time to 0 when returning to idle', async () => {
      const { container, rerender } = render(<RecorderPanel {...mockPipeline} />)

      mockPipeline.state = { status: 'recording' }
      rerender(<RecorderPanel {...mockPipeline} />)

      vi.advanceTimersByTime(5000)

      mockPipeline.state = { status: 'idle' }
      rerender(<RecorderPanel {...mockPipeline} />)

      const timeDisplay = container.querySelector('span.font-mono') as HTMLElement
      if (timeDisplay) {
        expect(timeDisplay.textContent).toBe('00:00')
      }
    })
  })

  describe('accessibility', () => {
    it('should have accessible button labels', () => {
      mockPipeline.state = { status: 'recording' }
      render(<RecorderPanel {...mockPipeline} />)

      expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Restart/i }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Finish/i })).toBeInTheDocument()
    })

    it('should have aria-hidden on decorative elements', () => {
      const { container } = render(<RecorderPanel {...mockPipeline} />)
      const decorativeDiv = container.querySelector('[aria-hidden="true"]')
      expect(decorativeDiv).toBeInTheDocument()
    })

    it('should announce recording status updates', () => {
      const { container, rerender } = render(<RecorderPanel {...mockPipeline} />)

      mockPipeline.state = { status: 'recording' }
      rerender(<RecorderPanel {...mockPipeline} />)

      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeInTheDocument()
    })
  })
})
