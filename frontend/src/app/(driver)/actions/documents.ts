'use server';

import { driverFetch } from '@/lib/driver-api';

const CLOUD_RUN_URL = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

export async function listDocuments(id: string) {
  return driverFetch<unknown[]>(`/documents/${id}/list`);
}

export async function getSignedUploadUrl(fileName: string, contentType: string): Promise<{ url: string; filePath: string; bucket: string; expiresAt: string }> {
  const res = await fetch(`${CLOUD_RUN_URL}/v1/files/signed-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INTERNAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucket: 'driver-documents',
      filename: fileName,
      contentType,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as Record<string, string>));
    const msg = body.error || `Failed to get upload URL (${res.status})`;
    return Promise.reject(msg);
  }
  return res.json();
}

export async function uploadDocument(id: string, data: { docType: string; fileName: string; fileUrl: string; expirationDate?: string }) {
  return driverFetch<unknown>(`/documents/${id}/upload`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDocumentStatus(id: string) {
  return driverFetch<{ complete: string[]; missing: string[]; expired: string[]; pendingReview: string[] }>(`/documents/${id}/status`);
}

export async function updateDocument(id: string, docId: string, data: { status?: string; expirationDate?: string; notes?: string }) {
  return driverFetch<{ success: boolean }>(`/documents/${id}/doc/${docId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDocument(id: string, docId: string) {
  return driverFetch<{ success: boolean }>(`/documents/${id}/doc/${docId}`, { method: 'DELETE' });
}

export async function extractDocument(
  imageBase64: string,
  docType: 'CDL_FRONT' | 'MED_CARD' | 'MVR'
): Promise<{ success: boolean; docType: string; extracted: Record<string, unknown> }> {
  const res = await fetch(`${CLOUD_RUN_URL}/v1/driver/ocr/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INTERNAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageBase64, docType }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `OCR extraction failed (${res.status})`);
  }
  return res.json();
}
