import { describe, expect, it } from 'vitest'
import { EnvSchema } from '../../src/config/env.js'

describe('EnvSchema', () => {
  it('accepts minimal valid input', () => {
    const r = EnvSchema.safeParse({
      OPENAI_API_KEY: 'sk-test',
      S3_BUCKET: 'b',
      S3_REGION: 'us-east-1',
      S3_ACCESS_KEY: 'ak',
      S3_SECRET_KEY: 'sk',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.PORT).toBe(3001)
      expect(r.data.FRONTEND_URL).toBe('http://localhost:5173')
    }
  })

  it('rejects empty OPENAI_API_KEY', () => {
    const r = EnvSchema.safeParse({
      OPENAI_API_KEY: '',
      S3_BUCKET: 'b',
      S3_REGION: 'us-east-1',
      S3_ACCESS_KEY: 'ak',
      S3_SECRET_KEY: 'sk',
    })
    expect(r.success).toBe(false)
  })

  it('rejects invalid FRONTEND_URL', () => {
    const r = EnvSchema.safeParse({
      OPENAI_API_KEY: 'sk-test',
      FRONTEND_URL: 'not-a-url',
      S3_BUCKET: 'b',
      S3_REGION: 'us-east-1',
      S3_ACCESS_KEY: 'ak',
      S3_SECRET_KEY: 'sk',
    })
    expect(r.success).toBe(false)
  })

  it('coerces PORT from string', () => {
    const r = EnvSchema.safeParse({
      OPENAI_API_KEY: 'sk-test',
      PORT: '4000',
      S3_BUCKET: 'b',
      S3_REGION: 'us-east-1',
      S3_ACCESS_KEY: 'ak',
      S3_SECRET_KEY: 'sk',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.PORT).toBe(4000)
    }
  })
})
