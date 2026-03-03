/* eslint-disable */

jest.mock('wix-http-functions', () => ({
  ok: (body) => ({ status: 200, body }),
  badRequest: (body) => ({ status: 400, body }),
  serverError: (body) => ({ status: 500, body })
}), { virtual: true });

jest.mock('wix-secrets-backend', () => ({
  getSecret: jest.fn()
}), { virtual: true });

jest.mock('backend/stripeService', () => ({
  upsertSubscription: jest.fn(),
  upsertApiSubscriptionFromStripe: jest.fn(),
  resetQuota: jest.fn(),
  getApiBillingSummary: jest.fn(),
  updateSubscriptionStatus: jest.fn(),
  updateApiSubscriptionStatus: jest.fn(),
  recordBillingEvent: jest.fn(),
  isEventProcessed: jest.fn(),
  logStripeEvent: jest.fn(),
  updatePaymentStatus: jest.fn()
}));

jest.mock('backend/adminCommissionService', () => ({
  processAutoCommission: jest.fn()
}));

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  insertRecord: jest.fn(),
  updateRecord: jest.fn()
}));

jest.mock('backend/carrierLeadsService', () => ({ updateLeadStatus: jest.fn() }));
jest.mock('backend/emailService', () => ({ sendPaymentReceivedEmail: jest.fn() }));
jest.mock('backend/abandonmentEmailService', () => ({
  trackAbandonedCheckout: jest.fn(),
  markCheckoutRecovered: jest.fn()
}));
jest.mock('backend/apiGateway', () => ({ handleGatewayRequest: jest.fn() }));
jest.mock('backend/agentService', () => ({ handleAgentTurn: jest.fn() }));
jest.mock('backend/fmcsaEnrichmentService', () => ({ autoEnrichFmcsaHits: jest.fn() }));
jest.mock('backend/semanticBackfillJob', () => ({ runNightlySemanticBackfill: jest.fn() }));
jest.mock('backend/ragIngestionService', () => ({
  ingestAllCarrierIntel: jest.fn(),
  ingestDriverMarketAggregate: jest.fn(),
  ingestLaneMarket: jest.fn()
}));
jest.mock('backend/ragFreshnessJob', () => ({ runRagFreshnessCheck: jest.fn() }));
jest.mock('backend/ragAnalyticsService', () => ({ runWeeklyRagAnalyticsRollup: jest.fn() }));
jest.mock('backend/observabilityService', () => ({ runAnomalyDetection: jest.fn() }));
jest.mock('backend/emailCampaignService', () => ({ processSendGridWebhook: jest.fn() }));
jest.mock('backend/smsCampaignService', () => ({
  processTwilioStatusWebhook: jest.fn(),
  processTwilioIncomingWebhook: jest.fn()
}));
jest.mock('backend/agentMailInboxService', () => ({
  handleWebhookEvent: jest.fn().mockResolvedValue({ success: true })
}));
jest.mock('backend/communicationMemoryService', () => ({
  ingestCommunicationEvent: jest.fn().mockResolvedValue({ success: true })
}));
jest.mock('backend/jobBoardService', () => ({ processJobBoardWebhook: jest.fn() }));
jest.mock('backend/socialPostingService', () => ({ connectSocialAccount: jest.fn() }));

const nodeCrypto = require('crypto');
const { getSecret } = require('wix-secrets-backend');
const dataAccess = require('backend/dataAccess');
const { handleWebhookEvent } = require('backend/agentMailInboxService');
const { ingestCommunicationEvent } = require('backend/communicationMemoryService');

function buildRequest(event, secret = 'whsec_agentmail_test') {
  const body = JSON.stringify(event);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = nodeCrypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  return {
    body: {
      text: jest.fn().mockResolvedValue(body)
    },
    headers: {
      'x-agentmail-timestamp': timestamp,
      'x-agentmail-signature': `sha256=${signature}`
    }
  };
}

describe('post_agentmail_webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.crypto = nodeCrypto.webcrypto;
    getSecret.mockImplementation((name) => {
      switch (name) {
        case 'AGENTMAIL_WEBHOOK_SECRET':
          return Promise.resolve('whsec_agentmail_test');
        case 'AGENTMAIL_API_KEY':
          return Promise.resolve('am_test_key');
        case 'AGENTMAIL_API_BASE_URL':
          return Promise.resolve('https://agentmail.example/v1');
        default:
          return Promise.resolve(null);
      }
    });
    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [] });
    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'evt_rec_1' } });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: { _id: 'evt_rec_1' } });
  });

  test('rejects webhook calls missing signatures', async () => {
    const { post_agentmail_webhook } = require('backend/http-functions');
    const response = await post_agentmail_webhook({
      body: { text: jest.fn().mockResolvedValue('{}') },
      headers: {}
    });

    expect(response.status).toBe(400);
  });

  test('rejects invalid signatures', async () => {
    const { post_agentmail_webhook } = require('backend/http-functions');
    const response = await post_agentmail_webhook({
      body: { text: jest.fn().mockResolvedValue('{}') },
      headers: {
        'x-agentmail-timestamp': String(Math.floor(Date.now() / 1000)),
        'x-agentmail-signature': 'sha256=bad'
      }
    });

    expect(response.status).toBe(400);
  });

  test('returns already_processed for duplicate events', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [{ _id: 'existing_event' }]
    });
    const { post_agentmail_webhook } = require('backend/http-functions');
    const response = await post_agentmail_webhook(buildRequest({
      id: 'evt_duplicate',
      type: 'message.received',
      data: { thread_id: 'thr_1' }
    }));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('already_processed');
    expect(dataAccess.insertRecord).not.toHaveBeenCalled();
  });

  test('persists and processes supported events', async () => {
    const { post_agentmail_webhook } = require('backend/http-functions');
    const response = await post_agentmail_webhook(buildRequest({
      id: 'evt_process',
      type: 'message.received',
      data: {
        inbox_id: 'inb_1',
        thread_id: 'thr_1',
        message_id: 'msg_1',
        from_email: 'driver@example.com',
        subject: 'Need documents',
        body: 'Please send over your CDL copy.',
        metadata: {
          linked_entity_type: 'driver_profile',
          linked_entity_id: 'drv_1',
          carrier_dot: '123456'
        }
      }
    }));

    expect(response.status).toBe(200);
    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'agentMailWebhookEvents',
      expect.objectContaining({
        event_id: 'evt_process',
        event_type: 'message.received'
      }),
      expect.objectContaining({ suppressAuth: true })
    );
    expect(handleWebhookEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'evt_process',
      eventType: 'message.received',
      threadId: 'thr_1'
    }));
    expect(ingestCommunicationEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'evt_process',
      counterpartEmail: 'driver@example.com'
    }));
  });
});
