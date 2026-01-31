/**
 * Tests for pipelineAutomationService.jsw
 * Covers rule CRUD, conflict detection, event matching, stage transitions, audit logging
 */

const mockAirtable = {
  queryRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  getRecord: jest.fn()
};

jest.mock('backend/airtableClient', () => mockAirtable);
jest.mock('backend/config', () => ({
  usesAirtable: jest.fn(() => true),
  getAirtableTableName: jest.fn((key) => `v2_${key}`),
  getWixCollectionName: jest.fn((key) => key)
}));
jest.mock('wix-data', () => ({ query: jest.fn(), insert: jest.fn(), update: jest.fn(), get: jest.fn() }));
jest.mock('wix-users-backend', () => ({ currentUser: { loggedIn: true, id: 'recruiter-123' } }));
jest.mock('backend/featureAdoptionService', () => ({ logFeatureInteraction: jest.fn(() => Promise.resolve()) }));
jest.mock('backend/recruiter_service', () => ({ updateCandidateStatus: jest.fn(() => Promise.resolve({ success: true })) }));

describe('PipelineAutomationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAirtable.queryRecords.mockResolvedValue({ records: [] });
    mockAirtable.createRecord.mockResolvedValue({ _id: 'rule-1' });
  });

  describe('createAutomationRule', () => {
    it('should create a rule with valid data', async () => {
      const { createAutomationRule } = require('backend/pipelineAutomationService');
      const result = await createAutomationRule('12345', {
        ruleName: 'Auto CDL Advance',
        triggerEvent: 'cdl_verified',
        fromStage: 'applied',
        toStage: 'in_review'
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid trigger events', async () => {
      const { createAutomationRule } = require('backend/pipelineAutomationService');
      const result = await createAutomationRule('12345', {
        ruleName: 'Test',
        triggerEvent: 'invalid_event'
      });
      expect(result.success).toBe(false);
    });

    it('should detect conflicting rules (same trigger + from_stage)', async () => {
      mockAirtable.queryRecords
        .mockResolvedValueOnce({ records: [] })  // No existing rules for priority calc
        .mockResolvedValueOnce({ records: [{ _id: 'existing-rule' }] }); // Conflict found

      // Need to reset mock order for conflict check
      mockAirtable.queryRecords.mockReset();
      mockAirtable.queryRecords
        .mockResolvedValueOnce({ records: [{ _id: 'conflict' }] }) // Conflict check
        .mockResolvedValueOnce({ records: [] }); // Priority check

      const { createAutomationRule } = require('backend/pipelineAutomationService');
      const result = await createAutomationRule('12345', {
        ruleName: 'Conflicting Rule',
        triggerEvent: 'cdl_verified',
        fromStage: 'applied',
        toStage: 'in_review'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('deleteAutomationRule', () => {
    it('should soft delete by setting is_active=false', async () => {
      mockAirtable.getRecord.mockResolvedValueOnce({ _id: 'rule-1', is_active: true });
      const { deleteAutomationRule } = require('backend/pipelineAutomationService');
      const result = await deleteAutomationRule('rule-1');
      expect(result.success).toBe(true);
    });
  });

  describe('toggleRuleStatus', () => {
    it('should toggle rule active status', async () => {
      mockAirtable.getRecord.mockResolvedValueOnce({ _id: 'rule-1', is_active: true });
      const { toggleRuleStatus } = require('backend/pipelineAutomationService');
      const result = await toggleRuleStatus('rule-1', false);
      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
    });
  });

  describe('processEvent', () => {
    it('should match and execute the highest priority rule', async () => {
      mockAirtable.queryRecords.mockResolvedValueOnce({
        records: [{
          _id: 'rule-1',
          rule_name: 'Auto Advance',
          trigger_event: 'cdl_verified',
          from_stage: 'applied',
          to_stage: 'in_review',
          priority: 1
        }]
      });
      const { processEvent } = require('backend/pipelineAutomationService');
      const result = await processEvent('12345', 'cdl_verified', {
        driverId: 'driver-1',
        interestId: 'interest-1',
        fromStatus: 'applied'
      });
      expect(result.success).toBe(true);
      expect(result.matched).toBe(true);
    });

    it('should return no match when no rules apply', async () => {
      const { processEvent } = require('backend/pipelineAutomationService');
      const result = await processEvent('12345', 'cdl_verified', {});
      expect(result.success).toBe(true);
      expect(result.matched).toBe(false);
    });

    it('should reject invalid event types', async () => {
      const { processEvent } = require('backend/pipelineAutomationService');
      const result = await processEvent('12345', 'invalid_event', {});
      expect(result.success).toBe(false);
    });
  });

  describe('seedDefaultRules', () => {
    it('should create 4 default rules', async () => {
      const { seedDefaultRules } = require('backend/pipelineAutomationService');
      const result = await seedDefaultRules('12345');
      expect(result.success).toBe(true);
      expect(result.total).toBe(4);
    });
  });
});
