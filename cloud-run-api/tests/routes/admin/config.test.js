import request from 'supertest';
import express from 'express';
import router from '../../../src/routes/admin/config.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  // Mock admin auth
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/config', router);
  return app;
}

describe('Admin config routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('GET /v1/admin/config/matching-weights', () => {
    it('returns carrier and driver weight objects', async () => {
      const res = await request(app).get('/v1/admin/config/matching-weights');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('carrier');
      expect(res.body).toHaveProperty('driver');
      expect(typeof res.body.carrier).toBe('object');
      expect(typeof res.body.driver).toBe('object');
    });
  });

  describe('GET /v1/admin/config/system', () => {
    it('returns system settings object', async () => {
      const res = await request(app).get('/v1/admin/config/system');
      expect(res.status).toBe(200);
      expect(typeof res.body).toBe('object');
      // Should have at least one known default key
      expect(
        res.body.cacheTtl !== undefined ||
        res.body.batchSize !== undefined ||
        res.body.maintenanceMode !== undefined
      ).toBe(true);
    });
  });

  describe('GET /v1/admin/config/tiers', () => {
    it('returns tier limits object', async () => {
      const res = await request(app).get('/v1/admin/config/tiers');
      expect(res.status).toBe(200);
      expect(typeof res.body).toBe('object');
    });
  });
});
