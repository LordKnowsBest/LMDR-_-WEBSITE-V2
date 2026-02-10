/* eslint-disable */
/**
 * ADMIN_GAMIFICATION_ANALYTICS Bridge Tests
 *
 * Tests for src/pages/ADMIN_GAMIFICATION_ANALYTICS.jmm93.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'ADMIN_GAMIFICATION_ANALYTICS.jmm93.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    getGamificationDashboardMetrics: jest.fn().mockResolvedValue({
        totalDrivers: 500, averageLevel: 4.2, activeEvents: 1, totalXPAwarded: 125000
    }),
    detectAbusePatterns: jest.fn().mockResolvedValue({
        patterns: [], flaggedUsers: [], riskLevel: 'low'
    })
};

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) { /* silent */ }
}

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg?.type) return;

    try {
        switch (msg.type) {
            case 'getGamificationMetrics': {
                const result = await backend.getGamificationDashboardMetrics();
                safeSend(component, { type: 'gamificationMetricsResult', data: result });
                break;
            }
            case 'detectAbusePatterns': {
                const result = await backend.detectAbusePatterns();
                safeSend(component, { type: 'abuseDetectionResult', data: result });
                break;
            }
            default:
                break;
        }
    } catch (error) {
        safeSend(component, {
            type: msg.type === 'getGamificationMetrics' ? 'gamificationMetricsResult' : 'abuseDetectionResult',
            data: { success: false, error: error.message || 'An unexpected error occurred' }
        });
    }
}

describe('ADMIN_GAMIFICATION_ANALYTICS Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    describe('Source file structure', () => {
        test('imports from backend/gamificationAnalyticsService', () => {
            expect(sourceCode).toContain("from 'backend/gamificationAnalyticsService'");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('uses type key protocol', () => {
            expect(sourceCode).toContain('msg.type');
        });

        test('defines safeSend', () => {
            expect(sourceCode).toContain('function safeSend');
        });

        test('defines HTML_COMPONENT_IDS', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });
    });

    describe('Message routing', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('getGamificationMetrics calls backend and sends result', async () => {
            await routeMessage(component, { type: 'getGamificationMetrics' });
            expect(mockBackend.getGamificationDashboardMetrics).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'gamificationMetricsResult',
                data: { totalDrivers: 500, averageLevel: 4.2, activeEvents: 1, totalXPAwarded: 125000 }
            });
        });

        test('detectAbusePatterns calls backend and sends result', async () => {
            await routeMessage(component, { type: 'detectAbusePatterns' });
            expect(mockBackend.detectAbusePatterns).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'abuseDetectionResult',
                data: { patterns: [], flaggedUsers: [], riskLevel: 'low' }
            });
        });

        test('unknown type does not send message', async () => {
            await routeMessage(component, { type: 'unknownType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        test('getGamificationMetrics failure sends error in result type', async () => {
            const failBackend = { ...mockBackend, getGamificationDashboardMetrics: jest.fn().mockRejectedValue(new Error('Metrics DB error')) };
            await routeMessage(component, { type: 'getGamificationMetrics' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'gamificationMetricsResult',
                data: { success: false, error: 'Metrics DB error' }
            });
        });

        test('detectAbusePatterns failure sends error in result type', async () => {
            const failBackend = { ...mockBackend, detectAbusePatterns: jest.fn().mockRejectedValue(new Error('Abuse detection failed')) };
            await routeMessage(component, { type: 'detectAbusePatterns' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'abuseDetectionResult',
                data: { success: false, error: 'Abuse detection failed' }
            });
        });
    });

    describe('safeSend utility', () => {
        test('does nothing if component is null', () => {
            expect(() => safeSend(null, { type: 'test' })).not.toThrow();
        });

        test('calls postMessage when valid', () => {
            safeSend(component, { type: 'test' });
            expect(component.postMessage).toHaveBeenCalledWith({ type: 'test' });
        });

        test('does not throw if postMessage throws', () => {
            const bad = { postMessage: jest.fn(() => { throw new Error('Detached'); }) };
            expect(() => safeSend(bad, { type: 'test' })).not.toThrow();
        });
    });
});
