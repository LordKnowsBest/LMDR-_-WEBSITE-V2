import {
  enqueueWebhookDelivery,
  generateWebhookSecret
} from '../../backend/apiWebhookService.jsw';

jest.mock('backend/dataAccess', () => ({
  insertRecord: jest.fn(),
  updateRecord: jest.fn(),
  queryRecords: jest.fn()
}));
jest.mock('wix-fetch', () => ({
  fetch: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const { fetch } = require('wix-fetch');

describe('apiWebhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('delivers webhook and marks sent', async () => {
    dataAccess.insertRecord.mockResolvedValue({
      record: {
        _id: 'delivery_1',
        partner_id: 'ptn_1',
        webhook_url: 'https://partner.example/webhook',
        webhook_secret: 'whsec_test',
        event_type: 'safety_alert',
        payload: { ok: true },
        attempt: 1
      }
    });
    dataAccess.updateRecord.mockResolvedValue({ success: true });
    fetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await enqueueWebhookDelivery({
      subscriptionId: 'sub_1',
      partnerId: 'ptn_1',
      webhookUrl: 'https://partner.example/webhook',
      webhookSecret: 'whsec_test',
      eventType: 'safety_alert',
      payload: { ok: true }
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('sent');
    expect(dataAccess.updateRecord).toHaveBeenCalledWith(
      'apiWebhookDeliveries',
      expect.objectContaining({ _id: 'delivery_1', status: 'sent', response_status: 200 }),
      expect.any(Object)
    );
  });

  test('schedules retry after failed webhook delivery', async () => {
    dataAccess.insertRecord.mockResolvedValue({
      record: {
        _id: 'delivery_2',
        partner_id: 'ptn_2',
        webhook_url: 'https://partner.example/webhook',
        webhook_secret: 'whsec_test',
        event_type: 'safety_alert',
        payload: { ok: false },
        attempt: 1
      }
    });
    dataAccess.updateRecord.mockResolvedValue({ success: true });
    fetch.mockRejectedValue(new Error('network_error'));

    const result = await enqueueWebhookDelivery({
      subscriptionId: 'sub_2',
      partnerId: 'ptn_2',
      webhookUrl: 'https://partner.example/webhook',
      webhookSecret: 'whsec_test',
      eventType: 'safety_alert',
      payload: { ok: false }
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('retry_scheduled');
    expect(result.attempt).toBe(2);
    expect(result.next_retry_at).toBeTruthy();
  });

  test('generates webhook secret with expected prefix', () => {
    const secret = generateWebhookSecret();
    expect(secret.startsWith('whsec_')).toBe(true);
    expect(secret.length).toBeGreaterThan(20);
  });
});
