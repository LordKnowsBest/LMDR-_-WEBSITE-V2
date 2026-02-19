jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  upsertRecord: jest.fn(),
  updateRecord: jest.fn(),
  insertRecord: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const campaignService = require('backend/metaCampaignService');
const adSetService = require('backend/metaAdSetService');
const creativeService = require('backend/metaCreativeService');

describe('meta paid media services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createCampaignDraft persists campaign mirror and audit', async () => {
    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [] });
    dataAccess.upsertRecord.mockResolvedValue({
      success: true,
      record: { campaign_id: 'cmp_1', status: 'draft' }
    });
    dataAccess.insertRecord.mockResolvedValue({ success: true });

    const result = await campaignService.createCampaignDraft('recruiter_1', {
      campaignId: 'cmp_1',
      integrationId: 'int_1',
      idempotencyKey: 'idem_cmp_1',
      name: 'Spring Driver Push'
    });

    expect(result.success).toBe(true);
    expect(dataAccess.upsertRecord).toHaveBeenCalledWith(
      'metaCampaignMirror',
      'campaign_id',
      'cmp_1',
      expect.objectContaining({ name: 'Spring Driver Push', status: 'draft' }),
      expect.any(Object)
    );
    expect(dataAccess.insertRecord).toHaveBeenCalled();
  });

  test('createCampaign returns idempotent prior snapshot when key already used', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [{ result_snapshot: { campaign: { campaign_id: 'cmp_existing' } } }]
    });

    const result = await campaignService.createCampaign('recruiter_1', {
      campaignId: 'cmp_existing',
      idempotencyKey: 'idem_existing'
    });

    expect(result.success).toBe(true);
    expect(result.idempotent).toBe(true);
    expect(result.campaign.campaign_id).toBe('cmp_existing');
    expect(dataAccess.upsertRecord).not.toHaveBeenCalled();
  });

  test('updateAdSetBudget updates ad set mirror', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({
        success: true,
        items: []
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{ ad_set_id: 'adset_1', daily_budget: 1000 }]
      });
    dataAccess.updateRecord.mockResolvedValue({
      success: true,
      record: { ad_set_id: 'adset_1', dailyBudget: 2500 }
    });
    dataAccess.insertRecord.mockResolvedValue({ success: true });

    const result = await adSetService.updateAdSetBudget('recruiter_1', {
      adSetId: 'adset_1',
      dailyBudget: 2500,
      idempotencyKey: 'idem_adset_1'
    });

    expect(result.success).toBe(true);
    expect(dataAccess.updateRecord).toHaveBeenCalledWith(
      'metaAdSetMirror',
      expect.objectContaining({ ad_set_id: 'adset_1' }),
      expect.any(Object)
    );
  });

  test('attachCreativeToAd links creative_id on ad mirror', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({ success: true, items: [] })
      .mockResolvedValueOnce({ success: true, items: [{ ad_id: 'ad_1', name: 'Ad 1' }] });
    dataAccess.updateRecord.mockResolvedValue({
      success: true,
      record: { ad_id: 'ad_1', creative_id: 'creative_1' }
    });
    dataAccess.insertRecord.mockResolvedValue({ success: true });

    const result = await creativeService.attachCreativeToAd('recruiter_1', {
      adId: 'ad_1',
      creativeId: 'creative_1',
      idempotencyKey: 'idem_attach_1'
    });

    expect(result.success).toBe(true);
    expect(result.creativeId).toBe('creative_1');
    expect(dataAccess.updateRecord).toHaveBeenCalledWith(
      'metaAdMirror',
      expect.objectContaining({ ad_id: 'ad_1', creative_id: 'creative_1' }),
      expect.any(Object)
    );
  });
});
