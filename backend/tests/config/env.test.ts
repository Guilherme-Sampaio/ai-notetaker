import { describe, expect, it } from 'vitest'
import { EnvSchema } from '../../src/config/env.js'

describe('EnvSchema', () => {
  it('accepts minimal valid input', () => {
    const r = EnvSchema.safeParse({
      OPENAI_API_KEY: 'sk-test',
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
    })
    expect(r.success).toBe(false)
  })

  it('rejects invalid FRONTEND_URL', () => {
    const r = EnvSchema.safeParse({
      OPENAI_API_KEY: 'sk-test',
      FRONTEND_URL: 'not-a-url',
    })
    expect(r.success).toBe(false)
  })

  it('coerces PORT from string', () => {
    const r = EnvSchema.safeParse({
      OPENAI_API_KEY: 'sk-test',
      PORT: '4000',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.PORT).toBe(4000)
    }
  })
})
