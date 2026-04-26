import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReviewPanel } from '../../src/components/ReviewPanel'
import type { UsePipelineReturn } from '../../src/hooks/usePipeline'
import type { PipelineState } from '../../src/types/pipeline.types'

describe('ReviewPanel', () => {
  let mockPipeline: Pick<UsePipelineReturn, 'submit' | 'discard'>
  let mockState: Extract<PipelineState, { status: 'review' | 'processing' }>

  beforeEach(() => {
    mockPipeline = {
      submit: vi.fn(),
      discard: vi.fn(),
    }

    mockState = {
      status: 'review',
      blob: new Blob(['audio'], { type: 'audio/webm' }),
      durationSeconds: 120,
    }
  })

  describe('review state rendering', () => {
    it('should render the review panel', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      expect(screen.getByText('Recording ready')).toBeInTheDocument()
    })

    it('should display recording icon', () => {
      const { container } = render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should display "Recording ready" heading', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      expect(screen.getByText('Recording ready')).toBeInTheDocument()
    })

    it('should display duration in MM:SS format', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      expect(screen.getByText(/Duration: 02:00/)).toBeInTheDocument()
    })

    it('should display various duration times correctly', () => {
      const testCases = [
        { seconds: 30, expected: '00:30' },
        { seconds: 125, expected: '02:05' },
        { seconds: 3661, expected: '61:01' },
      ]

      testCases.forEach(({ seconds, expected }) => {
        const { unmount } = render(
          <ReviewPanel
            state={{
              status: 'review',
              blob: new Blob(),
              durationSeconds: seconds,
            }}
            submit={mockPipeline.submit}
            discard={mockPipeline.discard}
          />,
        )
        expect(screen.getByText(new RegExp(`Duration: ${expected}`))).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('custom instructions textarea', () => {
    it('should have a textarea for custom instructions', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const textarea = screen.getByRole('textbox', {
        name: /Custom instructions/i,
      })
      expect(textarea).toBeInTheDocument()
    })

    it('should have a descriptive label', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      expect(
        screen.getByLabelText(/Custom instructions \(optional\)/),
      ).toBeInTheDocument()
    })

    it('should start with empty value', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toBe('')
    })

    it('should have placeholder text', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.placeholder).toBe(
        'e.g. "Emphasize registration deadlines"',
      )
    })

    it('should have 3 rows', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.rows).toBe(3)
    })

    it('should accept user input', async () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement

      fireEvent.change(textarea, { target: { value: 'Focus on deadlines' } })

      expect(textarea.value).toBe('Focus on deadlines')
    })

    it('should update on change', async () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement

      fireEvent.change(textarea, {
        target: { value: 'Important instruction' },
      })

      expect(textarea.value).toBe('Important instruction')
    })

    it('should be disabled during processing', () => {
      const processingState: Extract<PipelineState, { status: 'processing' }> =
        { status: 'processing' }

      render(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.disabled).toBe(true)
    })
  })

  describe('buttons', () => {
    it('should have Record again button', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      expect(
        screen.getByRole('button', { name: /Record again/i }),
      ).toBeInTheDocument()
    })

    it('should have Send for processing button', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      expect(
        screen.getByRole('button', { name: /Send for processing/i }),
      ).toBeInTheDocument()
    })

    it('should call discard on Record again click', async () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      const recordAgainBtn = screen.getByRole('button', { name: /Record again/i })
      fireEvent.click(recordAgainBtn)

      await waitFor(() => {
        expect(mockPipeline.discard).toHaveBeenCalled()
      })
    })

    it('should call submit on Send for processing click', async () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      const sendBtn = screen.getByRole('button', { name: /Send for processing/i })
      fireEvent.click(sendBtn)

      await waitFor(() => {
        expect(mockPipeline.submit).toHaveBeenCalled()
      })
    })

    it('should pass custom instructions to submit', async () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: 'Focus on deadlines' } })

      const sendBtn = screen.getByRole('button', { name: /Send for processing/i })
      fireEvent.click(sendBtn)

      await waitFor(() => {
        expect(mockPipeline.submit).toHaveBeenCalledWith('Focus on deadlines')
      })
    })

    it('should pass empty string if no instructions provided', async () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      const sendBtn = screen.getByRole('button', { name: /Send for processing/i })
      fireEvent.click(sendBtn)

      await waitFor(() => {
        expect(mockPipeline.submit).toHaveBeenCalledWith('')
      })
    })
  })

  describe('processing state', () => {
    let processingState: Extract<PipelineState, { status: 'processing' }>

    beforeEach(() => {
      processingState = { status: 'processing' }
    })

    it('should show "Processing…" button text', () => {
      render(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      expect(
        screen.getByRole('button', { name: /Processing…/i }),
      ).toBeInTheDocument()
    })

    it('should show spinner icon while processing', () => {
      const { container } = render(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const spinner = container.querySelector('[class*="animate-spin"]')
      expect(spinner).toBeInTheDocument()
    })

    it('should display processing status message', () => {
      render(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      expect(
        screen.getByText('Transcribing and summarizing your recording…'),
      ).toBeInTheDocument()
    })

    it('should have aria-live on processing message', () => {
      const { container } = render(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeInTheDocument()
      expect(liveRegion?.textContent).toContain('Transcribing')
    })

    it('should disable Record again button', () => {
      render(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const recordAgainBtn = screen.getByRole('button', {
        name: /Record again/i,
      }) as HTMLButtonElement
      expect(recordAgainBtn.disabled).toBe(true)
    })

    it('should disable Send for processing button', () => {
      render(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const sendBtn = screen.getByRole('button', {
        name: /Processing…/i,
      }) as HTMLButtonElement
      expect(sendBtn.disabled).toBe(true)
    })

    it('should disable custom instructions textarea', () => {
      render(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.disabled).toBe(true)
    })
  })

  describe('state transitions', () => {
    it('should handle transition from review to processing', () => {
      const { rerender } = render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      expect(screen.getByText(/Send for processing/i)).toBeInTheDocument()

      const processingState: Extract<PipelineState, { status: 'processing' }> =
        { status: 'processing' }
      rerender(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      expect(screen.getByText(/Processing…/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper form structure', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      const label = screen.getByText(/Custom instructions/i)
      expect(label.tagName.toLowerCase()).toBe('label')
    })

    it('should link label to textarea', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.id).toBe('instructions')
    })

    it('should have accessible button labels', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      expect(
        screen.getByRole('button', { name: /Record again/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Send for processing/i }),
      ).toBeInTheDocument()
    })

    it('should announce status changes', () => {
      const processingState: Extract<PipelineState, { status: 'processing' }> =
        { status: 'processing' }

      const { container } = render(
        <ReviewPanel
          state={processingState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      const liveRegion = container.querySelector('[aria-live]')
      expect(liveRegion).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should center content vertically and horizontally', () => {
      const { container } = render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      const mainDiv = container.querySelector('[class*="flex"]')
      expect(mainDiv).toHaveClass('flex-col', 'items-center')
    })

    it('should apply max width to textarea', () => {
      render(
        <ReviewPanel
          state={mockState}
          submit={mockPipeline.submit}
          discard={mockPipeline.discard}
        />,
      )

      const textareaContainer = screen.getByRole('textbox').parentElement
      expect(textareaContainer).toHaveClass('max-w-md')
    })
  })
})
