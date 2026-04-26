import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { PipelinePage } from '../../../src/pages/pipeline/PipelinePage'
import { usePipeline } from '../../../src/hooks/usePipeline'
import type { UsePipelineReturn } from '../../../src/hooks/usePipeline'
import * as notesApi from '../../../src/services/notes.api'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../src/hooks/usePipeline', () => ({
  usePipeline: vi.fn(),
}))

vi.mock('../../../src/services/notes.api', () => ({
  saveNote: vi.fn(),
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

function renderScreen() {
  return render(
    <MemoryRouter>
      <PipelinePage />
    </MemoryRouter>,
  )
}

describe('PipelineScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('renders RecorderPanel when state is idle', () => {
    mockUsePipeline.mockReturnValue(basePipeline({ state: { status: 'idle' } }))
    renderScreen()
    expect(screen.getByRole('toolbar', { name: /Recording controls/i })).toBeInTheDocument()
    expect(screen.queryByText('Recording ready')).not.toBeInTheDocument()
  })

  it('renders RecorderPanel when state is recording', () => {
    mockUsePipeline.mockReturnValue(basePipeline({ state: { status: 'recording' } }))
    renderScreen()
    expect(screen.getByRole('toolbar', { name: /Recording controls/i })).toBeInTheDocument()
  })

  it('renders RecorderPanel when state is paused', () => {
    mockUsePipeline.mockReturnValue(basePipeline({ state: { status: 'paused' } }))
    renderScreen()
    expect(screen.getByRole('toolbar', { name: /Recording controls/i })).toBeInTheDocument()
  })

  it('renders RecorderPanel when state is error', () => {
    mockUsePipeline.mockReturnValue(
      basePipeline({
        state: { status: 'error', stage: 'recording', message: 'Mic denied' },
      }),
    )
    renderScreen()
    expect(screen.getByRole('toolbar', { name: /Recording controls/i })).toBeInTheDocument()
  })

  it('renders ReviewPanel when state is review', () => {
    const blob = new Blob(['x'], { type: 'audio/webm' })
    mockUsePipeline.mockReturnValue(
      basePipeline({
        state: { status: 'review', blob, durationSeconds: 12 },
      }),
    )
    renderScreen()
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
    renderScreen()
    expect(screen.getByText('Recording ready')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Processing/i })).toBeDisabled()
    expect(
      screen.getByText('Transcribing and summarizing your recording…'),
    ).toBeInTheDocument()
  })

  it('renders NoteEditorPanel when state is done', () => {
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
    renderScreen()
    expect(screen.getByRole('heading', { name: /Review & Edit Summary/i })).toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: /Recording controls/i })).not.toBeInTheDocument()
  })

  it('navigates to /notes after save from done state', async () => {
    const user = userEvent.setup()
    vi.mocked(notesApi.saveNote).mockResolvedValueOnce({
      id: 'n',
      createdAt: '2026-01-01T00:00:00.000Z',
      transcript: 't',
      summary: {
        keyDecisions: [],
        upcomingDeadlines: [],
        followUpTasks: [],
        resourcesMentioned: [],
      },
    })
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
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/notes')
    })
  })

  it('calls restart when Record again from done state', async () => {
    const user = userEvent.setup()
    const restart = vi.fn()
    mockUsePipeline.mockReturnValue(
      basePipeline({
        restart,
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
    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Record again' }))
    expect(restart).toHaveBeenCalledTimes(1)
  })
})
