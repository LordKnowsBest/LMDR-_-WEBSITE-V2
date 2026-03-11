import { jest } from '@jest/globals';

// Mock pool.js — intercept query calls
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

// Mock bigquery.js — no-op
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: jest.fn(),
  flush: jest.fn(),
  default: {},
}));

// Dynamic imports AFTER mocks are registered
const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: gamificationRouter } = await import('../../../src/routes/driver/gamification.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.auth = { uid: 'test-driver', role: 'driver', type: 'firebase' };
    next();
  });
  app.use('/v1/driver/gamification', gamificationRouter);
  return app;
}

describe('Driver Gamification Routes', () => {
  let app;
  beforeAll(() => { app = createTestApp(); });
  afterEach(() => { mockQuery.mockReset(); });

  // ── GET /:id/progression ──
  describe('GET /v1/driver/gamification/:id/progression', () => {
    it('returns default progression when no record exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/gamification/driver-1/progression');
      expect(res.status).toBe(200);
      expect(res.body.driverId).toBe('driver-1');
      expect(res.body.totalXp).toBe(0);
      expect(res.body.level).toBe(1);
      expect(res.body.levelName).toBe('Rookie');
      expect(res.body.multiplier).toBe(1.0);
    });

    it('returns computed level and multiplier from existing record', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          _id: 'driver-2',
          airtable_id: null,
          _created_at: '2026-01-01',
          _updated_at: '2026-03-10',
          data: { total_xp: 350, streak_days: 5, last_check_in: '2026-03-10', freezes_available: 2 },
        }],
      });

      const res = await request(app).get('/v1/driver/gamification/driver-2/progression');
      expect(res.status).toBe(200);
      expect(res.body.totalXp).toBe(350);
      expect(res.body.level).toBe(3);
      expect(res.body.levelName).toBe('Mile Maker');
      expect(res.body.streakDays).toBe(5);
      expect(res.body.multiplier).toBe(1.5); // 1.0 + 5*0.1
      expect(res.body.freezesAvailable).toBe(2);
    });
  });

  // ── GET /leaderboard ──
  describe('GET /v1/driver/gamification/leaderboard', () => {
    it('returns ranked leaderboard list', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { _id: 'd-a', airtable_id: null, _created_at: '2026-01-01', _updated_at: '2026-03-10', data: { total_xp: 1200, driver_name: 'Alice', streak_days: 10 } },
          { _id: 'd-b', airtable_id: null, _created_at: '2026-01-01', _updated_at: '2026-03-10', data: { total_xp: 800, driver_name: 'Bob', streak_days: 3 } },
          { _id: 'd-c', airtable_id: null, _created_at: '2026-01-01', _updated_at: '2026-03-10', data: { total_xp: 50, driver_name: 'Charlie', streak_days: 0 } },
        ],
      });

      const res = await request(app).get('/v1/driver/gamification/leaderboard?limit=3');
      expect(res.status).toBe(200);
      expect(res.body.leaderboard).toHaveLength(3);
      expect(res.body.leaderboard[0].rank).toBe(1);
      expect(res.body.leaderboard[0].driverName).toBe('Alice');
      expect(res.body.leaderboard[0].totalXp).toBe(1200);
      expect(res.body.leaderboard[0].level).toBe(5);
      expect(res.body.leaderboard[0].levelName).toBe('Road Warrior');
      expect(res.body.leaderboard[1].rank).toBe(2);
      expect(res.body.leaderboard[2].level).toBe(1);
    });

    it('caps limit at 50', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/gamification/leaderboard?limit=200');
      expect(res.status).toBe(200);
      // Verify the query was called with limit 50
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[1]).toContain(50);
    });
  });

  // ── POST /:id/xp ──
  describe('POST /v1/driver/gamification/:id/xp', () => {
    it('awards correct XP for valid action (new driver)', async () => {
      // First query: get progression (empty — new driver)
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Second query: insert progression
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      // Third query: insert gamification event
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const res = await request(app)
        .post('/v1/driver/gamification/driver-new/xp')
        .send({ action: 'first_application' });

      expect(res.status).toBe(200);
      expect(res.body.xpAwarded).toBe(25); // base XP, multiplier 1.0 (0 streak)
      expect(res.body.totalXp).toBe(25);
      expect(res.body.level).toBe(1);
      expect(res.body.levelName).toBe('Rookie');
      expect(res.body.multiplier).toBe(1.0);
    });

    it('applies streak multiplier for existing driver', async () => {
      // Existing driver with streak of 5 days
      mockQuery.mockResolvedValueOnce({
        rows: [{
          _id: 'driver-streak',
          data: { total_xp: 100, streak_days: 5 },
        }],
      });
      // Update progression
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      // Insert event
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const res = await request(app)
        .post('/v1/driver/gamification/driver-streak/xp')
        .send({ action: 'update_profile' }); // base 10 XP

      expect(res.status).toBe(200);
      // 10 * 1.5 (streak multiplier for 5 days) = 15
      expect(res.body.xpAwarded).toBe(15);
      expect(res.body.totalXp).toBe(115);
      expect(res.body.multiplier).toBe(1.5);
    });

    it('rejects invalid action', async () => {
      const res = await request(app)
        .post('/v1/driver/gamification/driver-1/xp')
        .send({ action: 'invalid_action' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_ACTION');
      expect(res.body.validActions).toBeDefined();
    });

    it('rejects missing action', async () => {
      const res = await request(app)
        .post('/v1/driver/gamification/driver-1/xp')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_ACTION');
    });
  });
});
