'use server';

import { driverFetch } from '@/lib/driver-api';

export async function getRiskScore(id: string) {
  return driverFetch<{ riskScore: number; riskLevel: string; factors: Record<string, number>; recommendations: string[] }>(`/retention/${id}/risk`);
}

export async function getRiskHistory(id: string, limit = 12) {
  return driverFetch<unknown[]>(`/retention/${id}/risk/history?limit=${limit}`);
}

export async function getPerformance(id: string) {
  return driverFetch<unknown>(`/retention/${id}/performance`);
}

export async function getCarrierComparison(id: string) {
  return driverFetch<{ carrierMetrics: unknown; industryAverage: unknown }>(`/retention/${id}/carrier-comparison`);
}
