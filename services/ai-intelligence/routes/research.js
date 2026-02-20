/**
 * B2B parallel research route
 * Phase 4 stub — not yet implemented.
 */

import { Hono } from 'hono';

export const researchRouter = new Hono();

researchRouter.post('/company', async (c) => {
  return c.json({
    error: {
      code: 'not_implemented',
      message: 'B2B parallel research endpoint is planned for Phase 4.',
    },
  }, 501);
});
