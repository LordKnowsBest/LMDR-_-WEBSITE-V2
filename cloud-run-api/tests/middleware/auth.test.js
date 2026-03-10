import { parseBearerToken, isApiKey } from '../../src/middleware/auth.js';

describe('parseBearerToken', () => {
  it('extracts token from valid Bearer header', () => {
    expect(parseBearerToken('Bearer abc123')).toBe('abc123');
  });
  it('returns null for missing header', () => {
    expect(parseBearerToken(undefined)).toBeNull();
  });
  it('returns null for empty string', () => {
    expect(parseBearerToken('')).toBeNull();
  });
  it('returns null for non-Bearer scheme', () => {
    expect(parseBearerToken('Basic abc123')).toBeNull();
  });
  it('returns null for Bearer with no token', () => {
    expect(parseBearerToken('Bearer')).toBeNull();
  });
});

describe('isApiKey', () => {
  it('identifies lmdr_live_ prefix', () => {
    expect(isApiKey('lmdr_live_abc123def456')).toBe(true);
  });
  it('identifies lmdr_test_ prefix', () => {
    expect(isApiKey('lmdr_test_abc123def456')).toBe(true);
  });
  it('returns false for Firebase tokens', () => {
    expect(isApiKey('eyJhbGciOiJSUzI1NiJ9.something')).toBe(false);
  });
  it('returns false for null', () => {
    expect(isApiKey(null)).toBe(false);
  });
  it('returns false for undefined', () => {
    expect(isApiKey(undefined)).toBe(false);
  });
});
