/* eslint-disable */
/**
 * ADMIN_FEATURE_ADOPTION Bridge Tests
 * =====================================
 * Tests for src/pages/ADMIN_FEATURE_ADOPTION.rt8ev.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * **TYPE PROTOCOL** (not action protocol)
 * Switch on `msg.type`, params in `msg.data`, responses as `{ type: '...Result', data }`
 * Errors return `{ type: '...Result', data: { error } }` — no separate actionError
 *
 * 9 types: featureAdoptionReady (no-op), getFeatureLifecycleReport, getFeatureStats,
 *   getFeatureHealthScore, getAtRiskFeatures, getFunnelsList, getFunnelConversion,
 *   registerFeature, updateFeatureStatus
 *
 * Gotcha: getFunnelsList maps to backend getFunnels() (name mismatch)
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'ADMIN_FEATURE_ADOPTION.rt8ev.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockBackend = {
    getFeatureLifecycleReport: jest.fn().mockResolvedValue({ features: [{ id: 'f1' }] }),
    getFeatureStats: jest.fn().mockResolvedValue({ usage: 42, trend: 'up' }),
    getFeatureHealthScore: jest.fn().mockResolvedValue({ score: 85, status: 'healthy' }),
    getAtRiskFeatures: jest.fn().mockResolvedValue({ atRisk: [{ id: 'f2', reason: 'low usage' }] }),
    getFunnels: jest.fn().mockResolvedValue({ funnels: [{ id: 'fun1' }] }),
    getFunnelConversion: jest.fn().mockResolvedValue({ rate: 0.35, steps: [] }),
    registerFeature: jest.fn().mockResolvedValue({ success: true, featureId: 'f3' }),
    updateFeatureStatus: jest.fn().mockResolvedValue({ success: true })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        // silently fail
    }
}

function findHtmlComponent($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // skip
        }
    }
    return null;
}

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'featureAdoptionReady':
            // No-op: HTML triggers its own refreshAll
            break;

        case 'getFeatureLifecycleReport':
            try {
                const result = await backend.getFeatureLifecycleReport();
                safeSend(component, { type: 'featureLifecycleReportResult', data: result });
            } catch (err) {
                safeSend(component, { type: 'featureLifecycleReportResult', data: { error: err.message } });
            }
            break;

        case 'getFeatureStats':
            try {
                const { featureId, timeRange } = msg.data || {};
                const result = await backend.getFeatureStats(featureId, timeRange);
                safeSend(component, { type: 'featureStatsResult', data: result });
            } catch (err) {
                safeSend(component, { type: 'featureStatsResult', data: { error: err.message } });
            }
            break;

        case 'getFeatureHealthScore':
            try {
                const { featureId } = msg.data || {};
                const result = await backend.getFeatureHealthScore(featureId);
                safeSend(component, { type: 'featureHealthScoreResult', data: result });
            } catch (err) {
                safeSend(component, { type: 'featureHealthScoreResult', data: { error: err.message } });
            }
            break;

        case 'getAtRiskFeatures':
            try {
                const result = await backend.getAtRiskFeatures();
                safeSend(component, { type: 'atRiskFeaturesResult', data: result });
            } catch (err) {
                safeSend(component, { type: 'atRiskFeaturesResult', data: { error: err.message } });
            }
            break;

        case 'getFunnelsList':
            try {
                const result = await backend.getFunnels();
                safeSend(component, { type: 'funnelsListResult', data: result });
            } catch (err) {
                safeSend(component, { type: 'funnelsListResult', data: { error: err.message } });
            }
            break;

        case 'getFunnelConversion':
            try {
                const { funnelId, timeRange } = msg.data || {};
                const result = await backend.getFunnelConversion(funnelId, timeRange);
                safeSend(component, { type: 'funnelConversionResult', data: result });
            } catch (err) {
                safeSend(component, { type: 'funnelConversionResult', data: { error: err.message } });
            }
            break;

        case 'registerFeature':
            try {
                const { featureData } = msg.data || {};
                const result = await backend.registerFeature(featureData);
                safeSend(component, { type: 'registerFeatureResult', data: result });
            } catch (err) {
                safeSend(component, { type: 'registerFeatureResult', data: { success: false, error: err.message } });
            }
            break;

        case 'updateFeatureStatus':
            try {
                const { featureId, status, reason } = msg.data || {};
                const result = await backend.updateFeatureStatus(featureId, status, reason);
                safeSend(component, { type: 'updateFeatureStatusResult', data: result });
            } catch (err) {
                safeSend(component, { type: 'updateFeatureStatusResult', data: { success: false, error: err.message } });
            }
            break;

        default:
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_FEATURE_ADOPTION Page Code (Bridge)', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/featureAdoptionService', () => {
            expect(sourceCode).toContain("from 'backend/featureAdoptionService'");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('uses type-based protocol (msg.type)', () => {
            expect(sourceCode).toContain('msg.type');
        });

        test('does NOT use action-based protocol', () => {
            // The routeMessage should NOT switch on msg.action
            expect(sourceCode).not.toMatch(/msg\.action/);
        });

        test('handles all 9 types in switch', () => {
            expect(sourceCode).toContain("case 'featureAdoptionReady'");
            expect(sourceCode).toContain("case 'getFeatureLifecycleReport'");
            expect(sourceCode).toContain("case 'getFeatureStats'");
            expect(sourceCode).toContain("case 'getFeatureHealthScore'");
            expect(sourceCode).toContain("case 'getAtRiskFeatures'");
            expect(sourceCode).toContain("case 'getFunnelsList'");
            expect(sourceCode).toContain("case 'getFunnelConversion'");
            expect(sourceCode).toContain("case 'registerFeature'");
            expect(sourceCode).toContain("case 'updateFeatureStatus'");
        });

        test('getFunnelsList calls getFunnels (name mismatch documented)', () => {
            expect(sourceCode).toContain('getFunnels()');
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('defines safeSend helper with try-catch', () => {
            expect(sourceCode).toContain('function safeSend');
            const safeSendMatch = sourceCode.match(/function safeSend[\s\S]*?\n\}/);
            expect(safeSendMatch).not.toBeNull();
            expect(safeSendMatch[0]).toContain('try');
            expect(safeSendMatch[0]).toContain('catch');
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages without type key', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            await routeMessage(component, { action: 'wrong_protocol' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('featureAdoptionReady is a no-op', async () => {
            await routeMessage(component, { type: 'featureAdoptionReady' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('getFeatureLifecycleReport sends featureLifecycleReportResult', async () => {
            await routeMessage(component, { type: 'getFeatureLifecycleReport' });
            expect(mockBackend.getFeatureLifecycleReport).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'featureLifecycleReportResult',
                data: { features: [{ id: 'f1' }] }
            });
        });

        test('getFeatureStats passes featureId and timeRange', async () => {
            await routeMessage(component, {
                type: 'getFeatureStats',
                data: { featureId: 'f1', timeRange: '30d' }
            });
            expect(mockBackend.getFeatureStats).toHaveBeenCalledWith('f1', '30d');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'featureStatsResult',
                data: { usage: 42, trend: 'up' }
            });
        });

        test('getFeatureStats with no data defaults gracefully', async () => {
            await routeMessage(component, { type: 'getFeatureStats' });
            expect(mockBackend.getFeatureStats).toHaveBeenCalledWith(undefined, undefined);
        });

        test('getFeatureHealthScore passes featureId', async () => {
            await routeMessage(component, {
                type: 'getFeatureHealthScore',
                data: { featureId: 'f1' }
            });
            expect(mockBackend.getFeatureHealthScore).toHaveBeenCalledWith('f1');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'featureHealthScoreResult',
                data: { score: 85, status: 'healthy' }
            });
        });

        test('getAtRiskFeatures sends atRiskFeaturesResult', async () => {
            await routeMessage(component, { type: 'getAtRiskFeatures' });
            expect(mockBackend.getAtRiskFeatures).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'atRiskFeaturesResult',
                data: { atRisk: [{ id: 'f2', reason: 'low usage' }] }
            });
        });

        test('getFunnelsList calls getFunnels and sends funnelsListResult', async () => {
            await routeMessage(component, { type: 'getFunnelsList' });
            expect(mockBackend.getFunnels).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'funnelsListResult',
                data: { funnels: [{ id: 'fun1' }] }
            });
        });

        test('getFunnelConversion passes funnelId and timeRange', async () => {
            await routeMessage(component, {
                type: 'getFunnelConversion',
                data: { funnelId: 'fun1', timeRange: '7d' }
            });
            expect(mockBackend.getFunnelConversion).toHaveBeenCalledWith('fun1', '7d');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'funnelConversionResult',
                data: { rate: 0.35, steps: [] }
            });
        });

        test('registerFeature passes featureData', async () => {
            const featureData = { name: 'New Feature', category: 'test' };
            await routeMessage(component, {
                type: 'registerFeature',
                data: { featureData }
            });
            expect(mockBackend.registerFeature).toHaveBeenCalledWith(featureData);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'registerFeatureResult',
                data: { success: true, featureId: 'f3' }
            });
        });

        test('updateFeatureStatus passes featureId, status, reason', async () => {
            await routeMessage(component, {
                type: 'updateFeatureStatus',
                data: { featureId: 'f1', status: 'deprecated', reason: 'Replaced' }
            });
            expect(mockBackend.updateFeatureStatus).toHaveBeenCalledWith('f1', 'deprecated', 'Replaced');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'updateFeatureStatusResult',
                data: { success: true }
            });
        });

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'nonExistentType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING (type protocol uses ...Result with error, no actionError)
    // =========================================================================

    describe('Error handling', () => {
        test('getFeatureLifecycleReport failure sends error in result', async () => {
            const failBackend = {
                ...mockBackend,
                getFeatureLifecycleReport: jest.fn().mockRejectedValue(new Error('Lifecycle error'))
            };
            await routeMessage(component, { type: 'getFeatureLifecycleReport' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'featureLifecycleReportResult',
                data: { error: 'Lifecycle error' }
            });
        });

        test('getFeatureStats failure sends error in result', async () => {
            const failBackend = {
                ...mockBackend,
                getFeatureStats: jest.fn().mockRejectedValue(new Error('Stats error'))
            };
            await routeMessage(component, { type: 'getFeatureStats', data: { featureId: 'f1' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'featureStatsResult',
                data: { error: 'Stats error' }
            });
        });

        test('getFeatureHealthScore failure sends error in result', async () => {
            const failBackend = {
                ...mockBackend,
                getFeatureHealthScore: jest.fn().mockRejectedValue(new Error('Health error'))
            };
            await routeMessage(component, { type: 'getFeatureHealthScore', data: { featureId: 'f1' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'featureHealthScoreResult',
                data: { error: 'Health error' }
            });
        });

        test('getAtRiskFeatures failure sends error in result', async () => {
            const failBackend = {
                ...mockBackend,
                getAtRiskFeatures: jest.fn().mockRejectedValue(new Error('Risk error'))
            };
            await routeMessage(component, { type: 'getAtRiskFeatures' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'atRiskFeaturesResult',
                data: { error: 'Risk error' }
            });
        });

        test('getFunnelsList failure sends error in result', async () => {
            const failBackend = {
                ...mockBackend,
                getFunnels: jest.fn().mockRejectedValue(new Error('Funnel error'))
            };
            await routeMessage(component, { type: 'getFunnelsList' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'funnelsListResult',
                data: { error: 'Funnel error' }
            });
        });

        test('registerFeature failure sends success:false with error', async () => {
            const failBackend = {
                ...mockBackend,
                registerFeature: jest.fn().mockRejectedValue(new Error('Register failed'))
            };
            await routeMessage(component, { type: 'registerFeature', data: { featureData: {} } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'registerFeatureResult',
                data: { success: false, error: 'Register failed' }
            });
        });

        test('updateFeatureStatus failure sends success:false with error', async () => {
            const failBackend = {
                ...mockBackend,
                updateFeatureStatus: jest.fn().mockRejectedValue(new Error('Update failed'))
            };
            await routeMessage(component, {
                type: 'updateFeatureStatus',
                data: { featureId: 'f1', status: 'active' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'updateFeatureStatusResult',
                data: { success: false, error: 'Update failed' }
            });
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { type: 'test' })).not.toThrow();
        });
    });
});
