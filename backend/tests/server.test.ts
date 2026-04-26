import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/server.js'

describe('server', () => {
  it('responds to GET /api/health', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('mounts GET /api/notes', async () => {
    const res = await request(app).get('/api/notes')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('notes')
    expect(Array.isArray(res.body.notes)).toBe(true)
  })
})
