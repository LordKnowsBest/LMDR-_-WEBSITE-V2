'use server';

import { adminFetch } from '@/lib/admin-api';

export async function getDashboardOverview() {
  return adminFetch<{
    drivers: { total: number; active: number; pending: number; activePct: number };
    carriers: { total: number; active: number; flagged: number };
    matchesThisWeek: number;
    enrichmentCoverage: number;
    unresolvedAlerts: number;
    recentActivity: unknown[];
  }>('/dashboard/overview');
}

export async function getQuickStats() {
  return adminFetch<{
    totalDrivers: number;
    totalCarriers: number;
    pendingReview: number;
    flaggedDrivers: number;
  }>('/dashboard/quick-stats');
}

export async function getAiUsage(period = '7d') {
  return adminFetch<{
    period: string;
    providers: Array<{ provider: string; calls: number; inputTokens: number; outputTokens: number; avgLatencyMs: number; totalCostUsd: number }>;
  }>(`/dashboard/ai-usage?period=${period}`);
}

/* ── Analytics Service Proxies (server-side to avoid CORS) ── */

const ANALYTICS_URL = process.env.LMDR_ANALYTICS_SERVICE_URL || 'https://lmdr-analytics-service-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

export async function getAnalyticsDashboard() {
  try {
    const res = await fetch(`${ANALYTICS_URL}/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function getFeatureAdoption() {
  try {
    const res = await fetch(`${ANALYTICS_URL}/analytics/feature-adoption`, {
      headers: {
        'Authorization': `Bearer ${INTERNAL_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}
