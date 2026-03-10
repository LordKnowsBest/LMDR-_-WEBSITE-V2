// NOTE: This test requires the Cloud SQL Auth Proxy to be running
import { query, closePool } from '../../src/db/pool.js';

describe('pool (integration — requires proxy)', () => {
  afterAll(async () => {
    await closePool();
  });

  it('connects and returns a result', async () => {
    const result = await query('SELECT 1 + 1 AS sum');
    expect(result.rows[0].sum).toBe(2);
  }, 10000);

  it('can query an actual table', async () => {
    const result = await query('SELECT COUNT(*) AS cnt FROM airtable_carriers');
    expect(Number(result.rows[0].cnt)).toBeGreaterThan(0);
  }, 10000);
});
