/* eslint-disable */
/**
 * Airtable Client Strict Schema Tests
 */

/* eslint-env jest */

describe('airtableClient strict schema enforcement', () => {
  let toAirtableFormat;

  beforeAll(async () => {
    const airtableClient = await import('backend/airtableClient');
    toAirtableFormat = airtableClient.toAirtableFormat;
  });

  const strictTables = [
    'AIUsageLog',
    'AdminAuditLog',
    'SystemLogs',
    'SystemErrors',
    'SystemTraces',
    'SystemMetrics'
  ];

  test('throws on unmapped fields for strict tables', () => {
    strictTables.forEach(tableName => {
      expect(() => {
        toAirtableFormat({ unmapped_field: 'bad' }, tableName);
      }).toThrow(/schema mismatch/i);
    });
  });

  test('does not throw for mapped fields on AdminAuditLog', () => {
    const input = {
      adminId: 'admin_1',
      adminEmail: 'admin@example.com',
      action: 'exportData',
      targetType: 'system',
      targetId: 'target_1',
      details: { ok: true },
      timestamp: new Date('2026-02-05T10:00:00Z'),
      ipAddress: '127.0.0.1'
    };

    expect(() => toAirtableFormat(input, 'AdminAuditLog')).not.toThrow();
  });

  test('does not throw for mapped fields on AIUsageLog', () => {
    const input = {
      functionId: 'carrier_synthesis',
      provider: 'anthropic',
      model: 'claude-sonnet',
      latencyMs: 1200,
      tokensUsed: 456,
      inputTokens: 120,
      outputTokens: 336,
      error: null,
      usedFallback: false,
      timestamp: new Date('2026-02-05T10:00:00Z')
    };

    expect(() => toAirtableFormat(input, 'AIUsageLog')).not.toThrow();
  });

  test('non-strict tables warn but do not throw', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => {
      toAirtableFormat({ custom_field: 'value' }, 'FeatureAdoptionLogs');
    }).not.toThrow();

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
