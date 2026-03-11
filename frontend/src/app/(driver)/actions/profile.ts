'use server';

import { driverFetch } from '@/lib/driver-api';

export async function getProfile(id: string) {
  return driverFetch<unknown>(`/profile/${id}`);
}

export async function createProfile(data: { sessionId?: string; email?: string; userId?: string }) {
  return driverFetch<{ success: boolean; profile: unknown; isNew: boolean }>('/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProfile(id: string, fields: Record<string, unknown>) {
  return driverFetch<{ success: boolean; profile: unknown }>(`/profile/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export async function getProfileStrength(id: string) {
  return driverFetch<{ score: number; missingFields: string[] }>(`/profile/${id}/strength`);
}

export async function setVisibility(id: string, visible: boolean) {
  return driverFetch<{ success: boolean; visible: boolean }>(`/profile/${id}/visibility`, {
    method: 'PUT',
    body: JSON.stringify({ visible }),
  });
}

export async function logInterest(id: string, data: { carrierDot: string; matchScore?: number; status?: string }) {
  return driverFetch<{ success: boolean }>(`/profile/${id}/interest`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInterests(id: string, limit = 50, skip = 0) {
  return driverFetch<{ items: unknown[]; totalCount: number }>(`/profile/${id}/interests?limit=${limit}&skip=${skip}`);
}

export async function removeInterest(id: string, dot: string) {
  return driverFetch<{ success: boolean }>(`/profile/${id}/interest/${dot}`, { method: 'DELETE' });
}

export async function getActivity(id: string) {
  return driverFetch<{ applicationCount: number; viewCount: number; matchCount: number }>(`/profile/${id}/activity`);
}

export async function getViews(id: string, limit = 10) {
  return driverFetch<{ views: unknown[]; totalCount: number }>(`/profile/${id}/views?limit=${limit}`);
}

export async function getSuggestions(id: string) {
  return driverFetch<{ suggestions: unknown[] }>(`/profile/${id}/suggestions`);
}
