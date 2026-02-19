/* eslint-env jest */

const fs = require('fs');
const path = require('path');

jest.mock('backend/dataAccess', () => ({
  insertRecord: jest.fn(),
  queryRecords: jest.fn(),
  findByField: jest.fn(),
  updateRecord: jest.fn()
}));

jest.mock('backend/apiAuthService', () => ({
  generateApiKey: jest.fn(),
  hashApiKey: jest.fn(),
  rotateApiKey: jest.fn()
}));

jest.mock('backend/stripeService', () => ({
  createApiCheckoutSession: jest.fn(),
  createApiPortalSession: jest.fn(),
  getApiBillingSummary: jest.fn(),
  ensureApiStripeProducts: jest.fn(),
  generateApiOverageInvoice: jest.fn(),
  changeApiSubscriptionPlan: jest.fn()
}));

jest.mock('wix-fetch', () => ({ fetch: jest.fn() }));

const dataAccess = require('backend/dataAccess');
const authService = require('backend/apiAuthService');
const stripeService = require('backend/stripeService');
const { LmdrApiClient } = require('../../../sdk/js/lmdr-api-client/src/index.js');

const service = require('../../backend/apiPortalService.jsw');

describe('external api platform phase 8 flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    authService.generateApiKey.mockResolvedValue('lmdr_test_key_123');
    authService.hashApiKey.mockResolvedValue('hash_abc');
    authService.rotateApiKey.mockResolvedValue({ success: true });

    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'rec_1' } });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: { _id: 'rec_1' } });
    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [] });
    dataAccess.findByField.mockResolvedValue({
      _id: 'rec_partner_1',
      partner_id: 'ptn_1',
      contact_email: 'partner@example.com',
      api_keys: []
    });

    stripeService.ensureApiStripeProducts.mockResolvedValue({ success: true, configured: true });
    stripeService.generateApiOverageInvoice.mockResolvedValue({ success: true, invoice_id: 'in_1' });
    stripeService.changeApiSubscriptionPlan.mockResolvedValue({ success: true, tier: 'growth' });
    stripeService.getApiBillingSummary.mockResolvedValue({ success: true, overage_amount: 0, items: [] });
  });

  test('partner registration flow creates partner and api key', async () => {
    const result = await service.registerApiPartner({
      company_name: 'Acme Freight',
      contact_email: 'ops@acmefreight.com'
    });

    expect(result.success).toBe(true);
    expect(result.api_key).toBe('lmdr_test_key_123');
    expect(dataAccess.insertRecord).toHaveBeenCalled();
  });

  test('api key management flow creates and revokes keys', async () => {
    const created = await service.createPartnerApiKey('ptn_1', { environment: 'sandbox', name: 'Sandbox Key' });
    expect(created.success).toBe(true);
    expect(created.environment).toBe('sandbox');

    dataAccess.findByField.mockResolvedValueOnce({
      _id: 'rec_partner_1',
      partner_id: 'ptn_1',
      api_keys: [{ key_id: 'key_1', is_active: true }]
    });
    const revoked = await service.revokePartnerApiKey('ptn_1', 'key_1');
    expect(revoked.success).toBe(true);
  });

  test('billing integration flow provisions products, overage invoices, and plan changes', async () => {
    const products = await service.createApiTierProducts();
    const invoice = await service.createPartnerOverageInvoice('ptn_1', '2026-02', true);
    const changed = await service.changePartnerApiSubscription('ptn_1', 'growth', 'monthly', true);

    expect(products.success).toBe(true);
    expect(invoice.success).toBe(true);
    expect(changed.success).toBe(true);
    expect(stripeService.ensureApiStripeProducts).toHaveBeenCalled();
    expect(stripeService.generateApiOverageInvoice).toHaveBeenCalled();
    expect(stripeService.changeApiSubscriptionPlan).toHaveBeenCalled();
  });

  test('portal and docs html include responsive viewport and breakpoint classes', () => {
    const files = [
      path.resolve(__dirname, '..', 'admin', 'API_PORTAL_DASHBOARD.html'),
      path.resolve(__dirname, '..', 'admin', 'ADMIN_API_PARTNERS.html'),
      path.resolve(__dirname, '..', 'admin', 'API_DOCS_PORTAL.html')
    ];

    files.forEach((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      expect(source).toContain('name="viewport"');
      expect(source).toContain('grid-cols-1');
      expect(source).toContain('md:grid-cols-');
    });
  });

  test('javascript sdk can issue authenticated requests', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { ok: true, source: 'sdk' } })
    });

    const client = new LmdrApiClient({ apiKey: 'lmdr_live_x', fetch: fetchMock });
    const data = await client.getMarketIntelligence({ region: 'TX' });

    expect(data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/v1/intelligence/market');
    expect(options.headers.Authorization).toContain('Bearer lmdr_live_x');
  });

  test('python sdk scaffold is present with expected client methods', () => {
    const clientPath = path.resolve(__dirname, '..', '..', '..', 'sdk', 'python', 'lmdr_python', 'lmdr_python', 'client.py');
    const pyprojectPath = path.resolve(__dirname, '..', '..', '..', 'sdk', 'python', 'lmdr_python', 'pyproject.toml');
    expect(fs.existsSync(clientPath)).toBe(true);
    expect(fs.existsSync(pyprojectPath)).toBe(true);

    const source = fs.readFileSync(clientPath, 'utf8');
    expect(source).toContain('class LmdrApiClient');
    expect(source).toContain('def get_carrier_safety');
    expect(source).toContain('def search_drivers');
  });
});
