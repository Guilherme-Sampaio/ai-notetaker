import { z } from 'zod'

// TODO: define SummaryOutputSchema with keyDecisions, upcomingDeadlines, followUpTasks, resourcesMentioned
// Export SummaryOutput as the inferred TypeScript type

export const SummaryOutputSchema = z.object({
  keyDecisions: z.array(z.string()),
  upcomingDeadlines: z.array(z.string()),
  followUpTasks: z.array(z.string()),
  resourcesMentioned: z.array(z.string()),
})

export type SummaryOutput = z.infer<typeof SummaryOutputSchema>
