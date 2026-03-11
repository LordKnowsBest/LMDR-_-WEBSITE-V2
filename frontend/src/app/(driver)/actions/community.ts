'use server';

import { driverFetch } from '@/lib/driver-api';

export async function getForums() {
  return driverFetch<unknown[]>('/community/forums');
}

export async function getThreads(categoryId: string, limit = 20, skip = 0) {
  return driverFetch<{ items: unknown[]; totalCount: number }>(`/community/forums/${categoryId}/threads?limit=${limit}&skip=${skip}`);
}

export async function getThread(threadId: string) {
  return driverFetch<unknown>(`/community/forums/thread/${threadId}`);
}

export async function createThread(categoryId: string, data: { title: string; content: string; authorId: string }) {
  return driverFetch<unknown>(`/community/forums/${categoryId}/thread`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function replyToThread(threadId: string, data: { content: string; authorId: string }) {
  return driverFetch<unknown>(`/community/forums/thread/${threadId}/reply`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAnnouncements(limit = 20) {
  return driverFetch<unknown[]>(`/community/announcements?limit=${limit}`);
}

export async function markAnnouncementRead(id: string, driverId: string) {
  return driverFetch<{ success: boolean }>(`/community/announcements/${id}/read`, {
    method: 'POST',
    body: JSON.stringify({ driverId }),
  });
}

export async function commentOnAnnouncement(id: string, data: { driverId: string; content: string }) {
  return driverFetch<unknown>(`/community/announcements/${id}/comment`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSurveys() {
  return driverFetch<unknown[]>('/community/surveys');
}

export async function getSurvey(id: string) {
  return driverFetch<unknown>(`/community/surveys/${id}`);
}

export async function submitSurveyResponse(id: string, data: { driverId: string; answers: unknown }) {
  return driverFetch<{ success: boolean }>(`/community/surveys/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
