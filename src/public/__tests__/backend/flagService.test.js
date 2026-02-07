/**
 * @jest-environment node
 */
/* eslint-env jest */

import * as flagService from 'backend/flagService';
import * as dataAccess from 'backend/dataAccess';

// Mock modules before importing the service
jest.mock('backend/dataAccess', () => ({
  findByField: jest.fn(),
  queryRecords: jest.fn(),
  insertRecord: jest.fn().mockResolvedValue({ success: true }),
  updateRecord: jest.fn().mockResolvedValue({ success: true }),
  deleteRecord: jest.fn().mockResolvedValue({ success: true })
}), { virtual: true });

jest.mock('backend/observabilityService', () => ({
  log: jest.fn().mockResolvedValue({})
}), { virtual: true });

describe('Flag Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateFlag', () => {
    test('returns false if flag not found', async () => {
      dataAccess.findByField.mockResolvedValue(null);
      const result = await flagService.evaluateFlag('missing_flag', 'user123');
      expect(result).toBe(false);
    });

    test('returns defaultValue if flag disabled', async () => {
      dataAccess.findByField.mockResolvedValue({
        key: 'test_flag',
        enabled: false,
        defaultValue: true
      });
      const result = await flagService.evaluateFlag('test_flag', 'user123');
      expect(result).toBe(true);
    });

    test('returns true if global rollout is 100%', async () => {
      dataAccess.findByField.mockResolvedValue({
        key: 'test_flag',
        enabled: true,
        rolloutPercentage: 100
      });
      const result = await flagService.evaluateFlag('test_flag', 'user123');
      expect(result).toBe(true);
    });

    test('applies target rules correctly', async () => {
      dataAccess.findByField.mockResolvedValue({
        key: 'test_flag',
        enabled: true,
        rolloutPercentage: 0,
        targetRules: [
          {
            id: 'rule1',
            enabled: true,
            percentage: 100,
            conditions: [
              { attribute: 'role', operator: 'equals', value: 'admin' }
            ]
          }
        ]
      });
      
      const resultAdmin = await flagService.evaluateFlag('test_flag', 'user123', { role: 'admin' });
      expect(resultAdmin).toBe(true);
      
      const resultUser = await flagService.evaluateFlag('test_flag', 'user123', { role: 'user' });
      expect(resultUser).toBe(false);
    });

    test('handles nested context attributes', async () => {
      dataAccess.findByField.mockResolvedValue({
        key: 'nested_flag',
        enabled: true,
        rolloutPercentage: 0,
        targetRules: [
          {
            id: 'rule1',
            enabled: true,
            percentage: 100,
            conditions: [
              { attribute: 'user.tier', operator: 'equals', value: 'pro' }
            ]
          }
        ]
      });
      
      const resultPro = await flagService.evaluateFlag('nested_flag', 'user123', { user: { tier: 'pro' } });
      expect(resultPro).toBe(true);
      
      const resultFree = await flagService.evaluateFlag('nested_flag', 'user123', { user: { tier: 'free' } });
      expect(resultFree).toBe(false);
    });

    test('implements consistent bucketing', async () => {
      dataAccess.findByField.mockResolvedValue({
        key: 'bucket_flag',
        enabled: true,
        rolloutPercentage: 50
      });
      
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(await flagService.evaluateFlag('bucket_flag', 'consistent_user'));
      }
      
      // All results for same user/flag should be identical
      const allSame = results.every(r => r === results[0]);
      expect(allSame).toBe(true);
    });
  });

  describe('CRUD operations', () => {
    test('createFlag validates uniqueness', async () => {
      dataAccess.findByField.mockResolvedValue({ key: 'exists' });
      
      await expect(flagService.createFlag({ key: 'exists' }))
        .rejects.toThrow("Flag with key 'exists' already exists");
    });

    test('updateFlag validates existence', async () => {
      dataAccess.findByField.mockResolvedValue(null);
      
      await expect(flagService.updateFlag('missing', { name: 'New Name' }))
        .rejects.toThrow("Flag 'missing' not found");
    });
  });
});