import request from 'supertest';
import express from 'express';
import dashboardRouter from '../../../src/routes/admin/dashboard.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/dashboard', dashboardRouter);
  return app;
}

describe('Admin Dashboard Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('GET /v1/admin/dashboard/overview', () => {
    it('returns dashboard overview with driver/carrier stats', async () => {
      const res = await request(app).get('/v1/admin/dashboard/overview');
      expect(res.status).toBe(200);
      expect(res.body.drivers).toBeDefined();
      expect(typeof res.body.drivers.total).toBe('number');
      expect(res.body.carriers).toBeDefined();
      expect(typeof res.body.matchesThisWeek).toBe('number');
    });
  });

  describe('GET /v1/admin/dashboard/quick-stats', () => {
    it('returns 4 quick stats', async () => {
      const res = await request(app).get('/v1/admin/dashboard/quick-stats');
      expect(res.status).toBe(200);
      expect(typeof res.body.totalDrivers).toBe('number');
      expect(typeof res.body.totalCarriers).toBe('number');
      expect(typeof res.body.pendingReview).toBe('number');
    });
  });

  describe('GET /v1/admin/dashboard/ai-usage', () => {
    it('returns AI usage by provider', async () => {
      const res = await request(app).get('/v1/admin/dashboard/ai-usage?period=7d');
      expect(res.status).toBe(200);
      expect(res.body.period).toBe('7d');
      expect(Array.isArray(res.body.providers)).toBe(true);
    });
  });
});
