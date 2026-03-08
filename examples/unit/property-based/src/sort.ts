/**
 * Sort implementations to test with properties like:
 * - Output length equals input length
 * - Output is ordered
 * - Output is a permutation of input
 */

export function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return [...arr];

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let l = 0;
  let r = 0;

  while (l < left.length && r < right.length) {
    if (left[l] <= right[r]) {
      result.push(left[l++]);
    } else {
      result.push(right[r++]);
    }
  }

  return [...result, ...left.slice(l), ...right.slice(r)];
}

export function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return [...arr];

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => x < pivot);
  const middle = arr.filter((x) => x === pivot);
  const right = arr.filter((x) => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}
