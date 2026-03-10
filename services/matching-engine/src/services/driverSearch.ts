import { query, buildSelectQuery, buildCountQuery, getTableName } from '@lmdr/db';
import type { QueryFilters } from '@lmdr/types';

interface DriverSearchParams {
  cdlClass?: string;
  state?: string;
  freightType?: string;
  limit: number;
  offset: number;
}

interface SearchResult {
  records: Record<string, unknown>[];
  total: number;
}

const TABLE = getTableName('driverProfiles');

export async function searchDrivers(params: DriverSearchParams): Promise<SearchResult> {
  const filters: QueryFilters[] = [];

  // Only searchable drivers
  filters.push({ field: 'isSearchable', operator: 'eq', value: 'true' });

  if (params.cdlClass) {
    filters.push({ field: 'cdlClass', operator: 'eq', value: params.cdlClass });
  }
  if (params.state) {
    filters.push({ field: 'homeState', operator: 'eq', value: params.state });
  }
  if (params.freightType) {
    filters.push({ field: 'freightPreference', operator: 'hasSome', value: [params.freightType] });
  }

  const selectQ = buildSelectQuery(TABLE, {
    filters,
    limit: params.limit,
    skip: params.offset,
    sort: [{ field: 'yearsExperience', direction: 'desc' }],
  });
  const countQ = buildCountQuery(TABLE, { filters });

  const [dataResult, countResult] = await Promise.all([
    query(selectQ.sql, selectQ.params),
    query(countQ.sql, countQ.params),
  ]);

  const records = dataResult.rows.map((row: { _id: string; data: Record<string, unknown> }) => ({
    _id: row._id,
    ...row.data,
  }));

  return {
    records,
    total: Number(countResult.rows[0].count),
  };
}
