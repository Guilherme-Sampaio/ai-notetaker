import { SummaryOutputSchema, type SummaryOutput } from './summarize.schema.js'

const FALLBACK: SummaryOutput = {
  keyDecisions: [],
  upcomingDeadlines: [],
  followUpTasks: [],
  resourcesMentioned: [],
}

// Defensive: strict json_schema mode should prevent fences, but if the
// model or response_format ever changes, gpt models often wrap JSON in
// ```json ... ``` blocks. Stripping them here keeps the validator robust.
function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export function parseSummaryResponse(raw: string): SummaryOutput {
  if (!raw || !raw.trim()) return FALLBACK

  try {
    const parsed = JSON.parse(stripCodeFences(raw))
    const result = SummaryOutputSchema.safeParse(parsed)
    return result.success ? result.data : FALLBACK
  } catch {
    return FALLBACK
  }
}
