'use server';

import { adminFetch } from '@/lib/admin-api';

export async function getRevenueSnapshot() {
  return adminFetch<{
    mrr: number; arr: number; arpu: number; ltv: number;
    planMix: Array<{ plan: string; count: number; revenue: number }>;
  }>('/billing/revenue/snapshot');
}

export async function getMonthlyTrend() {
  return adminFetch<Array<{ month: string; mrr: number; subscribers: number }>>('/billing/revenue/trend');
}

export async function getChurnAnalysis() {
  return adminFetch<Array<{ tier: string; churnRate: number; count: number }>>('/billing/revenue/churn');
}

export async function getRevenueForecast(months = 6) {
  return adminFetch<Array<{ month: string; projected: number }>>(`/billing/revenue/forecast?months=${months}`);
}

export async function getBillingDetails(dot: string) {
  return adminFetch<unknown>(`/billing/customer/${dot}`);
}

export async function createAdjustment(data: { carrierDot: string; type: 'credit' | 'debit'; amount: number; reason: string }) {
  return adminFetch<{ _id: string }>('/billing/adjustments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createInvoice(data: Record<string, unknown>) {
  return adminFetch<{ _id: string }>('/billing/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInvoice(id: string) {
  return adminFetch<unknown>(`/billing/invoices/${id}`);
}

export async function updateInvoice(id: string, updates: Record<string, unknown>) {
  return adminFetch<{ success: boolean }>(`/billing/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function sendInvoice(id: string) {
  return adminFetch<{ success: boolean }>(`/billing/invoices/${id}/send`, { method: 'POST' });
}

export async function getCommissionRules() {
  return adminFetch<unknown>('/billing/commissions');
}

export async function calculateCommissions(period: string) {
  return adminFetch<{ calculated: number }>('/billing/commissions/calculate', {
    method: 'POST',
    body: JSON.stringify({ period }),
  });
}
