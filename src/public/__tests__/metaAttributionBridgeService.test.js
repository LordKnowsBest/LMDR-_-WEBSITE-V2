jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  upsertRecord: jest.fn(),
  updateRecord: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const bridge = require('backend/metaAttributionBridgeService');

describe('metaAttributionBridgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPaidMediaToPipelineFunnel aggregates funnel totals and conversion metrics', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [
        { impressions: 1000, clicks: 80, leads: 12, qualified_applications: 6, hires: 2, spend: 420 },
        { impressions: 600, clicks: 40, leads: 8, qualified_applications: 3, hires: 1, spend: 260 }
      ]
    });

    const result = await bridge.getPaidMediaToPipelineFunnel('recruiter_1', { carrierDot: '123456' });

    expect(result.success).toBe(true);
    expect(result.totals.leads).toBe(20);
    expect(result.totals.hires).toBe(3);
    expect(result.totals.cpl).toBe(34);
    expect(result.totals.cph).toBeCloseTo(226.67, 2);
  });

  test('getSourceQualityScore ranks sources by quality score', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [
        { source: 'facebook_feed', leads: 10, qualified: 6, hires: 3, spend: 400 },
        { source: 'instagram_feed', leads: 10, qualified: 2, hires: 1, spend: 550 }
      ]
    });

    const result = await bridge.getSourceQualityScore('recruiter_1', {});

    expect(result.success).toBe(true);
    expect(result.items.length).toBe(2);
    expect(result.bestSource.source).toBe('facebook_feed');
    expect(result.items[0].qualityScore).toBeGreaterThan(result.items[1].qualityScore);
  });

  test('syncCampaignTaxonomyToPipeline upserts attribution links per campaign', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [
        { campaign_id: 'cmp_1', name: 'Q1 Driver Push', category: 'recruitment', source: 'meta_paid' },
        { campaign_id: 'cmp_2', name: 'Q2 Local Driver Push', category: 'recruitment', channel: 'meta_paid' }
      ]
    });
    dataAccess.upsertRecord
      .mockResolvedValueOnce({ success: true, record: { campaign_id: 'cmp_1' } })
      .mockResolvedValueOnce({ success: true, record: { campaign_id: 'cmp_2' } });

    const result = await bridge.syncCampaignTaxonomyToPipeline('admin_1', { carrierDot: '123456' });

    expect(result.success).toBe(true);
    expect(result.synced).toBe(2);
    expect(dataAccess.upsertRecord).toHaveBeenCalledTimes(2);
  });

  test('backfillMissingAttribution updates records with blank campaign ids', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [
        { _id: 'a1', campaign_id: '', utm_campaign: 'cmp_utm_1', source: '' },
        { _id: 'a2', campaign_id: '', external_campaign_id: 'cmp_ext_2', source: 'meta_paid' }
      ]
    });
    dataAccess.updateRecord
      .mockResolvedValueOnce({ success: true, record: { _id: 'a1', campaign_id: 'cmp_utm_1' } })
      .mockResolvedValueOnce({ success: true, record: { _id: 'a2', campaign_id: 'cmp_ext_2' } });

    const result = await bridge.backfillMissingAttribution('admin_1', {});

    expect(result.success).toBe(true);
    expect(result.scanned).toBe(2);
    expect(result.updated).toBe(2);
    expect(dataAccess.updateRecord).toHaveBeenCalledTimes(2);
  });
});
