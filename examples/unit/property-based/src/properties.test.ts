import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { base64Encode, base64Decode, hexEncode, hexDecode, urlEncode, urlDecode } from "./codec.js";
import { mergeSort, quickSort } from "./sort.js";

describe("Property-based: Codec roundtrips", () => {
  it("base64 roundtrip: decode(encode(x)) === x", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        expect(base64Decode(base64Encode(str))).toBe(str);
      })
    );
  });

  it("hex roundtrip: decode(encode(x)) === x", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        expect(hexDecode(hexEncode(str))).toBe(str);
      })
    );
  });

  it("url roundtrip: decode(encode(x)) === x", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        expect(urlDecode(urlEncode(str))).toBe(str);
      })
    );
  });

  it("base64 encoding is deterministic", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        expect(base64Encode(str)).toBe(base64Encode(str));
      })
    );
  });
});

describe("Property-based: Sort invariants", () => {
  const sortFunctions = [
    { name: "mergeSort", fn: mergeSort },
    { name: "quickSort", fn: quickSort },
  ];

  for (const { name, fn } of sortFunctions) {
    describe(name, () => {
      it("preserves length", () => {
        fc.assert(
          fc.property(fc.array(fc.integer()), (arr) => {
            expect(fn(arr)).toHaveLength(arr.length);
          })
        );
      });

      it("output is sorted", () => {
        fc.assert(
          fc.property(fc.array(fc.integer()), (arr) => {
            const sorted = fn(arr);
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
            }
          })
        );
      });

      it("output is a permutation of input", () => {
        fc.assert(
          fc.property(fc.array(fc.integer()), (arr) => {
            const sorted = fn(arr);
            const inputCounts = countElements(arr);
            const outputCounts = countElements(sorted);
            expect(outputCounts).toEqual(inputCounts);
          })
        );
      });

      it("idempotent: sorting twice gives same result", () => {
        fc.assert(
          fc.property(fc.array(fc.integer()), (arr) => {
            expect(fn(fn(arr))).toEqual(fn(arr));
          })
        );
      });

      it("agrees with Array.sort on all inputs", () => {
        fc.assert(
          fc.property(fc.array(fc.integer()), (arr) => {
            const expected = [...arr].sort((a, b) => a - b);
            expect(fn(arr)).toEqual(expected);
          })
        );
      });
    });
  }
});

describe("Property-based: Shrinking demo", () => {
  it("demonstrates shrinking on failure (intentional)", () => {
    // This test is designed to fail — showing how fast-check
    // shrinks the input to the minimal counterexample.
    // Uncomment to see shrinking in action:
    //
    // fc.assert(
    //   fc.property(fc.array(fc.integer({ min: 1, max: 100 })), (arr) => {
    //     // "All arrays have sum < 50" — obviously false
    //     const sum = arr.reduce((a, b) => a + b, 0);
    //     return sum < 50;
    //   })
    // );
    //
    // fast-check will shrink to minimal failing case: e.g., [50]
    expect(true).toBe(true); // Placeholder so test passes
  });
});

function countElements(arr: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const x of arr) {
    counts.set(x, (counts.get(x) ?? 0) + 1);
  }
  return counts;
}
