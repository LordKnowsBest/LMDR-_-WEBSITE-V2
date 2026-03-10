/**
 * JSONB filter DSL → parameterized SQL query builder.
 * Accepts the same filter format as dataAccess.jsw.
 */

/**
 * Builds a parameterized WHERE clause from the filter DSL.
 * @param {Array<{field: string, operator: string, value: any}>} filters
 * @returns {{ sql: string, params: any[] }}
 */
export function buildWhereClause(filters = []) {
  if (!filters || filters.length === 0) return { sql: '', params: [] };

  const parts = [];
  const params = [];
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

/**
 * Builds a full SELECT query for a JSONB table.
 */
export function buildSelectQuery(tableName, { filters = [], limit = 50, skip = 0, sort = [] } = {}) {
  const { sql: whereSql, params } = buildWhereClause(filters);
  const safeLimit = Math.min(parseInt(limit) || 50, 500);
  const safeSkip = parseInt(skip) || 0;

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

/**
 * Builds a COUNT(*) query for a JSONB table.
 */
export function buildCountQuery(tableName, { filters = [] } = {}) {
  const { sql: whereSql, params } = buildWhereClause(filters);
  let sql = `SELECT COUNT(*) AS count FROM "${tableName}"`;
  if (whereSql) sql += ` WHERE ${whereSql}`;
  return { sql, params };
}

/**
 * Builds an INSERT query for a JSONB table.
 */
export function buildInsertQuery(tableName, { _id, airtable_id, data }) {
  const sql = `INSERT INTO "${tableName}" (_id, airtable_id, _created_at, _updated_at, data)
    VALUES ($1, $2, NOW(), NOW(), $3)
    RETURNING _id, airtable_id, _created_at, _updated_at, data`;
  return { sql, params: [_id, airtable_id || _id, JSON.stringify(data)] };
}

/**
 * Builds an UPDATE query for a JSONB table.
 */
export function buildUpdateQuery(tableName, id, data) {
  const sql = `UPDATE "${tableName}"
    SET data = data || $2, _updated_at = NOW()
    WHERE _id = $1
    RETURNING _id, airtable_id, _created_at, _updated_at, data`;
  return { sql, params: [id, JSON.stringify(data)] };
}
