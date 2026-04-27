import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../src/errors/AppError.js'
import { handleGetUploadUrl } from '../../src/handlers/uploadUrl.handler.js'
import { getPresignedUploadUrl } from '../../src/services/storage.service.js'

vi.mock('../../src/services/storage.service.js', () => ({
  getPresignedUploadUrl: vi.fn(),
}))

describe('handleGetUploadUrl', () => {
  beforeEach(() => {
    vi.mocked(getPresignedUploadUrl).mockReset()
    vi.mocked(getPresignedUploadUrl).mockResolvedValue('https://s3.example/presigned')
  })

  it('calls next with 400 when mimeType is missing', async () => {
    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response

    await handleGetUploadUrl({ query: {} } as Request, res, next as unknown as NextFunction)

    expect(getPresignedUploadUrl).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    const err = vi.mocked(next).mock.calls[0][0]
    expect(err).toBeInstanceOf(AppError)
    expect((err as AppError).status).toBe(400)
    expect((err as AppError).message).toBe('mimeType is required')
  })

  it('calls next with 415 for unsupported mimeType', async () => {
    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response

    await handleGetUploadUrl(
      { query: { mimeType: 'image/png' } } as unknown as Request,
      res,
      next as unknown as NextFunction,
    )

    expect(getPresignedUploadUrl).not.toHaveBeenCalled()
    const err = vi.mocked(next).mock.calls[0][0] as AppError
    expect(err.status).toBe(415)
  })

  it('strips parameters after semicolon before validating', async () => {
    const json = vi.fn()
    const next = vi.fn()
    const res = { json } as unknown as Response

    await handleGetUploadUrl(
      { query: { mimeType: 'audio/webm; codecs=opus' } } as unknown as Request,
      res,
      next as unknown as NextFunction,
    )

    expect(next).not.toHaveBeenCalled()
    expect(getPresignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/[0-9a-f-]{36}\.webm$/),
      'audio/webm',
    )
    expect(json).toHaveBeenCalledWith({
      uploadUrl: 'https://s3.example/presigned',
      key: expect.stringMatching(/^uploads\/[0-9a-f-]{36}\.webm$/),
    })
  })

  it('returns uploadUrl and key for allowed mime types', async () => {
    const json = vi.fn()
    const next = vi.fn()
    const res = { json } as unknown as Response

    await handleGetUploadUrl(
      { query: { mimeType: 'audio/wav' } } as unknown as Request,
      res,
      next as unknown as NextFunction,
    )

    expect(getPresignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/[0-9a-f-]{36}\.wav$/),
      'audio/wav',
    )
    expect(json).toHaveBeenCalledWith({
      uploadUrl: 'https://s3.example/presigned',
      key: expect.stringMatching(/^uploads\/[0-9a-f-]{36}\.wav$/),
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('forwards errors from getPresignedUploadUrl', async () => {
    const boom = new Error('signing failed')
    vi.mocked(getPresignedUploadUrl).mockRejectedValue(boom)

    const next = vi.fn()
    const res = { json: vi.fn() } as unknown as Response

    await handleGetUploadUrl(
      { query: { mimeType: 'audio/webm' } } as unknown as Request,
      res,
      next as unknown as NextFunction,
    )

    expect(next).toHaveBeenCalledWith(boom)
  })
})
