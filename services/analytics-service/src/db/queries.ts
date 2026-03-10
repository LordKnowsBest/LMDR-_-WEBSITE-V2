import { query, getTableName } from '@lmdr/db';

/**
 * Helper: count records in a JSONB table with an optional data filter.
 * E.g. countRecords('driverProfiles', { onboardingComplete: 'true' })
 */
export async function countRecords(
  collectionKey: string,
  filter?: Record<string, string>
): Promise<number> {
  const table = getTableName(collectionKey);
  let sql = `SELECT COUNT(*) as count FROM "${table}"`;
  const params: string[] = [];

  if (filter) {
    const clauses = Object.entries(filter).map(([key, value], i) => {
      params.push(value);
      return `data->>'${key}' = $${i + 1}`;
    });
    sql += ' WHERE ' + clauses.join(' AND ');
  }

  const result = await query(sql, params);
  return Number(result.rows[0].count);
}

/**
 * Helper: get distinct values from a JSONB field with counts.
 */
export async function distinctCounts(
  collectionKey: string,
  field: string,
  limit = 100
): Promise<Array<{ value: string; count: number }>> {
  const table = getTableName(collectionKey);
  const result = await query(
    `SELECT data->>'${field}' as value, COUNT(*) as count
     FROM "${table}"
     WHERE data->>'${field}' IS NOT NULL
     GROUP BY data->>'${field}'
     ORDER BY count DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((r) => ({ value: r.value as string, count: Number(r.count) }));
}

/**
 * Helper: get records ordered by a JSONB field with pagination.
 */
export async function getRecordsPaginated(
  collectionKey: string,
  orderByField: string,
  limit = 50,
  offset = 0,
  direction: 'ASC' | 'DESC' = 'DESC'
): Promise<Array<{ _id: string; data: Record<string, unknown> }>> {
  const table = getTableName(collectionKey);
  const result = await query(
    `SELECT _id, data FROM "${table}"
     ORDER BY data->>'${orderByField}' ${direction}
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows.map((r) => ({ _id: r._id as string, data: r.data as Record<string, unknown> }));
}
