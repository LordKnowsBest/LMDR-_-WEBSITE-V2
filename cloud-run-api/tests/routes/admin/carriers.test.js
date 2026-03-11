import request from 'supertest';
import express from 'express';
import carriersRouter from '../../../src/routes/admin/carriers.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/carriers', carriersRouter);
  return app;
}

describe('Admin Carriers Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('POST /v1/admin/carriers/query', () => {
    it('returns paginated carrier records', async () => {
      const res = await request(app)
        .post('/v1/admin/carriers/query')
        .send({ filters: [], limit: 10, skip: 0 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(typeof res.body.total).toBe('number');
      expect(res.body.page).toBeDefined();
    });
  });

  describe('GET /v1/admin/carriers/stats', () => {
    it('returns carrier statistics', async () => {
      const res = await request(app).get('/v1/admin/carriers/stats');
      expect(res.status).toBe(200);
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.active).toBe('number');
      expect(typeof res.body.flagged).toBe('number');
      expect(typeof res.body.enrichmentCoverage).toBe('number');
    });
  });
});
