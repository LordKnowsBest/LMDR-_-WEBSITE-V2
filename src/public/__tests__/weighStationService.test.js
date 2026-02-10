/* eslint-disable */

import {
    searchWeighStations,
    getWeighStationsAlongRoute,
    reportStationStatus,
    getStationStatus
} from '../../backend/weighStationService';
import wixData from 'wix-data';

// Mock dependencies
jest.mock('wix-data', () => ({
    query: jest.fn(),
    get: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    remove: jest.fn()
}));

jest.mock('wix-fetch', () => ({
    fetch: jest.fn()
}));

jest.mock('backend/config', () => ({
    usesAirtable: jest.fn().mockReturnValue(false),
    getAirtableTableName: jest.fn()
}));

jest.mock('backend/airtableClient', () => ({
    queryRecords: jest.fn(),
    getRecord: jest.fn(),
    createRecord: jest.fn()
}));

describe('Weigh Station Service Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. Test station search along route
    test('getWeighStationsAlongRoute should return unique stations from multiple waypoints', async () => {
        // Setup mock response for searchWeighStations (internal logic simulation)
        // Since we can't easily mock the internal export, we mock the wixData query to return different results for different locations

        const mockStations1 = [{ _id: 's1', name: 'Station 1' }, { _id: 's2', name: 'Station 2' }];
        const mockStations2 = [{ _id: 's2', name: 'Station 2' }, { _id: 's3', name: 'Station 3' }];

        // Mock wixData.query builder chain
        const mockQuery = {
            eq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            find: jest.fn()
                .mockResolvedValueOnce({ items: [] }) // Cache miss
                .mockResolvedValueOnce({ items: mockStations1 }) // DB search 1
                .mockResolvedValueOnce({ items: [] }) // Cache miss
                .mockResolvedValueOnce({ items: mockStations2 }) // DB search 2
        };
        wixData.query.mockReturnValue(mockQuery);

        const routePoints = [
            { lat: 34.0, lng: -84.0 },
            { lat: 35.0, lng: -85.0 }
        ];

        const result = await getWeighStationsAlongRoute(routePoints, { corridorRadius: 50 });

        expect(result.success).toBe(true);
        expect(result.items.length).toBe(3); // s1, s2, s3 (s2 deduped)
        expect(result.items.find(s => s._id === 's1')).toBeDefined();
        expect(result.items.find(s => s._id === 's3')).toBeDefined();
    });

    // 2. Test driver report submission and validation
    test('reportStationStatus should validate and insert report', async () => {
        const stationId = 'station123';
        const report = {
            driver_id: 'driverABC',
            report_type: 'open',
            wait_minutes: 5,
            notes: 'Quick flow'
        };

        wixData.insert.mockResolvedValue({ _id: 'reportXYZ', ...report });

        const result = await reportStationStatus(stationId, report);

        expect(result.success).toBe(true);
        expect(wixData.insert).toHaveBeenCalledWith('WeighStationReports', expect.objectContaining({
            station_id: stationId,
            report_type: 'open',
            wait_minutes: 5
        }), expect.anything());
    });

    // 3. Test status aggregation from multiple sources
    test('searchWeighStations should aggregate driver reports for status', async () => {
        const mockStation = {
            _id: 's1',
            name: 'Station 1',
            location: { lat: 34.0, lng: -84.0 },
            status: 'unknown'
        };

        const mockReports = [
            { report_type: 'open', reported_at: new Date(Date.now() - 1000 * 60 * 10) }, // 10 mins ago
            { report_type: 'open', reported_at: new Date(Date.now() - 1000 * 60 * 20) }, // 20 mins ago
            { report_type: 'closed', reported_at: new Date(Date.now() - 1000 * 60 * 60 * 3) } // 3 hours ago (less weight)
        ];

        // Mock Cache Miss
        wixData.query.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            descending: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            find: jest.fn()
                .mockResolvedValueOnce({ items: [] }) // Cache
                .mockResolvedValueOnce({ items: [mockStation] }) // Stations DB
                .mockResolvedValueOnce({ items: mockReports }) // Reports DB
        });

        const result = await searchWeighStations(34.0, -84.0, 50);

        expect(result.success).toBe(true);
        const station = result.items[0];
        // Expect status to be 'open' because recent reports override old ones
        expect(station.status).toBe('open');
        expect(station.status_confidence).toBe('reported');
        expect(station.report_count).toBe(3);
    });

    // 4. Test bypass rate display accuracy
    test('should calculate bypass probability correctly based on enabled services', async () => {
        const mockStation = {
            _id: 's1',
            location: { lat: 34.0, lng: -84.0 },
            prepass_enabled: true,
            prepass_bypass_rate: 85,
            drivewyze_enabled: true,
            drivewyze_bypass_rate: 90
        };

        // Cache miss, return station
        wixData.query.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            descending: jest.fn().mockReturnThis(),
            find: jest.fn()
                .mockResolvedValueOnce({ items: [] }) // Cache
                .mockResolvedValueOnce({ items: [mockStation] }) // Station
                .mockResolvedValueOnce({ items: [] }) // Reports
        });

        // Scenario 1: Driver has PrePass only
        const resultPrePass = await searchWeighStations(34.0, -84.0, 50, {
            bypassServices: { prepass: true, drivewyze: false }
        });
        expect(resultPrePass.items[0].bypass_probability).toBe(85);

        // Scenario 2: Driver has DriveWyze only (mock reset needed for strict flow, but assuming new call flows through)
        // Re-mock for second call sequence
        wixData.query.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            descending: jest.fn().mockReturnThis(),
            find: jest.fn()
                .mockResolvedValueOnce({ items: [] })
                .mockResolvedValueOnce({ items: [mockStation] })
                .mockResolvedValueOnce({ items: [] })
        });

        const resultDriveWyze = await searchWeighStations(34.0, -84.0, 50, {
            bypassServices: { prepass: false, drivewyze: true }
        });
        expect(resultDriveWyze.items[0].bypass_probability).toBe(90);

        // Scenario 3: Driver has neither
        wixData.query.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            descending: jest.fn().mockReturnThis(),
            find: jest.fn()
                .mockResolvedValueOnce({ items: [] })
                .mockResolvedValueOnce({ items: [mockStation] })
                .mockResolvedValueOnce({ items: [] })
        });

        const resultNone = await searchWeighStations(34.0, -84.0, 50, {
            bypassServices: { prepass: false, drivewyze: false }
        });
        expect(resultNone.items[0].bypass_probability).toBe(0);
    });

});
