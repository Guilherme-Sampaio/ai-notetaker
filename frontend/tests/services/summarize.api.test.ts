import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { streamSummarize } from '../../src/services/summarize.api'
import { getUploadUrl, uploadToS3 } from '../../src/services/storage.api'

vi.mock('../../src/services/storage.api', () => ({
  getUploadUrl: vi.fn(),
  uploadToS3: vi.fn(),
}))

function sseMessage(event: string, data: object) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

async function collectStream(blob: Blob, instructions?: string) {
  const events: unknown[] = []
  for await (const ev of streamSummarize(blob, instructions)) {
    events.push(ev)
  }
  return events
}

describe('streamSummarize', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  const summary = {
    keyDecisions: [] as string[],
    upcomingDeadlines: [] as string[],
    followUpTasks: [] as string[],
    resourcesMentioned: [] as string[],
  }

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
    vi.mocked(getUploadUrl).mockResolvedValue({
      uploadUrl: 'https://s3.example/presigned',
      key: 'uploads/test-id.webm',
    })
    vi.mocked(uploadToS3).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('yields uploading then SSE stage and done events', async () => {
    const blob = new Blob(['x'], { type: 'audio/webm' })
    const sse =
      sseMessage('stage', { stage: 'transcribing' }) +
      sseMessage('stage', { stage: 'summarizing' }) +
      sseMessage('done', { transcript: 'T', summary })

    fetchMock.mockResolvedValueOnce({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sse))
          controller.close()
        },
      }),
    })

    const events = await collectStream(blob)

    expect(events[0]).toEqual({ event: 'stage', stage: 'uploading' })
    expect(events[1]).toEqual({ event: 'stage', stage: 'transcribing' })
    expect(events[2]).toEqual({ event: 'stage', stage: 'summarizing' })
    expect(events[3]).toEqual({ event: 'done', transcript: 'T', summary })
    expect(fetchMock).toHaveBeenCalledWith('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'uploads/test-id.webm' }),
    })
  })

  it('POST body includes trimmed customInstructions', async () => {
    const blob = new Blob(['x'], { type: 'audio/webm' })
    fetchMock.mockResolvedValueOnce({
      ok: true,
      body: new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(sseMessage('done', { transcript: 'x', summary })))
          c.close()
        },
      }),
    })

    await collectStream(blob, '  hi  ')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({
      key: 'uploads/test-id.webm',
      customInstructions: 'hi',
    })
  })

  it('parses SSE split across chunk boundaries', async () => {
    const blob = new Blob(['x'])
    const msg = sseMessage('done', { transcript: 'x', summary })
    const mid = Math.floor(msg.length / 2)
    const part1 = msg.slice(0, mid)
    const part2 = msg.slice(mid)

    fetchMock.mockResolvedValueOnce({
      ok: true,
      body: new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(part1))
          c.enqueue(new TextEncoder().encode(part2))
          c.close()
        },
      }),
    })

    const events = await collectStream(blob)
    expect(events.some((e) => (e as { event: string }).event === 'done')).toBe(true)
  })

  it('throws when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      body: new ReadableStream(),
      json: vi.fn().mockResolvedValueOnce({}),
    })

    await expect(collectStream(new Blob())).rejects.toThrow('Processing failed. Please try again.')
  })

  it('throws when response has no body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      body: null,
      json: vi.fn().mockResolvedValueOnce({}),
    })

    await expect(collectStream(new Blob())).rejects.toThrow('Processing failed. Please try again.')
  })

  it('throws when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'))

    await expect(collectStream(new Blob())).rejects.toThrow('network')
  })
})
