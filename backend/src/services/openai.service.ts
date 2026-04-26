import OpenAI, { toFile } from 'openai'
import { env } from '../config/env.js'
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/summarize.prompt.js'
import { parseSummaryResponse } from '../prompts/summarize.validator.js'
import type { SummaryOutput } from '../prompts/summarize.schema.js'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  console.log(`[transcribe] start — ${(buffer.length / 1024).toFixed(1)} KB, type=${mimeType}`)

  const file = await toFile(buffer, 'recording.webm', { type: mimeType })

  try {
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'gpt-4o-transcribe',
    })

    console.log(`[transcribe] done — ${transcription.text.length} chars`)

    return transcription.text
  } catch (err) {
    console.error('[transcribe] OpenAI error:', err)
    throw Object.assign(new Error('Transcription failed. Please try again.'), { status: 502 })
  }
}

export async function summarizeTranscript(
  transcript: string,
  customInstructions?: string,
): Promise<SummaryOutput> {
  console.log(`[summarize] start — ${transcript.length} chars`)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(transcript, customInstructions) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'summary_output',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              keyDecisions: { type: 'array', items: { type: 'string' } },
              upcomingDeadlines: { type: 'array', items: { type: 'string' } },
              followUpTasks: { type: 'array', items: { type: 'string' } },
              resourcesMentioned: { type: 'array', items: { type: 'string' } },
            },
            required: ['keyDecisions', 'upcomingDeadlines', 'followUpTasks', 'resourcesMentioned'],
            additionalProperties: false,
          },
        },
      },
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    console.log(`[summarize] done — ${raw.length} chars`)

    return parseSummaryResponse(raw)
  } catch (err) {
    console.error('[summarize] OpenAI error:', err)
    throw Object.assign(new Error('Summarization failed. Please try again.'), { status: 502 })
  }
}

