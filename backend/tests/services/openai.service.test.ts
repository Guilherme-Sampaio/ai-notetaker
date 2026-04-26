import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../src/errors/AppError.js'

const transcriptionsCreate = vi.fn()

vi.mock('openai', () => {
  class MockOpenAI {
    audio = {
      transcriptions: {
        create: transcriptionsCreate,
      },
    }
  }
  return {
    default: MockOpenAI,
    toFile: vi.fn().mockImplementation((_buf: Buffer, _name: string, _opts: object) =>
      Promise.resolve({ __tag: 'mock-file' }),
    ),
  }
})

const tenWordTranscript = 'one two three four five six seven eight nine ten'

describe('transcribeAudio', () => {
  beforeEach(() => {
    transcriptionsCreate.mockReset()
    transcriptionsCreate.mockResolvedValue({ text: tenWordTranscript })
  })

  it('calls OpenAI transcriptions API and returns text when transcript has at least ten words', async () => {
    const { transcribeAudio } = await import('../../src/services/openai.service.js')

    const text = await transcribeAudio(Buffer.from('fake-audio'), 'audio/webm')

    expect(text).toBe(tenWordTranscript)
    expect(transcriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-transcribe',
      }),
    )
  })

  it('throws AppError 422 when transcription has fewer than ten words', async () => {
    transcriptionsCreate.mockResolvedValueOnce({ text: 'one two three' })
    const { transcribeAudio } = await import('../../src/services/openai.service.js')

    let caught: unknown
    try {
      await transcribeAudio(Buffer.from('x'), 'audio/webm')
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(AppError)
    expect((caught as AppError).status).toBe(422)
  })
})
