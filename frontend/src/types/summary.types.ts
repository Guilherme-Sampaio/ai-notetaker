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

export interface Note {
  id: string
  createdAt: string
  transcript: string
  summary: SummaryOutput
}
