import { env } from '../config/env.js'
import * as real from './openai.service.js'
import * as mock from './openai.mock.service.js'

const isMock = env.OPENAI_API_KEY === 'mock'

if (isMock) {
  console.warn('[ai] Running in MOCK mode — no real OpenAI calls will be made')
}

export const transcribeAudio: typeof real.transcribeAudio = isMock
  ? mock.transcribeAudio
  : real.transcribeAudio

export const summarizeTranscript: typeof real.summarizeTranscript = isMock
  ? mock.summarizeTranscript
  : real.summarizeTranscript
