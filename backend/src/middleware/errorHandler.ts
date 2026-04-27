import type { ErrorRequestHandler } from 'express'
import { AppError } from '../errors/AppError.js'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: 'app_error', message: err.message })
    return
  }

  console.error('[unhandled]', err)
  res.status(500).json({ error: 'server_error', message: 'Something went wrong. Please try again.' })
}
