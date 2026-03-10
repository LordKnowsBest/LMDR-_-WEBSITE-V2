/**
 * Phase 4 Smoke Tests — search, files, and jobs routes on the deployed Cloud Run API
 *
 * These tests require:
 *   CLOUD_RUN_URL      — e.g. https://lmdr-api-140035137711.us-central1.run.app
 *   LMDR_INTERNAL_KEY  — service-to-service auth key
 *
 * Run:  CLOUD_RUN_URL=... LMDR_INTERNAL_KEY=... npm test -- tests/regression/phase4-smoke.test.js
 */

const BASE_URL = process.env.CLOUD_RUN_URL;
const AUTH_KEY = process.env.LMDR_INTERNAL_KEY;

const describeIf = (condition, name, fn) =>
  condition ? describe(name, fn) : describe.skip(name, fn);

describeIf(BASE_URL && AUTH_KEY, 'Phase 4 Cloud Run API smoke tests', () => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_KEY}`,
  };

  // ─── Health ────────────────────────────────────────────────────────────────

  it('GET /health returns ok + db ok', async () => {
    const res = await fetch(`${BASE_URL}/health`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
  });

  // ─── Search — carriers ─────────────────────────────────────────────────────

  it('GET /v1/search/carriers?q=transport returns items array', async () => {
    const res = await fetch(`${BASE_URL}/v1/search/carriers?q=transport&limit=5`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('GET /v1/search/carriers?q=nonexistent_xyz_12345 returns empty items', async () => {
    const res = await fetch(
      `${BASE_URL}/v1/search/carriers?q=nonexistent_xyz_12345&limit=5`,
      { headers }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBe(0);
  });

  // ─── Search — suggest ──────────────────────────────────────────────────────

  it('GET /v1/search/suggest?q=tr&type=carrier returns suggestions array', async () => {
    const res = await fetch(`${BASE_URL}/v1/search/suggest?q=tr&type=carrier`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.suggestions)).toBe(true);
  });

  it('GET /v1/search/suggest?q=x returns 400 (query too short)', async () => {
    const res = await fetch(`${BASE_URL}/v1/search/suggest?q=x`, { headers });
    expect(res.status).toBe(400);
  });

  // ─── Files ─────────────────────────────────────────────────────────────────

  it('POST /v1/files/signed-url returns url containing storage.googleapis.com', async () => {
    const res = await fetch(`${BASE_URL}/v1/files/signed-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bucket: 'driver-documents',
        filename: 'test.pdf',
        contentType: 'application/pdf',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.url).toBe('string');
    expect(body.url).toContain('storage.googleapis.com');
  });

  it('POST /v1/files/signed-url with invalid bucket returns 400', async () => {
    const res = await fetch(`${BASE_URL}/v1/files/signed-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bucket: 'invalid-bucket' }),
    });
    expect(res.status).toBe(400);
  });

  // ─── Jobs ──────────────────────────────────────────────────────────────────

  it('POST /v1/jobs/board-refresh returns duration_ms', async () => {
    const res = await fetch(`${BASE_URL}/v1/jobs/board-refresh`, {
      method: 'POST',
      headers,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.duration_ms).toBe('number');
  });

  // ─── Existing baselines ────────────────────────────────────────────────────

  it('POST /v1/carriers/count returns > 20000', async () => {
    const res = await fetch(`${BASE_URL}/v1/carriers/count`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(20000);
  });

  // ─── Observability ─────────────────────────────────────────────────────────

  it('x-trace-id header present on all responses', async () => {
    const endpoints = [
      { method: 'GET', path: '/health' },
      { method: 'GET', path: '/v1/search/carriers?q=transport&limit=1' },
      { method: 'GET', path: '/v1/carriers/count' },
    ];

    for (const { method, path } of endpoints) {
      const res = await fetch(`${BASE_URL}${path}`, { method, headers });
      const traceId = res.headers.get('x-trace-id');
      expect(traceId).toBeTruthy();
      expect(traceId.length).toBeGreaterThan(10);
    }
  });

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('GET /v1/search/carriers returns 401 without auth token', async () => {
    const res = await fetch(`${BASE_URL}/v1/search/carriers?q=transport`);
    expect(res.status).toBe(401);
  });
});
