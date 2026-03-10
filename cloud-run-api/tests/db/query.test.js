import { buildWhereClause, buildSelectQuery, buildCountQuery, buildInsertQuery, buildUpdateQuery } from '../../src/db/query.js';

describe('buildWhereClause', () => {
  it('handles eq operator', () => {
    const { sql, params } = buildWhereClause([
      { field: 'state', operator: 'eq', value: 'TX' }
    ]);
    expect(sql).toBe("data->>'state' = $1");
    expect(params).toEqual(['TX']);
  });

  it('handles ne operator', () => {
    const { sql, params } = buildWhereClause([
      { field: 'status', operator: 'ne', value: 'inactive' }
    ]);
    expect(sql).toBe("data->>'status' != $1");
    expect(params).toEqual(['inactive']);
  });

  it('handles gte operator with numeric cast', () => {
    const { sql, params } = buildWhereClause([
      { field: 'num_trucks', operator: 'gte', value: 5 }
    ]);
    expect(sql).toContain('::numeric >= $1');
    expect(params).toEqual([5]);
  });

  it('handles multiple filters with AND', () => {
    const { sql, params } = buildWhereClause([
      { field: 'state', operator: 'eq', value: 'TX' },
      { field: 'is_active', operator: 'eq', value: 'true' }
    ]);
    expect(sql).toContain(' AND ');
    expect(params).toHaveLength(2);
  });

  it('handles hasSome with array', () => {
    const { sql, params } = buildWhereClause([
      { field: 'freight_type', operator: 'hasSome', value: ['Dry Van', 'Reefer'] }
    ]);
    expect(sql).toContain("data->'freight_type' ?| $1");
    expect(params[0]).toEqual(['Dry Van', 'Reefer']);
  });

  it('handles contains with ILIKE', () => {
    const { sql, params } = buildWhereClause([
      { field: 'company_name', operator: 'contains', value: 'Transport' }
    ]);
    expect(sql).toContain('ILIKE');
    expect(params[0]).toBe('%Transport%');
  });

  it('handles startsWith', () => {
    const { sql, params } = buildWhereClause([
      { field: 'name', operator: 'startsWith', value: 'ABC' }
    ]);
    expect(sql).toContain('ILIKE');
    expect(params[0]).toBe('ABC%');
  });

  it('handles isEmpty', () => {
    const { sql, params } = buildWhereClause([
      { field: 'email', operator: 'isEmpty' }
    ]);
    expect(sql).toContain('IS NULL');
    expect(params).toEqual([]);
  });

  it('handles isNotEmpty', () => {
    const { sql, params } = buildWhereClause([
      { field: 'email', operator: 'isNotEmpty' }
    ]);
    expect(sql).toContain('IS NOT NULL');
    expect(params).toEqual([]);
  });

  it('returns empty string for no filters', () => {
    const { sql, params } = buildWhereClause([]);
    expect(sql).toBe('');
    expect(params).toEqual([]);
  });

  it('throws for unsupported operator', () => {
    expect(() => buildWhereClause([
      { field: 'x', operator: 'regex', value: '.*' }
    ])).toThrow(/unsupported filter operator/i);
  });
});

describe('buildSelectQuery', () => {
  it('builds a query with limit and offset', () => {
    const { sql, params } = buildSelectQuery('airtable_carriers', {
      filters: [{ field: 'state', operator: 'eq', value: 'TX' }],
      limit: 25,
      skip: 0,
      sort: [{ field: 'combined_score', direction: 'desc' }]
    });
    expect(sql).toContain('SELECT');
    expect(sql).toContain('"airtable_carriers"');
    expect(sql).toContain('ORDER BY');
    expect(sql).toContain('LIMIT');
    expect(params).toContain('TX');
  });

  it('caps limit at 500', () => {
    const { sql, params } = buildSelectQuery('airtable_carriers', { limit: 9999 });
    expect(params[params.length - 2]).toBe(500);
  });

  it('defaults to ORDER BY _created_at DESC', () => {
    const { sql } = buildSelectQuery('airtable_carriers', {});
    expect(sql).toContain('ORDER BY _created_at DESC');
  });
});

describe('buildCountQuery', () => {
  it('builds a COUNT query', () => {
    const { sql, params } = buildCountQuery('airtable_carriers', {
      filters: [{ field: 'state', operator: 'eq', value: 'TX' }]
    });
    expect(sql).toContain('COUNT(*)');
    expect(sql).toContain('"airtable_carriers"');
    expect(params).toContain('TX');
  });

  it('builds COUNT without filters', () => {
    const { sql, params } = buildCountQuery('airtable_carriers');
    expect(sql).toBe('SELECT COUNT(*) AS count FROM "airtable_carriers"');
    expect(params).toEqual([]);
  });
});

describe('buildInsertQuery', () => {
  it('builds an INSERT with RETURNING', () => {
    const { sql, params } = buildInsertQuery('airtable_carriers', {
      _id: 'uuid-1', airtable_id: 'rec123', data: { name: 'Test' }
    });
    expect(sql).toContain('INSERT INTO');
    expect(sql).toContain('RETURNING');
    expect(params).toEqual(['uuid-1', 'rec123', '{"name":"Test"}']);
  });
});

describe('buildUpdateQuery', () => {
  it('builds an UPDATE with JSONB merge', () => {
    const { sql, params } = buildUpdateQuery('airtable_carriers', 'uuid-1', { name: 'Updated' });
    expect(sql).toContain('data || $2');
    expect(sql).toContain('RETURNING');
    expect(params[0]).toBe('uuid-1');
  });
});
