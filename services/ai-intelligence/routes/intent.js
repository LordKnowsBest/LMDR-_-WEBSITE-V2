/**
 * Intent Classification Routes
 *
 * POST /intent/classify — Classify user message intent for a given role
 */

import { Hono } from 'hono';
import crypto from 'node:crypto';
import { classifyIntent } from '../lib/intentClassifier.js';

export const intentRouter = new Hono();

// ── POST /intent/classify ───────────────────────────────────────────────────

intentRouter.post('/classify', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'validation_error', message: 'Invalid JSON body', requestId } }, 400);
  }

  const { message, role, recentContext = [], userId } = body;

  // Validate required fields
  if (!message || typeof message !== 'string') {
    return c.json({ error: { code: 'validation_error', message: 'message is required', requestId } }, 400);
  }

  if (!role || !['driver', 'recruiter', 'admin', 'carrier'].includes(role)) {
    return c.json({ error: { code: 'validation_error', message: 'role must be driver, recruiter, admin, or carrier', requestId } }, 400);
  }

  // Validate recentContext
  if (!Array.isArray(recentContext)) {
    return c.json({ error: { code: 'validation_error', message: 'recentContext must be an array', requestId } }, 400);
  }

  const result = await classifyIntent(
    message.substring(0, 500),
    role,
    recentContext.slice(0, 3).map(c => String(c).substring(0, 150))
  );

  return c.json({
    ...result,
    requestId,
  });
});
