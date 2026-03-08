/**
 * Functions designed to demonstrate mutation testing.
 * Stryker will mutate operators, boundaries, and logic to verify
 * that tests actually catch real bugs (not just run without error).
 */

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function calculateDiscount(price: number, quantity: number): number {
  if (price <= 0) throw new Error("Price must be positive");
  if (quantity <= 0) throw new Error("Quantity must be positive");

  let discount = 0;

  if (quantity >= 100) {
    discount = 0.2; // 20% for bulk orders
  } else if (quantity >= 10) {
    discount = 0.1; // 10% for medium orders
  } else if (quantity >= 5) {
    discount = 0.05; // 5% for small batch
  }

  const subtotal = price * quantity;
  return Math.round((subtotal * (1 - discount)) * 100) / 100;
}

export function isPalindrome(str: string): boolean {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleaned.length <= 1) return true;

  let left = 0;
  let right = cleaned.length - 1;

  while (left < right) {
    if (cleaned[left] !== cleaned[right]) return false;
    left++;
    right--;
  }

  return true;
}

export function fibonacci(n: number): number {
  if (n < 0) throw new Error("n must be non-negative");
  if (n <= 1) return n;

  let prev = 0;
  let curr = 1;
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}
