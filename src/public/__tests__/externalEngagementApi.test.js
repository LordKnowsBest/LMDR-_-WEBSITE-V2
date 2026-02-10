/* eslint-disable */
import {
  getExternalUserProgress,
  awardExternalXP,
  checkExternalAchievements,
  subscribeExternalEngagementWebhook
} from '../../backend/externalEngagementApi.jsw';

jest.mock('backend/gamificationService', () => ({
  getDriverProgression: jest.fn(),
  getRecruiterProgression: jest.fn(),
  awardDriverXP: jest.fn(),
  awardRecruiterPoints: jest.fn()
}));
jest.mock('backend/streakService', () => ({
  getStreakStatus: jest.fn()
}));
jest.mock('backend/achievementService', () => ({
  getAchievements: jest.fn(),
  checkAndAwardAchievements: jest.fn()
}));
jest.mock('backend/leaderboardService', () => ({
  getLeaderboard: jest.fn()
}));
jest.mock('backend/apiWebhookService', () => ({
  enqueueWebhookDelivery: jest.fn().mockResolvedValue({ success: true }),
  generateWebhookSecret: jest.fn(() => 'whsec_test_secret')
}));

const gamification = require('backend/gamificationService');
const streakService = require('backend/streakService');
const achievementService = require('backend/achievementService');
const webhookService = require('backend/apiWebhookService');

describe('externalEngagementApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns partner-scoped user mapping in progress payload', async () => {
    gamification.getDriverProgression.mockResolvedValue({
      level: 2,
      levelTitle: 'Road Warrior',
      currentXP: 250,
      xpToNextLevel: 50
    });
    streakService.getStreakStatus.mockResolvedValue({
      streak_days: 5,
      longest_streak: 7,
      multiplier: 1.1
    });
    achievementService.getAchievements.mockResolvedValue([]);

    const result = await getExternalUserProgress('user_1', { user_type: 'driver' }, {
      partner: { partner_id: 'ptn_1' }
    });

    expect(result.success).toBe(true);
    expect(result.data.partner_user_id).toBe('partner:ptn_1:driver:user_1');
    expect(gamification.getDriverProgression).toHaveBeenCalledWith('partner:ptn_1:driver:user_1');
  });

  test('emits level-up webhook on xp award', async () => {
    await subscribeExternalEngagementWebhook('ptn_1', {
      webhook_url: 'https://partner.example/webhook',
      event_types: ['engagement.level_up']
    });
    gamification.awardDriverXP.mockResolvedValue({
      success: true,
      level_up: true,
      level: 3
    });
    streakService.getStreakStatus.mockResolvedValue({
      streak_days: 2
    });

    const result = await awardExternalXP({
      partner_id: 'ptn_1',
      user_id: 'driver_1',
      user_type: 'driver',
      action: 'daily_login',
      xp_amount: 20
    });

    expect(result.success).toBe(true);
    expect(webhookService.enqueueWebhookDelivery).toHaveBeenCalled();
  });

  test('emits achievement webhook when achievements are earned', async () => {
    await subscribeExternalEngagementWebhook('ptn_2', {
      webhook_url: 'https://partner.example/webhook',
      event_types: ['engagement.achievement_earned']
    });
    achievementService.checkAndAwardAchievements.mockResolvedValue([
      { achievementId: 'ach_1', name: 'Top Driver' }
    ]);

    const result = await checkExternalAchievements({
      partner_id: 'ptn_2',
      user_id: 'driver_2',
      user_type: 'driver'
    });

    expect(result.success).toBe(true);
    expect(result.data.newly_earned.length).toBe(1);
    expect(webhookService.enqueueWebhookDelivery).toHaveBeenCalled();
  });
});
