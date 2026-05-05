import { cn, formatDate, truncate } from '@/lib/utils'

describe('Utils', () => {
  describe('cn - className merger', () => {
    it('should merge class names', () => {
      const result = cn('px-2', 'py-1')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
    })

    it('should handle conditional classes', () => {
      const result = cn('px-2', true && 'py-1', false && 'py-2')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
      expect(result).not.toContain('py-2')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('px-2', 'px-4')
      expect(result).toContain('px-4')
      expect(result).not.toContain('px-2')
    })

    it('should handle empty strings and undefined', () => {
      const result = cn('px-2', '', undefined, 'py-1')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
    })

    it('should handle arrays', () => {
      const result = cn(['px-2', 'py-1'], 'bg-white')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
      expect(result).toContain('bg-white')
    })
  })

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const result = formatDate('2024-05-04')
      expect(result).toBe('May 4, 2024')
    })

    it('should format Date object correctly', () => {
      const date = new Date('2024-05-04T00:00:00Z')
      const result = formatDate(date)
      expect(result).toMatch(/May \d{1,2}, 2024/)
    })

    it('should handle different date formats', () => {
      const result = formatDate('2023-12-25')
      expect(result).toBe('Dec 25, 2023')
    })

    it('should handle single digit months and days', () => {
      const result = formatDate('2024-01-01')
      expect(result).toBe('Jan 1, 2024')
    })

    it('should handle current date', () => {
      const now = new Date()
      const result = formatDate(now)
      expect(result).toMatch(/\w+ \d{1,2}, \d{4}/)
    })
  })

  describe('truncate', () => {
    it('should not truncate string shorter than length', () => {
      const result = truncate('hello', 10)
      expect(result).toBe('hello')
    })

    it('should truncate string longer than length', () => {
      const result = truncate('hello world', 5)
      expect(result).toBe('hello...')
    })

    it('should add ellipsis when truncating', () => {
      const result = truncate('hello world', 5)
      expect(result).toMatch(/\.\.\.$/)
    })

    it('should handle exact length match', () => {
      const result = truncate('hello', 5)
      expect(result).toBe('hello')
    })

    it('should handle empty string', () => {
      const result = truncate('', 10)
      expect(result).toBe('')
    })

    it('should handle length of 0', () => {
      const result = truncate('hello', 0)
      expect(result).toBe('...')
    })

    it('should truncate to specific length', () => {
      const text = 'The quick brown fox jumps over the lazy dog'
      const result = truncate(text, 20)
      expect(result).toBe('The quick brown fox ...')
      expect(result.length).toBe(23) // 20 + 3 for ...
    })

    it('should handle unicode characters', () => {
      const result = truncate('你好世界', 2)
      expect(result).toBe('你好...')
    })
  })
})
