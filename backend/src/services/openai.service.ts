import OpenAI, { toFile } from 'openai'
import { env } from '../config/env.js'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  console.log(`[transcribe] start — ${(buffer.length / 1024).toFixed(1)} KB, type=${mimeType}`)

  const file = await toFile(buffer, 'recording.webm', { type: mimeType })

  try {
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'gpt-4o-mini-transcribe',
    })

    console.log(`[transcribe] done — ${transcription.text.length} chars`)

    return transcription.text
  } catch (err) {
    console.error('[transcribe] OpenAI error:', err)
    throw Object.assign(new Error('Transcription failed. Please try again.'), { status: 502 })
  }
}


