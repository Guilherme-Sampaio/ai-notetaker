import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../src/middleware/errorHandler.js'
import summarizeRouter from '../../src/routes/summarize.routes.js'

vi.mock('../../src/services/openai.service.js', () => ({
  transcribeAudio: vi.fn().mockResolvedValue('fixture transcript'),
  summarizeTranscript: vi.fn().mockResolvedValue({
    keyDecisions: ['d1'],
    upcomingDeadlines: [],
    followUpTasks: [],
    resourcesMentioned: [],
  }),
}))

vi.mock('../../src/services/storage.service.js', () => ({
  getObjectBuffer: vi.fn().mockResolvedValue(Buffer.from('fake')),
  deleteObject: vi.fn().mockResolvedValue(undefined),
}))

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/summarize', summarizeRouter)
  app.use(errorHandler)
  return app
}

describe('POST /api/summarize/', () => {
  it('returns 400 when key is missing', async () => {
    const res = await request(buildApp()).post('/api/summarize/').send({})
    expect(res.status).toBe(400)
  })

  it('returns 400 when key does not start with uploads/', async () => {
    const res = await request(buildApp()).post('/api/summarize/').send({ key: 'evil/path' })
    expect(res.status).toBe(400)
  })

  it('returns 200 with transcript and summary for a valid key', async () => {
    const res = await request(buildApp())
      .post('/api/summarize/')
      .send({ key: 'uploads/abc-123.webm' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      transcript: 'fixture transcript',
      summary: {
        keyDecisions: ['d1'],
        upcomingDeadlines: [],
        followUpTasks: [],
        resourcesMentioned: [],
      },
    })
  })
})
