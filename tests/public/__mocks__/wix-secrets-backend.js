/**
 * Mock for wix-secrets-backend module
 * Used in Jest tests to simulate Wix Secrets API
 */

// Mock secrets store
const mockSecrets = {
  'STRIPE_SECRET_KEY': 'sk_test_mock_key',
  'STRIPE_WEBHOOK_SECRET': 'whsec_mock_secret',
  'CLAUDE_API_KEY': 'mock_claude_key',
  'PERPLEXITY_API_KEY': 'mock_perplexity_key',
  'FMCSA_WEB_KEY': 'mock_fmcsa_key'
};

const secrets = {
  getSecret: jest.fn(async (secretName) => {
    if (mockSecrets[secretName]) {
      return mockSecrets[secretName];
    }
    throw new Error(`Secret not found: ${secretName}`);
  }),

  // Test helper to add secrets
  __setSecret: (name, value) => {
    mockSecrets[name] = value;
  },

  // Test helper to remove secrets
  __removeSecret: (name) => {
    delete mockSecrets[name];
  },

  // Test helper to reset secrets
  __resetSecrets: () => {
    Object.keys(mockSecrets).forEach(key => {
      delete mockSecrets[key];
    });
  }
};

module.exports = {
  secrets,
  getSecret: secrets.getSecret
};
