'use server';

import { driverFetch } from '@/lib/driver-api';

export async function getTimeline(id: string, limit = 50) {
  return driverFetch<{ items: unknown[] }>(`/lifecycle/${id}/timeline?limit=${limit}`);
}

export async function updateDisposition(id: string, disposition: string) {
  return driverFetch<{ success: boolean }>(`/lifecycle/${id}/disposition`, {
    method: 'PUT',
    body: JSON.stringify({ disposition }),
  });
}

export async function getMilestones(id: string) {
  return driverFetch<{ milestones: Array<{ milestone: string; date: string | null; achieved: boolean }> }>(`/lifecycle/${id}/milestones`);
}

export async function submitFeedback(id: string, data: { carrierDot: string; rating: number; comment?: string; wouldRecommend?: boolean }) {
  return driverFetch<unknown>(`/lifecycle/${id}/feedback`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getStats(id: string) {
  return driverFetch<{ totalApplications: number; totalMatches: number; totalViews: number; daysSinceRegistration: number; disposition: string }>(`/lifecycle/${id}/stats`);
}
