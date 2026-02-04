/**
 * Array utility functions for batch processing
 * @module backend/utils/arrayUtils
 */

/**
 * Split array into chunks of specified size
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size (default: 10 for Airtable)
 * @returns {Array<Array>}
 */
export function chunkArray(array, size = 10) {
  if (!array || array.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
