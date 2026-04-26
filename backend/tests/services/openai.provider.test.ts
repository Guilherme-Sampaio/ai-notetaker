import { afterEach, describe, expect, it, vi } from 'vitest'

describe('openai.provider', () => {
  const savedKey = process.env['OPENAI_API_KEY']

  afterEach(() => {
    vi.useRealTimers()
    process.env['OPENAI_API_KEY'] = savedKey ?? 'test-key-not-used-for-real-requests'
    vi.resetModules()
  })

  it('uses mock transcribe when OPENAI_API_KEY is mock', async () => {
    vi.resetModules()
    process.env['OPENAI_API_KEY'] = 'mock'

    const { transcribeAudio } = await import('../../src/services/openai.provider.js')

    vi.useFakeTimers()
    const promise = transcribeAudio(Buffer.from([1, 2]), 'audio/wav')
    await vi.advanceTimersByTimeAsync(800)
    const text = await promise

    expect(text).toContain('May 15th')
  })
})
