import type { QueryFilters, SortClause } from '@lmdr/types';

interface WhereResult {
  sql: string;
  params: unknown[];
}

interface QueryResult {
  sql: string;
  params: unknown[];
}

export function buildWhereClause(filters: QueryFilters[] = []): WhereResult {
  if (!filters || filters.length === 0) return { sql: '', params: [] };

  const parts: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  for (const { field, operator, value } of filters) {
    const fieldPath = `data->>'${field}'`;
    const arrFieldPath = `data->'${field}'`;

    switch (operator) {
      case 'eq':
        parts.push(`${fieldPath} = $${paramIndex}`);
        params.push(String(value));
        paramIndex++;
        break;

      case 'ne':
        parts.push(`${fieldPath} != $${paramIndex}`);
        params.push(String(value));
        paramIndex++;
        break;

      case 'gt':
        parts.push(`(${fieldPath})::numeric > $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'gte':
        parts.push(`(${fieldPath})::numeric >= $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'lt':
        parts.push(`(${fieldPath})::numeric < $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'lte':
        parts.push(`(${fieldPath})::numeric <= $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'contains':
        parts.push(`${fieldPath} ILIKE $${paramIndex}`);
        params.push(`%${value}%`);
        paramIndex++;
        break;

      case 'startsWith':
        parts.push(`${fieldPath} ILIKE $${paramIndex}`);
        params.push(`${value}%`);
        paramIndex++;
        break;

      case 'hasSome':
        parts.push(`${arrFieldPath} ?| $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'hasAll':
        parts.push(`${arrFieldPath} ?& $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'isEmpty':
        parts.push(`(${fieldPath} IS NULL OR ${fieldPath} = '')`);
        break;

      case 'isNotEmpty':
        parts.push(`(${fieldPath} IS NOT NULL AND ${fieldPath} != '')`);
        break;

      default:
        throw new Error(`Unsupported filter operator: "${operator}"`);
    }
  }

  return { sql: parts.join(' AND '), params };
}

export function buildSelectQuery(
  tableName: string,
  { filters = [], limit = 50, skip = 0, sort = [] }: {
    filters?: QueryFilters[];
    limit?: number;
    skip?: number;
    sort?: SortClause[];
  } = {}
): QueryResult {
  const { sql: whereSql, params } = buildWhereClause(filters);
  const safeLimit = Math.min(parseInt(String(limit)) || 50, 500);
  const safeSkip = parseInt(String(skip)) || 0;

  let sql = `SELECT _id, airtable_id, _created_at, _updated_at, data FROM "${tableName}"`;

  if (whereSql) sql += ` WHERE ${whereSql}`;

  if (sort && sort.length > 0) {
    const orderParts = sort.map(({ field, direction }) => {
      const dir = direction?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      return `data->>'${field}' ${dir}`;
    });
    sql += ` ORDER BY ${orderParts.join(', ')}`;
  } else {
    sql += ' ORDER BY _created_at DESC';
  }

  const limitIdx = params.length + 1;
  sql += ` LIMIT $${limitIdx} OFFSET $${limitIdx + 1}`;
  params.push(safeLimit, safeSkip);

  return { sql, params };
}

export function buildCountQuery(
  tableName: string,
  { filters = [] }: { filters?: QueryFilters[] } = {}
): QueryResult {
  const { sql: whereSql, params } = buildWhereClause(filters);
  let sql = `SELECT COUNT(*) AS count FROM "${tableName}"`;
  if (whereSql) sql += ` WHERE ${whereSql}`;
  return { sql, params };
}

export function buildInsertQuery(
  tableName: string,
  { _id, airtable_id, data }: { _id: string; airtable_id?: string; data: Record<string, unknown> }
): QueryResult {
  const sql = `INSERT INTO "${tableName}" (_id, airtable_id, _created_at, _updated_at, data)
    VALUES ($1, $2, NOW(), NOW(), $3)
    RETURNING _id, airtable_id, _created_at, _updated_at, data`;
  return { sql, params: [_id, airtable_id || _id, JSON.stringify(data)] };
}

export function buildUpdateQuery(
  tableName: string,
  id: string,
  data: Record<string, unknown>
): QueryResult {
  const sql = `UPDATE "${tableName}"
    SET data = data || $2, _updated_at = NOW()
    WHERE _id = $1
    RETURNING _id, airtable_id, _created_at, _updated_at, data`;
  return { sql, params: [id, JSON.stringify(data)] };
}
