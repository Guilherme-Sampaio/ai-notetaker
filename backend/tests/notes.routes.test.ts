import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { notesStore } from '../src/db/notes.store.js'
import { errorHandler } from '../src/middleware/errorHandler.js'
import notesRouter from '../src/routes/notes.routes.js'

const validSummary = {
  keyDecisions: ['d1'],
  upcomingDeadlines: [] as string[],
  followUpTasks: [] as string[],
  resourcesMentioned: [] as string[],
}

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/notes', notesRouter)
  app.use(errorHandler)
  return app
}

describe('/api/notes', () => {
  beforeEach(() => {
    notesStore.clear()
  })

  describe('POST /api/notes/', () => {
    it('returns 400 when body is invalid', async () => {
      const app = buildApp()
      const res = await request(app).post('/api/notes/').send({})

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('server_error')
    })

    it('returns 201 with created note', async () => {
      const app = buildApp()
      const res = await request(app)
        .post('/api/notes/')
        .send({ transcript: 'hello', summary: validSummary })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        transcript: 'hello',
        summary: validSummary,
      })
      expect(res.body.id).toBeTruthy()
      expect(res.body.createdAt).toBeTruthy()
    })
  })

  describe('GET /api/notes/', () => {
    it('returns empty list when no notes', async () => {
      const app = buildApp()
      const res = await request(app).get('/api/notes/')

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ notes: [] })
    })

    it('returns saved notes newest first', async () => {
      const app = buildApp()
      await request(app).post('/api/notes/').send({ transcript: 'first', summary: validSummary })
      await request(app).post('/api/notes/').send({ transcript: 'second', summary: validSummary })

      const res = await request(app).get('/api/notes/')

      expect(res.status).toBe(200)
      expect(res.body.notes).toHaveLength(2)
      expect(res.body.notes[0].transcript).toBe('second')
      expect(res.body.notes[1].transcript).toBe('first')
    })
  })
})
