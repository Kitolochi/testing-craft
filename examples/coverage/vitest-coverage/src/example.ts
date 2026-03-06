/**
 * Calculate the average of an array of numbers.
 * Returns 0 for empty arrays.
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

/**
 * Determine a letter grade from a numeric score.
 */
export function letterGrade(score: number): string {
  if (score < 0 || score > 100) {
    throw new RangeError(`Score must be between 0 and 100, got ${score}`)
  }

  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * Check if a value is within a range (inclusive).
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Truncate a string to a max length, appending an ellipsis if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (maxLength < 0) {
    throw new RangeError('maxLength must be non-negative')
  }

  if (text.length <= maxLength) return text
  if (maxLength <= 3) return text.slice(0, maxLength)
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Parse a comma-separated string into an array of trimmed, non-empty values.
 */
export function parseCsv(input: string): string[] {
  if (!input.trim()) return []

  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}
