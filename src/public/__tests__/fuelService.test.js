/**
 * @jest-environment node
 *
 * Fuel Service Test Suite
 * =======================
 * Tests for the fuel optimizer and price tracking system.
 */
/* eslint-env jest */

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockWixData = {
    insert: jest.fn(),
    query: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    remove: jest.fn()
};

const createMockQueryBuilder = (items = []) => ({
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    le: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    ascending: jest.fn().mockReturnThis(),
    find: jest.fn().mockResolvedValue({ items, length: items.length })
});

jest.mock('wix-data', () => mockWixData, { virtual: true });

const mockLocationService = {
    calculateDistance: jest.fn((lat1, lng1, lat2, lng2) => {
        return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 69;
    })
};
jest.mock('backend/locationService', () => mockLocationService, { virtual: true });

// ============================================================================
// SERVICE IMPLEMENTATION (Inline for testing - mirrors fuelService.jsw)
// ============================================================================

const COLLECTIONS = {
    PRICES: 'FuelPrices',
    CARDS: 'FuelCards',
    CACHE: 'RoadUtilityCache'
};

/**
 * Search for diesel prices near location
 */
async function searchFuelPrices(lat, lng, radius = 50, options = {}) {
    try {
        // Query local database (mock of GasBuddy/OPIS cache)
        const results = await mockWixData.query(COLLECTIONS.PRICES)
            .limit(1000)
            .find({ suppressAuth: true });
            
        const items = results.items || [];

        // Filter by radius
        const nearbyStations = items.filter(station => {
            const distance = mockLocationService.calculateDistance(lat, lng, station.location.lat, station.location.lng);
            station.distance_miles = parseFloat(distance.toFixed(2));
            return distance <= radius;
        });

        // Apply fuel card discounts
        const processedStations = nearbyStations.map(station => {
            let discount = 0;
            if (options.cardType && station.card_discounts && station.card_discounts[options.cardType]) {
                discount = station.card_discounts[options.cardType];
            }
            
            return {
                ...station,
                retail_price: station.diesel_price,
                discount_applied: discount,
                effective_price: parseFloat((station.diesel_price - discount).toFixed(3))
            };
        });

        // Sort by effective price
        processedStations.sort((a, b) => a.effective_price - b.effective_price);

        return { success: true, items: processedStations };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Fuel Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('searchFuelPrices', () => {
        test('returns fuel stations sorted by price', async () => {
            
            const mockStations = [
                { _id: 's1', name: 'Cheap Fuel', location: { lat: 35.1, lng: -89.4 }, diesel_price: 3.50 },
                { _id: 's2', name: 'Expensive Fuel', location: { lat: 35.2, lng: -89.3 }, diesel_price: 3.80 }
            ];

            mockWixData.query.mockReturnValue(createMockQueryBuilder(mockStations));

            const result = await searchFuelPrices(35.0, -89.5, 50);

            expect(result.success).toBe(true);
            expect(result.items).toHaveLength(2);
            expect(result.items[0].diesel_price).toBe(3.50);
            expect(result.items[0].effective_price).toBe(3.50);
        });

        test('applies fuel card discounts', async () => {
            
            const mockStations = [
                { 
                    _id: 's1', 
                    name: 'Pilot', 
                    location: { lat: 35.1, lng: -89.4 },
                    diesel_price: 3.80, 
                    card_discounts: { comdata: 0.10 } 
                }
            ];

            mockWixData.query.mockReturnValue(createMockQueryBuilder(mockStations));

            const result = await searchFuelPrices(35.0, -89.5, 50, { cardType: 'comdata' });

            expect(result.items[0].effective_price).toBe(3.70);
            expect(result.items[0].discount_applied).toBe(0.10);
        });
    });
});
