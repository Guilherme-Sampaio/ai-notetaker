import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleSummarize } from '../src/controllers/summarize.controller.js'
import { transcribeAudio } from '../src/services/openai.service.js'

vi.mock('../src/services/openai.service.js', () => ({
  transcribeAudio: vi.fn(),
}))

describe('handleSummarize', () => {
  beforeEach(() => {
    vi.mocked(transcribeAudio).mockReset()
  })

  it('calls next with 400 when no audio file', async () => {
    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response

    await handleSummarize({ file: undefined } as Request, res, next as unknown as NextFunction)

    expect(transcribeAudio).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    const err = vi.mocked(next).mock.calls[0][0] as Error & { status?: number }
    expect(err.status).toBe(400)
    expect(err.message).toBe('No audio file provided')
  })

  it('returns transcript when file is present', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue('hello transcript')

    const next = vi.fn()
    const json = vi.fn()
    const res = { json } as unknown as Response
    const buffer = Buffer.from([0, 1, 2])
    const req = {
      file: { buffer, mimetype: 'audio/wav' },
    } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(transcribeAudio).toHaveBeenCalledWith(buffer, 'audio/wav')
    expect(json).toHaveBeenCalledWith({ transcript: 'hello transcript' })
    expect(next).not.toHaveBeenCalled()
  })

  it('forwards errors from transcribeAudio', async () => {
    const boom = new Error('upstream failed')
    vi.mocked(transcribeAudio).mockRejectedValue(boom)

    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response
    const req = {
      file: { buffer: Buffer.from([0]), mimetype: 'audio/wav' },
    } as unknown as Request

    await handleSummarize(req, res, next as unknown as NextFunction)

    expect(next).toHaveBeenCalledWith(boom)
    expect(res.json).not.toHaveBeenCalled()
  })
})
