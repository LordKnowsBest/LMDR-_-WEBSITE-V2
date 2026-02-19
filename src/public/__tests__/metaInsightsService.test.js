jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  upsertRecord: jest.fn(),
  updateRecord: jest.fn(),
  insertRecord: jest.fn()
}));
jest.mock('backend/metaReliabilityService', () => ({
  consumeRequestBudget: jest.fn(),
  executeWithRetryAndCircuit: jest.fn(),
  readWithCache: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const reliability = require('backend/metaReliabilityService');
const insights = require('backend/metaInsightsService');

describe('metaInsightsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reliability.consumeRequestBudget.mockResolvedValue({
      allowed: true,
      remainingPct: 80
    });
    reliability.executeWithRetryAndCircuit.mockImplementation(async (_op, fn) => fn());
    reliability.readWithCache.mockImplementation(async (_cacheKey, fetcher) => fetcher());
  });

  test('getInsightsCampaignLevel returns aggregated totals', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({
        success: true,
        items: [{ campaign_id: 'cmp_1' }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [
          { entity_type: 'campaign', entity_id: 'cmp_1', spend: 100, clicks: 10, results: 2, reach: 500, impressions: 900 }
        ]
      });

    const result = await insights.getInsightsCampaignLevel('recruiter_1', {});

    expect(result.success).toBe(true);
    expect(result.entityType).toBe('campaign');
    expect(result.totals.spend).toBe(100);
    expect(result.totals.results).toBe(2);
    expect(result.totals.cpl).toBe(50);
  });

  test('createAsyncReportJob writes queued job', async () => {
    dataAccess.insertRecord.mockResolvedValue({
      success: true,
      record: { job_id: 'job_1', status: 'queued' }
    });

    const result = await insights.createAsyncReportJob('recruiter_1', { jobId: 'job_1', reportScope: 'campaign' });

    expect(result.success).toBe(true);
    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'metaAsyncReportJobs',
      expect.objectContaining({ job_id: 'job_1', status: 'queued', report_scope: 'campaign' }),
      expect.any(Object)
    );
  });

  test('processPendingMetaAsyncReports completes queued jobs', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({
        success: true,
        items: [{ job_id: 'job_1', status: 'queued', report_scope: 'campaign', recruiter_id: 'recruiter_1', date_range: {} }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{ campaign_id: 'cmp_1' }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{ entity_type: 'campaign', entity_id: 'cmp_1', spend: 90, clicks: 9, results: 3, reach: 400, impressions: 700 }]
      });
    dataAccess.updateRecord
      .mockResolvedValueOnce({ success: true, record: { job_id: 'job_1', status: 'processing' } })
      .mockResolvedValueOnce({ success: true, record: { job_id: 'job_1', status: 'completed' } });

    const result = await insights.processPendingMetaAsyncReports();

    expect(result.success).toBe(true);
    expect(result.processed).toBe(1);
    expect(dataAccess.updateRecord).toHaveBeenLastCalledWith(
      'metaAsyncReportJobs',
      expect.objectContaining({ status: 'completed', row_count: 1 }),
      expect.any(Object)
    );
  });

  test('getInsightsCampaignLevel fails when request budget is exhausted mid-read', async () => {
    reliability.consumeRequestBudget
      .mockResolvedValueOnce({ allowed: true, remainingPct: 70 })
      .mockResolvedValueOnce({ allowed: false, error: 'Request budget exceeded for metaInsightsDaily' });

    dataAccess.queryRecords
      .mockResolvedValueOnce({
        success: true,
        items: [{ campaign_id: 'cmp_1' }, { campaign_id: 'cmp_2' }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{ entity_type: 'campaign', entity_id: 'cmp_1', spend: 55, clicks: 5, results: 1, reach: 250, impressions: 400 }]
      });

    const result = await insights.getInsightsCampaignLevel('recruiter_1', {});

    expect(result.success).toBe(false);
    expect(result.failedEntityId).toBe('cmp_2');
    expect(result.rows).toHaveLength(1);
    expect(result.error).toMatch(/budget exceeded/i);
  });

  test('processPendingMetaAsyncReports marks job failed when insights query fails', async () => {
    reliability.consumeRequestBudget.mockResolvedValue({ allowed: true, remainingPct: 60 });

    dataAccess.queryRecords
      .mockResolvedValueOnce({
        success: true,
        items: [{ job_id: 'job_2', status: 'queued', report_scope: 'campaign', recruiter_id: 'recruiter_2', date_range: {} }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{ campaign_id: 'cmp_1' }, { campaign_id: 'cmp_2' }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{ entity_type: 'campaign', entity_id: 'cmp_1', spend: 22, clicks: 2, results: 1, reach: 180, impressions: 260 }]
      });

    reliability.consumeRequestBudget
      .mockResolvedValueOnce({ allowed: true, remainingPct: 75 })
      .mockResolvedValueOnce({ allowed: false, error: 'Request budget exceeded for meta_insights.read.metaInsightsDaily' });

    dataAccess.updateRecord
      .mockResolvedValueOnce({ success: true, record: { job_id: 'job_2', status: 'processing' } })
      .mockResolvedValueOnce({ success: true, record: { job_id: 'job_2', status: 'failed' } });

    const result = await insights.processPendingMetaAsyncReports();

    expect(result.success).toBe(true);
    expect(result.processed).toBe(0);
    expect(dataAccess.updateRecord).toHaveBeenLastCalledWith(
      'metaAsyncReportJobs',
      expect.objectContaining({
        status: 'failed',
        row_count: 0
      }),
      expect.any(Object)
    );
  });

});
