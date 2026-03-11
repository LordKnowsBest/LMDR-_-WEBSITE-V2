import { jest } from '@jest/globals';

// Mock dependencies before importing router
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({ query: mockQuery }));
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: jest.fn(),
  insertAuditEvent: jest.fn(),
}));

const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: router } = await import('../../../src/routes/driver/financial.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.auth = { uid: 'test-driver', type: 'firebase' }; next(); });
  app.use('/v1/driver/financial', router);
  return app;
}

describe('driver/financial', () => {
  let app;
  beforeEach(() => { app = createTestApp(); jest.clearAllMocks(); });

  // ── POST /:id/expenses ──
  describe('POST /:id/expenses', () => {
    test('creates expense record', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{}] }); // INSERT
      const res = await request(app)
        .post('/v1/driver/financial/drv1/expenses')
        .send({ amount: 85.50, category: 'fuel', description: 'Diesel fill-up', date: '2026-03-10' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.expense.driver_id).toBe('drv1');
      expect(res.body.expense.amount).toBe(85.5);
      expect(res.body.expense.category).toBe('fuel');
    });

    test('rejects invalid category', async () => {
      const res = await request(app)
        .post('/v1/driver/financial/drv1/expenses')
        .send({ amount: 50, category: 'gambling' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid category/);
    });

    test('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/v1/driver/financial/drv1/expenses')
        .send({ description: 'no amount or category' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/amount and category are required/);
    });
  });

  // ── GET /:id/expenses ──
  describe('GET /:id/expenses', () => {
    test('returns paginated expense list', async () => {
      const now = new Date();
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { _id: 'exp1', airtable_id: 'exp1', _created_at: now, _updated_at: now, data: { driver_id: 'drv1', amount: 50, category: 'tolls' } },
            { _id: 'exp2', airtable_id: 'exp2', _created_at: now, _updated_at: now, data: { driver_id: 'drv1', amount: 120, category: 'fuel' } },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ total: '2' }] });

      const res = await request(app).get('/v1/driver/financial/drv1/expenses');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.items[0].category).toBe('tolls');
    });

    test('filters by category', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const res = await request(app).get('/v1/driver/financial/drv1/expenses?category=fuel');
      expect(res.status).toBe(200);
      // Verify the category filter was included in the query
      const sqlCall = mockQuery.mock.calls[0];
      expect(sqlCall[0]).toContain("data->>'category'");
      expect(sqlCall[1]).toContain('fuel');
    });
  });

  // ── GET /:id/expenses/summary ──
  describe('GET /:id/expenses/summary', () => {
    test('returns aggregate summary', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_spend: '350.75' }] })
        .mockResolvedValueOnce({
          rows: [
            { category: 'fuel', total: '200.50', count: '4' },
            { category: 'tolls', total: '150.25', count: '6' },
          ],
        });

      const res = await request(app).get('/v1/driver/financial/drv1/expenses/summary');
      expect(res.status).toBe(200);
      expect(res.body.totalSpend).toBe(350.75);
      expect(res.body.byCategory).toHaveLength(2);
      expect(res.body.byCategory[0].category).toBe('fuel');
      expect(res.body.byCategory[0].total).toBe(200.5);
      expect(res.body.byCategory[0].count).toBe(4);
      expect(typeof res.body.averagePerDay).toBe('number');
      expect(res.body.period).toBe('month');
      expect(res.body.days).toBe(30);
    });

    test('supports week period', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_spend: '100' }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/v1/driver/financial/drv1/expenses/summary?period=week');
      expect(res.status).toBe(200);
      expect(res.body.days).toBe(7);
      expect(res.body.averagePerDay).toBeCloseTo(100 / 7, 1);
    });
  });

  // ── PUT /:id/expense/:expenseId ──
  describe('PUT /:id/expense/:expenseId', () => {
    test('updates expense with ownership check', async () => {
      const now = new Date();
      mockQuery
        .mockResolvedValueOnce({ rows: [{ _id: 'exp1', data: { driver_id: 'drv1' } }] }) // ownership check
        .mockResolvedValueOnce({ rows: [{ _id: 'exp1', airtable_id: 'exp1', _created_at: now, _updated_at: now, data: { driver_id: 'drv1', amount: 100, category: 'fuel' } }] }); // update

      const res = await request(app)
        .put('/v1/driver/financial/drv1/expense/exp1')
        .send({ amount: 100 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('returns 404 when expense not owned by driver', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // ownership check fails
      const res = await request(app)
        .put('/v1/driver/financial/drv1/expense/exp-other')
        .send({ amount: 100 });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /:id/expense/:expenseId ──
  describe('DELETE /:id/expense/:expenseId', () => {
    test('deletes expense with ownership check', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ _id: 'exp1' }] }) // ownership check
        .mockResolvedValueOnce({ rows: [] }); // delete

      const res = await request(app).delete('/v1/driver/financial/drv1/expense/exp1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('returns 404 when expense not owned by driver', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // ownership check fails
      const res = await request(app).delete('/v1/driver/financial/drv1/expense/exp-other');
      expect(res.status).toBe(404);
    });
  });
});
