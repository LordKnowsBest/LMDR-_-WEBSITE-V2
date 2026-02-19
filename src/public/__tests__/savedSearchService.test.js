/* eslint-disable */
/**
 * Tests for savedSearchService.jsw
 * Covers CRUD operations, criteria serialization, ownership checks, alert processing
 */

// Mock dependencies
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
jest.mock('wix-users-backend', () => ({ currentUser: { loggedIn: true, id: 'test-user-123' } }));
jest.mock('backend/featureAdoptionService', () => ({ logFeatureInteraction: jest.fn(() => Promise.resolve()) }));

describe('SavedSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAirtable.queryRecords.mockResolvedValue({ records: [] });
    mockAirtable.createRecord.mockResolvedValue({ _id: 'new-search-1' });
    mockAirtable.getRecord.mockResolvedValue({ _id: 'search-1', recruiter_id: 'test-user-123', is_active: true });
  });

  describe('createSavedSearch', () => {
    it('should create a saved search with valid data', async () => {
      const { createSavedSearch } = require('backend/savedSearchService');
      const result = await createSavedSearch('12345', {
        searchName: 'Test Search',
        criteria: { cdl_types: ['A'] },
        alertFrequency: 'daily',
        alertChannel: 'in_app'
      });
      expect(result.success).toBe(true);
      expect(mockAirtable.createRecord).toHaveBeenCalled();
    });

    it('should reject empty search name', async () => {
      const { createSavedSearch } = require('backend/savedSearchService');
      const result = await createSavedSearch('12345', { searchName: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject duplicate names per carrier', async () => {
      mockAirtable.queryRecords.mockResolvedValueOnce({ records: [{ _id: 'existing' }] });
      const { createSavedSearch } = require('backend/savedSearchService');
      const result = await createSavedSearch('12345', {
        searchName: 'Duplicate Name',
        criteria: {}
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should default to daily frequency and in_app channel', async () => {
      const { createSavedSearch } = require('backend/savedSearchService');
      await createSavedSearch('12345', {
        searchName: 'Test',
        criteria: {},
        alertFrequency: 'invalid',
        alertChannel: 'invalid'
      });
      // Filter out observability logging calls to systemMetrics
      const searchCalls = mockAirtable.createRecord.mock.calls.filter(c => c[0] !== 'systemMetrics');
      const callArgs = searchCalls[0][1];
      expect(callArgs.alert_frequency).toBe('daily');
      expect(callArgs.alert_channel).toBe('in_app');
    });
  });

  describe('updateSavedSearch', () => {
    it('should verify ownership before updating', async () => {
      mockAirtable.getRecord.mockResolvedValueOnce({ _id: 'search-1', recruiter_id: 'other-user' });
      const { updateSavedSearch } = require('backend/savedSearchService');
      const result = await updateSavedSearch('search-1', { searchName: 'Updated' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authorized');
    });
  });

  describe('deleteSavedSearch', () => {
    it('should soft delete by setting is_active=false', async () => {
      const { deleteSavedSearch } = require('backend/savedSearchService');
      const result = await deleteSavedSearch('search-1');
      expect(result.success).toBe(true);
      const updateArgs = mockAirtable.updateRecord.mock.calls[0][2];
      expect(updateArgs.is_active).toBe(false);
    });
  });

  describe('getSavedSearches', () => {
    it('should return active searches with parsed criteria', async () => {
      mockAirtable.queryRecords.mockResolvedValueOnce({
        records: [{ _id: 's1', search_name: 'Test', criteria_json: '{"cdl":["A"]}', is_active: true }]
      });
      const { getSavedSearches } = require('backend/savedSearchService');
      const result = await getSavedSearches('12345');
      expect(result.success).toBe(true);
      expect(result.searches[0].criteria).toEqual({ cdl: ['A'] });
    });
  });

  describe('processSavedSearchAlerts', () => {
    it('should process due searches and create alerts for new matches', async () => {
      const { processSavedSearchAlerts } = require('backend/savedSearchService');
      const result = await processSavedSearchAlerts();
      expect(result.success).toBe(true);
    });
  });
});
