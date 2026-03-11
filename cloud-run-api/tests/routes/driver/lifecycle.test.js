import { jest } from '@jest/globals';

// ── Mock pool.js ──
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: mockQuery,
}));

// ── Mock bigquery.js ──
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: jest.fn(),
  insertAuditEvent: jest.fn(),
  flush: jest.fn(),
}));

// Dynamic imports after mocks are registered
const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: lifecycleRouter } = await import('../../../src/routes/driver/lifecycle.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.auth = { uid: 'test-driver-123', role: 'driver', type: 'firebase' };
    next();
  });
  app.use('/v1/driver/lifecycle', lifecycleRouter);
  return app;
}

describe('Driver Lifecycle Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });
  afterEach(() => { mockQuery.mockReset(); });

  // ── GET /:id/timeline ──
  describe('GET /v1/driver/lifecycle/:id/timeline', () => {
    it('returns lifecycle events for a driver', async () => {
      const now = new Date().toISOString();
      mockQuery.mockResolvedValueOnce({
        rows: [
          { _id: 'evt-1', airtable_id: null, _created_at: now, _updated_at: now, data: { driver_id: 'drv-1', event_type: 'disposition_change', old_value: 'actively_looking', new_value: 'hired' } },
          { _id: 'evt-2', airtable_id: null, _created_at: now, _updated_at: now, data: { driver_id: 'drv-1', event_type: 'profile_updated' } },
        ],
      });

      const res = await request(app).get('/v1/driver/lifecycle/drv-1/timeline');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events).toHaveLength(2);
      expect(res.body.events[0].event_type).toBe('disposition_change');
      expect(res.body.count).toBe(2);
    });

    it('returns empty array when no events exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/lifecycle/drv-none/timeline');
      expect(res.status).toBe(200);
      expect(res.body.events).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('respects limit query param', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await request(app).get('/v1/driver/lifecycle/drv-1/timeline?limit=10');
      // Verify the limit was passed to the query
      const sqlArg = mockQuery.mock.calls[0][0];
      const paramsArg = mockQuery.mock.calls[0][1];
      expect(sqlArg).toContain('LIMIT');
      expect(paramsArg).toContain(10);
    });
  });

  // ── PUT /:id/disposition ──
  describe('PUT /v1/driver/lifecycle/:id/disposition', () => {
    it('updates disposition and creates lifecycle event', async () => {
      const now = new Date().toISOString();

      // 1. SELECT current disposition (safeQuery)
      mockQuery.mockResolvedValueOnce({
        rows: [{ data: { disposition: 'actively_looking', full_name: 'Test Driver' } }],
      });
      // 2. UPDATE driver profile
      mockQuery.mockResolvedValueOnce({
        rows: [{ _id: 'drv-1', airtable_id: null, _created_at: now, _updated_at: now, data: { disposition: 'hired', full_name: 'Test Driver' } }],
      });
      // 3. INSERT lifecycle event
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/v1/driver/lifecycle/drv-1/disposition')
        .send({ disposition: 'hired' });

      expect(res.status).toBe(200);
      expect(res.body.driver).toBeDefined();
      expect(res.body.driver.disposition).toBe('hired');
      // Verify lifecycle event was inserted
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('rejects invalid disposition', async () => {
      const res = await request(app)
        .put('/v1/driver/lifecycle/drv-1/disposition')
        .send({ disposition: 'invalid_state' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid disposition');
    });

    it('rejects missing disposition', async () => {
      const res = await request(app)
        .put('/v1/driver/lifecycle/drv-1/disposition')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('disposition is required');
    });

    it('returns 404 for non-existent driver', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/v1/driver/lifecycle/drv-missing/disposition')
        .send({ disposition: 'hired' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('DRIVER_NOT_FOUND');
    });
  });

  // ── GET /:id/stats ──
  describe('GET /v1/driver/lifecycle/:id/stats', () => {
    it('returns aggregate stats for a driver', async () => {
      const createdAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago

      // 1. profile
      mockQuery.mockResolvedValueOnce({
        rows: [{ _created_at: createdAt, data: { disposition: 'actively_looking' } }],
      });
      // 2. applications count
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 5 }] });
      // 3. matches count
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 3 }] });
      // 4. views count
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 12 }] });

      const res = await request(app).get('/v1/driver/lifecycle/drv-1/stats');

      expect(res.status).toBe(200);
      expect(res.body.totalApplications).toBe(5);
      expect(res.body.totalMatches).toBe(3);
      expect(res.body.totalViews).toBe(12);
      expect(res.body.daysSinceRegistration).toBeGreaterThanOrEqual(29);
      expect(res.body.daysSinceRegistration).toBeLessThanOrEqual(31);
      expect(res.body.disposition).toBe('actively_looking');
    });

    it('returns 404 for non-existent driver', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // The parallel queries still resolve
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      const res = await request(app).get('/v1/driver/lifecycle/drv-missing/stats');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('DRIVER_NOT_FOUND');
    });
  });

  // ── POST /:id/feedback ──
  describe('POST /v1/driver/lifecycle/:id/feedback', () => {
    it('creates match feedback', async () => {
      const now = new Date().toISOString();
      mockQuery.mockResolvedValueOnce({
        rows: [{ _id: 'fb-1', airtable_id: null, _created_at: now, _updated_at: now, data: { driver_id: 'drv-1', carrier_dot: '1234567', rating: 4, comment: 'Great carrier', would_recommend: true } }],
      });

      const res = await request(app)
        .post('/v1/driver/lifecycle/drv-1/feedback')
        .send({ carrierDot: '1234567', rating: 4, comment: 'Great carrier', wouldRecommend: true });

      expect(res.status).toBe(201);
      expect(res.body.feedback).toBeDefined();
      expect(res.body.feedback.rating).toBe(4);
      expect(res.body.feedback.carrier_dot).toBe('1234567');
    });

    it('rejects missing carrierDot', async () => {
      const res = await request(app)
        .post('/v1/driver/lifecycle/drv-1/feedback')
        .send({ rating: 4 });
      expect(res.status).toBe(400);
    });

    it('rejects invalid rating', async () => {
      const res = await request(app)
        .post('/v1/driver/lifecycle/drv-1/feedback')
        .send({ carrierDot: '1234567', rating: 6 });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('rating must be');
    });
  });

  // ── GET /:id/milestones ──
  describe('GET /v1/driver/lifecycle/:id/milestones', () => {
    it('returns milestone array with achieved flags', async () => {
      const date1 = '2026-01-15T10:00:00.000Z';
      const date2 = '2026-02-01T12:00:00.000Z';

      // profile
      mockQuery.mockResolvedValueOnce({ rows: [{ _created_at: date1 }] });
      // first application
      mockQuery.mockResolvedValueOnce({ rows: [{ _created_at: date2 }] });
      // first match — none
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // first view — none
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/lifecycle/drv-1/milestones');
      expect(res.status).toBe(200);
      expect(res.body.milestones).toHaveLength(4);

      const [profileMs, appMs, matchMs, viewMs] = res.body.milestones;
      expect(profileMs.milestone).toBe('first_profile_created');
      expect(profileMs.achieved).toBe(true);
      expect(appMs.achieved).toBe(true);
      expect(matchMs.achieved).toBe(false);
      expect(viewMs.achieved).toBe(false);
    });
  });
});
