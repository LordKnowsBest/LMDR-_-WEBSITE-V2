import crypto from 'crypto';
import OpenAI from 'openai';
import { query, getTableName, buildInsertQuery } from '@lmdr/db';

const EMBEDDINGS_TABLE = getTableName('ragEmbeddings');

// ---------------------------------------------------------------------------
// Embedding generation (OpenAI text-embedding-3-small)
// ---------------------------------------------------------------------------

function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function createEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// ---------------------------------------------------------------------------
// Document indexing — stores embedding in Cloud SQL JSONB
// ---------------------------------------------------------------------------

export async function indexDocument(
  docId: string,
  content: string,
): Promise<{ docId: string; indexed: boolean; chunks: number }> {
  // Split content into chunks (simple paragraph splitting)
  const chunks = splitIntoChunks(content, 1000);
  let indexed = 0;

  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk);
    const _id = crypto.randomUUID();
    const data = {
      docId,
      content: chunk,
      embedding: JSON.stringify(embedding),
      indexedAt: new Date().toISOString(),
    };

    const { sql, params } = buildInsertQuery(EMBEDDINGS_TABLE, { _id, data });
    await query(sql, params);
    indexed++;
  }

  return { docId, indexed: indexed > 0, chunks: indexed };
}

// ---------------------------------------------------------------------------
// RAG Query — embed question, cosine similarity search, generate answer
// ---------------------------------------------------------------------------

export async function ragQuery(
  question: string,
  context?: string,
): Promise<{ answer: string; sources: Array<{ docId: string; score: number; snippet: string }> }> {
  // 1. Get relevant documents via similarity search
  const sources = await similaritySearch(question, 5);

  // 2. Build context from retrieved docs
  const retrievedContext = sources.map((s) => s.snippet).join('\n\n---\n\n');
  const fullContext = context ? `${context}\n\n${retrievedContext}` : retrievedContext;

  // 3. Generate answer using AI router (import inline to avoid circular dep)
  const { complete, selectProvider } = await import('./aiRouter');
  const provider = selectProvider('general');
  const result = await complete(provider, [
    {
      role: 'system',
      content:
        'You are a helpful assistant that answers questions based on the provided context. If the context does not contain enough information, say so.',
    },
    {
      role: 'user',
      content: `Context:\n${fullContext}\n\nQuestion: ${question}`,
    },
  ]);

  return { answer: result.content, sources };
}

// ---------------------------------------------------------------------------
// Similarity Search — cosine similarity on JSONB embeddings
// ---------------------------------------------------------------------------

export async function similaritySearch(
  text: string,
  limit: number,
): Promise<Array<{ docId: string; score: number; snippet: string }>> {
  const queryEmbedding = await createEmbedding(text);

  // Retrieve all embeddings and compute cosine similarity in-app
  // (In production, use pgvector extension for efficient search)
  const result = await query(
    `SELECT _id, data FROM "${EMBEDDINGS_TABLE}" ORDER BY _created_at DESC LIMIT 1000`,
  );

  if (result.rows.length === 0) {
    return [];
  }

  const scored = result.rows
    .map((row) => {
      const rowData = row.data as Record<string, unknown>;
      const storedEmbedding = JSON.parse(rowData.embedding as string) as number[];
      const score = cosineSimilarity(queryEmbedding, storedEmbedding);
      return {
        docId: rowData.docId as string,
        score,
        snippet: (rowData.content as string).substring(0, 300),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
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
