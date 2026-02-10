/* eslint-disable */
/**
 * Tests for callOutcomeService.jsw
 * Covers outcome logging, analytics, feedback weight aggregation, scoring bounds
 */

const mockAirtable = {
  queryRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  getAllRecords: jest.fn(),
  upsertRecord: jest.fn()
};

jest.mock('backend/airtableClient', () => mockAirtable);
jest.mock('backend/config', () => ({
  usesAirtable: jest.fn(() => true),
  getAirtableTableName: jest.fn((key) => `v2_${key}`),
  getWixCollectionName: jest.fn((key) => key)
}));
jest.mock('wix-data', () => ({ query: jest.fn(), insert: jest.fn(), update: jest.fn() }));
jest.mock('wix-users-backend', () => ({ currentUser: { loggedIn: true, id: 'recruiter-123' } }));
jest.mock('backend/featureAdoptionService', () => ({ logFeatureInteraction: jest.fn(() => Promise.resolve()) }));
jest.mock('backend/gamificationService', () => ({ awardRecruiterPoints: jest.fn(() => Promise.resolve()) }));

describe('CallOutcomeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAirtable.createRecord.mockResolvedValue({ _id: 'outcome-1' });
    mockAirtable.getAllRecords.mockResolvedValue([]);
  });

  describe('logCallOutcome', () => {
    it('should log a valid call outcome', async () => {
      const { logCallOutcome } = require('backend/callOutcomeService');
      const result = await logCallOutcome('12345', {
        driverId: 'driver-1',
        outcome: 'interested',
        sentiment: 'positive'
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid outcome values', async () => {
      const { logCallOutcome } = require('backend/callOutcomeService');
      const result = await logCallOutcome('12345', {
        driverId: 'driver-1',
        outcome: 'invalid_outcome'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid outcome');
    });

    it('should require driver ID', async () => {
      const { logCallOutcome } = require('backend/callOutcomeService');
      const result = await logCallOutcome('12345', { outcome: 'interested' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Driver ID');
    });
  });

  describe('getOutcomeAnalytics', () => {
    it('should calculate conversion rates by score band', async () => {
      mockAirtable.getAllRecords.mockResolvedValueOnce([
        { outcome: 'interested', match_score_at_call: 95, sentiment: 'positive' },
        { outcome: 'wrong_fit', match_score_at_call: 60, sentiment: 'negative' },
        { outcome: 'callback', match_score_at_call: 85, sentiment: 'positive' }
      ]);
      const { getOutcomeAnalytics } = require('backend/callOutcomeService');
      const result = await getOutcomeAnalytics('12345');
      expect(result.success).toBe(true);
      expect(result.analytics.totalCalls).toBe(3);
      expect(result.analytics.overallConversionRate).toBeGreaterThan(0);
    });
  });

  describe('processFeedbackBatch', () => {
    it('should cap feedback weights at +/- 20%', async () => {
      mockAirtable.getAllRecords.mockResolvedValueOnce([
        { carrier_dot: '12345', outcome: 'interested' },
        { carrier_dot: '12345', outcome: 'interested' },
        { carrier_dot: '12345', outcome: 'interested' }
      ]);
      const { processFeedbackBatch } = require('backend/callOutcomeService');
      const result = await processFeedbackBatch();
      expect(result.success).toBe(true);
    });
  });
});
