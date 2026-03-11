'use server';

import { driverFetch } from '@/lib/driver-api';

export async function getProgression(id: string) {
  return driverFetch<{ xp: number; level: number; levelName: string; streakDays: number; multiplier: number }>(`/gamification/${id}/progression`);
}

export async function awardXP(id: string, action: string) {
  return driverFetch<{ xpAwarded: number; totalXp: number; level: number; multiplier: number }>(`/gamification/${id}/xp`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export async function getAchievements(id: string) {
  return driverFetch<unknown[]>(`/gamification/${id}/achievements`);
}

export async function claimAchievement(id: string, achievementId: string) {
  return driverFetch<{ success: boolean }>(`/gamification/${id}/achievement/${achievementId}/claim`, { method: 'POST' });
}

export async function getStreak(id: string) {
  return driverFetch<{ currentDays: number; freezeAvailable: boolean; nextMilestone: number; multiplier: number }>(`/gamification/${id}/streak`);
}

export async function checkIn(id: string) {
  return driverFetch<{ success: boolean; streakDays: number }>(`/gamification/${id}/streak/check-in`, { method: 'POST' });
}

export async function useStreakFreeze(id: string) {
  return driverFetch<{ success: boolean }>(`/gamification/${id}/streak/freeze`, { method: 'POST' });
}

export async function getLeaderboard(limit = 10) {
  return driverFetch<unknown[]>(`/gamification/leaderboard?limit=${limit}`);
}

export async function getActiveEvents() {
  return driverFetch<unknown[]>('/gamification/events/active');
}

export async function getChallenges(id: string) {
  return driverFetch<unknown[]>(`/gamification/${id}/challenges`);
}
