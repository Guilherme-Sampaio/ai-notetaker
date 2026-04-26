import { z } from 'zod'

export const SummaryOutputSchema = z.object({
  keyDecisions: z
    .array(z.string())
    .describe('Choices the advisor and student explicitly agreed on.'),
  upcomingDeadlines: z
    .array(z.string())
    .describe('Specific dates, weeks, or timeframes the student must meet.'),
  followUpTasks: z
    .array(z.string())
    .describe('Concrete next actions, with the responsible party when known.'),
  resourcesMentioned: z
    .array(z.string())
    .describe('Specific courses, programs, offices, sites, people, or books.'),
})

export type SummaryOutput = z.infer<typeof SummaryOutputSchema>
