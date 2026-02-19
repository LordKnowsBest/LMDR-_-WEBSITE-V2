jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  upsertRecord: jest.fn(),
  updateRecord: jest.fn(),
  insertRecord: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const insights = require('backend/metaInsightsService');

describe('metaInsightsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
