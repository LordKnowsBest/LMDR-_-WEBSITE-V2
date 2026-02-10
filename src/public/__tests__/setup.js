/* eslint-disable */
/**
 * Jest Setup File
 *
 * This file is executed before running any test.
 * It sets up global mocks and configurations needed for Wix Velo testing.
 */

// Global mocks for Wix Velo environment if needed
// (Most mocks are handled via moduleNameMapper in jest.config.js)

// Mock console.log/warn to keep test output clean during batch runs
// if (process.env.QUIET_TESTS) {
//   console.log = jest.fn();
//   console.warn = jest.fn();
// }

// Standard setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});
