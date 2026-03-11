'use server';

import { driverFetch } from '@/lib/driver-api';

export async function listDocuments(id: string) {
  return driverFetch<unknown[]>(`/documents/${id}/list`);
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
