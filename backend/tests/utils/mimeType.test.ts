import { describe, expect, it } from 'vitest'
import { mimeTypeFromKey } from '../../src/utils/mimeType.js'

describe('mimeTypeFromKey', () => {
  it('maps known extensions', () => {
    expect(mimeTypeFromKey('uploads/a.webm')).toBe('audio/webm')
    expect(mimeTypeFromKey('uploads/a.wav')).toBe('audio/wav')
    expect(mimeTypeFromKey('uploads/a.mp4')).toBe('audio/mp4')
    expect(mimeTypeFromKey('uploads/a.mp3')).toBe('audio/mpeg')
  })

  it('defaults to audio/webm for unknown extension', () => {
    expect(mimeTypeFromKey('uploads/a.bin')).toBe('audio/webm')
    expect(mimeTypeFromKey('uploads/noext')).toBe('audio/webm')
  })
})
