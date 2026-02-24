/**
 * RAG Retrieval Pipeline
 *
 * Core retrieval logic: embed query → query Pinecone namespaces → rank → assemble context.
 * Reuses existing lib/embeddings.js (Voyage AI) and lib/pinecone.js (REST client).
 *
 * Combined score: 0.8 * cosineScore + 0.2 * freshnessScore
 * Threshold: combinedScore >= 0.65
 */

import { embed } from './embeddings.js';
import { PINECONE_HOSTS, NAMESPACES, hasNamespaceAccess, calculateFreshnessScore } from './knowledgeCorpus.js';
import { assembleContextBudget } from './contextBudget.js';

const COSINE_WEIGHT    = 0.8;
const FRESHNESS_WEIGHT = 0.2;
const SCORE_THRESHOLD  = 0.65;
const DEFAULT_TOP_K    = 5;
const MAX_TOP_K        = 20;

/**
 * Headers for Pinecone REST API.
 */
function pineconeHeaders() {
  return {
    'Api-Key': process.env.PINECONE_API_KEY,
    'Content-Type': 'application/json',
  };
}

/**
 * Query a single Pinecone namespace.
 *
 * @param {string} indexKey - 'knowledge' or 'memory'
 * @param {string} namespace
 * @param {number[]} queryVector
 * @param {number} topK
 * @param {object} filters - Pinecone metadata filters
 * @returns {Promise<Array<{ id, score, metadata }>>}
 */
async function queryNamespace(indexKey, namespace, queryVector, topK, filters = {}) {
  const host = PINECONE_HOSTS[indexKey];
  if (!host) {
    console.warn(`[retrieval] No Pinecone host configured for index: ${indexKey}`);
    return [];
  }

  const body = {
    vector: queryVector,
    topK,
    namespace,
    includeMetadata: true,
  };
  if (Object.keys(filters).length > 0) body.filter = filters;

  const res = await fetch(`${host}/query`, {
    method: 'POST',
    headers: pineconeHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error(`[retrieval] Pinecone query failed for ${namespace}: ${res.status} ${errBody}`);
    return [];
  }

  const data = await res.json();
  return (data.matches || []).map(m => ({
    id: m.id,
    cosineScore: m.score || 0,
    metadata: m.metadata || {},
    namespace,
  }));
}

/**
 * Full retrieval pipeline: embed → query → rank → assemble.
 *
 * @param {object} ragConfig
 * @param {string[]} ragConfig.namespaces
 * @param {string}   ragConfig.roleScope
 * @param {number}  [ragConfig.topK=5]
 * @param {object}  [ragConfig.filters={}] - Per-namespace filters: { namespace: { field: value } }
 * @param {number}  [ragConfig.contextBudgetTokens=2000]
 * @param {string}  [ragConfig.userId] - Required for conversation_memory
 * @param {string}   queryText - The user's message
 * @returns {Promise<{
 *   contextBlock: string,
 *   chunks: Array,
 *   totalChunksConsidered: number,
 *   chunksPassedThreshold: number,
 *   totalTokensAssembled: number,
 *   retrievalLatencyMs: number,
 *   noContextReason?: string
 * }>}
 */
export async function retrieveContext(ragConfig, queryText) {
  const startTime = Date.now();

  const {
    namespaces = [],
    roleScope,
    topK = DEFAULT_TOP_K,
    filters = {},
    contextBudgetTokens = 2000,
    userId,
  } = ragConfig;

  // Clamp topK
  const clampedTopK = Math.min(Math.max(1, topK), MAX_TOP_K);

  // Validate namespaces access
  const accessibleNamespaces = namespaces.filter(ns => {
    if (!hasNamespaceAccess(roleScope, ns)) {
      console.warn(`[retrieval] Role ${roleScope} denied access to namespace ${ns}`);
      return false;
    }
    // conversation_memory requires userId
    if (ns === 'conversation_memory' && !userId) {
      console.warn('[retrieval] conversation_memory requires userId — skipping');
      return false;
    }
    return true;
  });

  if (accessibleNamespaces.length === 0) {
    return {
      contextBlock: '',
      chunks: [],
      totalChunksConsidered: 0,
      chunksPassedThreshold: 0,
      totalTokensAssembled: 0,
      retrievalLatencyMs: Date.now() - startTime,
      noContextReason: 'no_accessible_namespaces',
    };
  }

  // Embed the query
  let queryVector;
  try {
    queryVector = await embed(queryText);
  } catch (err) {
    console.error('[retrieval] Embedding failed:', err.message);
    return {
      contextBlock: '',
      chunks: [],
      totalChunksConsidered: 0,
      chunksPassedThreshold: 0,
      totalTokensAssembled: 0,
      retrievalLatencyMs: Date.now() - startTime,
      noContextReason: 'embedding_failed',
    };
  }

  // Query all namespaces in parallel
  const queryPromises = accessibleNamespaces.map(ns => {
    const nsDef = NAMESPACES[ns];
    const indexKey = nsDef?.index || 'knowledge';

    // Build namespace-specific filters
    let nsFilters = filters[ns] || {};
    if (ns === 'conversation_memory' && userId) {
      nsFilters = { ...nsFilters, user_id: userId };
    }

    return queryNamespace(indexKey, ns, queryVector, clampedTopK, nsFilters);
  });

  const results = await Promise.all(queryPromises);
  const allMatches = results.flat();

  // Score and rank
  const scored = allMatches.map(match => {
    const nsDef = NAMESPACES[match.namespace];
    const freshnessScore = calculateFreshnessScore(
      match.metadata?.ingested_at || match.metadata?.enriched_at || match.metadata?.generated_at,
      nsDef?.ttlHours || 168
    );

    return {
      documentId: match.id,
      namespace: match.namespace,
      text: match.metadata?.text || '',
      cosineScore: match.cosineScore,
      freshnessScore,
      combinedScore: (COSINE_WEIGHT * match.cosineScore) + (FRESHNESS_WEIGHT * freshnessScore),
      metadata: match.metadata || {},
    };
  });

  // Sort by combined score descending
  scored.sort((a, b) => b.combinedScore - a.combinedScore);

  // Filter by threshold
  const passed = scored.filter(c => c.combinedScore >= SCORE_THRESHOLD);

  if (passed.length === 0) {
    return {
      contextBlock: '',
      chunks: [],
      totalChunksConsidered: allMatches.length,
      chunksPassedThreshold: 0,
      totalTokensAssembled: 0,
      retrievalLatencyMs: Date.now() - startTime,
      noContextReason: 'no_chunks_above_threshold',
    };
  }

  // Assemble within budget
  const { contextBlock, includedChunks, totalTokens } = assembleContextBudget(passed, contextBudgetTokens);

  return {
    contextBlock,
    chunks: includedChunks.map(c => ({
      documentId: c.documentId,
      namespace: c.namespace,
      text: c.text,
      cosineScore: c.cosineScore,
      freshnessScore: c.freshnessScore,
      combinedScore: c.combinedScore,
      metadata: c.metadata,
    })),
    totalChunksConsidered: allMatches.length,
    chunksPassedThreshold: passed.length,
    totalTokensAssembled: totalTokens,
    retrievalLatencyMs: Date.now() - startTime,
  };
}

/**
 * Upsert a document vector into a knowledge namespace.
 *
 * @param {string} namespace
 * @param {string} documentId
 * @param {string} text
 * @param {object} metadata
 * @returns {Promise<{ status: 'ingested' | 'error', error?: string }>}
 */
export async function ingestDocument(namespace, documentId, text, metadata) {
  const nsDef = NAMESPACES[namespace];
  if (!nsDef) {
    return { status: 'error', error: `Unknown namespace: ${namespace}` };
  }

  const host = PINECONE_HOSTS[nsDef.index];
  if (!host) {
    return { status: 'error', error: `No Pinecone host for index: ${nsDef.index}` };
  }

  // Embed the text
  let vector;
  try {
    vector = await embed(text);
  } catch (err) {
    return { status: 'error', error: `Embedding failed: ${err.message}` };
  }

  // Store the text in metadata for retrieval
  const fullMetadata = {
    ...metadata,
    text,
    ingested_at: new Date().toISOString(),
    namespace,
  };

  // Upsert to Pinecone
  try {
    const res = await fetch(`${host}/vectors/upsert`, {
      method: 'POST',
      headers: pineconeHeaders(),
      body: JSON.stringify({
        vectors: [{
          id: documentId,
          values: vector,
          metadata: fullMetadata,
        }],
        namespace,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return { status: 'error', error: `Pinecone upsert failed ${res.status}: ${errBody}` };
    }

    return { status: 'ingested' };
  } catch (err) {
    return { status: 'error', error: `Pinecone upsert error: ${err.message}` };
  }
}
