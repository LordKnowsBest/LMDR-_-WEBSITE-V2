jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  upsertRecord: jest.fn()
}));

jest.mock('backend/observabilityService', () => ({
  log: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const configService = require('backend/admin_config_service');

describe('admin_config_service settings reads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getSystemSettings returns defaults when no stored row exists', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: []
    });

    const result = await configService.getSystemSettings();

    expect(result).toMatchObject({
      cache_ttl_minutes: 60,
      enrichment_batch_size: 3,
      maintenance_mode: false
    });
  });

  test('getSystemSettings merges persisted JSON object with defaults', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [{
        settingKey: 'system_settings',
        value: JSON.stringify({
          cache_ttl_minutes: 90,
          maintenance_mode: true
        })
      }]
    });

    const result = await configService.getSystemSettings();

    expect(result).toMatchObject({
      cache_ttl_minutes: 90,
      enrichment_batch_size: 3,
      maintenance_mode: true
    });
  });

  test('getSystemSettings falls back to defaults when settings query fails', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: false,
      error: 'query failed',
      items: []
    });

    const result = await configService.getSystemSettings();

    expect(result).toMatchObject({
      cache_ttl_minutes: 60,
      maintenance_mode: false
    });
  });
});
