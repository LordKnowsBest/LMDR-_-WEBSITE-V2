'use server';

import { adminFetch } from '@/lib/admin-api';

export async function getMatchingWeights() {
  return adminFetch<{ carrier: Record<string, number>; driver: Record<string, number> }>(
    '/config/matching-weights'
  );
}

export async function updateMatchingWeights(weights: { carrier?: Record<string, number>; driver?: Record<string, number> }) {
  return adminFetch<{ success: boolean }>('/config/matching-weights', {
    method: 'PUT',
    body: JSON.stringify(weights),
  });
}

export async function getSystemSettings() {
  return adminFetch<Record<string, unknown>>('/config/system');
}

export async function updateSystemSettings(settings: Record<string, unknown>) {
  return adminFetch<{ success: boolean }>('/config/system', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function getTierLimits() {
  return adminFetch<unknown[]>('/config/tiers');
}

export async function updateTierLimits(tiers: unknown[]) {
  return adminFetch<{ success: boolean }>('/config/tiers', {
    method: 'PUT',
    body: JSON.stringify({ tiers }),
  });
}
