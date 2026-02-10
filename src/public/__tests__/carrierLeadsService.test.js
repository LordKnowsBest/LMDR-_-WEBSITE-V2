/* eslint-disable */
/**
 * Carrier Leads Service Tests (submitCarrierStaffingRequest)
 */

/* eslint-env jest */

jest.mock('backend/config', () => ({
  usesAirtable: jest.fn(),
  getWixCollectionName: jest.fn((name) => name),
  getAirtableTableName: jest.fn((name) => `v2_${name}`)
}));

jest.mock('backend/airtableClient', () => ({
  queryRecords: jest.fn(),
  createRecord: jest.fn()
}));

const wixData = require('wix-data');

describe('carrierLeadsService', () => {
  let submitCarrierStaffingRequest;
  let config;
  let airtable;

  const baseFormData = {
    companyName: 'Test Trucking',
    contactName: 'John Doe',
    email: 'john@test.com',
    phone: '555-1234',
    staffingType: 'emergency',
    driversNeeded: '5-10',
    driverTypes: ['OTR', 'Regional'],
    additionalNotes: 'Urgent need',
    sourceUrl: '/homepage'
  };

  beforeEach(async () => {
    jest.resetModules();
    config = await import('backend/config');
    airtable = await import('backend/airtableClient');
    ({ submitCarrierStaffingRequest } = await import('backend/carrierLeadsService'));

    config.usesAirtable.mockImplementation((key) => key === 'carriers' || key === 'carrierStaffingRequests');
    config.getAirtableTableName.mockImplementation((key) => {
      if (key === 'carriers') return 'Carriers (Master)';
      if (key === 'carrierStaffingRequests') return 'v2_Carrier Staffing Requests';
      return `v2_${key}`;
    });

    airtable.queryRecords.mockResolvedValue({ records: [] });
    airtable.createRecord.mockResolvedValue({ _id: 'lead_1' });

    wixData.query.mockClear();
  });

  describe('carrier lookup', () => {
    test('uses {DOT_NUMBER} filter formula', async () => {
      airtable.queryRecords.mockResolvedValue({ records: [{ _id: 'carrier_1' }] });

      await submitCarrierStaffingRequest({
        ...baseFormData,
        dotNumber: '12345'
      });

      const options = airtable.queryRecords.mock.calls[0][1];
      expect(options.filterByFormula).toBe('{DOT_NUMBER} = 12345');
    });

    test('converts string DOT to number before query', async () => {
      await submitCarrierStaffingRequest({
        ...baseFormData,
        dotNumber: '  12345  '
      });

      const options = airtable.queryRecords.mock.calls[0][1];
      expect(options.filterByFormula).toBe('{DOT_NUMBER} = 12345');
    });

    test('handles DOT with invalid characters gracefully', async () => {
      await submitCarrierStaffingRequest({
        ...baseFormData,
        dotNumber: '123-456'
      });

      expect(airtable.queryRecords).not.toHaveBeenCalled();
    });

    test('handles DOT exceeding valid range', async () => {
      await submitCarrierStaffingRequest({
        ...baseFormData,
        dotNumber: '123456789'
      });

      expect(airtable.queryRecords).not.toHaveBeenCalled();
    });

    test('queries Airtable when usesAirtable returns true', async () => {
      config.usesAirtable.mockImplementation((key) => key === 'carriers' || key === 'carrierStaffingRequests');

      await submitCarrierStaffingRequest({
        ...baseFormData,
        dotNumber: '12345'
      });

      expect(airtable.queryRecords).toHaveBeenCalled();
      expect(wixData.query).not.toHaveBeenCalled();
    });

    test('queries Wix when usesAirtable returns false', async () => {
      config.usesAirtable.mockReturnValue(false);

      await submitCarrierStaffingRequest({
        ...baseFormData,
        dotNumber: '12345'
      });

      expect(wixData.query).toHaveBeenCalled();
      expect(airtable.queryRecords).not.toHaveBeenCalled();
    });
  });

  describe('service-level integration', () => {
    test('sets linked_carrier_id when DOT matches existing carrier', async () => {
      airtable.queryRecords.mockResolvedValue({ records: [{ _id: 'carrier_123' }] });

      await submitCarrierStaffingRequest({
        ...baseFormData,
        dotNumber: '12345'
      });

      const leadRecord = airtable.createRecord.mock.calls[0][1];
      expect(leadRecord.linked_carrier_id).toBe('carrier_123');
    });

    test('returns error when Airtable insert fails', async () => {
      airtable.createRecord.mockRejectedValue(new Error('API limit'));

      const result = await submitCarrierStaffingRequest({
        ...baseFormData,
        dotNumber: '12345'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API limit');
    });

    test('serializes driverTypes array correctly', async () => {
      await submitCarrierStaffingRequest({
        ...baseFormData,
        driverTypes: ['OTR', 'Regional', 'Local']
      });

      const leadRecord = airtable.createRecord.mock.calls[0][1];
      expect(leadRecord.driver_types).toEqual(['OTR', 'Regional', 'Local']);
    });
  });

  describe('getMatchPreview', () => {
    let getMatchPreview;

    beforeEach(async () => {
      ({ getMatchPreview } = await import('backend/carrierLeadsService'));
    });

    test('returns correct count and messaging', async () => {
      airtable.queryRecords.mockResolvedValue({
        success: true,
        items: [
          { cdl_class: 'A', years_experience: 5 },
          { cdl_class: 'A', years_experience: 3 }
        ],
        totalCount: 2
      });

      const result = await getMatchPreview({ cdlTypes: ['A'] });
      
      expect(result.success).toBe(true);
      expect(result.preview.count).toBe(2);
      expect(result.preview.breakdown.avgExperience).toBe(4);
      expect(result.preview.message).toContain('2 drivers');
    });

    test('filters by experience correctly', async () => {
      await getMatchPreview({ minExperience: 3 });

      const options = airtable.queryRecords.mock.calls[0][1];
      expect(options.filters.years_experience.gte).toBe(3);
    });

    test('handles empty matches gracefully', async () => {
      airtable.queryRecords.mockResolvedValue({
        success: true,
        items: [],
        totalCount: 0
      });

      const result = await getMatchPreview({ cdlTypes: ['X'] });
      
      expect(result.preview.count).toBe(0);
      expect(result.preview.hasMatches).toBe(false);
      expect(result.preview.message).toContain('growing daily');
    });
  });
});
