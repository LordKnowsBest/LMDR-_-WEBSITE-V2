'use server';

import { driverFetch } from '@/lib/driver-api';

export async function getDashboard(id: string) {
  return driverFetch<{ matchCount: number; applicationCount: number; savedCount: number }>(`/cockpit/${id}/dashboard`);
}

export async function applyToJob(id: string, jobId: string) {
  return driverFetch<{ success: boolean }>(`/cockpit/${id}/apply/${jobId}`, { method: 'POST' });
}

export async function withdrawApplication(id: string, appId: string) {
  return driverFetch<{ success: boolean }>(`/cockpit/${id}/withdraw/${appId}`, { method: 'POST' });
}

export async function getApplications(id: string, limit = 20, skip = 0, status?: string) {
  const params = new URLSearchParams({ limit: String(limit), skip: String(skip) });
  if (status) params.set('status', status);
  return driverFetch<{ items: unknown[]; totalCount: number }>(`/cockpit/${id}/applications?${params}`);
}

export async function saveJob(id: string, jobId: string) {
  return driverFetch<{ success: boolean }>(`/cockpit/${id}/save-job/${jobId}`, { method: 'POST' });
}

export async function getSavedJobs(id: string, limit = 20, skip = 0) {
  return driverFetch<{ items: unknown[]; totalCount: number }>(`/cockpit/${id}/saved-jobs?limit=${limit}&skip=${skip}`);
}

export async function removeSavedJob(id: string, jobId: string) {
  return driverFetch<{ success: boolean }>(`/cockpit/${id}/saved-job/${jobId}`, { method: 'DELETE' });
}

export async function getNotifications(id: string) {
  return driverFetch<unknown[]>(`/cockpit/${id}/notifications`);
}

export async function markNotificationRead(id: string, notifId: string) {
  return driverFetch<{ success: boolean }>(`/cockpit/${id}/notification/${notifId}/read`, { method: 'PUT' });
}

export async function markAllNotificationsRead(id: string) {
  return driverFetch<{ success: boolean }>(`/cockpit/${id}/notifications/mark-all-read`, { method: 'POST' });
}

export async function getRecommended(id: string) {
  return driverFetch<{ items: unknown[] }>(`/cockpit/${id}/recommended`);
}
