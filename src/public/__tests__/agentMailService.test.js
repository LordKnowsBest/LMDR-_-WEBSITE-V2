/* eslint-disable */

jest.mock('wix-secrets-backend', () => ({
  getSecret: jest.fn()
}), { virtual: true });

const nodeCrypto = require('crypto');
const { getSecret } = require('wix-secrets-backend');

describe('agentMailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: jest.fn().mockReturnValue('application/json') },
      json: async () => ({ items: [] }),
      text: async () => ''
    });
    getSecret.mockImplementation((name) => {
      switch (name) {
        case 'AGENTMAIL_API_KEY':
          return Promise.resolve('am_test_key');
        case 'AGENTMAIL_API_BASE_URL':
          return Promise.resolve('https://agentmail.example/v1');
        case 'AGENTMAIL_WEBHOOK_SECRET':
          return Promise.resolve('whsec_agentmail_test');
        default:
          return Promise.resolve(null);
      }
    });
    global.crypto = nodeCrypto.webcrypto;
  });

  test('sends authenticated requests to the configured path', async () => {
    const { agentMailRequest } = require('backend/agentMailService');
    await agentMailRequest('GET', 'threads', {
      query: { inbox_id: 'inb_123', limit: 10 }
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://agentmail.example/v1/threads?inbox_id=inb_123&limit=10',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer am_test_key'
        })
      })
    );
  });

  test('generates deterministic client ids', () => {
    const { generateClientId } = require('backend/agentMailService');
    const first = generateClientId('draft', {
      threadId: 'thr_1',
      to: 'driver@example.com'
    });
    const second = generateClientId('draft', {
      to: 'driver@example.com',
      threadId: 'thr_1'
    });

    expect(first).toBe(second);
  });

  test('verifies valid webhook signatures', async () => {
    const { verifyWebhookSignature } = require('backend/agentMailService');
    const body = JSON.stringify({ id: 'evt_1', type: 'message.received' });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = nodeCrypto
      .createHmac('sha256', 'whsec_agentmail_test')
      .update(`${timestamp}.${body}`)
      .digest('hex');

    const result = await verifyWebhookSignature(body, {
      'x-agentmail-timestamp': timestamp,
      'x-agentmail-signature': `sha256=${signature}`
    });

    expect(result.success).toBe(true);
  });

  test('rejects invalid webhook signatures', async () => {
    const { verifyWebhookSignature } = require('backend/agentMailService');
    const result = await verifyWebhookSignature('{}', {
      'x-agentmail-timestamp': String(Math.floor(Date.now() / 1000)),
      'x-agentmail-signature': 'sha256=bad'
    });

    expect(result.success).toBe(false);
  });
});
