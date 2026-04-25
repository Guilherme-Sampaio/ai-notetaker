import type { ErrorRequestHandler } from 'express'

// TODO: implement central error handler
// Catches all errors passed via next(error)
// Returns { error: string, message: string } with appropriate HTTP status

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err as { status?: number }).status ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(status).json({ error: 'server_error', message })
}
