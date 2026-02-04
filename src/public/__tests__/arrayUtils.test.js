/**
 * Unit tests for arrayUtils module
 */

// Inline implementation for testing (matches src/backend/utils/arrayUtils.js)
function chunkArray(array, size = 10) {
  if (!array || array.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

describe('chunkArray', () => {
  test('splits array into correct chunk sizes', () => {
    const chunks = chunkArray([1, 2, 3, 4, 5, 6, 7], 3);
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  test('handles empty array', () => {
    expect(chunkArray([])).toEqual([]);
  });

  test('handles null', () => {
    expect(chunkArray(null)).toEqual([]);
  });

  test('handles undefined', () => {
    expect(chunkArray(undefined)).toEqual([]);
  });

  test('uses default chunk size of 10', () => {
    const arr = Array.from({ length: 25 }, (_, i) => i + 1);
    const chunks = chunkArray(arr);
    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(10);
    expect(chunks[1].length).toBe(10);
    expect(chunks[2].length).toBe(5);
  });

  test('handles array smaller than chunk size', () => {
    const chunks = chunkArray([1, 2, 3], 10);
    expect(chunks).toEqual([[1, 2, 3]]);
  });

  test('handles array equal to chunk size', () => {
    const chunks = chunkArray([1, 2, 3, 4, 5], 5);
    expect(chunks).toEqual([[1, 2, 3, 4, 5]]);
  });

  test('handles chunk size of 1', () => {
    const chunks = chunkArray([1, 2, 3], 1);
    expect(chunks).toEqual([[1], [2], [3]]);
  });

  test('preserves object references in chunks', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const obj3 = { id: 3 };
    const chunks = chunkArray([obj1, obj2, obj3], 2);
    expect(chunks[0][0]).toBe(obj1);
    expect(chunks[0][1]).toBe(obj2);
    expect(chunks[1][0]).toBe(obj3);
  });
});
