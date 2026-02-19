/* eslint-disable */

import {
    getAlertsAtLocation,
    getRouteWeather,
    getChainRequirements,
    subscribeToAlerts,
    processNewAlerts
} from '../../backend/weatherAlertService';
import { fetch } from 'wix-fetch';
import * as dataAccess from '../../backend/dataAccess';

// Mock emailService
jest.mock('../../backend/emailService', () => ({
    sendWeatherAlertEmail: jest.fn().mockResolvedValue({ success: true })
}));
jest.mock('../../backend/dataAccess', () => ({
    queryRecords: jest.fn(),
    insertRecord: jest.fn(),
    updateRecord: jest.fn()
}));
jest.mock('../../backend/seeds/seedMockData', () => ({
    seedDriverSubscriptions: jest.fn().mockResolvedValue({ seeded: true })
}));

// Mock wix-fetch
jest.mock('wix-fetch', () => ({
    fetch: jest.fn()
}));

// Mock wix-secrets-backend
jest.mock('wix-secrets-backend', () => ({
    getSecret: jest.fn().mockResolvedValue('test-key')
}));

describe('Weather Alert Service Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        dataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'rec1' } });
    });

    // 1. Test Single Location Alerts (NWS API)
    test('getAlertsAtLocation should return alerts from NWS', async () => {
        // Mock NWS Response
        const mockNwsData = {
            features: [
                {
                    properties: {
                        id: 'alert1',
                        event: 'Winter Storm Warning',
                        severity: 'Severe',
                        headline: 'Winter Storm Warning issued...',
                        description: 'Heavy snow expected.',
                        expires: '2023-01-01T00:00:00Z'
                    }
                }
            ]
        };

        fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockNwsData)
        });

        const result = await getAlertsAtLocation(39.31, -120.33);

        expect(result.success).toBe(true);
        expect(result.alerts).toHaveLength(1);
        expect(result.alerts[0].event).toBe('Winter Storm Warning');
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('api.weather.gov/alerts/active?point=39.31,-120.33'),
            expect.anything()
        );
    });

    test('getAlertsAtLocation should handle NWS API errors', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 500
        });

        const result = await getAlertsAtLocation(39.31, -120.33);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/NWS API error/);
    });

    // 2. Test Route Weather
    test('getRouteWeather should aggregate alerts along route', async () => {
        // Mock NWS response for multiple calls
        const mockAlert = {
            properties: { id: 'alert1', event: 'Flood Watch', severity: 'Moderate' }
        };
        const mockSafe = { features: [] };
        const mockDanger = { features: [mockAlert] };

        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSafe) }) // Start
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockDanger) }) // Mid
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSafe) }); // End

        const route = [
            { lat: 35.0, lng: -90.0 }, // Memphis
            { lat: 34.0, lng: -92.0 }, // Little Rock
            { lat: 33.0, lng: -94.0 }  // Texarkana
        ];

        const result = await getRouteWeather(route);

        expect(result.success).toBe(true);
        expect(result.alerts).toHaveLength(1); // Deduplicated (aggregated)
        expect(result.alerts[0].event).toBe('Flood Watch');
    });

    // 3. Test Chain Laws (Static Data)
    test('getChainRequirements should return known passes', async () => {
        const result = await getChainRequirements();

        expect(result.success).toBe(true);
        expect(result.items.length).toBeGreaterThan(0);

        const donner = result.items.find(i => i.id === 'donner_pass');
        expect(donner).toBeDefined();
        expect(donner.state).toBe('CA');
    });



    // 4. Test Scheduled Job (processNewAlerts)
    test('processNewAlerts should find severe alerts and trigger emails', async () => {
        dataAccess.queryRecords
            .mockResolvedValueOnce({
                success: true,
                items: [{
                    _id: 'sub1',
                    driver_id: 'driver-1',
                    location: { lat: 39.31, lng: -120.33 },
                    alert_types: ['severe_weather'],
                    min_severity: 'moderate'
                }]
            })
            .mockResolvedValueOnce({ success: true, items: [] }); // no dedupe cache

        // Mock NWS to return a severe alert
        const mockSevereAlert = {
            properties: {
                id: 'severe1',
                event: 'Tornado Warning',
                severity: 'Severe',
                headline: 'Tornado Warning in effect',
                description: 'Take cover immediately.',
                areaDesc: 'Nevada County'
            }
        };

        fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ features: [mockSevereAlert] })
        });

        const emailService = require('../../backend/emailService');

        const result = await processNewAlerts();

        expect(result.success).toBe(true);
        expect(result.sent).toBeGreaterThan(0);
        expect(result.notifications).toBeGreaterThan(0);
        expect(emailService.sendWeatherAlertEmail).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                event: 'Tornado Warning',
                severity: 'Severe'
            })
        );
        expect(dataAccess.insertRecord).toHaveBeenCalledWith(
            'memberNotifications',
            expect.objectContaining({ type: 'weather_alert' }),
            expect.anything()
        );
    });

    test('subscribeToAlerts should upsert driver preferences', async () => {
        dataAccess.queryRecords.mockResolvedValue({ success: true, items: [] });
        dataAccess.insertRecord.mockResolvedValue({
            success: true,
            record: { driver_id: 'driver-1', min_severity: 'severe' }
        });

        const result = await subscribeToAlerts('driver-1', {
            min_severity: 'severe',
            alert_types: ['winter'],
            push_enabled: true
        });

        expect(result.success).toBe(true);
        expect(dataAccess.insertRecord).toHaveBeenCalledWith(
            'driverNotificationPreferences',
            expect.objectContaining({
                driver_id: 'driver-1',
                min_severity: 'severe',
                alert_types: ['winter']
            }),
            expect.anything()
        );
    });

});

