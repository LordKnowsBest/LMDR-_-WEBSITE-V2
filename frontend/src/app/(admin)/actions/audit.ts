'use server';

import { adminFetch } from '@/lib/admin-api';

interface AuditQueryOptions {
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  limit?: number;
  skip?: number;
}

export async function queryAuditLog(options: AuditQueryOptions = {}) {
  return adminFetch<{ items: unknown[]; totalCount: number }>(
    '/audit/query',
    { method: 'POST', body: JSON.stringify(options) }
  );
}

export async function getAuditStats() {
  return adminFetch<{
    totalEntries: number;
    topAdmins: Array<{ admin: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  }>('/audit/stats');
}

export async function exportAuditLogCSV() {
  return adminFetch<string>('/audit/export');
}

export async function generateComplianceReport(templateId: string) {
  return adminFetch<{ reportId: string }>('/audit/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  });
}

export async function getAuditEntry(id: string) {
  return adminFetch<unknown>(`/audit/${id}`);
}
