jest.mock('backend/socialSecretService', () => ({
  getMetaAppId: jest.fn().mockResolvedValue('app-id'),
  getMetaAppSecret: jest.fn().mockResolvedValue('app-secret')
}));

describe('socialTokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('validateToken returns valid status and scopes', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          is_valid: true,
          expires_at: 1900000000,
          scopes: ['pages_manage_posts']
        }
      })
    });

    const tokenService = require('backend/socialTokenService');
    const result = await tokenService.validateToken('token-1234567890');

    expect(result.success).toBe(true);
    expect(result.is_valid).toBe(true);
    expect(result.scopes).toEqual(['pages_manage_posts']);
  });

  test('exchangeForLongLived returns exchanged token payload', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'long-lived-token',
        token_type: 'bearer',
        expires_in: 5184000
      })
    });

    const tokenService = require('backend/socialTokenService');
    const result = await tokenService.exchangeForLongLived('short-lived-token');

    expect(result.success).toBe(true);
    expect(result.access_token).toBe('long-lived-token');
    expect(result.expires_in).toBe(5184000);
  });
});
