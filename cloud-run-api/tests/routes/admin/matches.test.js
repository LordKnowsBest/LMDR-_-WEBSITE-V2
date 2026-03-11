import request from 'supertest';
import express from 'express';
import matchesRouter from '../../../src/routes/admin/matches.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  // Mock admin auth
  app.use((req, res, next) => {
    req.auth = { uid: 'test-admin', role: 'admin', type: 'firebase' };
    next();
  });
  app.use('/v1/admin/matches', matchesRouter);
  return app;
}

describe('Admin Matches Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });

  describe('POST /v1/admin/matches/query', () => {
    it('returns paginated match records', async () => {
      const res = await request(app)
        .post('/v1/admin/matches/query')
        .send({ filters: [], limit: 5, skip: 0 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(res.body.records.length).toBeLessThanOrEqual(5);
      expect(typeof res.body.total).toBe('number');
      expect(res.body.page).toEqual({ limit: 5, skip: 0 });
    });

    it('uses default limit and skip when not provided', async () => {
      const res = await request(app)
        .post('/v1/admin/matches/query')
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.page).toEqual({ limit: 50, skip: 0 });
    });
  });

  describe('POST /v1/admin/matches/interests', () => {
    it('returns paginated interest records', async () => {
      const res = await request(app)
        .post('/v1/admin/matches/interests')
        .send({ filters: [], limit: 5 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(typeof res.body.total).toBe('number');
    });
  });

  describe('GET /v1/admin/matches/stats', () => {
    it('returns match statistics with all required fields', async () => {
      const res = await request(app)
        .get('/v1/admin/matches/stats');
      expect(res.status).toBe(200);
      expect(typeof res.body.weeklyMatches).toBe('number');
      expect(typeof res.body.totalMatches).toBe('number');
      expect(typeof res.body.totalInterests).toBe('number');
      expect(typeof res.body.conversionRate).toBe('number');
      expect(typeof res.body.dailyAverage).toBe('number');
    });
  });

  describe('GET /v1/admin/matches/export', () => {
    it('returns CSV with correct headers', async () => {
      const res = await request(app)
        .get('/v1/admin/matches/export');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('matches_export.csv');
      expect(res.text).toContain('id,driver_id,carrier_id,score,action,date');
    });
  });

  describe('GET /v1/admin/matches/:id', () => {
    it('returns 404 for non-existent match', async () => {
      const res = await request(app)
        .get('/v1/admin/matches/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('MATCH_NOT_FOUND');
    });
  });
});
