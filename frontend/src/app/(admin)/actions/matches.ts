'use server';

import { adminFetch } from '@/lib/admin-api';

interface MatchQueryOptions {
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  limit?: number;
  skip?: number;
}

export async function listMatches(options: MatchQueryOptions = {}) {
  return adminFetch<{ items: unknown[]; totalCount: number; limit: number; skip: number }>(
    '/matches/query',
    { method: 'POST', body: JSON.stringify(options) }
  );
}

export async function listInterests(options: MatchQueryOptions = {}) {
  return adminFetch<{ items: unknown[]; totalCount: number }>(
    '/matches/interests',
    { method: 'POST', body: JSON.stringify(options) }
  );
}

export async function getMatchStats() {
  return adminFetch<{
    thisWeek: number; total: number; conversionRate: number;
  }>('/matches/stats');
}

export async function exportMatchesCSV() {
  return adminFetch<string>('/matches/export');
}

export async function getMatch(id: string) {
  return adminFetch<unknown>(`/matches/${id}`);
}
