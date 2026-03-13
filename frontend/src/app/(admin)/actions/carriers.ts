'use server';

import { adminFetch } from '@/lib/admin-api';

interface CarrierQueryOptions {
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  search?: string;
  limit?: number;
  skip?: number;
}

export async function listCarriers(options: CarrierQueryOptions = {}) {
  return adminFetch<{ items: unknown[]; totalCount: number; limit: number; skip: number }>(
    '/carriers/query',
    { method: 'POST', body: JSON.stringify(options) }
  );
}

export async function getCarrierStats() {
  return adminFetch<{
    total: number; active: number; enriched: number; enrichmentPct: number;
  }>('/carriers/stats');
}

export async function getCarrier(id: string) {
  return adminFetch<unknown>(`/carriers/${id}`);
}

export async function lookupCarrierByDot(dot: string) {
  const result = await adminFetch<{ items: unknown[]; totalCount: number }>(
    '/carriers/query',
    {
      method: 'POST',
      body: JSON.stringify({
        filters: [{ field: 'dot_number', operator: 'eq', value: Number(dot) || dot }],
        limit: 1,
      }),
    }
  );
  return result.items?.[0] || null;
}
