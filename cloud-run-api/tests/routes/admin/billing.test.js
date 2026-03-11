/**
 * Integration tests for admin/billing routes.
 * Requires Cloud SQL Auth Proxy running and lmdr DB populated.
 * Bypasses auth by building a test app with mock auth middleware.
 */
import { jest } from '@jest/globals';
import express from 'express';
import billingRouter from '../../../src/routes/admin/billing.js';
import { closePool } from '../../../src/db/pool.js';
import request from 'supertest';

function createTestApp() {
  const app = express();
  app.use(express.json());
  // Mock auth — inject req.auth for all requests
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin' };
    next();
  });
  // Mount billing router at /billing (matches how admin/index.js mounts it)
  app.use('/billing', billingRouter);
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}

describe('Admin billing routes (integration)', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });
  afterAll(async () => { await closePool(); });

  describe('GET /billing/revenue/snapshot', () => {
    it('returns MRR, ARR, ARPU, and planMix', async () => {
      const res = await request(app).get('/billing/revenue/snapshot');
      expect(res.status).toBe(200);
      expect(typeof res.body.mrr).toBe('number');
      expect(typeof res.body.arr).toBe('number');
      expect(typeof res.body.arpu).toBe('number');
      expect(Array.isArray(res.body.planMix)).toBe(true);
    });
  });

  describe('GET /billing/commissions', () => {
    it('returns rules and reps arrays', async () => {
      const res = await request(app).get('/billing/commissions');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.rules)).toBe(true);
      expect(Array.isArray(res.body.reps)).toBe(true);
    });
  });
});
