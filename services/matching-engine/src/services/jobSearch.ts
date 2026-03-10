import { query, buildSelectQuery, buildCountQuery, getTableName } from '@lmdr/db';
import type { QueryFilters } from '@lmdr/types';

interface JobSearchParams {
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  cdlClass?: string;
  freightType?: string;
  limit: number;
  offset: number;
}

interface SearchResult {
  records: Record<string, unknown>[];
  total: number;
}

const TABLE = getTableName('jobPostings');

export async function searchJobs(params: JobSearchParams): Promise<SearchResult> {
  const filters: QueryFilters[] = [];

  // Status must be open
  filters.push({ field: 'status', operator: 'eq', value: 'open' });

  if (params.cdlClass) {
    filters.push({ field: 'cdlRequired', operator: 'eq', value: params.cdlClass });
  }
  if (params.freightType) {
    filters.push({ field: 'freightType', operator: 'eq', value: params.freightType });
  }

  const selectQ = buildSelectQuery(TABLE, {
    filters,
    limit: params.limit,
    skip: params.offset,
    sort: [{ field: 'postedAt', direction: 'desc' }],
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

  // If lat/lng provided, filter by distance post-query (geo filtering in JSONB)
  let filtered = records;
  if (params.lat && params.lng && params.radiusMiles) {
    filtered = records.filter((r: Record<string, unknown>) => {
      const jobLat = Number(r.lat);
      const jobLng = Number(r.lng);
      if (!jobLat || !jobLng) return true; // include jobs without coordinates
      const dist = haversineDistance(params.lat!, params.lng!, jobLat, jobLng);
      return dist <= params.radiusMiles!;
    });
  }

  return {
    records: filtered,
    total: Number(countResult.rows[0].count),
  };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
