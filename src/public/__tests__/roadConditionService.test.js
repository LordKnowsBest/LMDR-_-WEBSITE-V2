/* eslint-disable */

import {
    getRouteConditions,
    getTruckRestrictions,
    reportCondition
} from '../../backend/roadConditionService';
import * as dataAccess from '../../backend/dataAccess';
import { fetchMultiStateConditions } from '../../backend/adapters/state511';

jest.mock('../../backend/dataAccess', () => ({
    queryRecords: jest.fn(),
    insertRecord: jest.fn()
}));

jest.mock('../../backend/adapters/state511', () => ({
    fetchMultiStateConditions: jest.fn()
}));

jest.mock('../../backend/seeds/seedMockData', () => ({
    seedRoadConditions: jest.fn().mockResolvedValue({ seeded: false }),
    seedTruckRestrictions: jest.fn().mockResolvedValue({ seeded: false })
}));

describe('Road Condition Service Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [] }) });
        dataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'rc-1' } });
    });

    test('getRouteConditions merges multi-state 511 data and local records', async () => {
        dataAccess.queryRecords.mockResolvedValue({
            success: true,
            items: [
                {
                    _id: 'local-1',
                    type: 'construction',
                    description: 'Lane closed near MP120',
                    location: { lat: 39.32, lng: -120.31 }
                }
            ]
        });
        fetchMultiStateConditions.mockResolvedValue([
            {
                _id: 'ia-1',
                type: 'closure',
                description: 'Interstate closed due to crash',
                state: 'IA',
                highway: 'I-80',
                location: { lat: 41.6, lng: -93.7 },
                delay_minutes: 90
            }
        ]);

        const result = await getRouteConditions([
            { lat: 39.31, lng: -120.33 },
            { lat: 39.50, lng: -120.50 }
        ]);

        expect(result.success).toBe(true);
        expect(result.conditions.length).toBeGreaterThanOrEqual(1);
        expect(fetchMultiStateConditions).toHaveBeenCalled();
    });

    test('getRouteConditions returns summary with delay estimates', async () => {
        dataAccess.queryRecords.mockResolvedValue({
            success: true,
            items: [
                {
                    _id: 'c1',
                    type: 'closure',
                    description: 'Road closed',
                    state: 'CA',
                    highway: 'I-80',
                    location: { lat: 39.31, lng: -120.33 }
                }
            ]
        });
        fetchMultiStateConditions.mockResolvedValue([]);

        const result = await getRouteConditions([{ lat: 39.31, lng: -120.33 }]);
        expect(result.success).toBe(true);
        expect(result.summary.total_incidents).toBeGreaterThan(0);
        expect(result.summary.total_delay_minutes).toBeGreaterThanOrEqual(60);
    });

    test('getTruckRestrictions filters by truck specs (height + hazmat)', async () => {
        dataAccess.queryRecords.mockResolvedValue({
            success: true,
            items: [
                {
                    _id: 'r1',
                    highway: 'US-6',
                    state: 'CO',
                    restriction_type: 'height',
                    value: 13.0,
                    location: { lat: 39.6, lng: -105.9 }
                },
                {
                    _id: 'r2',
                    highway: 'I-70',
                    state: 'CO',
                    restriction_type: 'hazmat',
                    value: 1,
                    location: { lat: 39.61, lng: -105.91 }
                }
            ]
        });

        const result = await getTruckRestrictions(
            [{ lat: 39.6, lng: -105.9 }],
            { height: 13.5, weight: 80, hazmat: true }
        );

        expect(result.success).toBe(true);
        expect(result.restrictions.length).toBeGreaterThanOrEqual(2);
    });

    test('reportCondition validates GPS proximity when userLocation is provided', async () => {
        const result = await reportCondition({
            driverId: 'driver-1',
            type: 'construction',
            state: 'CA',
            highway: 'I-5',
            location: { lat: 34.00, lng: -118.00 },
            userLocation: { lat: 36.00, lng: -121.00 },
            description: 'Heavy work zone'
        });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/Location mismatch/);
    });

    test('reportCondition stores valid report', async () => {
        const result = await reportCondition({
            driverId: 'driver-1',
            type: 'accident',
            state: 'TN',
            highway: 'I-40',
            location: { lat: 35.15, lng: -90.05 },
            userLocation: { lat: 35.16, lng: -90.05 },
            description: 'Two lanes blocked'
        });

        expect(result.success).toBe(true);
        expect(dataAccess.insertRecord).toHaveBeenCalledWith(
            'driverConditionReports',
            expect.objectContaining({ type: 'accident', status: 'active' }),
            expect.anything()
        );
    });
});

