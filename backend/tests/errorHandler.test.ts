import type { NextFunction, Request, Response } from 'express'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/errors/AppError.js'
import { errorHandler } from '../src/middleware/errorHandler.js'

describe('errorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('responds with app_error for AppError', () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response
    errorHandler(new AppError('bad input', 422), {} as Request, res, vi.fn() as NextFunction)
    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith({ error: 'app_error', message: 'bad input' })
  })

  it('responds with 500 for unknown errors', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response
    errorHandler(new Error('boom'), {} as Request, res, vi.fn() as NextFunction)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'server_error',
      message: 'Something went wrong. Please try again.',
    })
  })
})
