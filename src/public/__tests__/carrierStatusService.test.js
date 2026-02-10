/* eslint-disable */
/**
 * Carrier Status Service Tests
 */

/* eslint-env jest */

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  getRecord: jest.fn()
}));

jest.mock('backend/carrierPreferences', () => ({
  getHiringPreferences: jest.fn()
}));

describe('carrierStatusService', () => {
  let carrierStatusService;
  let dataAccess;
  let carrierPreferences;

  beforeEach(async () => {
    jest.resetModules();
    dataAccess = await import('backend/dataAccess');
    carrierPreferences = await import('backend/carrierPreferences');
    carrierStatusService = await import('backend/carrierStatusService');

    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [] });
    carrierPreferences.getHiringPreferences.mockResolvedValue({ success: true, preferences: null });
  });

  describe('getCarrierOnboardingStatus', () => {
    test('returns error if carrier not found', async () => {
      dataAccess.queryRecords.mockResolvedValueOnce({ success: true, items: [] }); // Carriers query

      const result = await carrierStatusService.getCarrierOnboardingStatus('12345');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Carrier not found');
    });

    test('determines status based on carrier and enrichment state', async () => {
      // 1. Mock carrier found
      dataAccess.queryRecords.mockResolvedValueOnce({ 
        success: true, 
        items: [{ dot_number: '12345', status: 'pending' }] 
      });
      // 2. Mock enrichment found
      dataAccess.queryRecords.mockResolvedValueOnce({ 
        success: true, 
        items: [{ dot_number: '12345', enriched_date: new Date() }] 
      });
      // 3. Mock match count (drivers query)
      dataAccess.queryRecords.mockResolvedValueOnce({ 
        success: true, 
        totalCount: 5 
      });

      const result = await carrierStatusService.getCarrierOnboardingStatus('12345');
      expect(result.success).toBe(true);
      expect(result.status.stage).toBe(3); // Enriching
      expect(result.status.stageName).toBe('enriching');
    });

    test('detects live status when carrier is active', async () => {
      dataAccess.queryRecords.mockResolvedValueOnce({ 
        success: true, 
        items: [{ dot_number: '12345', status: 'active' }] 
      });
      dataAccess.queryRecords.mockResolvedValueOnce({ success: true, items: [] }); // Enrichments
      dataAccess.queryRecords.mockResolvedValueOnce({ success: true, totalCount: 0 }); // Drivers

      const result = await carrierStatusService.getCarrierOnboardingStatus('12345');
      expect(result.status.stage).toBe(4); // Live
      expect(result.status.stageName).toBe('live');
    });

    test('detects matching status when active and has matches', async () => {
      dataAccess.queryRecords.mockResolvedValueOnce({ 
        success: true, 
        items: [{ dot_number: '12345', status: 'active' }] 
      });
      dataAccess.queryRecords.mockResolvedValueOnce({ success: true, items: [] });
      dataAccess.queryRecords.mockResolvedValueOnce({ 
        success: true, 
        totalCount: 10 
      });

      const result = await carrierStatusService.getCarrierOnboardingStatus('12345');
      expect(result.status.stage).toBe(5); // Matching
      expect(result.status.stageName).toBe('matching');
      expect(result.status.matchPreview.count).toBe(10);
    });
  });

  describe('getMatchCount', () => {
    test('queries drivers with preferences', async () => {
      carrierPreferences.getHiringPreferences.mockResolvedValue({ 
        success: true, 
        preferences: { required_cdl_types: ['A'], min_experience_years: 2 } 
      });
      dataAccess.queryRecords.mockResolvedValue({ success: true, totalCount: 25 });

      const result = await carrierStatusService.getMatchCount('12345');
      expect(result.count).toBe(25);
      
      const lastCall = dataAccess.queryRecords.mock.calls[dataAccess.queryRecords.mock.calls.length - 1];
      expect(lastCall[1].filters.cdl_class.hasSome).toContain('A');
      expect(lastCall[1].filters.years_experience.gte).toBe(2);
    });
  });
});
