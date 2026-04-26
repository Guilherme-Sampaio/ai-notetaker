import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PipelineScreen } from '../../src/components/PipelineScreen'
import { usePipeline } from '../../src/hooks/usePipeline'
import type { UsePipelineReturn } from '../../src/hooks/usePipeline'

vi.mock('../../src/hooks/usePipeline', () => ({
  usePipeline: vi.fn(),
}))

const mockUsePipeline = vi.mocked(usePipeline)

function basePipeline(overrides: Partial<UsePipelineReturn> = {}): UsePipelineReturn {
  return {
    state: { status: 'idle' },
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    restart: vi.fn(),
    finish: vi.fn(),
    submit: vi.fn(),
    discard: vi.fn(),
    ...overrides,
  }
}

describe('PipelineScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders RecorderPanel when state is idle', () => {
    mockUsePipeline.mockReturnValue(basePipeline({ state: { status: 'idle' } }))
    render(<PipelineScreen />)
    expect(screen.getByRole('toolbar', { name: /Recording controls/i })).toBeInTheDocument()
    expect(screen.queryByText('Recording ready')).not.toBeInTheDocument()
  })

  it('renders RecorderPanel when state is recording', () => {
    mockUsePipeline.mockReturnValue(basePipeline({ state: { status: 'recording' } }))
    render(<PipelineScreen />)
    expect(screen.getByRole('toolbar', { name: /Recording controls/i })).toBeInTheDocument()
  })

  it('renders RecorderPanel when state is paused', () => {
    mockUsePipeline.mockReturnValue(basePipeline({ state: { status: 'paused' } }))
    render(<PipelineScreen />)
    expect(screen.getByRole('toolbar', { name: /Recording controls/i })).toBeInTheDocument()
  })

  it('renders RecorderPanel when state is error', () => {
    mockUsePipeline.mockReturnValue(
      basePipeline({
        state: { status: 'error', stage: 'recording', message: 'Mic denied' },
      }),
    )
    render(<PipelineScreen />)
    expect(screen.getByRole('toolbar', { name: /Recording controls/i })).toBeInTheDocument()
  })

  it('renders ReviewPanel when state is review', () => {
    const blob = new Blob(['x'], { type: 'audio/webm' })
    mockUsePipeline.mockReturnValue(
      basePipeline({
        state: { status: 'review', blob, durationSeconds: 12 },
      }),
    )
    render(<PipelineScreen />)
    expect(screen.getByText('Recording ready')).toBeInTheDocument()
    expect(screen.getByLabelText(/Custom instructions/i)).toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: /Recording controls/i })).not.toBeInTheDocument()
  })

  it('renders ReviewPanel when state is processing', () => {
    mockUsePipeline.mockReturnValue(
      basePipeline({
        state: { status: 'processing' },
      }),
    )
    render(<PipelineScreen />)
    expect(screen.getByText('Recording ready')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Processing/i })).toBeDisabled()
    expect(
      screen.getByText('Transcribing and summarizing your recording…'),
    ).toBeInTheDocument()
  })

  it('renders ReviewPanel for done status is not used by screen branch', () => {
    mockUsePipeline.mockReturnValue(
      basePipeline({
        state: {
          status: 'done',
          transcript: 't',
          summary: {
            keyDecisions: [],
            upcomingDeadlines: [],
            followUpTasks: [],
            resourcesMentioned: [],
          },
        },
      }),
    )
    render(<PipelineScreen />)
    expect(screen.getByRole('toolbar', { name: /Recording controls/i })).toBeInTheDocument()
  })
})
