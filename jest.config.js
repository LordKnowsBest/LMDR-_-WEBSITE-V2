/**
 * Jest Configuration for LMDR Wix Velo Project
 *
 * This config is set up to test backend services in isolation
 * by mocking Wix dependencies (wix-data, wix-members-backend, etc.)
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directories for tests
  roots: ['<rootDir>/src/public/__tests__'],

  // Test file patterns
  testMatch: [
    '**/*.test.js',
    '**/*.spec.js',
    '**/*.test.mjs'
  ],

  // Module file extensions (include .jsw for Wix modules)
  moduleFileExtensions: ['js', 'jsw', 'mjs', 'json', 'node'],

  // Module name mapping for Wix imports
  moduleNameMapper: {
    // Map Wix backend modules to mocks
    '^wix-data$': '<rootDir>/src/public/__tests__/__mocks__/wix-data.js',
    '^wix-members-backend$': '<rootDir>/src/public/__tests__/__mocks__/wix-members-backend.js',
    '^wix-secrets-backend$': '<rootDir>/src/public/__tests__/__mocks__/wix-secrets-backend.js',
    '^wix-users-backend$': '<rootDir>/src/public/__tests__/__mocks__/wix-users-backend.js',
    '^wix-fetch$': '<rootDir>/src/public/__tests__/__mocks__/wix-fetch.js',
    '^wix-media-backend$': '<rootDir>/src/public/__tests__/__mocks__/wix-media-backend.js',
    // Map backend imports (handle both .js and .jsw, prevent double .jsw)
    '^backend/configData$': '<rootDir>/src/backend/configData.js',
    '^backend/(.+)\\.jsw$': '<rootDir>/src/backend/$1.jsw',
    '^backend/(.+)$': '<rootDir>/src/backend/$1.jsw'
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/public/__tests__/setup.js'],

  // Coverage settings
  collectCoverageFrom: [
    'src/backend/**/*.jsw',
    '!src/backend/**/*.config.js'
  ],

  // Transform ESM backend sources (.js/.jsw) so CJS tests can import them.
  transform: {
    '^.+\\.(js|jsx|mjs|cjs|jsw)$': 'babel-jest'
  },

  // Verbose output
  verbose: true,

  // Timeout for tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true
};
