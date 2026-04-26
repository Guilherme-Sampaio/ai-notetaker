import { describe, it, expect } from 'vitest'
import { getRecorderStatus } from '../../src/utils/recorderStatus'
import type { PipelineState } from '../../src/types/pipeline.types'

describe('getRecorderStatus', () => {
  describe('status labels', () => {
    it('should return "Ready to record" for idle state', () => {
      const state: PipelineState = { status: 'idle' }
      const { statusLabel } = getRecorderStatus(state)
      expect(statusLabel).toBe('Ready to record')
    })

    it('should return "Recording…" for recording state', () => {
      const state: PipelineState = { status: 'recording' }
      const { statusLabel } = getRecorderStatus(state)
      expect(statusLabel).toBe('Recording…')
    })

    it('should return "Paused" for paused state', () => {
      const state: PipelineState = { status: 'paused' }
      const { statusLabel } = getRecorderStatus(state)
      expect(statusLabel).toBe('Paused')
    })

    it('should return review state duration not included in label', () => {
      const state: PipelineState = {
        status: 'review',
        blob: new Blob(),
        durationSeconds: 60,
      }
      const { statusLabel } = getRecorderStatus(state)
      // review is not recorded, so it should return empty string or something else
      expect(statusLabel).toBe('')
    })

    it('should return empty string for processing state', () => {
      const state: PipelineState = { status: 'processing' }
      const { statusLabel } = getRecorderStatus(state)
      expect(statusLabel).toBe('')
    })

    it('should return error message for error state', () => {
      const errorMessage = 'Microphone access denied'
      const state: PipelineState = {
        status: 'error',
        stage: 'recording',
        message: errorMessage,
      }
      const { statusLabel } = getRecorderStatus(state)
      expect(statusLabel).toBe(errorMessage)
    })

    it('should return empty string for done state', () => {
      const state: PipelineState = {
        status: 'done',
        transcript: 'Test transcript',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }
      const { statusLabel } = getRecorderStatus(state)
      expect(statusLabel).toBe('')
    })
  })

  describe('mic colors', () => {
    it('should return red color while recording', () => {
      const state: PipelineState = { status: 'recording' }
      const { micColor } = getRecorderStatus(state)
      expect(micColor).toContain('bg-red-500')
      expect(micColor).toContain('text-white')
      expect(micColor).toContain('shadow-red-200')
    })

    it('should return amber color while paused', () => {
      const state: PipelineState = { status: 'paused' }
      const { micColor } = getRecorderStatus(state)
      expect(micColor).toContain('bg-amber-400')
      expect(micColor).toContain('text-white')
      expect(micColor).toContain('shadow-amber-200')
    })

    it('should return primary color when idle', () => {
      const state: PipelineState = { status: 'idle' }
      const { micColor } = getRecorderStatus(state)
      expect(micColor).toContain('bg-primary')
      expect(micColor).toContain('text-primary-foreground')
      expect(micColor).toContain('shadow-primary')
    })

    it('should return destructive color on error', () => {
      const state: PipelineState = {
        status: 'error',
        stage: 'recording',
        message: 'Something went wrong',
      }
      const { micColor } = getRecorderStatus(state)
      expect(micColor).toContain('bg-destructive')
      expect(micColor).toContain('text-destructive-foreground')
      expect(micColor).toContain('shadow-destructive')
    })

    it('should return primary color for review state', () => {
      const state: PipelineState = {
        status: 'review',
        blob: new Blob(),
        durationSeconds: 60,
      }
      const { micColor } = getRecorderStatus(state)
      expect(micColor).toContain('bg-primary')
      expect(micColor).toContain('text-primary-foreground')
    })

    it('should return primary color for processing state', () => {
      const state: PipelineState = { status: 'processing' }
      const { micColor } = getRecorderStatus(state)
      expect(micColor).toContain('bg-primary')
      expect(micColor).toContain('text-primary-foreground')
    })

    it('should return primary color for done state', () => {
      const state: PipelineState = {
        status: 'done',
        transcript: 'Test transcript',
        summary: {
          keyDecisions: [],
          upcomingDeadlines: [],
          followUpTasks: [],
          resourcesMentioned: [],
        },
      }
      const { micColor } = getRecorderStatus(state)
      expect(micColor).toContain('bg-primary')
      expect(micColor).toContain('text-primary-foreground')
    })
  })

  describe('return type', () => {
    it('should return object with statusLabel and micColor properties', () => {
      const state: PipelineState = { status: 'idle' }
      const result = getRecorderStatus(state)
      expect(result).toHaveProperty('statusLabel')
      expect(result).toHaveProperty('micColor')
      expect(typeof result.statusLabel).toBe('string')
      expect(typeof result.micColor).toBe('string')
    })

    it('should return non-empty micColor string', () => {
      const state: PipelineState = { status: 'recording' }
      const { micColor } = getRecorderStatus(state)
      expect(micColor.length).toBeGreaterThan(0)
    })
  })

  describe('tailwind class structure', () => {
    it('should include multiple tailwind classes separated by spaces', () => {
      const state: PipelineState = { status: 'recording' }
      const { micColor } = getRecorderStatus(state)
      const classes = micColor.split(' ')
      expect(classes.length).toBeGreaterThan(1)
    })

    it('should always include bg- class for color', () => {
      const states: PipelineState[] = [
        { status: 'idle' },
        { status: 'recording' },
        { status: 'paused' },
      ]

      states.forEach(state => {
        const { micColor } = getRecorderStatus(state)
        expect(micColor).toMatch(/bg-\w+/)
      })
    })

    it('should always include text- class for text color', () => {
      const states: PipelineState[] = [
        { status: 'idle' },
        { status: 'recording' },
        { status: 'paused' },
      ]

      states.forEach(state => {
        const { micColor } = getRecorderStatus(state)
        expect(micColor).toMatch(/text-\w+/)
      })
    })

    it('should always include shadow- class', () => {
      const states: PipelineState[] = [
        { status: 'idle' },
        { status: 'recording' },
        { status: 'paused' },
      ]

      states.forEach(state => {
        const { micColor } = getRecorderStatus(state)
        expect(micColor).toMatch(/shadow-\w+/)
      })
    })
  })

  describe('state discrimination', () => {
    it('should handle all PipelineState variants', () => {
      const variants: PipelineState[] = [
        { status: 'idle' },
        { status: 'recording' },
        { status: 'paused' },
        { status: 'review', blob: new Blob(), durationSeconds: 10 },
        { status: 'processing' },
        {
          status: 'done',
          transcript: 'test',
          summary: {
            keyDecisions: [],
            upcomingDeadlines: [],
            followUpTasks: [],
            resourcesMentioned: [],
          },
        },
        { status: 'error', stage: 'recording', message: 'error' },
      ]

      variants.forEach(state => {
        const result = getRecorderStatus(state)
        expect(result).toHaveProperty('statusLabel')
        expect(result).toHaveProperty('micColor')
        expect(result.statusLabel).toBeDefined()
        expect(result.micColor).toBeDefined()
      })
    })
  })

  describe('error state variations', () => {
    it('should show different error messages based on state', () => {
      const errorMessages = [
        'Microphone access denied',
        'Could not resume recording',
        'No audio was recorded',
        'Network error occurred',
      ]

      errorMessages.forEach(message => {
        const state: PipelineState = {
          status: 'error',
          stage: 'recording',
          message,
        }
        const { statusLabel } = getRecorderStatus(state)
        expect(statusLabel).toBe(message)
      })
    })

    it('should use destructive color for all errors', () => {
      const errorStates: PipelineState[] = [
        {
          status: 'error',
          stage: 'recording',
          message: 'Microphone access denied',
        },
        { status: 'error', stage: 'processing', message: 'Network error' },
      ]

      errorStates.forEach(state => {
        const { micColor } = getRecorderStatus(state)
        expect(micColor).toContain('bg-destructive')
      })
    })
  })

  describe('visual feedback alignment', () => {
    it('should provide consistent color and label for recording state', () => {
      const state: PipelineState = { status: 'recording' }
      const { statusLabel, micColor } = getRecorderStatus(state)
      expect(statusLabel).toBe('Recording…')
      expect(micColor).toContain('bg-red-500') // Recording = red, active state
    })

    it('should provide consistent color and label for paused state', () => {
      const state: PipelineState = { status: 'paused' }
      const { statusLabel, micColor } = getRecorderStatus(state)
      expect(statusLabel).toBe('Paused')
      expect(micColor).toContain('bg-amber-400') // Paused = amber, attention needed
    })

    it('should provide consistent color and label for idle state', () => {
      const state: PipelineState = { status: 'idle' }
      const { statusLabel, micColor } = getRecorderStatus(state)
      expect(statusLabel).toBe('Ready to record')
      expect(micColor).toContain('bg-primary') // Idle = primary, ready
    })
  })
})
