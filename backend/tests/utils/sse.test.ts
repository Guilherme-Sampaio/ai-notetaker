import type { Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { initSse, sendEvent } from '../../src/utils/sse.js'

describe('sse', () => {
  it('initSse sets SSE headers and flushes', () => {
    const setHeader = vi.fn()
    const flushHeaders = vi.fn()
    const res = { setHeader, flushHeaders } as unknown as Response

    initSse(res)

    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream')
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache')
    expect(setHeader).toHaveBeenCalledWith('Connection', 'keep-alive')
    expect(flushHeaders).toHaveBeenCalledTimes(1)
  })

  it('sendEvent writes event and JSON data separated by blank line', () => {
    const write = vi.fn()
    const res = { write } as unknown as Response

    sendEvent(res, 'stage', { stage: 'transcribing' })

    expect(write).toHaveBeenCalledWith(
      'event: stage\ndata: {"stage":"transcribing"}\n\n',
    )
  })
})
