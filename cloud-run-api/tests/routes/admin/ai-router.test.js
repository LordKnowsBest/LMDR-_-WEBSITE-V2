import request from 'supertest';
import express from 'express';
import aiRouterRouter from '../../../src/routes/admin/ai-router.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/ai-router', aiRouterRouter);
  return app;
}

describe('Admin AI Router Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('GET /v1/admin/ai-router/config', () => {
    it('returns provider config with providers array', async () => {
      const res = await request(app).get('/v1/admin/ai-router/config');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.providers)).toBe(true);
    });
  });

  describe('GET /v1/admin/ai-router/costs', () => {
    it('returns cost breakdown by provider', async () => {
      const res = await request(app).get('/v1/admin/ai-router/costs');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.providers)).toBe(true);
      if (res.body.providers.length > 0) {
        const p = res.body.providers[0];
        expect(typeof p.provider).toBe('string');
        expect(typeof p.calls).toBe('number');
        expect(typeof p.avgLatencyMs).toBe('number');
        expect(typeof p.totalCostUsd).toBe('number');
      }
    });
  });
});
