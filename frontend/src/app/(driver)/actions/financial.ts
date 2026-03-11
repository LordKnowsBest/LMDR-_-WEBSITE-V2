'use server';

import { driverFetch } from '@/lib/driver-api';

export async function logExpense(id: string, data: { amount: number; category: string; description?: string; date?: string; receiptUrl?: string }) {
  return driverFetch<unknown>(`/financial/${id}/expenses`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getExpenses(id: string, filters?: { category?: string; startDate?: string; endDate?: string; limit?: number; skip?: number }) {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.skip) params.set('skip', String(filters.skip));
  return driverFetch<{ items: unknown[]; totalCount: number }>(`/financial/${id}/expenses?${params}`);
}

export async function getExpenseSummary(id: string, period = 'month') {
  return driverFetch<{ totalSpend: number; byCategory: Array<{ category: string; total: number; count: number }>; averagePerDay: number }>(`/financial/${id}/expenses/summary?period=${period}`);
}

export async function updateExpense(id: string, expenseId: string, data: { amount?: number; category?: string; description?: string }) {
  return driverFetch<{ success: boolean }>(`/financial/${id}/expense/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteExpense(id: string, expenseId: string) {
  return driverFetch<{ success: boolean }>(`/financial/${id}/expense/${expenseId}`, { method: 'DELETE' });
}
