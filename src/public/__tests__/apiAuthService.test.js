/* eslint-disable */
import {
  parseBearerToken,
  validateApiKey,
  hashApiKey
} from '../../backend/apiAuthService.jsw';

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  updateRecord: jest.fn(),
  findByField: jest.fn()
}));

const dataAccess = require('backend/dataAccess');

describe('apiAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('parses bearer token', () => {
    expect(parseBearerToken('Bearer abc123')).toBe('abc123');
    expect(parseBearerToken('bearer abc123')).toBe('abc123');
    expect(parseBearerToken('Basic abc123')).toBeNull();
  });

  test('validates api key for active partner + subscription', async () => {
    const rawKey = 'lmdr_live_test_key_1';
    const keyHash = await hashApiKey(rawKey);
    const partner = {
      _id: 'p_internal_1',
      partner_id: 'ptn_1',
      tier: 'growth',
      status: 'active',
      ip_whitelist: ['1.2.3.4'],
      api_keys: [{
        key_id: 'key_auth_1',
        key_hash: keyHash,
        is_active: true
      }]
    };

    dataAccess.queryRecords.mockImplementation(async (collection, options = {}) => {
      if (collection === 'apiPartners') {
        return { success: true, items: [partner] };
      }
      if (collection === 'apiSubscriptions') {
        return { success: true, items: [{ partner_id: 'ptn_1', tier: 'growth', status: 'active' }] };
      }
      return { success: true, items: [] };
    });
    dataAccess.updateRecord.mockResolvedValue({ success: true });

    const result = await validateApiKey({
      authorizationHeader: `Bearer ${rawKey}`,
      ipAddress: '1.2.3.4'
    });

    expect(result.success).toBe(true);
    expect(result.tier).toBe('growth');
    expect(result.partner.partner_id).toBe('ptn_1');
    expect(dataAccess.updateRecord).toHaveBeenCalled();
  });

  test('rejects when key is invalid', async () => {
    dataAccess.queryRecords.mockImplementation(async (collection) => {
      if (collection === 'apiPartners') {
        return { success: true, items: [] };
      }
      return { success: true, items: [] };
    });

    const result = await validateApiKey({
      authorizationHeader: 'Bearer not_a_real_key'
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('invalid_api_key');
  });

  test('rejects when ip is not whitelisted', async () => {
    const rawKey = 'lmdr_live_test_key_2';
    const keyHash = await hashApiKey(rawKey);

    dataAccess.queryRecords.mockImplementation(async (collection) => {
      if (collection === 'apiPartners') {
        return {
          success: true,
          items: [{
            _id: 'p_internal_2',
            partner_id: 'ptn_2',
            status: 'active',
            ip_whitelist: ['10.0.0.1'],
            api_keys: [{ key_id: 'key_auth_2', key_hash: keyHash, is_active: true }]
          }]
        };
      }
      return { success: true, items: [] };
    });

    const result = await validateApiKey({
      authorizationHeader: `Bearer ${rawKey}`,
      ipAddress: '8.8.8.8'
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('forbidden_ip');
    expect(dataAccess.updateRecord).not.toHaveBeenCalled();
  });
});
