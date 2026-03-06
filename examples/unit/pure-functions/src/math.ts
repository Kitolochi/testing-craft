/**
 * Clamp a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Convert a string to a URL-safe slug.
 * - Lowercases, trims, replaces spaces/special chars with hyphens.
 * - Collapses consecutive hyphens and strips leading/trailing hyphens.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Format a number as a currency string.
 * Defaults to USD with 2 decimal places.
 */
export function formatCurrency(
  amount: number,
  locale: string = 'en-US',
  currency: string = 'USD',
): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`Invalid amount: ${amount}`)
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}
