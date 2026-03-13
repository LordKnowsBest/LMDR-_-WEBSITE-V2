'use server';

import { adminFetch } from '@/lib/admin-api';

export async function getRouterConfig() {
  return adminFetch<unknown>('/ai-router/config');
}

export async function updateRouterConfig(config: Record<string, unknown>) {
  return adminFetch<{ success: boolean }>('/ai-router/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export async function testProvider(providerId: string) {
  return adminFetch<{ provider: string; healthy: boolean; latencyMs: number }>(
    '/ai-router/test',
    { method: 'POST', body: JSON.stringify({ providerId }) }
  );
}

export async function getProviders() {
  return adminFetch<unknown[]>('/ai-router/config');
}

export async function routerComplete(input: { providerId: string; prompt: string }) {
  return adminFetch<unknown>('/ai-router/test', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getProviderCosts() {
  return adminFetch<unknown[]>('/ai-router/costs');
}

export async function getOptimizerConfig() {
  return adminFetch<unknown>('/ai-router/optimizer');
}

export async function updateOptimizerConfig(config: Record<string, unknown>) {
  return adminFetch<{ success: boolean }>('/ai-router/optimizer', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}
