import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../src/middleware/errorHandler.js'
import uploadUrlRouter from '../../src/routes/uploadUrl.routes.js'

vi.mock('../../src/services/storage.service.js', () => ({
  getPresignedUploadUrl: vi.fn().mockResolvedValue('https://s3.example/presigned'),
}))

function buildApp() {
  const app = express()
  app.use('/api/upload-url', uploadUrlRouter)
  app.use(errorHandler)
  return app
}

describe('GET /api/upload-url', () => {
  it('returns 400 when mimeType is missing', async () => {
    const res = await request(buildApp()).get('/api/upload-url')
    expect(res.status).toBe(400)
  })

  it('returns 415 for unsupported mimeType', async () => {
    const res = await request(buildApp()).get('/api/upload-url').query({ mimeType: 'image/png' })
    expect(res.status).toBe(415)
  })

  it('returns 200 with uploadUrl and key', async () => {
    const res = await request(buildApp()).get('/api/upload-url').query({ mimeType: 'audio/webm' })
    expect(res.status).toBe(200)
    expect(res.body.uploadUrl).toBe('https://s3.example/presigned')
    expect(res.body.key).toMatch(/^uploads\/[0-9a-f-]{36}\.webm$/)
  })
})
