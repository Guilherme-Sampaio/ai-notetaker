import { describe, expect, it } from 'vitest'
import { parseSummaryResponse } from '../../src/ai/summarize.validator.js'

const empty = {
  keyDecisions: [],
  upcomingDeadlines: [],
  followUpTasks: [],
  resourcesMentioned: [],
}

describe('parseSummaryResponse', () => {
  it('returns parsed summary for valid JSON', () => {
    const raw = JSON.stringify({
      keyDecisions: ['a'],
      upcomingDeadlines: ['b'],
      followUpTasks: [],
      resourcesMentioned: [],
    })
    expect(parseSummaryResponse(raw)).toEqual({
      keyDecisions: ['a'],
      upcomingDeadlines: ['b'],
      followUpTasks: [],
      resourcesMentioned: [],
    })
  })

  it('strips markdown code fences', () => {
    const inner = JSON.stringify({
      keyDecisions: [],
      upcomingDeadlines: [],
      followUpTasks: ['task'],
      resourcesMentioned: [],
    })
    const raw = '```json\n' + inner + '\n```'
    expect(parseSummaryResponse(raw)).toEqual({
      keyDecisions: [],
      upcomingDeadlines: [],
      followUpTasks: ['task'],
      resourcesMentioned: [],
    })
  })

  it('returns fallback on invalid JSON', () => {
    expect(parseSummaryResponse('not json')).toEqual(empty)
  })

  it('returns fallback on empty or whitespace', () => {
    expect(parseSummaryResponse('')).toEqual(empty)
    expect(parseSummaryResponse('   ')).toEqual(empty)
  })

  it('returns fallback when Zod validation fails', () => {
    expect(parseSummaryResponse(JSON.stringify({ wrong: true }))).toEqual(empty)
  })
})
