'use server';

const CLOUD_RUN_URL = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

class AdminApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, body: unknown) {
    super(`Admin API error ${status}`);
    this.status = status;
    this.detail = body;
  }
}

export async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${CLOUD_RUN_URL}/v1/admin${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${INTERNAL_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AdminApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}
