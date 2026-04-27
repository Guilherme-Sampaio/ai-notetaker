import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../src/errors/AppError.js'
import { handleSummarize } from '../../src/handlers/summarize.handler.js'
import { summarizeTranscript, transcribeAudio } from '../../src/services/openai.service.js'
import { deleteObject, getObjectBuffer } from '../../src/services/storage.service.js'

const emptySummary = {
  keyDecisions: [] as string[],
  upcomingDeadlines: [] as string[],
  followUpTasks: [] as string[],
  resourcesMentioned: [] as string[],
}

function sseResponse() {
  const write = vi.fn()
  const end = vi.fn()
  const setHeader = vi.fn()
  const flushHeaders = vi.fn()
  const res = { setHeader, flushHeaders, write, end, json: vi.fn() } as unknown as Response
  return { res, write, end }
}

vi.mock('../../src/services/openai.service.js', () => ({
  transcribeAudio: vi.fn(),
  summarizeTranscript: vi.fn(),
}))

vi.mock('../../src/services/storage.service.js', () => ({
  getObjectBuffer: vi.fn(),
  deleteObject: vi.fn(),
}))

describe('handleSummarize', () => {
  beforeEach(() => {
    vi.mocked(transcribeAudio).mockReset()
    vi.mocked(summarizeTranscript).mockReset()
    vi.mocked(getObjectBuffer).mockReset()
    vi.mocked(deleteObject).mockResolvedValue(undefined)
    vi.mocked(summarizeTranscript).mockResolvedValue(emptySummary)
  })

  it('calls next with 400 when key is missing', async () => {
    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response

    await handleSummarize({ body: {} } as Request, res, next as unknown as NextFunction)

    expect(getObjectBuffer).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    const err = vi.mocked(next).mock.calls[0][0]
    expect(err).toBeInstanceOf(AppError)
    expect((err as AppError).status).toBe(400)
  })

  it('calls next with 400 when key does not start with uploads/', async () => {
    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response

    await handleSummarize({ body: { key: 'evil/../../etc/passwd' } } as Request, res, next as unknown as NextFunction)

    expect(getObjectBuffer).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    const err = vi.mocked(next).mock.calls[0][0]
    expect(err).toBeInstanceOf(AppError)
    expect((err as AppError).status).toBe(400)
  })

  it('streams SSE stages and done when key is valid', async () => {
    const buffer = Buffer.from([0, 1, 2])
    vi.mocked(getObjectBuffer).mockResolvedValue(buffer)
    vi.mocked(transcribeAudio).mockResolvedValue('hello transcript')

    const next = vi.fn()
    const { res, write, end } = sseResponse()
    const req = { body: { key: 'uploads/abc.webm' } } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(getObjectBuffer).toHaveBeenCalledWith('uploads/abc.webm')
    expect(transcribeAudio).toHaveBeenCalledWith(buffer, 'audio/webm')
    expect(summarizeTranscript).toHaveBeenCalledWith('hello transcript', undefined)

    const payload = write.mock.calls.map((c) => c[0] as string).join('')
    expect(payload).toContain('event: stage')
    expect(payload).toContain('"stage":"transcribing"')
    expect(payload).toContain('"stage":"summarizing"')
    expect(payload).toContain('event: done')
    expect(payload).toContain('"transcript":"hello transcript"')
    expect(end).toHaveBeenCalledTimes(1)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes customInstructions to summarizeTranscript when provided', async () => {
    vi.mocked(getObjectBuffer).mockResolvedValue(Buffer.from([0]))
    vi.mocked(transcribeAudio).mockResolvedValue('hello transcript')

    const next = vi.fn()
    const { res, write } = sseResponse()
    const req = {
      body: { key: 'uploads/abc.webm', customInstructions: 'focus' },
    } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(summarizeTranscript).toHaveBeenCalledWith('hello transcript', 'focus')
    expect(write.mock.calls.some((c) => (c[0] as string).includes('event: done'))).toBe(true)
  })

  it('sends SSE error and ends when transcription fails', async () => {
    vi.mocked(getObjectBuffer).mockResolvedValue(Buffer.from([0]))
    vi.mocked(transcribeAudio).mockRejectedValue(new Error('whisper down'))

    const next = vi.fn()
    const { res, write, end } = sseResponse()
    const req = { body: { key: 'uploads/abc.webm' } } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(next).not.toHaveBeenCalled()
    const out = write.mock.calls.map((c) => c[0] as string).join('')
    expect(out).toContain('event: error')
    expect(out).toContain('whisper down')
    expect(end).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(deleteObject).toHaveBeenCalledWith('uploads/abc.webm'))
  })

  it('sends SSE error when summarizeTranscript fails', async () => {
    vi.mocked(getObjectBuffer).mockResolvedValue(Buffer.from([0]))
    vi.mocked(transcribeAudio).mockResolvedValue('hello')
    vi.mocked(summarizeTranscript).mockRejectedValue(new Error('summarize failed'))

    const next = vi.fn()
    const { res, write, end } = sseResponse()
    const req = { body: { key: 'uploads/abc.wav' } } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(next).not.toHaveBeenCalled()
    const out = write.mock.calls.map((c) => c[0] as string).join('')
    expect(out).toContain('event: error')
    expect(out).toContain('summarize failed')
    expect(end).toHaveBeenCalledTimes(1)
  })
})
