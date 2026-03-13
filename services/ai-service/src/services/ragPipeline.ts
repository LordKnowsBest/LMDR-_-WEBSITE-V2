import crypto from 'crypto';
import { query, getTableName, buildInsertQuery } from '@lmdr/db';

const EMBEDDINGS_TABLE = getTableName('ragEmbeddings');

// ---------------------------------------------------------------------------
// Namespace Configuration (ported from Railway knowledgeCorpus.js)
// ---------------------------------------------------------------------------

export const NAMESPACES: Record<string, {
  accessRoles: string[];
  ttlHours: number;
}> = {
  carrier_intel:       { accessRoles: ['driver', 'recruiter', 'admin', 'carrier'], ttlHours: 168 },
  driver_market:       { accessRoles: ['driver', 'recruiter', 'admin', 'carrier'], ttlHours: 24 },
  platform_ops:        { accessRoles: ['driver', 'recruiter', 'admin', 'carrier'], ttlHours: 720 },
  industry_regs:       { accessRoles: ['driver', 'recruiter'], ttlHours: 2160 },
  lane_market:         { accessRoles: ['driver', 'recruiter', 'admin', 'carrier'], ttlHours: 6 },
  conversation_memory: { accessRoles: ['driver', 'recruiter', 'carrier'], ttlHours: 2160 },
};

export const ROLE_DEFAULT_NAMESPACES: Record<string, string[]> = {
  driver:    ['carrier_intel', 'driver_market', 'platform_ops', 'industry_regs', 'lane_market'],
  recruiter: ['driver_market', 'carrier_intel', 'lane_market', 'platform_ops', 'industry_regs'],
  admin:     ['platform_ops', 'carrier_intel', 'driver_market', 'lane_market'],
  carrier:   ['driver_market', 'carrier_intel', 'lane_market', 'platform_ops'],
};

// ---------------------------------------------------------------------------
// PII Scrubbing
// ---------------------------------------------------------------------------

const PII_PATTERNS = [
  { pattern: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, replacement: '[SSN]' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  { pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[PHONE]' },
];

function scrubPII(text: string): string {
  let cleaned = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Embedding generation — Gemini Embedding 2 via Vertex AI (ADC, no API key)
// ---------------------------------------------------------------------------

const EMBEDDING_MODEL = 'gemini-embedding-001';

async function getAccessToken(): Promise<string> {
  const res = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } },
  );
  if (!res.ok) throw new Error(`Failed to get access token: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function embedWithGemini(text: string, taskType: string): Promise<number[]> {
  const project = process.env.GCP_PROJECT || 'ldmr-velocitymatch';
  const location = process.env.GCP_REGION || 'us-central1';
  const accessToken = await getAccessToken();

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      instances: [{ content: text, taskType }],
      parameters: { outputDimensionality: 768 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Embedding error ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    predictions: Array<{ embeddings: { values: number[] } }>;
  };

  return data.predictions[0].embeddings.values;
}

export async function createEmbedding(text: string): Promise<number[]> {
  return embedWithGemini(text, 'RETRIEVAL_DOCUMENT');
}

export async function createQueryEmbedding(text: string): Promise<number[]> {
  return embedWithGemini(text, 'RETRIEVAL_QUERY');
}

// ---------------------------------------------------------------------------
// Document Ingestion — namespace-aware, PII-scrubbed, upsert by documentId
// ---------------------------------------------------------------------------

export async function ingestDocument(
  namespace: string,
  documentId: string,
  text: string,
  metadata: Record<string, unknown> = {},
  sourceUpdatedAt?: string,
): Promise<{ status: string; error?: string }> {
  // Validate namespace
  if (!NAMESPACES[namespace]) {
    return { status: 'error', error: `Invalid namespace: ${namespace}` };
  }

  // Validate text
  const cleaned = scrubPII(text.trim());
  if (!cleaned || cleaned.length === 0) {
    return { status: 'error', error: 'Text is empty after scrubbing' };
  }
  if (cleaned.length > 8000) {
    return { status: 'error', error: `Text exceeds 8000 char limit (got ${cleaned.length})` };
  }

  try {
    // Check for existing document (upsert)
    const existing = await query(
      `SELECT _id FROM "${EMBEDDINGS_TABLE}" WHERE data->>'documentId' = $1 AND data->>'namespace' = $2 LIMIT 1`,
      [documentId, namespace],
    );

    const embedding = await createEmbedding(cleaned);
    const now = new Date().toISOString();
    const docData = {
      documentId,
      namespace,
      content: cleaned,
      embedding: JSON.stringify(embedding),
      metadata,
      sourceUpdatedAt: sourceUpdatedAt || now,
      indexedAt: now,
    };

    if (existing.rows.length > 0) {
      // Update existing
      await query(
        `UPDATE "${EMBEDDINGS_TABLE}" SET data = $2::jsonb WHERE _id = $1`,
        [existing.rows[0]._id, JSON.stringify(docData)],
      );
    } else {
      // Insert new
      const _id = crypto.randomUUID();
      const { sql, params } = buildInsertQuery(EMBEDDINGS_TABLE, { _id, data: docData });
      await query(sql, params);
    }

    return { status: 'ingested' };
  } catch (err) {
    return { status: 'error', error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Legacy indexDocument (simple — used by /ai/rag/index route)
// ---------------------------------------------------------------------------

export async function indexDocument(
  docId: string,
  content: string,
): Promise<{ docId: string; indexed: boolean; chunks: number }> {
  const chunks = splitIntoChunks(content, 1000);
  let indexed = 0;

  for (const chunk of chunks) {
    const result = await ingestDocument('platform_ops', `${docId}_chunk_${indexed}`, chunk, { docId });
    if (result.status === 'ingested') indexed++;
  }

  return { docId, indexed: indexed > 0, chunks: indexed };
}

// ---------------------------------------------------------------------------
// Retrieval — namespace-filtered, role-scoped, cosine + freshness scoring
// ---------------------------------------------------------------------------

export interface RetrievalResult {
  chunks: Array<{
    documentId: string;
    namespace: string;
    score: number;
    freshnessScore: number;
    combinedScore: number;
    snippet: string;
    metadata: Record<string, unknown>;
  }>;
  context: string;
  namespacesSearched: string[];
}

export async function retrieveContext(
  queryText: string,
  options: {
    namespaces?: string[];
    roleScope?: string;
    topK?: number;
    userId?: string;
  } = {},
): Promise<RetrievalResult> {
  const role = options.roleScope || 'driver';
  const requestedNs = options.namespaces || ROLE_DEFAULT_NAMESPACES[role] || [];
  const topK = Math.min(options.topK || 5, 20);

  // Filter to accessible namespaces
  const namespaces = requestedNs.filter((ns) => {
    const def = NAMESPACES[ns];
    return def && def.accessRoles.includes(role);
  });

  if (namespaces.length === 0) {
    return { chunks: [], context: '', namespacesSearched: [] };
  }

  const queryEmbedding = await createQueryEmbedding(queryText);

  // Build namespace filter for SQL
  const nsPlaceholders = namespaces.map((_, i) => `$${i + 1}`).join(', ');
  const sqlQuery = `SELECT _id, data FROM "${EMBEDDINGS_TABLE}"
     WHERE data->>'namespace' IN (${nsPlaceholders})
     ORDER BY _created_at DESC LIMIT 2000`;

  const result = await query(sqlQuery, namespaces);

  if (result.rows.length === 0) {
    return { chunks: [], context: '', namespacesSearched: namespaces };
  }

  const now = Date.now();
  const COSINE_WEIGHT = 0.8;
  const FRESHNESS_WEIGHT = 0.2;
  const SCORE_THRESHOLD = 0.5;

  const scored = result.rows
    .map((row) => {
      const rowData = row.data as Record<string, unknown>;
      const storedEmbedding = JSON.parse(rowData.embedding as string) as number[];
      const cosineScore = cosineSimilarity(queryEmbedding, storedEmbedding);

      // Freshness score
      const ns = rowData.namespace as string;
      const ttlHours = NAMESPACES[ns]?.ttlHours || 168;
      const indexedAt = rowData.indexedAt as string;
      const hoursSince = indexedAt ? (now - new Date(indexedAt).getTime()) / (1000 * 60 * 60) : ttlHours;
      const freshnessScore = Math.max(0, Math.min(1, 1 - hoursSince / ttlHours));

      const combinedScore = COSINE_WEIGHT * cosineScore + FRESHNESS_WEIGHT * freshnessScore;

      // For conversation_memory, filter by userId
      if (ns === 'conversation_memory' && options.userId) {
        const meta = rowData.metadata as Record<string, unknown> | undefined;
        if (meta?.user_id !== options.userId) return null;
      }

      return {
        documentId: rowData.documentId as string,
        namespace: ns,
        score: cosineScore,
        freshnessScore,
        combinedScore,
        snippet: (rowData.content as string).substring(0, 300),
        metadata: (rowData.metadata as Record<string, unknown>) || {},
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null && item.combinedScore >= SCORE_THRESHOLD)
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topK);

  const context = scored.map((c) => c.snippet).join('\n\n---\n\n');

  return { chunks: scored, context, namespacesSearched: namespaces };
}

// ---------------------------------------------------------------------------
// RAG Query — retrieve + generate answer (used by /ai/rag/query)
// ---------------------------------------------------------------------------

export async function ragQuery(
  question: string,
  context?: string,
): Promise<{ answer: string; sources: Array<{ docId: string; score: number; snippet: string }> }> {
  const retrieval = await retrieveContext(question, { roleScope: 'driver', topK: 5 });

  const retrievedContext = retrieval.context;
  const fullContext = context ? `${context}\n\n${retrievedContext}` : retrievedContext;

  if (!fullContext.trim()) {
    return {
      answer: "I don't have enough information in my knowledge base to answer that yet. Try asking about specific carriers or check the platform directly.",
      sources: [],
    };
  }

  const { complete, selectProvider } = await import('./aiRouter');
  const provider = selectProvider('general');
  const result = await complete(provider, [
    {
      role: 'system',
      content: 'You are a helpful assistant that answers questions based on the provided context. Keep answers concise (2-3 sentences max). If the context does not contain enough information, say so.',
    },
    {
      role: 'user',
      content: `Context:\n${fullContext}\n\nQuestion: ${question}`,
    },
  ]);

  const sources = retrieval.chunks.map((c) => ({
    docId: c.documentId,
    score: c.combinedScore,
    snippet: c.snippet,
  }));

  return { answer: result.content, sources };
}

// ---------------------------------------------------------------------------
// Similarity Search (legacy — used by /ai/vectors/search)
// ---------------------------------------------------------------------------

export async function similaritySearch(
  text: string,
  limit: number,
): Promise<Array<{ docId: string; score: number; snippet: string }>> {
  const retrieval = await retrieveContext(text, { topK: limit });
  return retrieval.chunks.map((c) => ({
    docId: c.documentId,
    score: c.combinedScore,
    snippet: c.snippet,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function splitIntoChunks(text: string, maxChunkSize: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = '';
    }
    current += para + '\n\n';
  }
  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}
