export interface SummaryOutput {
  keyDecisions: string[]
  upcomingDeadlines: string[]
  followUpTasks: string[]
  resourcesMentioned: string[]
}

export interface ProcessResponse {
  transcript: string
  summary: SummaryOutput
}
