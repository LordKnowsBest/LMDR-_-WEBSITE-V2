import request from 'supertest';
import express from 'express';
import auditRouter from '../../../src/routes/admin/audit.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/audit', auditRouter);
  return app;
}

describe('Admin Audit Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('POST /v1/admin/audit/query', () => {
    it('returns audit records with pagination', async () => {
      const res = await request(app)
        .post('/v1/admin/audit/query')
        .send({ filters: [], limit: 10, skip: 0 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(typeof res.body.total).toBe('number');
      expect(res.body.page).toBeDefined();
      expect(res.body.page.limit).toBe(10);
      expect(res.body.page.skip).toBe(0);
    });
  });

  describe('GET /v1/admin/audit/stats', () => {
    it('returns audit stats with counts and top lists', async () => {
      const res = await request(app).get('/v1/admin/audit/stats');
      expect(res.status).toBe(200);
      expect(typeof res.body.today).toBe('number');
      expect(typeof res.body.thisWeek).toBe('number');
      expect(typeof res.body.thisMonth).toBe('number');
      expect(Array.isArray(res.body.topAdmins)).toBe(true);
      expect(Array.isArray(res.body.topActions)).toBe(true);
    });
  });
});
