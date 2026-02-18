/* eslint-disable */
/**
 * @jest-environment node
 */
/* eslint-env jest */

import * as experimentService from 'backend/experimentService';
import * as dataAccess from 'backend/dataAccess';

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  findByField: jest.fn(),
  insertRecord: jest.fn().mockResolvedValue({ success: true }),
  updateRecord: jest.fn().mockResolvedValue({ success: true }),
}), { virtual: true });

jest.mock('backend/utils/conditionEvaluator', () => ({
  evaluateConditions: jest.fn().mockReturnValue(true),
}), { virtual: true });

jest.mock('backend/utils/hashUtils', () => ({
  hashString: jest.fn().mockReturnValue(10),
}), { virtual: true });

describe('experimentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('assignUserToTest returns existing assignment variant', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({
        success: true,
        items: [{ _id: 'as1', testKey: 't1', userId: 'u1', variantId: 'variant_a' }]
      });

    const variant = await experimentService.assignUserToTest('t1', 'u1');
    expect(variant).toBe('variant_a');
  });

  test('recordConversion dedupes identical event', async () => {
    dataAccess.queryRecords
      // getUserAssignment
      .mockResolvedValueOnce({
        success: true,
        items: [{ _id: 'as1', testKey: 't1', userId: 'u1', variantId: 'control', converted: false }]
      })
      // duplicate event check
      .mockResolvedValueOnce({
        success: true,
        items: [{ _id: 'e1', testKey: 't1', userId: 'u1', eventName: 'application_submitted' }]
      });

    const result = await experimentService.recordConversion('t1', 'u1', 'application_submitted');
    expect(result.success).toBe(true);
    expect(result.deduped).toBe(true);
  });
});
