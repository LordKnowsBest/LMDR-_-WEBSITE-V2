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
