import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../src/errors/AppError.js'
import { handleSummarize } from '../../src/handlers/summarize.handler.js'
import { summarizeTranscript, transcribeAudio } from '../../src/services/openai.provider.js'
import { deleteObject, getObjectBuffer } from '../../src/services/storage.service.js'

const emptySummary = {
  keyDecisions: [] as string[],
  upcomingDeadlines: [] as string[],
  followUpTasks: [] as string[],
  resourcesMentioned: [] as string[],
}

vi.mock('../../src/services/openai.provider.js', () => ({
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

  it('returns transcript and summary when key is valid', async () => {
    const buffer = Buffer.from([0, 1, 2])
    vi.mocked(getObjectBuffer).mockResolvedValue(buffer)
    vi.mocked(transcribeAudio).mockResolvedValue('hello transcript')

    const next = vi.fn()
    const json = vi.fn()
    const res = { json } as unknown as Response
    const req = { body: { key: 'uploads/abc.webm' } } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(getObjectBuffer).toHaveBeenCalledWith('uploads/abc.webm')
    expect(transcribeAudio).toHaveBeenCalledWith(buffer, 'audio/webm')
    expect(summarizeTranscript).toHaveBeenCalledWith('hello transcript', undefined)
    expect(json).toHaveBeenCalledWith({ transcript: 'hello transcript', summary: emptySummary })
    expect(next).not.toHaveBeenCalled()
  })

  it('passes customInstructions to summarizeTranscript when provided', async () => {
    vi.mocked(getObjectBuffer).mockResolvedValue(Buffer.from([0]))
    vi.mocked(transcribeAudio).mockResolvedValue('hello transcript')

    const next = vi.fn()
    const json = vi.fn()
    const res = { json } as unknown as Response
    const req = {
      body: { key: 'uploads/abc.webm', customInstructions: 'focus' },
    } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(summarizeTranscript).toHaveBeenCalledWith('hello transcript', 'focus')
  })

  it('deletes the S3 object even when transcription fails', async () => {
    vi.mocked(getObjectBuffer).mockResolvedValue(Buffer.from([0]))
    vi.mocked(transcribeAudio).mockRejectedValue(new Error('whisper down'))

    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response
    const req = { body: { key: 'uploads/abc.webm' } } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(next).toHaveBeenCalled()
    await vi.waitFor(() => expect(deleteObject).toHaveBeenCalledWith('uploads/abc.webm'))
  })

  it('forwards errors from summarizeTranscript', async () => {
    vi.mocked(getObjectBuffer).mockResolvedValue(Buffer.from([0]))
    vi.mocked(transcribeAudio).mockResolvedValue('hello')
    const boom = new Error('summarize failed')
    vi.mocked(summarizeTranscript).mockRejectedValue(boom)

    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response
    const req = { body: { key: 'uploads/abc.wav' } } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(next).toHaveBeenCalledWith(boom)
    expect(res.json).not.toHaveBeenCalled()
  })
})
