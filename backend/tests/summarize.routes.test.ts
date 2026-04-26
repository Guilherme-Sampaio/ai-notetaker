import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../src/middleware/errorHandler.js'
import summarizeRouter from '../src/routes/summarize.routes.js'

vi.mock('../src/services/openai.provider.js', () => ({
  transcribeAudio: vi.fn().mockResolvedValue('fixture transcript'),
  summarizeTranscript: vi.fn().mockResolvedValue({
    keyDecisions: ['d1'],
    upcomingDeadlines: [],
    followUpTasks: [],
    resourcesMentioned: [],
  }),
}))

function buildApp() {
  const app = express()
  app.use('/api/summarize', summarizeRouter)
  app.use(errorHandler)
  return app
}

describe('POST /api/summarize/', () => {
  it('returns 415 for unsupported mime type', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/summarize/')
      .attach('audio', Buffer.from('x'), { filename: 'x.png', contentType: 'image/png' })

    expect(res.status).toBe(415)
  })

  it('returns 400 when audio field is missing', async () => {
    const app = buildApp()
    const res = await request(app).post('/api/summarize/').send({})

    expect(res.status).toBe(400)
  })

  it('returns 200 with transcript and summary for wav', async () => {
    const app = buildApp()
    const res = await request(app)
      .post('/api/summarize/')
      .attach('audio', Buffer.from('fake'), { filename: 'clip.wav', contentType: 'audio/wav' })

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
