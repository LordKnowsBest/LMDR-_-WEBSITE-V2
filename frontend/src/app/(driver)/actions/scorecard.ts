'use server';

import { driverFetch } from '@/lib/driver-api';

export async function getCurrentScores(id: string) {
  return driverFetch<unknown>(`/scorecard/${id}/current`);
}

export async function getScoreHistory(id: string, period = 'monthly', limit = 12) {
  return driverFetch<unknown[]>(`/scorecard/${id}/history?period=${period}&limit=${limit}`);
}

export async function getRank(id: string) {
  return driverFetch<{ rank: number; totalDrivers: number; percentile: number }>(`/scorecard/${id}/rank`);
}

export async function getFleetComparison(id: string) {
  return driverFetch<{ driverScores: unknown; fleetAverage: unknown; comparison: unknown }>(`/scorecard/${id}/fleet-comparison`);
}
