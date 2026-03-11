'use server';

import { adminFetch } from '@/lib/admin-api';

interface DriverQueryOptions {
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  search?: string;
  limit?: number;
  skip?: number;
}

export async function listDrivers(options: DriverQueryOptions = {}) {
  return adminFetch<{ items: unknown[]; totalCount: number; limit: number; skip: number }>(
    '/drivers/query',
    { method: 'POST', body: JSON.stringify(options) }
  );
}

export async function getDriverStats() {
  return adminFetch<{
    total: number; active: number; pending: number; expired: number; newThisWeek: number;
  }>('/drivers/stats');
}

export async function getDriverAnalytics(period = '30d') {
  return adminFetch<{ period: string; breakdown: unknown[] }>(`/drivers/analytics?period=${period}`);
}

export async function exportDriversCSV() {
  return adminFetch<string>('/drivers/export');
}

export async function getDriver(id: string) {
  return adminFetch<unknown>(`/drivers/${id}`);
}

export async function updateDriverStatus(id: string, status: string, reason?: string) {
  return adminFetch<{ success: boolean }>(`/drivers/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
}

export async function verifyDriver(id: string) {
  return adminFetch<{ success: boolean }>(`/drivers/${id}/verify`, { method: 'POST' });
}

export async function suspendDriver(id: string, reason: string) {
  return adminFetch<{ success: boolean }>(`/drivers/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function bulkUpdateDrivers(action: string, driverIds: string[]) {
  return adminFetch<{ processed: number; failed: number }>('/drivers/bulk', {
    method: 'POST',
    body: JSON.stringify({ action, driverIds }),
  });
}
