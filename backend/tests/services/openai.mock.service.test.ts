import { describe, expect, it, vi } from 'vitest'
import { transcribeAudio } from '../../src/services/openai.mock.service.js'

describe('openai.mock.service transcribeAudio', () => {
  it('returns fixture transcript after delay', async () => {
    vi.useFakeTimers()
    const promise = transcribeAudio(Buffer.alloc(0), 'audio/wav')
    await vi.advanceTimersByTimeAsync(800)
    const text = await promise
    vi.useRealTimers()

    expect(text).toContain('May 15th')
    expect(text).toContain('Cognitive Science')
  })
})
