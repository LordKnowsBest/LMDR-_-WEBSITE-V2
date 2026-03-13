/**
 * Railway-compatible RAG routes (v1)
 *
 * POST /v1/rag/ingest   — Ingest one document into a knowledge namespace
 * POST /v1/rag/retrieve  — Retrieve top-k relevant chunks from namespaces
 *
 * These routes replace the Railway ai-intelligence service.
 * Wix services (ragIngestionService.jsw, ragService.jsw) call these paths.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import {
  ingestDocument,
  retrieveContext,
  NAMESPACES,
  ROLE_DEFAULT_NAMESPACES,
} from '../services/ragPipeline';

const router = Router();
router.use(authenticate());

// POST /v1/rag/ingest
router.post('/ingest', async (req: Request, res: Response) => {
  try {
    const { namespace, documentId, text, metadata = {}, sourceUpdatedAt } = req.body;

    if (!namespace || !NAMESPACES[namespace]) {
      return res.status(400).json({
        error: {
          code: 'validation_error',
          message: `Invalid namespace. Must be one of: ${Object.keys(NAMESPACES).join(', ')}`,
        },
      });
    }

    if (!documentId || typeof documentId !== 'string') {
      return res.status(400).json({ error: { code: 'validation_error', message: 'documentId is required' } });
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: { code: 'validation_error', message: 'text is required' } });
    }

    if (!sourceUpdatedAt) {
      return res.status(400).json({ error: { code: 'validation_error', message: 'sourceUpdatedAt is required' } });
    }

    const result = await ingestDocument(namespace, documentId, text, metadata, sourceUpdatedAt);

    if (result.status === 'error') {
      return res.status(500).json({ error: { code: 'ingestion_error', message: result.error } });
    }

    res.json({
      documentId,
      namespace,
      status: 'ingested',
      ingestedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[v1/rag/ingest]', (err as Error).message);
    res.status(500).json({ error: { code: 'internal_error', message: (err as Error).message } });
  }
});

// POST /v1/rag/retrieve
router.post('/retrieve', async (req: Request, res: Response) => {
  try {
    const { query: queryText, namespaces, roleScope, topK, userId } = req.body;

    if (!queryText || typeof queryText !== 'string') {
      return res.status(400).json({ error: { code: 'validation_error', message: 'query is required' } });
    }

    if (!roleScope || !['driver', 'recruiter', 'admin', 'carrier'].includes(roleScope)) {
      return res.status(400).json({ error: { code: 'validation_error', message: 'roleScope must be driver, recruiter, admin, or carrier' } });
    }

    const nsToSearch = namespaces && Array.isArray(namespaces) && namespaces.length > 0
      ? namespaces
      : ROLE_DEFAULT_NAMESPACES[roleScope] || [];

    // Validate namespace access
    for (const ns of nsToSearch) {
      if (!NAMESPACES[ns]) {
        return res.status(400).json({ error: { code: 'validation_error', message: `Invalid namespace: ${ns}` } });
      }
      if (!NAMESPACES[ns].accessRoles.includes(roleScope)) {
        return res.status(400).json({ error: { code: 'NAMESPACE_ACCESS_DENIED', message: `Role ${roleScope} cannot access namespace ${ns}` } });
      }
    }

    if (nsToSearch.includes('conversation_memory') && !userId) {
      return res.status(400).json({ error: { code: 'validation_error', message: 'userId is required when querying conversation_memory' } });
    }

    const result = await retrieveContext(queryText.substring(0, 500), {
      namespaces: nsToSearch,
      roleScope,
      topK,
      userId,
    });

    res.json(result);
  } catch (err) {
    console.error('[v1/rag/retrieve]', (err as Error).message);
    res.status(500).json({ error: { code: 'internal_error', message: (err as Error).message } });
  }
});

export default router;
