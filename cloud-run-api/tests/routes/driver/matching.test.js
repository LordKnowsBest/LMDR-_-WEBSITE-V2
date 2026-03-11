import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: mockQuery,
}));
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: jest.fn(),
  insertAuditEvent: jest.fn(),
}));
jest.unstable_mockModule('../../../src/lib/driver-scoring.js', () => ({
  scoreMatch: jest.fn(() => ({
    score: 85,
    factors: { location: 1.0, pay: 1.0, safety: 0.9, culture: 0.85, routeType: 1.0, fleetAge: 0.8 },
  })),
  rankMatches: jest.fn((driver, carriers) =>
    carriers.map((c, i) => ({ carrier: c, score: 90 - i * 5, factors: {} }))
  ),
  DEFAULT_WEIGHTS: {
    location: 0.25,
    pay: 0.22,
    safety: 0.20,
    culture: 0.15,
    routeType: 0.10,
    fleetAge: 0.08,
  },
}));

const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: matchingRouter } = await import('../../../src/routes/driver/matching.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-driver', role: 'driver', type: 'firebase' };
    next();
  });
  app.use('/v1/driver/matching', matchingRouter);
  return app;
}

describe('Driver Matching Routes', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('GET /v1/driver/matching/weights', () => {
    it('returns default weights when matching_model_weights table does not exist', async () => {
      // getActiveWeights catches error and returns DEFAULT_WEIGHTS
      mockQuery.mockRejectedValueOnce(new Error('relation "matching_model_weights" does not exist'));

      const res = await request(app).get('/v1/driver/matching/weights');
      expect(res.status).toBe(200);
      expect(res.body.weights).toBeDefined();
      expect(res.body.weights.location).toBe(0.25);
      expect(res.body.weights.pay).toBe(0.22);
      expect(res.body.weights.safety).toBe(0.20);
      expect(res.body.weights.culture).toBe(0.15);
      expect(res.body.weights.routeType).toBe(0.10);
      expect(res.body.weights.fleetAge).toBe(0.08);
      expect(res.body.isDefault).toBe(true);
    });

    it('returns custom weights when table has active row', async () => {
      const customWeights = { location: 0.30, pay: 0.20, safety: 0.20, culture: 0.10, routeType: 0.10, fleetAge: 0.10 };
      mockQuery.mockResolvedValueOnce({ rows: [{ weights: customWeights }] });

      const res = await request(app).get('/v1/driver/matching/weights');
      expect(res.status).toBe(200);
      expect(res.body.weights.location).toBe(0.30);
      expect(res.body.isDefault).toBe(false);
    });
  });

  describe('GET /v1/driver/matching/model-info', () => {
    it('returns default model info when no matching_model_weights table', async () => {
      // safeQuery catches "does not exist" and returns { rows: [] }
      mockQuery.mockRejectedValueOnce(new Error('relation "matching_model_weights" does not exist'));

      const res = await request(app).get('/v1/driver/matching/model-info');
      expect(res.status).toBe(200);
      expect(res.body.modelVersion).toBe('default');
      expect(res.body.weights).toBeDefined();
      expect(res.body.weights.location).toBe(0.25);
      expect(res.body.trainingMetrics).toBeNull();
    });

    it('returns model info from active row', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          model_version: 'v2.1',
          weights: { location: 0.30, pay: 0.25, safety: 0.15, culture: 0.10, routeType: 0.10, fleetAge: 0.10 },
          training_metrics: { accuracy: 0.92, f1: 0.88 },
          promoted_at: '2026-03-01T00:00:00Z',
        }],
      });

      const res = await request(app).get('/v1/driver/matching/model-info');
      expect(res.status).toBe(200);
      expect(res.body.modelVersion).toBe('v2.1');
      expect(res.body.trainingMetrics.accuracy).toBe(0.92);
      expect(res.body.promotedAt).toBe('2026-03-01T00:00:00Z');
    });
  });

  describe('POST /v1/driver/matching/detect-mutual', () => {
    it('returns mutual match when both sides interested', async () => {
      // First call: getActiveWeights (may or may not be called depending on route)
      // For detect-mutual: two safeQuery calls for interests + views
      mockQuery
        .mockResolvedValueOnce({ rows: [{ _id: 'interest-1', data: { driver_id: 'd1', carrier_dot: '123456' } }] })
        .mockResolvedValueOnce({ rows: [{ _id: 'view-1', data: { driver_id: 'd1', carrier_dot: '123456' } }] });

      const res = await request(app)
        .post('/v1/driver/matching/detect-mutual')
        .send({ driverId: 'd1', carrierDot: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.isMutualMatch).toBe(true);
      expect(res.body.driverInterested).toBe(true);
      expect(res.body.carrierViewed).toBe(true);
    });

    it('returns no mutual match when only driver interested', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ _id: 'interest-1', data: { driver_id: 'd1', carrier_dot: '123456' } }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/v1/driver/matching/detect-mutual')
        .send({ driverId: 'd1', carrierDot: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.isMutualMatch).toBe(false);
      expect(res.body.driverInterested).toBe(true);
      expect(res.body.carrierViewed).toBe(false);
    });

    it('returns no mutual match when neither side interested', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/v1/driver/matching/detect-mutual')
        .send({ driverId: 'd1', carrierDot: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.isMutualMatch).toBe(false);
      expect(res.body.driverInterested).toBe(false);
      expect(res.body.carrierViewed).toBe(false);
    });
  });
});
