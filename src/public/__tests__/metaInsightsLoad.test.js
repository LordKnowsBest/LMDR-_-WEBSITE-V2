jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  upsertRecord: jest.fn(),
  updateRecord: jest.fn(),
  insertRecord: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const insights = require('backend/metaInsightsService');

describe('meta insights load profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles high-volume campaign insights pull within request-budget limits (180 entities)', async () => {
    const campaignIds = Array.from({ length: 180 }, (_, idx) => `cmp_load_${idx + 1}`);
    let queryCount = 0;

    dataAccess.queryRecords.mockImplementation(async (collection, options = {}) => {
      queryCount += 1;

      if (collection === 'metaCampaignMirror') {
        return {
          success: true,
          items: campaignIds.map(campaignId => ({ campaign_id: campaignId }))
        };
      }

      if (collection === 'metaInsightsDaily') {
        const entityId = options.filters && options.filters.entity_id ? options.filters.entity_id : '';
        return {
          success: true,
          items: [{
            entity_type: 'campaign',
            entity_id: entityId,
            spend: 12,
            impressions: 1200,
            reach: 700,
            clicks: 24,
            results: 3
          }]
        };
      }

      return { success: true, items: [] };
    });

    const result = await insights.getInsightsCampaignLevel('recruiter_load_1', {});

    expect(result.success).toBe(true);
    expect(result.ids).toHaveLength(180);
    expect(result.rows).toHaveLength(180);
    expect(result.totals.spend).toBe(2160);
    expect(result.totals.results).toBe(540);
    expect(queryCount).toBe(181);
  });
});
