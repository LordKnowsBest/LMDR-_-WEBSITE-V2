import { toSnakeCase, pgTableName, getTableName, KNOWN_COLLECTIONS } from '../../src/db/schema.js';

describe('toSnakeCase', () => {
  it('converts camelCase to snake_case', () => {
    expect(toSnakeCase('carrierAccounts')).toBe('carrier_accounts');
  });
  it('handles single word', () => {
    expect(toSnakeCase('carriers')).toBe('carriers');
  });
  it('handles multiple capitals', () => {
    expect(toSnakeCase('b2bMatchSignals')).toBe('b2b_match_signals');
  });
  it('handles consecutive capitals', () => {
    expect(toSnakeCase('aiUsageLog')).toBe('ai_usage_log');
  });
});

describe('pgTableName', () => {
  it('prefixes with airtable_', () => {
    expect(pgTableName('carriers')).toBe('airtable_carriers');
  });
  it('converts camelCase key', () => {
    expect(pgTableName('carrierAccounts')).toBe('airtable_carrier_accounts');
  });
  it('handles b2b prefix', () => {
    expect(pgTableName('b2bAccounts')).toBe('airtable_b2b_accounts');
  });
});

describe('getTableName', () => {
  it('resolves known collection', () => {
    expect(getTableName('carriers')).toBe('airtable_carriers');
  });
  it('resolves driverProfiles', () => {
    expect(getTableName('driverProfiles')).toBe('airtable_driver_profiles');
  });
  it('resolves apiPartners', () => {
    expect(getTableName('apiPartners')).toBe('airtable_api_partners');
  });
  it('throws for unknown collection in strict mode', () => {
    expect(() => getTableName('nonExistentCollection')).toThrow(/unknown collection/i);
  });
  it('allows unknown collection in non-strict mode', () => {
    expect(getTableName('nonExistentCollection', { strict: false })).toBe('airtable_non_existent_collection');
  });
});

describe('KNOWN_COLLECTIONS', () => {
  it('contains core collections', () => {
    expect(KNOWN_COLLECTIONS.has('carriers')).toBe(true);
    expect(KNOWN_COLLECTIONS.has('driverProfiles')).toBe(true);
    expect(KNOWN_COLLECTIONS.has('b2bAccounts')).toBe(true);
  });
  it('has at least 100 entries', () => {
    expect(KNOWN_COLLECTIONS.size).toBeGreaterThan(100);
  });
});
