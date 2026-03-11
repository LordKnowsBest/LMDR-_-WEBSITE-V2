import request from 'supertest';
import express from 'express';
import driversRouter from '../../../src/routes/admin/drivers.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/drivers', driversRouter);
  return app;
}

describe('Admin Drivers Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('POST /v1/admin/drivers/query', () => {
    it('returns paginated driver list', async () => {
      const res = await request(app)
        .post('/v1/admin/drivers/query')
        .send({ limit: 10, skip: 0 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(typeof res.body.total).toBe('number');
    });
  });

  describe('GET /v1/admin/drivers/stats', () => {
    it('returns driver counts', async () => {
      const res = await request(app).get('/v1/admin/drivers/stats');
      expect(res.status).toBe(200);
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.active).toBe('number');
    });
  });
});
