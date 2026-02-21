/**
 * Semantic search routes — Phase 2
 *
 * POST /v1/embed/driver    — embed + upsert driver profile
 * POST /v1/embed/carrier   — embed + upsert carrier profile
 * POST /v1/search/drivers  — query lmdr-drivers index
 * POST /v1/search/carriers — query lmdr-carriers index
 */

import { Hono } from 'hono';
import crypto from 'node:crypto';
import { embed, buildDriverText, buildCarrierText } from '../lib/embeddings.js';
import { upsertVector, queryVectors, fetchVector } from '../lib/pinecone.js';

export const semanticRouter = new Hono();

const EMBED_TIMEOUT_MS  = 5_000;
const SEARCH_TIMEOUT_MS = 3_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Remove undefined/null fields — Pinecone rejects null metadata values. */
function stripNulls(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), ms)),
  ]);
}

// ── POST /embed/driver ────────────────────────────────────────────────────────

semanticRouter.post('/embed/driver', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { driverId, profileUpdatedAt, profile } = body;
  if (!driverId || !profileUpdatedAt || !profile) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'driverId, profileUpdatedAt, profile required', requestId } }, 400);
  }

  // Idempotency: skip if embedding is current
  try {
    const existing = await fetchVector('drivers', driverId);
    if (existing?.metadata?.profileUpdatedAt === profileUpdatedAt) {
      return c.json({ driverId, status: 'skipped', reason: 'embedding_current', requestId });
    }
  } catch { /* non-fatal — proceed to embed */ }

  try {
    const text   = buildDriverText(profile);
    const vector = await withTimeout(embed(text), EMBED_TIMEOUT_MS);

    const metadata = stripNulls({
      profileUpdatedAt,
      cdl_class:        profile.cdl_class        || undefined,
      home_state:       profile.home_state        || undefined,
      experience_years: profile.experience_years  || 0,
      is_discoverable:  profile.is_discoverable   || 'No',
      last_active:      new Date().toISOString(),
    });

    await upsertVector('drivers', driverId, vector, metadata);

    return c.json({
      driverId,
      status: 'upserted',
      embeddedAt: new Date().toISOString(),
      indexVersion: 1,
      requestId,
    });
  } catch (err) {
    console.error('[embed/driver]', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, requestId } }, 500);
  }
});

// ── POST /embed/carrier ───────────────────────────────────────────────────────

semanticRouter.post('/embed/carrier', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { carrierId, profileUpdatedAt, profile } = body;
  if (!carrierId || !profileUpdatedAt || !profile) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'carrierId, profileUpdatedAt, profile required', requestId } }, 400);
  }

  try {
    const existing = await fetchVector('carriers', carrierId);
    if (existing?.metadata?.profileUpdatedAt === profileUpdatedAt) {
      return c.json({ carrierId, status: 'skipped', reason: 'embedding_current', requestId });
    }
  } catch { /* non-fatal */ }

  try {
    const text   = buildCarrierText(profile);
    const vector = await withTimeout(embed(text), EMBED_TIMEOUT_MS);

    const metadata = stripNulls({
      profileUpdatedAt,
      dot_number:    profile.dot_number    || undefined,
      fleet_size:    profile.fleet_size    || 0,
      pay_range_min: profile.pay_range_min || 0,
    });

    await upsertVector('carriers', carrierId, vector, metadata);

    return c.json({
      carrierId,
      status: 'upserted',
      embeddedAt: new Date().toISOString(),
      indexVersion: 1,
      requestId,
    });
  } catch (err) {
    console.error('[embed/carrier]', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, requestId } }, 500);
  }
});

// ── POST /search/drivers ──────────────────────────────────────────────────────

semanticRouter.post('/search/drivers', async (c) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  let body;

  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { query, filters = {}, topK = 50, includeMetadata = true } = body;
  if (!query) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'query required', requestId } }, 400);
  }

  try {
    const queryVector = await withTimeout(embed(query), SEARCH_TIMEOUT_MS);
    const matches     = await queryVectors('drivers', queryVector, Math.min(topK, 200), filters, includeMetadata);

    const now = Date.now();
    const results = matches.map(m => ({
      driverId: m.id,
      score:    Math.round(m.score * 1000) / 1000,
      stale:    m.metadata?.last_active
        ? (now - new Date(m.metadata.last_active).getTime()) > 86_400_000
        : false,
      metadata: includeMetadata ? m.metadata : undefined,
    }));

    return c.json({
      results,
      totalReturned:  results.length,
      queryLatencyMs: Date.now() - start,
      requestId,
    });
  } catch (err) {
    console.error('[search/drivers]', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, requestId } }, 500);
  }
});

// ── POST /search/carriers ─────────────────────────────────────────────────────

semanticRouter.post('/search/carriers', async (c) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  let body;

  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { query, filters = {}, topK = 20, includeMetadata = true } = body;
  if (!query) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'query required', requestId } }, 400);
  }

  try {
    const queryVector = await withTimeout(embed(query), SEARCH_TIMEOUT_MS);
    const matches     = await queryVectors('carriers', queryVector, Math.min(topK, 200), filters, includeMetadata);

    const results = matches.map(m => ({
      carrierId: m.id,
      score:     Math.round(m.score * 1000) / 1000,
      stale:     false,
      metadata:  includeMetadata ? m.metadata : undefined,
    }));

    return c.json({
      results,
      totalReturned:  results.length,
      queryLatencyMs: Date.now() - start,
      requestId,
    });
  } catch (err) {
    console.error('[search/carriers]', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, requestId } }, 500);
  }
});
