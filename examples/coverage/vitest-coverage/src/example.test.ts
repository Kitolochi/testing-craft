import { describe, it, expect } from 'vitest'
import { average, letterGrade, inRange, truncate, parseCsv } from './example'

// ---------------------------------------------------------------------------
// average
// ---------------------------------------------------------------------------
describe('average', () => {
  it('returns the average of numbers', () => {
    expect(average([10, 20, 30])).toBe(20)
  })

  it('returns 0 for empty array', () => {
    expect(average([])).toBe(0)
  })

  it('handles single element', () => {
    expect(average([42])).toBe(42)
  })

  it('handles negative numbers', () => {
    expect(average([-10, 10])).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// letterGrade
// ---------------------------------------------------------------------------
describe('letterGrade', () => {
  it.each([
    { score: 95, grade: 'A' },
    { score: 90, grade: 'A' },
    { score: 85, grade: 'B' },
    { score: 80, grade: 'B' },
    { score: 75, grade: 'C' },
    { score: 70, grade: 'C' },
    { score: 65, grade: 'D' },
    { score: 60, grade: 'D' },
    { score: 55, grade: 'F' },
    { score: 0, grade: 'F' },
  ])('score $score -> grade $grade', ({ score, grade }) => {
    expect(letterGrade(score)).toBe(grade)
  })

  it('throws for score below 0', () => {
    expect(() => letterGrade(-1)).toThrow(RangeError)
  })

  it('throws for score above 100', () => {
    expect(() => letterGrade(101)).toThrow(RangeError)
  })

  it('handles boundary at 100', () => {
    expect(letterGrade(100)).toBe('A')
  })
})

// ---------------------------------------------------------------------------
// inRange
// ---------------------------------------------------------------------------
describe('inRange', () => {
  it('returns true when value is within range', () => {
    expect(inRange(5, 1, 10)).toBe(true)
  })

  it('returns true at min boundary', () => {
    expect(inRange(1, 1, 10)).toBe(true)
  })

  it('returns true at max boundary', () => {
    expect(inRange(10, 1, 10)).toBe(true)
  })

  it('returns false below range', () => {
    expect(inRange(0, 1, 10)).toBe(false)
  })

  it('returns false above range', () => {
    expect(inRange(11, 1, 10)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------
describe('truncate', () => {
  it('returns original string when within limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...')
  })

  it('handles maxLength equal to string length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('handles very short maxLength', () => {
    expect(truncate('hello', 2)).toBe('he')
  })

  it('throws for negative maxLength', () => {
    expect(() => truncate('hello', -1)).toThrow(RangeError)
  })
})

// ---------------------------------------------------------------------------
// parseCsv
// ---------------------------------------------------------------------------
describe('parseCsv', () => {
  it('parses comma-separated values', () => {
    expect(parseCsv('a, b, c')).toEqual(['a', 'b', 'c'])
  })

  it('returns empty array for empty string', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(parseCsv('   ')).toEqual([])
  })

  it('filters out empty segments', () => {
    expect(parseCsv('a,,b, ,c')).toEqual(['a', 'b', 'c'])
  })

  it('handles single value', () => {
    expect(parseCsv('only')).toEqual(['only'])
  })
})
