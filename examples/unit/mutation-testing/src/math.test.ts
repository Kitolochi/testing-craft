import { describe, it, expect } from "vitest";
import { clamp, calculateDiscount, isPalindrome, fibonacci } from "./math.js";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when value is below", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns max when value is above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles boundary values", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("calculateDiscount", () => {
  it("throws for non-positive price", () => {
    expect(() => calculateDiscount(0, 1)).toThrow("Price must be positive");
    expect(() => calculateDiscount(-10, 1)).toThrow("Price must be positive");
  });

  it("throws for non-positive quantity", () => {
    expect(() => calculateDiscount(10, 0)).toThrow("Quantity must be positive");
  });

  it("applies no discount for small orders", () => {
    expect(calculateDiscount(10, 4)).toBe(40);
  });

  it("applies 5% discount for 5+ items", () => {
    expect(calculateDiscount(10, 5)).toBe(47.5);
  });

  it("applies 10% discount for 10+ items", () => {
    expect(calculateDiscount(10, 10)).toBe(90);
  });

  it("applies 20% discount for 100+ items", () => {
    expect(calculateDiscount(10, 100)).toBe(800);
  });

  // These boundary tests catch mutations that change >= to >
  it("correctly handles boundary at quantity=5", () => {
    expect(calculateDiscount(100, 4)).toBe(400);    // No discount
    expect(calculateDiscount(100, 5)).toBe(475);    // 5% discount
  });

  it("correctly handles boundary at quantity=10", () => {
    expect(calculateDiscount(100, 9)).toBe(855);    // 5% discount
    expect(calculateDiscount(100, 10)).toBe(900);   // 10% discount
  });
});

describe("isPalindrome", () => {
  it("detects palindromes", () => {
    expect(isPalindrome("racecar")).toBe(true);
    expect(isPalindrome("A man a plan a canal Panama")).toBe(true);
  });

  it("detects non-palindromes", () => {
    expect(isPalindrome("hello")).toBe(false);
    expect(isPalindrome("ab")).toBe(false);
  });

  it("handles edge cases", () => {
    expect(isPalindrome("")).toBe(true);
    expect(isPalindrome("a")).toBe(true);
  });
});

describe("fibonacci", () => {
  it("throws for negative numbers", () => {
    expect(() => fibonacci(-1)).toThrow("n must be non-negative");
  });

  it("returns base cases", () => {
    expect(fibonacci(0)).toBe(0);
    expect(fibonacci(1)).toBe(1);
  });

  it("computes correct values", () => {
    expect(fibonacci(2)).toBe(1);
    expect(fibonacci(5)).toBe(5);
    expect(fibonacci(10)).toBe(55);
  });
});
