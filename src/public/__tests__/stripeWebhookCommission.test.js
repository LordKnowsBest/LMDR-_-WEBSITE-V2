jest.mock('wix-http-functions', () => ({
  ok: (body) => ({ status: 200, body }),
  badRequest: (body) => ({ status: 400, body }),
  serverError: (body) => ({ status: 500, body })
}), { virtual: true });

jest.mock('wix-secrets-backend', () => ({
  getSecret: jest.fn()
}), { virtual: true });

jest.mock('backend/stripeService', () => ({
  upsertSubscription: jest.fn().mockResolvedValue({ success: true }),
  upsertApiSubscriptionFromStripe: jest.fn().mockResolvedValue({ success: true }),
  resetQuota: jest.fn().mockResolvedValue({ success: true }),
  getApiBillingSummary: jest.fn().mockResolvedValue({}),
  updateSubscriptionStatus: jest.fn().mockResolvedValue({ success: true }),
  updateApiSubscriptionStatus: jest.fn().mockResolvedValue({ success: true }),
  recordBillingEvent: jest.fn().mockResolvedValue({ success: true }),
  isEventProcessed: jest.fn().mockResolvedValue(false),
  logStripeEvent: jest.fn().mockResolvedValue({ success: true }),
  updatePaymentStatus: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/adminCommissionService', () => ({
  processAutoCommission: jest.fn().mockResolvedValue({ success: true, commission: { _id: 'c1' } })
}));

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn().mockResolvedValue({ success: true, items: [] }),
  insertRecord: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/carrierLeadsService', () => ({ updateLeadStatus: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('backend/emailService', () => ({ sendPaymentReceivedEmail: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('backend/abandonmentEmailService', () => ({
  trackAbandonedCheckout: jest.fn().mockResolvedValue({ success: true }),
  markCheckoutRecovered: jest.fn().mockResolvedValue({ wasAbandoned: false })
}));
jest.mock('backend/apiGateway', () => ({ handleGatewayRequest: jest.fn() }));
jest.mock('backend/agentService', () => ({ handleAgentTurn: jest.fn() }));
jest.mock('backend/voiceService', () => ({ getVoiceConfig: jest.fn() }));
jest.mock('backend/emailCampaignService', () => ({ processSendGridWebhook: jest.fn() }));
jest.mock('backend/smsCampaignService', () => ({
  processTwilioStatusWebhook: jest.fn(),
  processTwilioIncomingWebhook: jest.fn()
}));
jest.mock('backend/jobBoardService', () => ({ processJobBoardWebhook: jest.fn() }));
jest.mock('backend/socialPostingService', () => ({ connectSocialAccount: jest.fn() }));

const nodeCrypto = require('crypto');

const { getSecret } = require('wix-secrets-backend');
const dataAccess = require('backend/dataAccess');
const stripeService = require('backend/stripeService');
const { processAutoCommission } = require('backend/adminCommissionService');
const { post_stripe_webhook } = require('backend/http-functions');

const TEST_WEBHOOK_SECRET = 'whsec_test_1234567890abcdef';

function buildRequest(event) {
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const sig = nodeCrypto
    .createHmac('sha256', TEST_WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return {
    body: {
      text: jest.fn().mockResolvedValue(body)
    },
    headers: {
      'stripe-signature': `t=${timestamp},v1=${sig}`
    }
  };
}

describe('stripe webhook commission wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Return the test secret for STRIPE_WEBHOOK_SECRET; null for everything else
    getSecret.mockImplementation(name =>
      Promise.resolve(name === 'STRIPE_WEBHOOK_SECRET' ? TEST_WEBHOOK_SECRET : null)
    );
    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [] });
  });

  test('triggers new_subscription commission on checkout.session.completed', async () => {
    const event = {
      id: 'evt_checkout_new',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          mode: 'subscription',
          payment_status: 'paid',
          amount_total: 24900,
          currency: 'usd',
          metadata: {
            carrier_dot: '123456',
            sales_rep_id: 'rep_1',
            carrier_name: 'Acme Carrier'
          }
        }
      }
    };

    const response = await post_stripe_webhook(buildRequest(event));

    expect(response.status).toBe(200);
    expect(processAutoCommission).toHaveBeenCalledWith('new_subscription', expect.objectContaining({
      sales_rep_id: 'rep_1',
      carrier_dot: '123456',
      deal_value: 24900
    }));
  });

  test('triggers placement commission when checkout metadata marks placement', async () => {
    const event = {
      id: 'evt_checkout_place',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_2',
          mode: 'payment',
          payment_status: 'paid',
          amount_total: 120000,
          currency: 'usd',
          metadata: {
            carrier_dot: '777777',
            sales_rep_id: 'rep_9',
            commission_event: 'placement'
          }
        }
      }
    };

    await post_stripe_webhook(buildRequest(event));

    expect(processAutoCommission).toHaveBeenCalledWith('placement', expect.objectContaining({
      sales_rep_id: 'rep_9',
      carrier_dot: '777777',
      deal_value: 120000
    }));
  });

  test('triggers upgrade commission on customer.subscription.updated when previous attributes indicate plan/item change', async () => {
    const event = {
      id: 'evt_sub_upgrade',
      type: 'customer.subscription.updated',
      data: {
        previous_attributes: {
          items: { data: [{ price: { id: 'price_old' } }] }
        },
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'active',
          metadata: {
            carrier_dot: '333333',
            sales_rep_id: 'rep_3'
          },
          items: {
            data: [{ price: { unit_amount: 39900 } }]
          }
        }
      }
    };

    await post_stripe_webhook(buildRequest(event));

    expect(processAutoCommission).toHaveBeenCalledWith('upgrade', expect.objectContaining({
      carrier_dot: '333333',
      deal_value: 39900
    }));
  });

  test('triggers renewal commission on invoice.paid subscription cycle', async () => {
    const event = {
      id: 'evt_inv_paid',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_1',
          subscription: 'sub_1',
          billing_reason: 'subscription_cycle',
          amount_paid: 29900,
          currency: 'usd',
          period_start: 1735689600,
          period_end: 1738368000,
          subscription_details: {
            metadata: {
              carrier_dot: '555555',
              sales_rep_id: 'rep_5'
            }
          },
          lines: {
            data: [{ metadata: { carrier_dot: '555555', sales_rep_id: 'rep_5' } }]
          }
        }
      }
    };

    await post_stripe_webhook(buildRequest(event));

    expect(processAutoCommission).toHaveBeenCalledWith('renewal', expect.objectContaining({
      carrier_dot: '555555',
      deal_value: 29900
    }));
  });

  test('skips auto commission when commission idempotency key already exists', async () => {
    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [{ _id: 'existing' }] });

    const event = {
      id: 'evt_dup_checkout',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_dup',
          mode: 'subscription',
          payment_status: 'paid',
          amount_total: 19900,
          metadata: { carrier_dot: '121212', sales_rep_id: 'rep_dup' }
        }
      }
    };

    await post_stripe_webhook(buildRequest(event));

    expect(processAutoCommission).not.toHaveBeenCalled();
    expect(stripeService.logStripeEvent).toHaveBeenCalled();
  });
});
