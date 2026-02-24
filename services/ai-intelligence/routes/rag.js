/**
 * RAG Routes
 *
 * POST /rag/ingest   — Ingest one document into a knowledge namespace
 * POST /rag/retrieve — Retrieve top-k relevant chunks from namespaces
 */

import { Hono } from 'hono';
import crypto from 'node:crypto';
import { ingestDocument, retrieveContext } from '../lib/retrieval.js';
import { NAMESPACES, validateChunkText } from '../lib/knowledgeCorpus.js';

export const ragRouter = new Hono();

const VALID_NAMESPACES = Object.keys(NAMESPACES);

// ── POST /rag/ingest ────────────────────────────────────────────────────────

ragRouter.post('/ingest', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'validation_error', message: 'Invalid JSON body', requestId } }, 400);
  }

  const { namespace, documentId, text, metadata = {}, sourceUpdatedAt } = body;

  // Validate required fields
  if (!namespace || !VALID_NAMESPACES.includes(namespace)) {
    return c.json({
      error: { code: 'validation_error', message: `Invalid namespace. Must be one of: ${VALID_NAMESPACES.join(', ')}`, requestId },
    }, 400);
  }

  if (!documentId || typeof documentId !== 'string') {
    return c.json({ error: { code: 'validation_error', message: 'documentId is required', requestId } }, 400);
  }

  // Validate and scrub text
  const textResult = validateChunkText(text);
  if (!textResult.valid) {
    return c.json({ error: { code: 'validation_error', message: textResult.error, requestId } }, 400);
  }

  if (!sourceUpdatedAt) {
    return c.json({ error: { code: 'validation_error', message: 'sourceUpdatedAt is required', requestId } }, 400);
  }

  // Ingest
  const result = await ingestDocument(namespace, documentId, textResult.text, {
    ...metadata,
    source_updated_at: sourceUpdatedAt,
  });

  if (result.status === 'error') {
    return c.json({ error: { code: 'ingestion_error', message: result.error, requestId } }, 500);
  }

  return c.json({
    documentId,
    namespace,
    status: 'ingested',
    ingestedAt: new Date().toISOString(),
    requestId,
  });
});

// ── POST /rag/retrieve ──────────────────────────────────────────────────────

ragRouter.post('/retrieve', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'validation_error', message: 'Invalid JSON body', requestId } }, 400);
  }

  const { query, namespaces, roleScope, topK, filters, contextBudgetTokens, userId, traceId } = body;

  // Validate required fields
  if (!query || typeof query !== 'string') {
    return c.json({ error: { code: 'validation_error', message: 'query is required', requestId } }, 400);
  }

  if (!namespaces || !Array.isArray(namespaces) || namespaces.length === 0) {
    return c.json({ error: { code: 'validation_error', message: 'namespaces array is required and must be non-empty', requestId } }, 400);
  }

  if (!roleScope || !['driver', 'recruiter', 'admin', 'carrier'].includes(roleScope)) {
    return c.json({ error: { code: 'validation_error', message: 'roleScope must be driver, recruiter, admin, or carrier', requestId } }, 400);
  }

  // Validate namespace access
  for (const ns of namespaces) {
    if (!VALID_NAMESPACES.includes(ns)) {
      return c.json({ error: { code: 'validation_error', message: `Invalid namespace: ${ns}`, requestId } }, 400);
    }
    const nsDef = NAMESPACES[ns];
    if (!nsDef.accessRoles.includes(roleScope)) {
      return c.json({ error: { code: 'NAMESPACE_ACCESS_DENIED', message: `Role ${roleScope} cannot access namespace ${ns}`, requestId } }, 400);
    }
  }

  // conversation_memory requires userId
  if (namespaces.includes('conversation_memory') && !userId) {
    return c.json({ error: { code: 'validation_error', message: 'userId is required when querying conversation_memory', requestId } }, 400);
  }

  const result = await retrieveContext(
    { namespaces, roleScope, topK, filters: filters || {}, contextBudgetTokens, userId },
    query.substring(0, 500)
  );

  return c.json({
    ...result,
    requestId,
  });
});
