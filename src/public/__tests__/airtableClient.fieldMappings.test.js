/**
 * Airtable Client Field Mapping Tests (carrierStaffingRequests)
 */

/* eslint-env jest */

describe('airtableClient field mappings', () => {
  let toAirtableFormat;
  let toWixFormat;

  beforeAll(async () => {
    const airtableClient = await import('backend/airtableClient');
    toAirtableFormat = airtableClient.toAirtableFormat;
    toWixFormat = airtableClient.toWixFormat;
  });

  describe('carrierStaffingRequests mappings', () => {
    test('maps all known fields correctly', () => {
      const input = {
        additional_notes: 'Need drivers ASAP',
        submitted_date: new Date('2026-01-01T10:00:00Z'),
        source_url: '/homepage',
        driver_types: ['OTR', 'Regional']
      };

      const output = toAirtableFormat(input, 'carrierStaffingRequests');

      expect(output['Notes']).toBe('Need drivers ASAP');
      expect(output['Submitted Date']).toBe('2026-01-01T10:00:00.000Z');
      expect(output['Source URL']).toBe('/homepage');
      expect(output['Driver Types']).toEqual(['OTR', 'Regional']);
    });

    test('passes through unmapped fields with Title Case conversion and warns', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const input = { custom_field: 'value' };
      const output = toAirtableFormat(input, 'carrierStaffingRequests');

      expect(output['Custom Field']).toBe('value');
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    test('round-trip: Wix -> Airtable -> Wix preserves data', () => {
      const original = { additional_notes: 'Test', status: 'new' };
      const toAirtable = toAirtableFormat(original, 'carrierStaffingRequests');
      const backToWix = toWixFormat({ id: 'rec1', fields: toAirtable }, 'carrierStaffingRequests');

      expect(backToWix.additional_notes).toBe(original.additional_notes);
      expect(backToWix.status).toBe(original.status);
    });

    test('handles mixed case input fields strictly (treated as unmapped)', () => {
      const input = { Additional_Notes: 'Test', ADDITIONAL_NOTES: 'Test2' };
      const output = toAirtableFormat(input, 'carrierStaffingRequests');

      expect(output['Additional Notes']).toBe('Test');
      expect(output['ADDITIONAL NOTES']).toBe('Test2');
      expect(output['Notes']).toBeUndefined();
    });
  });
});
