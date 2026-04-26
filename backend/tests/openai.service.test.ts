import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('transcribeAudio', () => {
  beforeEach(() => {
    transcriptionsCreate.mockReset()
    transcriptionsCreate.mockResolvedValue({ text: 'mocked line' })
  })

  it('calls OpenAI transcriptions API and returns text', async () => {
    const { transcribeAudio } = await import('../src/services/openai.service.js')

    const text = await transcribeAudio(Buffer.from('fake-audio'), 'audio/webm')

    expect(text).toBe('mocked line')
    expect(transcriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini-transcribe',
      }),
    )
  })
})
