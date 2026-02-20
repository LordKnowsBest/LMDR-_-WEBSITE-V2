/**
 * Semantic search routes (embed + search)
 * Phase 2 stub — not yet implemented.
 */

import { Hono } from 'hono';

export const semanticRouter = new Hono();

const STUB = { error: { code: 'not_implemented', message: 'Semantic search endpoints are planned for Phase 2.' } };

semanticRouter.post('/embed/driver',   async (c) => c.json(STUB, 501));
semanticRouter.post('/embed/carrier',  async (c) => c.json(STUB, 501));
semanticRouter.post('/search/drivers', async (c) => c.json(STUB, 501));
semanticRouter.post('/search/carriers',async (c) => c.json(STUB, 501));
