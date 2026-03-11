'use server';

import { driverFetch } from '@/lib/driver-api';

export async function findJobs(driverId: string, limit = 20) {
  return driverFetch<{ matches: unknown[]; totalScored: number; modelVersion: string }>('/matching/find-jobs', {
    method: 'POST',
    body: JSON.stringify({ driverId, limit }),
  });
}

export async function findDrivers(carrierDot: string, limit = 20) {
  return driverFetch<{ drivers: unknown[]; totalScored: number }>('/matching/find-drivers', {
    method: 'POST',
    body: JSON.stringify({ carrierDot, limit }),
  });
}

export async function explainMatch(driverId: string, carrierDot: string) {
  return driverFetch<{ overallScore: number; summary: string; categories: unknown[] }>(`/matching/explain/${driverId}/${carrierDot}`);
}

export async function getWeights() {
  return driverFetch<{ weights: Record<string, number>; isDefault: boolean }>('/matching/weights');
}

export async function searchJobs(filters: { cdlClass?: string; jobType?: string; state?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (filters.cdlClass) params.set('cdlClass', filters.cdlClass);
  if (filters.jobType) params.set('jobType', filters.jobType);
  if (filters.state) params.set('state', filters.state);
  if (filters.limit) params.set('limit', String(filters.limit));
  return driverFetch<{ items: unknown[]; totalCount: number }>(`/matching/search/jobs?${params}`);
}

export async function searchDrivers(filters: { cdlClass?: string; state?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (filters.cdlClass) params.set('cdlClass', filters.cdlClass);
  if (filters.state) params.set('state', filters.state);
  if (filters.limit) params.set('limit', String(filters.limit));
  return driverFetch<{ items: unknown[]; totalCount: number }>(`/matching/search/drivers?${params}`);
}

export async function detectMutual(driverId: string, carrierDot: string) {
  return driverFetch<{ isMutualMatch: boolean; driverInterested: boolean; carrierViewed: boolean }>('/matching/detect-mutual', {
    method: 'POST',
    body: JSON.stringify({ driverId, carrierDot }),
  });
}

export async function getModelInfo() {
  return driverFetch<{ modelVersion: string; weights: Record<string, number>; trainingMetrics: unknown }>('/matching/model-info');
}
