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

/* ── Service Health Check (server-side to avoid CORS) ── */

const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

interface ServiceHealthResult {
  key: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
}

export async function getServiceHealth(): Promise<ServiceHealthResult[]> {
  const services = [
    { key: 'api-gateway', url: process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app' },
    { key: 'ai-intelligence', url: process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app' },
    { key: 'analytics-pipe', url: process.env.LMDR_ANALYTICS_SERVICE_URL || 'https://lmdr-analytics-service-140035137711.us-central1.run.app' },
  ];

  const results = await Promise.all(
    services.map(async (svc): Promise<ServiceHealthResult> => {
      try {
        const start = Date.now();
        const res = await fetch(`${svc.url}/health`, {
          headers: { 'Authorization': `Bearer ${INTERNAL_KEY}` },
          signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Date.now() - start;
        return { key: svc.key, status: res.ok ? 'healthy' : 'degraded', latencyMs };
      } catch {
        return { key: svc.key, status: 'down', latencyMs: -1 };
      }
    })
  );

  return results;
}
