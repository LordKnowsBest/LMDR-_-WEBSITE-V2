import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  query: mockQuery,
}));
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: jest.fn(),
  insertAuditEvent: jest.fn(),
}));

const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: wellnessRouter } = await import('../../../src/routes/driver/wellness.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { uid: 'test-driver', role: 'driver', type: 'firebase' };
    next();
  });
  app.use('/v1/driver/wellness', wellnessRouter);
  return app;
}

describe('Driver Wellness Routes', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('GET /v1/driver/wellness/health', () => {
    it('returns health resources', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { _id: 'r1', airtable_id: null, _created_at: '2026-03-01', _updated_at: '2026-03-01', data: { title: 'Stretching Guide', category: 'fitness' } },
          { _id: 'r2', airtable_id: null, _created_at: '2026-03-02', _updated_at: '2026-03-02', data: { title: 'Sleep Tips', category: 'sleep' } },
        ],
      });

      const res = await request(app).get('/v1/driver/wellness/health');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0].title).toBe('Stretching Guide');
      expect(res.body.totalCount).toBe(2);
    });

    it('filters by category', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { _id: 'r1', airtable_id: null, _created_at: '2026-03-01', _updated_at: '2026-03-01', data: { title: 'Stretching Guide', category: 'fitness' } },
        ],
      });

      const res = await request(app).get('/v1/driver/wellness/health?category=fitness');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].category).toBe('fitness');
      // Verify the SQL included category filter
      expect(mockQuery.mock.calls[0][0]).toContain("data->>'category'");
    });

    it('returns empty array when no resources exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/wellness/health');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.totalCount).toBe(0);
    });
  });

  describe('GET /v1/driver/wellness/pets/nearby', () => {
    it('returns locations filtered by distance', async () => {
      // Two locations: one nearby (within 50 mi), one far away
      mockQuery.mockResolvedValueOnce({
        rows: [
          { _id: 'loc1', airtable_id: null, _created_at: '2026-03-01', _updated_at: '2026-03-01', data: { name: 'Truck Stop A', lat: 39.1, lng: -84.5, amenities: ['dog_park'] } },
          { _id: 'loc2', airtable_id: null, _created_at: '2026-03-01', _updated_at: '2026-03-01', data: { name: 'Rest Area B', lat: 40.0, lng: -84.5, amenities: ['pet_area'] } },
          { _id: 'loc3', airtable_id: null, _created_at: '2026-03-01', _updated_at: '2026-03-01', data: { name: 'Far Away Stop', lat: 45.0, lng: -90.0, amenities: [] } },
        ],
      });

      // Search near Cincinnati (39.1, -84.5) with 75 mile radius
      const res = await request(app).get('/v1/driver/wellness/pets/nearby?lat=39.1&lng=-84.5&radiusMiles=75');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      // First result should be closest
      expect(res.body.items[0].name).toBe('Truck Stop A');
      expect(res.body.items[0].distance).toBeDefined();
      // Far away stop should be excluded
      const farStop = res.body.items.find(l => l.name === 'Far Away Stop');
      expect(farStop).toBeUndefined();
    });

    it('returns 400 when lat/lng missing', async () => {
      const res = await request(app).get('/v1/driver/wellness/pets/nearby');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('lat');
    });

    it('returns empty when no locations in range', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/wellness/pets/nearby?lat=39.1&lng=-84.5');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
    });
  });

  describe('GET /v1/driver/wellness/mentors', () => {
    it('returns available mentors', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { _id: 'm1', airtable_id: null, _created_at: '2026-03-01', _updated_at: '2026-03-01', data: { name: 'John Veteran', status: 'available', years_experience: 15, specialties: ['hazmat', 'OTR'] } },
          { _id: 'm2', airtable_id: null, _created_at: '2026-03-01', _updated_at: '2026-03-01', data: { name: 'Jane Expert', status: 'available', years_experience: 10, specialties: ['flatbed'] } },
        ],
      });

      const res = await request(app).get('/v1/driver/wellness/mentors');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0].name).toBe('John Veteran');
      expect(res.body.totalCount).toBe(2);
      // Verify query filters by status=available
      expect(mockQuery.mock.calls[0][0]).toContain("'available'");
    });

    it('returns empty when no mentors available', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/wellness/mentors');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
    });
  });

  describe('POST /v1/driver/wellness/mentors/request', () => {
    it('creates mentor match when mentor is eligible (5+ years)', async () => {
      // First query: get mentor profile
      mockQuery.mockResolvedValueOnce({
        rows: [{ _id: 'm1', data: { name: 'John Veteran', status: 'available', years_experience: 15 } }],
      });
      // Second query: insert mentor match
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/v1/driver/wellness/mentors/request')
        .send({ driverId: 'd1', mentorId: 'm1', goals: 'Learn hazmat routes' });

      expect(res.status).toBe(201);
      expect(res.body.driver_id).toBe('d1');
      expect(res.body.mentor_id).toBe('m1');
      expect(res.body.status).toBe('pending');
    });

    it('rejects mentor with less than 5 years experience', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ _id: 'm2', data: { name: 'New Driver', status: 'available', years_experience: 3 } }],
      });

      const res = await request(app)
        .post('/v1/driver/wellness/mentors/request')
        .send({ driverId: 'd1', mentorId: 'm2', goals: 'Get advice' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('MENTOR_NOT_ELIGIBLE');
    });

    it('returns 404 when mentor not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/v1/driver/wellness/mentors/request')
        .send({ driverId: 'd1', mentorId: 'nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('MENTOR_NOT_FOUND');
    });

    it('returns 400 when required fields missing', async () => {
      const res = await request(app)
        .post('/v1/driver/wellness/mentors/request')
        .send({ driverId: 'd1' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing');
    });
  });

  describe('POST /v1/driver/wellness/health/tips', () => {
    it('submits a health tip with pending status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/v1/driver/wellness/health/tips')
        .send({ driverId: 'd1', category: 'nutrition', title: 'Healthy Snacks', content: 'Pack almonds and fruit' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Healthy Snacks');
      expect(res.body.status).toBe('pending');
      expect(res.body.driver_id).toBe('d1');
    });

    it('returns 400 when required fields missing', async () => {
      const res = await request(app)
        .post('/v1/driver/wellness/health/tips')
        .send({ driverId: 'd1' });

      expect(res.status).toBe(400);
    });
  });
});
