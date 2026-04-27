import OpenAI, { toFile } from 'openai'
import { env } from '../config/env.js'
import { AppError } from '../errors/AppError.js'
import { SYSTEM_PROMPT, buildUserPrompt } from '../ai/summarize.prompt.js'
import { parseSummaryResponse } from '../ai/summarize.validator.js'
import type { SummaryOutput } from '../ai/summarize.schema.js'

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

    const wordCount = transcription.text.trim().split(/\s+/).filter(Boolean).length
    if (wordCount < 10) {
      throw new AppError('Recording too short or no clear speech detected. Please record again and speak clearly.', 422)
    }

    return transcription.text
  } catch (err) {
    if (err instanceof AppError) throw err
    console.error('[transcribe] OpenAI error:', err)
    throw new AppError('Transcription failed. Please try again.', 502)
  }
}

export async function summarizeTranscript(
  transcript: string,
  customInstructions?: string,
): Promise<SummaryOutput> {
  console.log(`[summarize] start — ${transcript.length} chars`)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.4-nano',
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

    const summary = parseSummaryResponse(raw)

    const isEmpty =
      summary.keyDecisions.length === 0 &&
      summary.upcomingDeadlines.length === 0 &&
      summary.followUpTasks.length === 0 &&
      summary.resourcesMentioned.length === 0

    if (isEmpty) {
      throw new AppError("This recording doesn't appear to contain an advising session. No decisions, tasks, or deadlines were found.", 422)
    }

    return summary
  } catch (err) {
    if (err instanceof AppError) throw err
    console.error('[summarize] OpenAI error:', err)
    throw new AppError('Summarization failed. Please try again.', 502)
  }
}

