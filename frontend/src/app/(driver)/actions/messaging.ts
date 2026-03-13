'use server';

import { driverFetch } from '@/lib/driver-api';

export async function getConversations(id: string) {
  return driverFetch<{ conversations: unknown[] }>(`/messaging/${id}/conversations`);
}

export async function getMessages(id: string, convId: string) {
  return driverFetch<{ conversation: unknown; messages: unknown[]; totalCount: number }>(
    `/messaging/${id}/conversation/${convId}`
  );
}

export async function sendMessage(id: string, convId: string, content: string) {
  return driverFetch<{ messageId: string }>(`/messaging/${id}/conversation/${convId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function createConversation(
  id: string,
  data: { recipientId: string; recipientName: string; subject?: string }
) {
  return driverFetch<{ conversationId: string }>(`/messaging/${id}/conversation`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function markAsRead(id: string, convId: string) {
  return driverFetch<{ status: string; updatedCount: number }>(
    `/messaging/${id}/conversation/${convId}/read`,
    { method: 'PUT' }
  );
}
