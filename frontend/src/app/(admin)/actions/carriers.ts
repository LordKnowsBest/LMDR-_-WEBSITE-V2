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
