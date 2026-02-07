import {
  searchExternalFuelPrices,
  planExternalRouteFuel,
  getExternalFuelStation
} from '../../backend/externalFuelApi.jsw';

jest.mock('backend/fuelService', () => ({
  searchFuelPrices: jest.fn(),
  getFuelAlongRoute: jest.fn(),
  getFuelPriceTrends: jest.fn()
}));
jest.mock('backend/dataAccess', () => ({
  getRecord: jest.fn(),
  queryRecords: jest.fn()
}));

const { searchFuelPrices, getFuelAlongRoute, getFuelPriceTrends } = require('backend/fuelService');
const dataAccess = require('backend/dataAccess');

describe('externalFuelApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns fuel prices with regional averages', async () => {
    searchFuelPrices.mockResolvedValue({
      success: true,
      items: [
        {
          _id: 'st_1',
          station_name: 'Station A',
          location: { lat: 35.1, lng: -90.1 },
          distance_miles: 4.2,
          effective_price: 3.45,
          diesel_price: 3.55,
          discount_applied: 0.1,
          address: { state: 'TN' },
          amenities: ['showers']
        },
        {
          _id: 'st_2',
          station_name: 'Station B',
          location: { lat: 35.2, lng: -90.2 },
          distance_miles: 6.0,
          effective_price: 3.5,
          diesel_price: 3.6,
          discount_applied: 0.1,
          address: { state: 'AR' },
          amenities: []
        }
      ]
    });

    const result = await searchExternalFuelPrices({ lat: 35.0, lng: -90.0, radius: 25 });
    expect(result.success).toBe(true);
    expect(result.data.regional_averages.avg_effective_diesel).toBe(3.475);
    expect(result.data.regional_averages.by_state.length).toBe(2);
  });

  test('plans route with optimized stops and pricing', async () => {
    getFuelAlongRoute.mockResolvedValue({
      success: true,
      items: [
        { _id: 's1', station_name: 'A', effective_price: 3.4, savings_per_fill: 12, discount_applied: 0.1, route_mile: 50 },
        { _id: 's2', station_name: 'B', effective_price: 3.3, savings_per_fill: 15, discount_applied: 0.12, route_mile: 150 },
        { _id: 's3', station_name: 'C', effective_price: 3.5, savings_per_fill: 8, discount_applied: 0.08, route_mile: 240 }
      ]
    });

    const result = await planExternalRouteFuel({
      route_points: [{ lat: 35, lng: -90 }, { lat: 36, lng: -88 }],
      fuel_cards: ['comdata'],
      total_distance_miles: 300,
      mpg: 6.5,
      tank_capacity_gallons: 120,
      current_fuel_gallons: 20
    });

    expect(result.success).toBe(true);
    expect(result.data.recommended_stops.length).toBeGreaterThan(0);
    expect(result.data.total_fuel_cost_estimate).toBeGreaterThan(0);
  });

  test('returns detailed station payload with card discounts and amenities', async () => {
    dataAccess.getRecord.mockResolvedValue({
      _id: 'station_1',
      station_name: 'Pilot #1',
      location: { lat: 35.1, lng: -90.1 },
      address: { state: 'TN' },
      diesel_price: 3.59,
      def_price: 3.99,
      amenities: ['showers', 'laundry'],
      card_discounts: { comdata: 0.1, efs: 0.08 }
    });
    getFuelPriceTrends.mockResolvedValue({
      success: true,
      trends: [{ avg_diesel: 3.55 }, { avg_diesel: 3.57 }]
    });

    const result = await getExternalFuelStation('station_1');
    expect(result.success).toBe(true);
    expect(result.data.amenities).toContain('showers');
    expect(result.data.fuel_card_discounts.length).toBeGreaterThan(0);
    expect(result.data.pricing.regional_state_avg_diesel).toBe(3.56);
  });
});
