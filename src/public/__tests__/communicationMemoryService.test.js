/* eslint-disable */

const mockDataAccess = {
  queryRecords: jest.fn(),
  insertRecord: jest.fn(),
  updateRecord: jest.fn()
};

jest.mock('backend/dataAccess', () => mockDataAccess);

describe('communicationMemoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataAccess.queryRecords.mockResolvedValue({ success: true, items: [] });
    mockDataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'mem_1' } });
    mockDataAccess.updateRecord.mockResolvedValue({ success: true, record: { _id: 'mem_1' } });
  });

  test('builds a compact thread summary', () => {
    const { buildThreadSummary } = require('backend/communicationMemoryService');
    const summary = buildThreadSummary({
      channel: 'agentmail',
      counterpartEmail: 'driver@example.com',
      subject: 'Orientation',
      bodyText: 'Driver asked about orientation timing and required documents.'
    });

    expect(summary).toContain('driver@example.com');
    expect(summary).toContain('Orientation');
  });

  test('ingests linked communication events into communication memory', async () => {
    const { ingestCommunicationEvent } = require('backend/communicationMemoryService');
    const result = await ingestCommunicationEvent({
      channel: 'agentmail',
      threadId: 'thr_1',
      messageId: 'msg_1',
      inboxId: 'inb_1',
      counterpartEmail: 'driver@example.com',
      subject: 'Documents',
      bodyText: 'Here is my CDL.',
      metadata: {
        linked_entity_type: 'driver_profile',
        linked_entity_id: 'drv_1',
        carrier_dot: '123456'
      }
    });

    expect(result.success).toBe(true);
    expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
      'communicationMemories',
      expect.objectContaining({
        entity_type: 'driver_profile',
        entity_id: 'drv_1',
        channel_thread_id: 'thr_1'
      }),
      expect.objectContaining({ suppressAuth: true })
    );
    expect(mockDataAccess.insertRecord).toHaveBeenCalledWith(
      'communicationLinks',
      expect.objectContaining({
        thread_id: 'thr_1',
        linked_entity_id: 'drv_1'
      }),
      expect.objectContaining({ suppressAuth: true })
    );
  });

  test('updates existing communication memory records idempotently', async () => {
    mockDataAccess.queryRecords
      .mockResolvedValueOnce({ success: true, items: [] })
      .mockResolvedValueOnce({
        success: true,
        items: [{
          _id: 'mem_existing',
          source_count: 1
        }]
      });

    const { ingestCommunicationEvent } = require('backend/communicationMemoryService');
    await ingestCommunicationEvent({
      channel: 'agentmail',
      threadId: 'thr_2',
      messageId: 'msg_2',
      counterpartEmail: 'driver2@example.com',
      bodyText: 'Following up.',
      metadata: {
        linked_entity_type: 'driver_profile',
        linked_entity_id: 'drv_2'
      }
    });

    expect(mockDataAccess.updateRecord).toHaveBeenCalledWith(
      'communicationMemories',
      expect.objectContaining({
        _id: 'mem_existing',
        source_count: 2
      }),
      expect.objectContaining({ suppressAuth: true })
    );
  });
});
