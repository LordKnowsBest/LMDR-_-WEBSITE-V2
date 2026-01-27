/**
 * Jest Configuration for LMDR Wix Velo Project
 *
 * This config is set up to test backend services in isolation
 * by mocking Wix dependencies (wix-data, wix-members-backend, etc.)
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Enable experimental ESM support
  extensionsToTreatAsEsm: ['.jsw'],

  // Root directories for tests
  roots: ['<rootDir>/src/public/__tests__'],

  // Test file patterns
  testMatch: [
    '**/*.test.js',
    '**/*.spec.js'
  ],

  // Module file extensions (include .jsw for Wix modules)
  moduleFileExtensions: ['js', 'jsw', 'json', 'node'],

  // Module name mapping for Wix imports
  moduleNameMapper: {
    // Map Wix backend modules to mocks
    '^wix-data$': '<rootDir>/src/public/__tests__/__mocks__/wix-data.js',
    '^wix-members-backend$': '<rootDir>/src/public/__tests__/__mocks__/wix-members-backend.js',
    '^wix-secrets-backend$': '<rootDir>/src/public/__tests__/__mocks__/wix-secrets-backend.js',
    '^wix-users-backend$': '<rootDir>/src/public/__tests__/__mocks__/wix-users-backend.js',
    '^wix-fetch$': '<rootDir>/src/public/__tests__/__mocks__/wix-fetch.js',
    // Map backend imports (handle both .js and .jsw)
    '^backend/(.*)$': '<rootDir>/src/backend/$1.jsw'
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/public/__tests__/setup.js'],

  // Coverage settings
  collectCoverageFrom: [
    'src/backend/**/*.jsw',
    '!src/backend/**/*.config.js'
  ],

  // Transform settings (no transform needed for plain JS)
  transform: {},

  // Verbose output
  verbose: true,

  // Timeout for tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true
};
