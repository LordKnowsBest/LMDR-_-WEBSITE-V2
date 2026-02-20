jest.mock('backend/dataAccess', () => ({
  insertRecord: jest.fn(),
  updateRecord: jest.fn(),
  queryRecords: jest.fn(),
  findByField: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const queueService = require('backend/socialQueueService');

describe('socialQueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createQueueRecord stores queued record', async () => {
    dataAccess.insertRecord.mockResolvedValueOnce({ success: true, record: { _id: 'queue_1', status: 'queued' } });

    const result = await queueService.createQueueRecord({
      dedupe_key: 'ddk_1',
      platform: 'facebook',
      post_type: 'text'
    });

    expect(result.success).toBe(true);
    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'socialPostQueue',
      expect.objectContaining({ dedupe_key: 'ddk_1', status: 'queued' }),
      expect.any(Object)
    );
  });

  test('getByDedupeKey returns latest record', async () => {
    dataAccess.queryRecords.mockResolvedValueOnce({
      success: true,
      items: [{ _id: 'queue_2', dedupe_key: 'ddk_2', status: 'published' }]
    });

    const result = await queueService.getByDedupeKey('ddk_2');

    expect(result.success).toBe(true);
    expect(result.record._id).toBe('queue_2');
  });
});
