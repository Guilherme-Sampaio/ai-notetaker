import { SummaryOutputSchema, type SummaryOutput } from './summarize.schema.js'

// TODO: implement parseSummaryResponse
// Must never throw — return safe fallback on any JSON.parse or Zod failure.

const FALLBACK: SummaryOutput = {
  keyDecisions: [],
  upcomingDeadlines: [],
  followUpTasks: [],
  resourcesMentioned: [],
}

export function parseSummaryResponse(_raw: string): SummaryOutput {
  try {
    const parsed = JSON.parse(_raw)
    const result = SummaryOutputSchema.safeParse(parsed)
    return result.success ? result.data : FALLBACK
  } catch {
    return FALLBACK
  }
}
