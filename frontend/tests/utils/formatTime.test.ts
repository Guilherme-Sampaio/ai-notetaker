import { describe, it, expect } from 'vitest'
import { formatTime } from '../../src/utils/formatTime'

describe('formatTime', () => {
  describe('basic formatting', () => {
    it('should format 0 seconds as 00:00', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('should format single digit seconds with leading zero', () => {
      expect(formatTime(5)).toBe('00:05')
    })

    it('should format two digit seconds without padding', () => {
      expect(formatTime(59)).toBe('00:59')
    })

    it('should format one minute', () => {
      expect(formatTime(60)).toBe('01:00')
    })

    it('should format multiple minutes', () => {
      expect(formatTime(125)).toBe('02:05')
    })

    it('should format ten minutes', () => {
      expect(formatTime(600)).toBe('10:00')
    })

    it('should format one hour', () => {
      expect(formatTime(3600)).toBe('60:00')
    })

    it('should format time over one hour', () => {
      expect(formatTime(3665)).toBe('61:05')
    })

    it('should format large time values', () => {
      expect(formatTime(86399)).toBe('1439:59')
    })
  })

  describe('edge cases', () => {
    it('should format 1 second', () => {
      expect(formatTime(1)).toBe('00:01')
    })

    it('should format 59 seconds', () => {
      expect(formatTime(59)).toBe('00:59')
    })

    it('should format 61 seconds', () => {
      expect(formatTime(61)).toBe('01:01')
    })

    it('should pad both minutes and seconds', () => {
      expect(formatTime(125)).toBe('02:05')
    })

    it('should handle 99:59', () => {
      expect(formatTime(5999)).toBe('99:59')
    })
  })

  describe('common use cases', () => {
    it('should format typical recording duration of 3 minutes 30 seconds', () => {
      expect(formatTime(210)).toBe('03:30')
    })

    it('should format typical recording duration of 1 minute 45 seconds', () => {
      expect(formatTime(105)).toBe('01:45')
    })

    it('should format typical recording duration of 30 seconds', () => {
      expect(formatTime(30)).toBe('00:30')
    })

    it('should format typical recording duration of 15 minutes', () => {
      expect(formatTime(900)).toBe('15:00')
    })

    it('should format typical recording duration of 45 minutes', () => {
      expect(formatTime(2700)).toBe('45:00')
    })

    it('should format typical recording duration of 1 hour 5 minutes', () => {
      expect(formatTime(3900)).toBe('65:00')
    })
  })

  describe('mathematical correctness', () => {
    it('should correctly divide seconds into minutes and seconds', () => {
      const seconds = 3661 // 1 hour, 1 minute, 1 second
      const result = formatTime(seconds)
      expect(result).toBe('61:01')
    })

    it('should handle remainder correctly', () => {
      const seconds = 127 // 2 minutes, 7 seconds
      const result = formatTime(seconds)
      expect(result).toBe('02:07')
    })

    it('should round down fractional minutes', () => {
      const seconds = 89 // 1 minute, 29 seconds
      const result = formatTime(seconds)
      expect(result).toBe('01:29')
    })
  })

  describe('string formatting', () => {
    it('should always return a string in format MM:SS', () => {
      const result = formatTime(42)
      expect(typeof result).toBe('string')
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should always pad minutes to at least 2 digits', () => {
      const result = formatTime(1)
      const parts = result.split(':')
      expect(parts[0].length).toBe(2)
    })

    it('should always pad seconds to exactly 2 digits', () => {
      const result = formatTime(5)
      const parts = result.split(':')
      expect(parts[1].length).toBe(2)
    })

    it('should include colon separator', () => {
      const result = formatTime(100)
      expect(result).toContain(':')
    })

    it('should have exactly one colon', () => {
      const result = formatTime(3661)
      const colonCount = (result.match(/:/g) || []).length
      expect(colonCount).toBe(1)
    })
  })

  describe('tabular numbers property', () => {
    it('should be suitable for monospace display', () => {
      // This is more of a documentation test - formatTime is used with
      // className="text-4xl font-mono font-bold tabular-nums"
      // which means each character has equal width for alignment
      const times = [
        formatTime(0),
        formatTime(30),
        formatTime(300),
        formatTime(3600),
      ]

      // All should be same length format MM:SS or longer
      expect(times[0]).toBe('00:00')
      expect(times[1]).toBe('00:30')
      expect(times[2]).toBe('05:00')
      expect(times[3]).toBe('60:00')

      // Can verify they align in monospace
      const allSame = times.every(t => t.match(/^\d+:\d{2}$/))
      expect(allSame).toBe(true)
    })
  })
})
