import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleSummarize } from '../src/controllers/summarize.controller.js'
import { summarizeTranscript, transcribeAudio } from '../src/services/openai.provider.js'

const emptySummary = {
  keyDecisions: [] as string[],
  upcomingDeadlines: [] as string[],
  followUpTasks: [] as string[],
  resourcesMentioned: [] as string[],
}

vi.mock('../src/services/openai.provider.js', () => ({
  transcribeAudio: vi.fn(),
  summarizeTranscript: vi.fn(),
}))

describe('handleSummarize', () => {
  beforeEach(() => {
    vi.mocked(transcribeAudio).mockReset()
    vi.mocked(summarizeTranscript).mockReset()
    vi.mocked(summarizeTranscript).mockResolvedValue(emptySummary)
  })

  it('calls next with 400 when no audio file', async () => {
    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response

    await handleSummarize({ file: undefined } as Request, res, next as unknown as NextFunction)

    expect(transcribeAudio).not.toHaveBeenCalled()
    expect(summarizeTranscript).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    const err = vi.mocked(next).mock.calls[0][0] as Error & { status?: number }
    expect(err.status).toBe(400)
    expect(err.message).toBe('No audio file provided')
  })

  it('returns transcript and summary when file is present', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue('hello transcript')

    const next = vi.fn()
    const json = vi.fn()
    const res = { json } as unknown as Response
    const buffer = Buffer.from([0, 1, 2])
    const req = {
      file: { buffer, mimetype: 'audio/wav' },
      body: {},
    } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(transcribeAudio).toHaveBeenCalledWith(buffer, 'audio/wav')
    expect(summarizeTranscript).toHaveBeenCalledWith('hello transcript', undefined)
    expect(json).toHaveBeenCalledWith({
      transcript: 'hello transcript',
      summary: emptySummary,
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('forwards errors from transcribeAudio', async () => {
    const boom = new Error('upstream failed')
    vi.mocked(transcribeAudio).mockRejectedValue(boom)

    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response
    const req = {
      file: { buffer: Buffer.from([0]), mimetype: 'audio/wav' },
      body: {},
    } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(next).toHaveBeenCalledWith(boom)
    expect(res.json).not.toHaveBeenCalled()
  })

  it('forwards errors from summarizeTranscript', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue('hello')
    const boom = new Error('summarize failed')
    vi.mocked(summarizeTranscript).mockRejectedValue(boom)

    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response
    const req = {
      file: { buffer: Buffer.from([1]), mimetype: 'audio/wav' },
      body: {},
    } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(next).toHaveBeenCalledWith(boom)
    expect(res.json).not.toHaveBeenCalled()
  })
})
