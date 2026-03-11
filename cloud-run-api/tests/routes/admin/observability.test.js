import request from 'supertest';
import express from 'express';
import observabilityRouter from '../../../src/routes/admin/observability.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/observability', observabilityRouter);
  return app;
}

describe('Admin Observability Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('POST /v1/admin/observability/logs', () => {
    it('returns paginated log records', async () => {
      const res = await request(app)
        .post('/v1/admin/observability/logs')
        .send({ filters: [], limit: 10, skip: 0 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(typeof res.body.total).toBe('number');
      expect(res.body.page).toBeDefined();
      expect(res.body.page.limit).toBe(10);
      expect(res.body.page.skip).toBe(0);
    });

    it('uses default limit and skip when not provided', async () => {
      const res = await request(app)
        .post('/v1/admin/observability/logs')
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.page.limit).toBe(100);
      expect(res.body.page.skip).toBe(0);
    });
  });

  describe('GET /v1/admin/observability/anomalies', () => {
    it('returns unresolved anomalies', async () => {
      const res = await request(app)
        .get('/v1/admin/observability/anomalies');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.anomalies)).toBe(true);
    });
  });
});
