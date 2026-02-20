/**
 * POST /agent/stream
 * Phase 3 stub — streaming endpoint not yet implemented.
 */

import { Hono } from 'hono';

export const streamRouter = new Hono();

streamRouter.post('/', async (c) => {
  return c.json({
    error: {
      code: 'not_implemented',
      message: 'Streaming endpoint is planned for Phase 3 and not yet available.',
    },
  }, 501);
});
