jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  updateRecord: jest.fn(),
  insertRecord: jest.fn()
}));

jest.mock('backend/metaInsightsService', () => ({
  suggestBudgetReallocation: jest.fn().mockResolvedValue({ success: true, suggestions: [{ campaignId: 'cmp1', budgetDeltaPct: 15 }] }),
  suggestCreativeRotation: jest.fn().mockResolvedValue({ success: true, suggestions: [{ creativeId: 'cr1', recommendation: 'rotate' }] }),
  suggestAudienceNarrowing: jest.fn().mockResolvedValue({ success: true, suggestions: [{ placement: 'facebook_feed', recommendation: 'narrow_audience' }] })
}));

jest.mock('backend/metaAdSetService', () => ({
  updateAdSet: jest.fn().mockResolvedValue({ success: true, adSet: { ad_set_id: 'as1' } }),
  updateAdSetBudget: jest.fn().mockResolvedValue({ success: true, adSet: { ad_set_id: 'as1', daily_budget: 120 } })
}));

jest.mock('backend/metaCreativeService', () => ({
  attachCreativeToAd: jest.fn().mockResolvedValue({ success: true, ad: { ad_id: 'ad1', creative_id: 'cr2' } })
}));

const dataAccess = require('backend/dataAccess');
const { updateAdSet, updateAdSetBudget } = require('backend/metaAdSetService');
const { attachCreativeToAd } = require('backend/metaCreativeService');
const optimization = require('backend/metaOptimizationService');

describe('metaOptimizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getRuleDrivenRecommendations returns grouped recommendation sets', async () => {
    const result = await optimization.getRuleDrivenRecommendations('recruiter_1', { campaignId: 'cmp1' });
    expect(result.success).toBe(true);
    expect(result.recommendations.budget).toHaveLength(1);
    expect(result.recommendations.creative).toHaveLength(1);
    expect(result.recommendations.audience).toHaveLength(1);
  });

  test('applyBudgetReallocation blocks on freshness/confidence/cooldown safety gates', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({ success: true, items: [{ timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() }] }) // stale
      .mockResolvedValueOnce({ success: true, items: [{ action_id: 'prior_action' }] }) // cooldown conflict
      .mockResolvedValueOnce({ success: true, items: [] }); // no anomaly
    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { action_id: 'opt_blocked_1' } });

    const result = await optimization.applyBudgetReallocation('recruiter_1', {
      adSetId: 'as1',
      confidence: 0.4,
      minConfidence: 0.7,
      maxDataAgeMinutes: 120,
      cooldownMinutes: 60
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.reasons).toEqual(expect.arrayContaining([
      'data_freshness_below_threshold',
      'confidence_below_threshold',
      'cooldown_window_active'
    ]));
    expect(updateAdSetBudget).not.toHaveBeenCalled();
  });

  test('applyBidAdjustment blocks when anomaly stop-switch is triggered', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({ success: true, items: [{ timestamp: new Date().toISOString() }] }) // fresh
      .mockResolvedValueOnce({ success: true, items: [] }) // cooldown clear
      .mockResolvedValueOnce({ success: true, items: [{ anomaly_flag: true, anomaly_score: 0.92 }] }); // anomaly
    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { action_id: 'opt_blocked_2' } });

    const result = await optimization.applyBidAdjustment('recruiter_1', {
      adSetId: 'as1',
      confidence: 0.9
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.reasons).toContain('anomaly_stop_switch_triggered');
    expect(updateAdSet).not.toHaveBeenCalled();
  });

  test('rollbackOptimizationAction reverts a budget_reallocation mutation', async () => {
    dataAccess.queryRecords.mockResolvedValueOnce({
      success: true,
      items: [{
        action_id: 'opt_apply_1',
        action_type: 'budget_reallocation',
        target_id: 'as1',
        status: 'applied',
        rollback_payload: { adSetId: 'as1', dailyBudget: 80, lifetimeBudget: 0 }
      }]
    });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: { action_id: 'opt_apply_1', status: 'rolled_back' } });
    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { action_id: 'opt_rb_1' } });

    const result = await optimization.rollbackOptimizationAction('recruiter_1', { actionId: 'opt_apply_1' });

    expect(result.success).toBe(true);
    expect(updateAdSetBudget).toHaveBeenCalledWith('recruiter_1', expect.objectContaining({
      adSetId: 'as1',
      dailyBudget: 80
    }));
    expect(dataAccess.updateRecord).toHaveBeenCalledWith(
      'metaOptimizationActions',
      expect.objectContaining({ status: 'rolled_back' }),
      expect.any(Object)
    );
  });

  test('rollbackOptimizationAction reverts a creative_rotation mutation', async () => {
    dataAccess.queryRecords.mockResolvedValueOnce({
      success: true,
      items: [{
        action_id: 'opt_apply_2',
        action_type: 'creative_rotation',
        target_id: 'ad1',
        status: 'applied',
        rollback_payload: JSON.stringify({ adId: 'ad1', priorCreativeId: 'cr1' })
      }]
    });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: { action_id: 'opt_apply_2', status: 'rolled_back' } });
    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { action_id: 'opt_rb_2' } });

    const result = await optimization.rollbackOptimizationAction('recruiter_1', { actionId: 'opt_apply_2' });

    expect(result.success).toBe(true);
    expect(attachCreativeToAd).toHaveBeenCalledWith('recruiter_1', expect.objectContaining({
      adId: 'ad1',
      creativeId: 'cr1'
    }));
  });
});
