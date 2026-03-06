import { describe, it, expect } from 'vitest'
import { clamp, slugify, formatCurrency } from './math'

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------
describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('returns min when value is below range', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
  })

  it('returns max when value is above range', () => {
    expect(clamp(11, 0, 10)).toBe(10)
  })

  it('handles equal min and max', () => {
    expect(clamp(5, 3, 3)).toBe(3)
  })

  it('returns boundary value when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0)
  })

  it('returns boundary value when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10)
  })

  it.each([
    { value: -100, min: -50, max: 50, expected: -50 },
    { value: 100, min: -50, max: 50, expected: 50 },
    { value: 0, min: -50, max: 50, expected: 0 },
    { value: 0.5, min: 0, max: 1, expected: 0.5 },
    { value: -0.1, min: 0, max: 1, expected: 0 },
  ])('clamp($value, $min, $max) === $expected', ({ value, min, max, expected }) => {
    expect(clamp(value, min, max)).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------
describe('slugify', () => {
  it('converts a simple string to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('handles whitespace-only input', () => {
    expect(slugify('   ')).toBe('')
  })

  it('strips special characters', () => {
    expect(slugify('Hello, World! #2024')).toBe('hello-world-2024')
  })

  it('collapses consecutive hyphens', () => {
    expect(slugify('foo---bar')).toBe('foo-bar')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello')
  })

  it('replaces underscores with hyphens', () => {
    expect(slugify('foo_bar_baz')).toBe('foo-bar-baz')
  })

  it.each([
    ['Already-a-slug', 'already-a-slug'],
    ['  Leading and trailing spaces  ', 'leading-and-trailing-spaces'],
    ['CamelCaseTitle', 'camelcasetitle'],
    ['price: $19.99!', 'price-1999'],
    ['multi   space', 'multi-space'],
  ])('slugify(%j) === %j', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe('formatCurrency', () => {
  it('formats positive USD amount', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative amount', () => {
    expect(formatCurrency(-99.9)).toBe('-$99.90')
  })

  it('formats with EUR locale', () => {
    const result = formatCurrency(1234.56, 'de-DE', 'EUR')
    expect(result).toContain('1.234,56')
    expect(result).toContain('€')
  })

  it('throws RangeError for NaN', () => {
    expect(() => formatCurrency(NaN)).toThrow(RangeError)
    expect(() => formatCurrency(NaN)).toThrow('Invalid amount: NaN')
  })

  it('throws RangeError for Infinity', () => {
    expect(() => formatCurrency(Infinity)).toThrow(RangeError)
  })

  it('throws RangeError for negative Infinity', () => {
    expect(() => formatCurrency(-Infinity)).toThrow(RangeError)
  })

  it.each([
    { amount: 0.1 + 0.2, expected: '$0.30' },
    { amount: 999999.99, expected: '$999,999.99' },
    { amount: 0.001, expected: '$0.00' },
  ])('formatCurrency($amount) === $expected', ({ amount, expected }) => {
    expect(formatCurrency(amount)).toBe(expected)
  })
})
