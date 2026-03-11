'use server';

import { adminFetch } from '@/lib/admin-api';

interface LogQueryOptions {
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  limit?: number;
  skip?: number;
}

export async function getLogs(options: LogQueryOptions = {}) {
  return adminFetch<{ items: unknown[]; totalCount: number }>(
    '/observability/logs',
    { method: 'POST', body: JSON.stringify(options) }
  );
}

export async function getAnomalies() {
  return adminFetch<unknown[]>('/observability/anomalies');
}

export async function acknowledgeAnomaly(id: string) {
  return adminFetch<{ success: boolean }>(`/observability/anomalies/${id}/ack`, { method: 'POST' });
}

export async function resolveAnomaly(id: string) {
  return adminFetch<{ success: boolean }>(`/observability/anomalies/${id}/resolve`, { method: 'POST' });
}

export async function getAnomalyRules() {
  return adminFetch<unknown[]>('/observability/rules');
}

export async function createAnomalyRule(rule: Record<string, unknown>) {
  return adminFetch<{ _id: string }>('/observability/rules', {
    method: 'POST',
    body: JSON.stringify(rule),
  });
}

export async function updateAnomalyRule(id: string, updates: Record<string, unknown>) {
  return adminFetch<{ success: boolean }>(`/observability/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteAnomalyRule(id: string) {
  return adminFetch<{ success: boolean }>(`/observability/rules/${id}`, { method: 'DELETE' });
}
