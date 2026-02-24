/**
 * POST /agent/turn
 *
 * Executes one AI step using the configured provider adapter.
 * Returns either a text response or tool_use blocks for the caller to execute.
 * The multi-step tool-use loop is managed by the calling layer (agentRuntimeService.jsw).
 *
 * Request body:
 * {
 *   systemPrompt: string,
 *   messages:     Array,   // Anthropic messages format
 *   tools:        Array,   // Anthropic tool definitions (optional)
 *   modelId:      string,  // optional, defaults to claude-sonnet-4-6
 *   maxTokens:    number,  // optional, defaults to 2048
 *   traceId:      string,  // Wix-side trace ID for correlation
 * }
 *
 * Success response (text):
 * {
 *   type: 'text',
 *   text: string,
 *   stopReason: string,
 *   inputTokens: number,
 *   outputTokens: number,
 *   providerRunId: string,
 *   traceId: string,
 *   latencyMs: number,
 * }
 *
 * Success response (tool_use):
 * {
 *   type: 'tool_use',
 *   toolUseBlocks: Array,  // Anthropic tool_use content blocks
 *   contentBlocks: Array,  // Full content block array for next message
 *   stopReason: string,
 *   inputTokens: number,
 *   outputTokens: number,
 *   providerRunId: string,
 *   traceId: string,
 *   latencyMs: number,
 * }
 *
 * Error response:
 * { error: { code: string, message: string, requestId: string } }
 *
 * Error codes: validation_error, auth_error, timeout, provider_error, circuit_open
 * Timeout budget: caller should set 25s; this endpoint times out at 28s internally.
 */

import { Hono } from 'hono';
import { ClaudeAdapter } from '../runtime/claudeAdapter.js';
import { retrieveContext } from '../lib/retrieval.js';
import crypto from 'node:crypto';

export const agentRouter = new Hono();

const adapter = new ClaudeAdapter();
const INTERNAL_TIMEOUT_MS = 28_000;

agentRouter.post('/turn', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'validation_error', message: 'Invalid JSON body', requestId } }, 400);
  }

  const { systemPrompt, messages, tools = [], modelId, maxTokens, traceId, ragConfig } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: { code: 'validation_error', message: 'messages array is required and must be non-empty', requestId } }, 400);
  }

  // ── RAG Context Retrieval (inline, before Claude call) ──
  let augmentedPrompt = systemPrompt;
  let ragResult = null;

  if (ragConfig?.enabled && ragConfig.namespaces?.length > 0) {
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      const queryText = typeof lastUserMsg?.content === 'string'
        ? lastUserMsg.content
        : (lastUserMsg?.content?.[0]?.text || '');

      if (queryText) {
        ragResult = await retrieveContext(ragConfig, queryText.substring(0, 500));
        if (ragResult.contextBlock) {
          augmentedPrompt = `${ragResult.contextBlock}\n\n${systemPrompt}`;
        }
      }
    } catch (err) {
      console.warn('[agent/turn] RAG retrieval failed (non-blocking):', err.message);
    }
  }

  // Internal timeout guard
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('INTERNAL_TIMEOUT')), INTERNAL_TIMEOUT_MS)
  );

  try {
    const result = await Promise.race([
      adapter.runStep({ systemPrompt: augmentedPrompt, messages, tools, modelId, maxTokens }),
      timeoutPromise,
    ]);

    const response = { ...result, traceId: traceId || null, requestId };

    if (ragResult) {
      response.ragLatencyMs = ragResult.retrievalLatencyMs;
      response.retrievedChunks = (ragResult.chunks || []).map(ch => ({
        documentId: ch.documentId,
        namespace: ch.namespace,
        combinedScore: ch.combinedScore,
      }));
      if (!ragResult.contextBlock && ragResult.noContextReason) {
        response.ragNoContextReason = ragResult.noContextReason;
      }
    }

    return c.json(response);

  } catch (err) {
    if (err.message === 'INTERNAL_TIMEOUT') {
      return c.json({ error: { code: 'timeout', message: 'Provider step timed out', requestId } }, 504);
    }

    console.error('[agent/turn] Provider error:', err.message);
    return c.json({ error: { code: 'provider_error', message: err.message, requestId } }, 502);
  }
});
