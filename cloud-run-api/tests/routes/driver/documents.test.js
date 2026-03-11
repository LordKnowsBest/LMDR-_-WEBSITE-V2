import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies before importing router
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/db/pool.js', () => ({ query: mockQuery }));
jest.unstable_mockModule('../../../src/db/bigquery.js', () => ({
  insertLog: jest.fn(),
  insertAuditEvent: jest.fn(),
}));

const { default: router } = await import('../../../src/routes/driver/documents.js');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.auth = { uid: 'test-driver', type: 'firebase' }; next(); });
  app.use('/v1/driver/documents', router);
  return app;
}

describe('driver/documents', () => {
  let app;
  beforeEach(() => { app = createTestApp(); jest.clearAllMocks(); });

  test('GET /:id/list returns documents with expiration status', async () => {
    const pastDate = '2025-01-01';
    const futureDate = '2028-12-31';
    mockQuery.mockResolvedValueOnce({
      rows: [
        { _id: 'doc1', airtable_id: 'doc1', _created_at: new Date(), _updated_at: new Date(), data: { driver_id: 'drv1', doc_type: 'cdl', file_name: 'cdl.pdf', expiration_date: futureDate, status: 'approved' } },
        { _id: 'doc2', airtable_id: 'doc2', _created_at: new Date(), _updated_at: new Date(), data: { driver_id: 'drv1', doc_type: 'medical_card', file_name: 'med.pdf', expiration_date: pastDate, status: 'approved' } },
      ],
    });
    const res = await request(app).get('/v1/driver/documents/drv1/list');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.totalCount).toBe(2);
    // First doc (future date) should not be expired
    expect(res.body.items[0].is_expired).toBe(false);
    // Second doc (past date) should be expired
    expect(res.body.items[1].is_expired).toBe(true);
  });

  test('GET /:id/status returns compliance status', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { _id: 'doc1', airtable_id: 'doc1', _created_at: new Date(), _updated_at: new Date(), data: { driver_id: 'drv1', doc_type: 'cdl', status: 'approved' } },
        { _id: 'doc2', airtable_id: 'doc2', _created_at: new Date(), _updated_at: new Date(), data: { driver_id: 'drv1', doc_type: 'mvr', status: 'pending_review' } },
        { _id: 'doc3', airtable_id: 'doc3', _created_at: new Date(), _updated_at: new Date(), data: { driver_id: 'drv1', doc_type: 'drug_test', status: 'approved', expiration_date: '2020-01-01' } },
      ],
    });
    const res = await request(app).get('/v1/driver/documents/drv1/status');
    expect(res.status).toBe(200);
    expect(res.body.complete).toContain('cdl');
    expect(res.body.pendingReview).toContain('mvr');
    expect(res.body.expired).toContain('drug_test');
    expect(res.body.missing).toContain('medical_card');
    expect(res.body.missing).toContain('employment_history');
    expect(res.body.missing).not.toContain('cdl');
  });

  test('POST /:id/upload creates document record', async () => {
    // Insert into qualificationFiles
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Update driverProfiles doc count
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/v1/driver/documents/drv1/upload')
      .send({ docType: 'cdl', fileName: 'cdl-front.pdf', fileUrl: 'https://storage.example.com/cdl.pdf', expirationDate: '2028-06-15' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.document).toBeDefined();
    expect(res.body.document.doc_type).toBe('cdl');
    expect(res.body.document.status).toBe('pending_review');
    expect(res.body.document.driver_id).toBe('drv1');
    // Verify query was called for both insert and profile update
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  test('POST /:id/upload rejects invalid docType', async () => {
    const res = await request(app)
      .post('/v1/driver/documents/drv1/upload')
      .send({ docType: 'invalid_type', fileName: 'file.pdf' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_DOC_TYPE');
  });

  test('POST /:id/upload rejects missing fileName', async () => {
    const res = await request(app)
      .post('/v1/driver/documents/drv1/upload')
      .send({ docType: 'cdl' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_FILE_NAME');
  });

  test('PUT /:id/doc/:docId updates document metadata', async () => {
    // Ownership check
    mockQuery.mockResolvedValueOnce({
      rows: [{ _id: 'doc1', airtable_id: 'doc1', _created_at: new Date(), _updated_at: new Date(), data: { driver_id: 'drv1', doc_type: 'cdl' } }],
    });
    // Update returning
    mockQuery.mockResolvedValueOnce({
      rows: [{ _id: 'doc1', airtable_id: 'doc1', _created_at: new Date(), _updated_at: new Date(), data: { driver_id: 'drv1', doc_type: 'cdl', status: 'approved', notes: 'Verified' } }],
    });
    const res = await request(app)
      .put('/v1/driver/documents/drv1/doc/doc1')
      .send({ status: 'approved', notes: 'Verified' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.document.status).toBe('approved');
  });

  test('PUT /:id/doc/:docId returns 404 for wrong owner', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .put('/v1/driver/documents/drv1/doc/doc-wrong')
      .send({ status: 'approved' });
    expect(res.status).toBe(404);
  });

  test('DELETE /:id/doc/:docId deletes document and decrements count', async () => {
    // Ownership check
    mockQuery.mockResolvedValueOnce({
      rows: [{ _id: 'doc1', airtable_id: 'doc1', _created_at: new Date(), _updated_at: new Date(), data: { driver_id: 'drv1', doc_type: 'cdl' } }],
    });
    // Delete
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Decrement profile count
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/v1/driver/documents/drv1/doc/doc1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  test('DELETE /:id/doc/:docId returns 404 for wrong owner', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete('/v1/driver/documents/drv1/doc/doc-wrong');
    expect(res.status).toBe(404);
  });
});
