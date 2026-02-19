/* eslint-disable */
import {
  searchExternalParking,
  getExternalParkingLocation
} from '../../backend/externalParkingApi.jsw';

jest.mock('backend/parkingService', () => ({
  searchParking: jest.fn(),
  getParkingDetails: jest.fn()
}));

const { searchParking, getParkingDetails } = require('backend/parkingService');

describe('externalParkingApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns parking search with source attribution and geo query data', async () => {
    searchParking.mockResolvedValue({
      success: true,
      items: [
        {
          _id: 'loc_sensor',
          name: 'I-40 Rest Area',
          location: { lat: 35.1, lng: -90.1 },
          distance_miles: 4.2,
          total_spaces: 40,
          available_spaces: 9,
          source: 'indiana_tpims',
          source_label: 'INDOT Sensors',
          data_confidence: 'sensor',
          amenities: ['restroom', 'food']
        },
        {
          _id: 'loc_community',
          name: 'Community Lot',
          location: { lat: 35.2, lng: -90.2 },
          distance_miles: 6.1,
          total_spaces: 20,
          available_spaces: 2,
          source: 'community',
          data_confidence: 'reported',
          amenities: ['restroom']
        }
      ]
    });

    const result = await searchExternalParking({
      lat: 35.1495,
      lng: -90.049,
      radius: 25,
      min_spaces: 5
    });

    expect(result.success).toBe(true);
    expect(result.data.query.center.lat).toBe(35.1495);
    expect(result.data.results.length).toBe(1);
    expect(result.data.results[0].availability.source_label).toBe('INDOT Sensors');
    expect(result.data.coverage.sensor_locations).toBe(1);
  });

  test('returns detailed location with historical availability and reviews', async () => {
    getParkingDetails.mockResolvedValue({
      success: true,
      item: {
        _id: 'loc_123',
        name: 'Pilot Lot',
        location: { lat: 35.15, lng: -90.05 },
        total_spaces: 50,
        available_spaces: 12,
        source: 'community',
        amenities: ['showers', 'laundry'],
        historical_availability: [
          { timestamp: '2026-02-18T12:00:00.000Z', available_spaces: 10, trend: 'down' },
          { timestamp: '2026-02-19T12:00:00.000Z', available_spaces: 12, trend: 'up' }
        ],
        reviews: [
          { rating: 4, comment: 'Clean lot', created_at: '2026-02-18T01:00:00.000Z' }
        ]
      }
    });

    const result = await getExternalParkingLocation('loc_123');

    expect(result.success).toBe(true);
    expect(result.data.amenities).toContain('showers');
    expect(result.data.historical_availability.length).toBe(2);
    expect(result.data.reviews.length).toBe(1);
    expect(result.data.availability.source_label).toBe('Community reports');
  });

  test('validates required geo params', async () => {
    const result = await searchExternalParking({ radius: 25 });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('invalid_request');
  });
});
