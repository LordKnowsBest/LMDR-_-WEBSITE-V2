
import { getRouteConditions, getTruckRestrictions, reportCondition } from '../../backend/roadConditionService';

// Mock dependencies
jest.mock('wix-data', () => ({
    insert: jest.fn().mockResolvedValue({ _id: 'mock_report_id' })
}));
jest.mock('wix-fetch', () => ({
    fetch: jest.fn()
}));
jest.mock('backend/config', () => ({
    usesAirtable: jest.fn().mockReturnValue(false),
    getAirtableTableName: jest.fn()
}), { virtual: true });
jest.mock('backend/airtableClient', () => ({}), { virtual: true });
jest.mock('../../backend/adapters/state511', () => ({
    fetchMultiStateConditions: jest.fn().mockResolvedValue([])
}));

describe('Road Condition Service', () => {

    describe('getRouteConditions', () => {
        it('should return closures near Donner Pass (I-80)', async () => {
            // Mock route points crossing Donner Pass
            const routePoints = [
                { lat: 39.3, lng: -120.3 }, // Near Donner
                { lat: 39.4, lng: -120.0 }
            ];

            const result = await getRouteConditions(routePoints);

            expect(result.success).toBe(true);
            expect(result.conditions.length).toBeGreaterThan(0);
            expect(result.conditions[0].highway).toBe('I-80');
            expect(result.conditions[0].type).toBe('closure');
            expect(result.summary.total_incidents).toBeGreaterThan(0);
        });

        it('should return clear roads for far away route', async () => {
            // Points in Florida (far from our CA mocks)
            const routePoints = [
                { lat: 25.7, lng: -80.2 },
                { lat: 26.1, lng: -80.1 }
            ];

            const result = await getRouteConditions(routePoints);

            expect(result.success).toBe(true);
            expect(result.conditions.length).toBe(0);
            expect(result.summary.status).toBe('Clear');
        });

        it('should handle empty route gracefully', async () => {
            const result = await getRouteConditions([]);
            expect(result.success).toBe(false);
            expect(result.error).toBe('No route provided');
        });
    });

    describe('getTruckRestrictions', () => {
        it('should return height restriction for tall trucks', async () => {
            const routePoints = [{ lat: 39.6, lng: -105.9 }]; // US-6 Loveland Pass
            const tallTruck = { height: 14.0 }; // Taller than 13.5ft limit

            const result = await getTruckRestrictions(routePoints, tallTruck);

            expect(result.success).toBe(true);
            const heightRest = result.restrictions.find(r => r.restriction_type === 'height');
            expect(heightRest).toBeDefined();
            expect(heightRest.value).toBe(13.5);
        });

        it('should NOT return height restriction for short trucks', async () => {
            const routePoints = [{ lat: 39.6, lng: -105.9 }];
            const shortTruck = { height: 12.0 }; // Shorter than limit

            const result = await getTruckRestrictions(routePoints, shortTruck);

            expect(result.success).toBe(true);
            const heightRest = result.restrictions.find(r => r.restriction_type === 'height');
            expect(heightRest).toBeUndefined();
        });
    });

    describe('reportCondition', () => {
        it('should successfully submit a valid report', async () => {
            const report = {
                driverId: 'driver123',
                type: 'accident',
                location: { lat: 39.0, lng: -120.0 },
                highway: 'I-80',
                state: 'CA',
                description: 'Rollover in right lane'
            };

            const result = await reportCondition(report);

            expect(result.success).toBe(true);
            expect(result.reportId).toBeDefined();
        });

        it('should reject invalid report', async () => {
            const result = await reportCondition({}); // Missing fields
            expect(result.success).toBe(false);
        });
    });

});
