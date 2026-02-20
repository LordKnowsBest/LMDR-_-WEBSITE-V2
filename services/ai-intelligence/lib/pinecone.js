/**
 * Pinecone client helpers.
 * Uses the Pinecone REST API directly (no SDK) to keep the package footprint small.
 *
 * Indexes:
 *   lmdr-drivers  — driver profile embeddings
 *   lmdr-carriers — carrier profile embeddings
 *
 * Both are serverless, cosine metric, 1024 dims (voyage-3).
 */

const PINECONE_BASE = 'https://api.pinecone.io';

const HOSTS = {
  drivers:  'https://lmdr-drivers-hmmwwf9.svc.aped-4627-b74a.pinecone.io',
  carriers: 'https://lmdr-carriers-hmmwwf9.svc.aped-4627-b74a.pinecone.io',
};

const INDEX_VERSION = 1;

function headers() {
  return {
    'Api-Key': process.env.PINECONE_API_KEY,
    'Content-Type': 'application/json',
  };
}

/**
 * Upsert a single vector into the given index.
 * Idempotent — safe to call on every profile update.
 *
 * @param {'drivers'|'carriers'} index
 * @param {string} id        - Record ID (driverId or carrierId)
 * @param {number[]} vector  - 1024-dim embedding
 * @param {object} metadata  - Filterable metadata stored alongside vector
 */
export async function upsertVector(index, id, vector, metadata = {}) {
  const host = HOSTS[index];
  const res = await fetch(`${host}/vectors/upsert`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      vectors: [{
        id,
        values: vector,
        metadata: { ...metadata, index_version: INDEX_VERSION },
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pinecone upsert failed ${res.status}: ${body}`);
  }

  return await res.json();
}

/**
 * Query the index for the top-K nearest neighbors.
 *
 * @param {'drivers'|'carriers'} index
 * @param {number[]} queryVector
 * @param {number}  topK
 * @param {object}  filter    - Pinecone metadata filter (exact match)
 * @param {boolean} includeMetadata
 * @returns {Promise<Array<{ id, score, metadata }>>}
 */
export async function queryVectors(index, queryVector, topK = 50, filter = {}, includeMetadata = true) {
  const host = HOSTS[index];
  const body = {
    vector: queryVector,
    topK,
    includeMetadata,
  };
  if (Object.keys(filter).length > 0) body.filter = filter;

  const res = await fetch(`${host}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pinecone query failed ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.matches || [];
}

/**
 * Fetch a single vector by ID to check if it exists and its metadata.
 * Returns null if not found.
 */
export async function fetchVector(index, id) {
  const host = HOSTS[index];
  const res = await fetch(`${host}/vectors/fetch?ids=${encodeURIComponent(id)}`, {
    headers: headers(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.vectors?.[id] || null;
}

/**
 * Check Pinecone index health by describing the index stats.
 * Returns 'ok' or 'error'.
 */
export async function checkHealth(index) {
  try {
    const host = HOSTS[index];
    const res = await fetch(`${host}/describe_index_stats`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({}),
    });
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}
