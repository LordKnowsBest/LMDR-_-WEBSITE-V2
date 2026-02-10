/* eslint-disable */
import {
  searchExternalDrivers,
  getExternalDriverProfile,
  matchExternalCarriers
} from '../../backend/externalMatchingApi.jsw';

jest.mock('backend/driverMatching', () => ({
  findMatchingDrivers: jest.fn(),
  getDriverProfile: jest.fn()
}));
jest.mock('backend/carrierMatching', () => ({
  findMatchingCarriers: jest.fn()
}));
jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  updateRecord: jest.fn()
}));

const { findMatchingDrivers, getDriverProfile } = require('backend/driverMatching');
const { findMatchingCarriers } = require('backend/carrierMatching');
const dataAccess = require('backend/dataAccess');

describe('externalMatchingApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('applies external driver filters for class/endorsements/distance', async () => {
    findMatchingDrivers.mockResolvedValue({
      success: true,
      pagination: { totalCount: 2 },
      matches: [
        {
          score: 90,
          driver: {
            _id: 'd1',
            cdl_class: 'A',
            endorsements: ['H', 'N'],
            years_experience: 5,
            distance_miles: 40,
            city: 'Memphis',
            state: 'TN'
          }
        },
        {
          score: 80,
          driver: {
            _id: 'd2',
            cdl_class: 'B',
            endorsements: ['P'],
            years_experience: 2,
            distance_miles: 120,
            city: 'Nashville',
            state: 'TN'
          }
        }
      ]
    });

    const result = await searchExternalDrivers({
      carrier_dot: '123456',
      filters: {
        cdl_class: ['A'],
        endorsements_required: ['H'],
        min_experience_years: 3,
        max_distance_miles: 50
      }
    }, { tier: 'enterprise' });

    expect(result.success).toBe(true);
    expect(result.data.results.length).toBe(1);
    expect(result.data.results[0].driver_id).toBe('d1');
  });

  test('masks pii by default for driver profile', async () => {
    getDriverProfile.mockResolvedValue({
      success: true,
      driver: {
        _id: 'd1',
        full_name: 'Test Driver',
        email: 'driver@example.com',
        phone: '5551234567'
      }
    });

    const result = await getExternalDriverProfile('d1', {
      carrier_dot: '123456'
    }, { tier: 'enterprise', partner: { partner_id: 'ptn_1' } });

    expect(result.success).toBe(true);
    expect(result.data.pii_masked).toBe(true);
    expect(result.data.profile.email).toBe('***masked***');
  });

  test('allows enterprise unmask and records profile view credit', async () => {
    getDriverProfile.mockResolvedValue({
      success: true,
      driver: {
        _id: 'd1',
        full_name: 'Test Driver',
        email: 'driver@example.com',
        phone: '5551234567'
      }
    });
    dataAccess.queryRecords.mockResolvedValue({
      items: [{ _id: 'usage_1', quotas_used: { driver_profile_views: 1 } }]
    });
    dataAccess.updateRecord.mockResolvedValue({ success: true });

    const result = await getExternalDriverProfile('d1', {
      carrier_dot: '123456',
      unmask_pii: 'true'
    }, { tier: 'enterprise', partner: { partner_id: 'ptn_1' } });

    expect(result.success).toBe(true);
    expect(result.data.pii_masked).toBe(false);
    expect(result.data.profile.email).toBe('driver@example.com');
    expect(dataAccess.updateRecord).toHaveBeenCalled();
  });

  test('returns carrier match payload with score breakdown', async () => {
    findMatchingCarriers.mockResolvedValue({
      success: true,
      totalMatches: 1,
      matches: [{
        overallScore: 88,
        scores: { pay: 30, home_time: 20 },
        carrier: {
          DOT_NUMBER: '123456',
          LEGAL_NAME: 'ACME CARRIER',
          PHY_CITY: 'Memphis',
          PHY_STATE: 'TN'
        },
        enrichment: {
          pay_cpm_range: '$0.60-$0.70',
          driver_sentiment: 'positive',
          hiring_status: 'active'
        }
      }]
    });

    const result = await matchExternalCarriers({
      driver_profile: {
        endorsements: ['H'],
        years_experience: 4,
        preferences: { operation_type: 'OTR', min_cpm: 0.6 }
      },
      include_enrichment: true
    });

    expect(result.success).toBe(true);
    expect(result.data.results.length).toBe(1);
    expect(result.data.results[0].match_score).toBe(88);
    expect(result.data.results[0].score_breakdown.pay).toBe(30);
  });
});
