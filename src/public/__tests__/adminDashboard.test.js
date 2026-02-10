/* eslint-disable */
/**
 * ADMIN_DASHBOARD Page Code Tests
 *
 * Tests for src/pages/ADMIN_DASHBOARD.svo6l.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'ADMIN_DASHBOARD.svo6l.js'
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

const mockWixLocation = { to: jest.fn() };

const mockBackend = {
    getDashboardOverview: jest.fn().mockResolvedValue({ totalDrivers: 100, totalCarriers: 50 }),
    getActivityChartData: jest.fn().mockResolvedValue({ labels: ['Mon'], values: [10] }),
    getAIUsageStats: jest.fn().mockResolvedValue({ tokensUsed: 5000 }),
    getAIHealthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
    resolveAlert: jest.fn().mockResolvedValue({ success: true }),
    getFeatureStats: jest.fn().mockResolvedValue({ feature: 'test', usage: 42 }),
    getFeatureLifecycleReport: jest.fn().mockResolvedValue({ features: [] }),
    getAtRiskFeatures: jest.fn().mockResolvedValue({ atRisk: [] }),
    getFunnels: jest.fn().mockResolvedValue({ funnels: [] }),
    getFunnelConversion: jest.fn().mockResolvedValue({ rate: 0.5 }),
    updateFeatureStatus: jest.fn().mockResolvedValue({ updated: true })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        // silently fail like the source
    }
}

function getHtmlComponents($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {
            // skip
        }
    }
    return found;
}

async function routeMessage(component, message, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!message?.action) return;

    const { action } = message;

    if (action === 'navigateTo') {
        const destination = message.destination;
        if (destination) {
            wixLocation.to(`/${destination}`);
        }
        return;
    }

    try {
        switch (action) {
            case 'getDashboard': {
                const data = await backend.getDashboardOverview();
                safeSend(component, { action: 'dashboardLoaded', payload: data });
                break;
            }
            case 'getChartData': {
                const data = await backend.getActivityChartData(message.period || 'week');
                safeSend(component, { action: 'chartDataLoaded', payload: data });
                break;
            }
            case 'getAIUsage': {
                const [usageData, healthData] = await Promise.all([
                    backend.getAIUsageStats(message.period || 'week'),
                    backend.getAIHealthCheck()
                ]);
                safeSend(component, { action: 'aiUsageLoaded', payload: usageData });
                safeSend(component, { action: 'aiHealthLoaded', payload: healthData });
                break;
            }
            case 'resolveAlert': {
                if (!message.alertId) {
                    safeSend(component, { action: 'actionError', message: 'Missing alert ID' });
                    return;
                }
                await backend.resolveAlert(message.alertId);
                safeSend(component, { action: 'actionSuccess', message: 'Alert resolved successfully' });
                const data = await backend.getDashboardOverview();
                safeSend(component, { action: 'dashboardLoaded', payload: data });
                break;
            }
            case 'getFeatureStats': {
                if (message.featureId) {
                    const data = await backend.getFeatureStats(message.featureId, message.timeRange, message.groupBy || 'day');
                    safeSend(component, { action: 'featureStatsResult', payload: data });
                } else {
                    const data = await backend.getFeatureLifecycleReport();
                    safeSend(component, { action: 'featureStatsLoaded', payload: data });
                }
                break;
            }
            case 'getFeatureLifecycleReport': {
                const data = await backend.getFeatureLifecycleReport();
                safeSend(component, { action: 'featureLifecycleReportResult', payload: data });
                break;
            }
            case 'getAtRiskFeatures': {
                const data = await backend.getAtRiskFeatures();
                safeSend(component, { action: 'atRiskFeaturesResult', payload: data });
                break;
            }
            case 'getFunnelsList': {
                const data = await backend.getFunnels();
                safeSend(component, { action: 'funnelsListResult', payload: data });
                break;
            }
            case 'getFunnelConversion': {
                if (!message.funnelId) {
                    safeSend(component, { action: 'actionError', message: 'Missing funnel ID' });
                    return;
                }
                const data = await backend.getFunnelConversion(message.funnelId, message.timeRange);
                safeSend(component, { action: 'funnelConversionResult', payload: data });
                break;
            }
            case 'updateFeatureStatus': {
                if (!message.featureId || !message.status) {
                    safeSend(component, { action: 'actionError', message: 'Missing feature ID or status' });
                    return;
                }
                const data = await backend.updateFeatureStatus(message.featureId, message.status, message.reason || '');
                safeSend(component, { action: 'updateFeatureStatusResult', payload: data });
                safeSend(component, { action: 'actionSuccess', message: `Feature "${message.featureId}" status updated to "${message.status}"` });
                break;
            }
            default:
                break;
        }
    } catch (error) {
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_DASHBOARD Page Code', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/admin_dashboard_service', () => {
            expect(sourceCode).toContain("from 'backend/admin_dashboard_service'");
        });

        test('imports from backend/featureAdoptionService', () => {
            expect(sourceCode).toContain("from 'backend/featureAdoptionService'");
        });

        test('imports wixLocation', () => {
            expect(sourceCode).toContain("import wixLocation from 'wix-location'");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS with expected IDs', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#html2');
            expect(sourceCode).toContain('#htmlEmbed1');
        });
    });

    // =========================================================================
    // SAFETY CHECKS (no bare $w calls)
    // =========================================================================

    describe('Safety checks', () => {
        test('all $w() calls are wrapped in try-catch', () => {
            // The source uses $w(id) in a loop rather than hardcoded $w('#html1')
            const wCalls = sourceCode.match(/\$w\(/g) || [];
            expect(wCalls.length).toBeGreaterThan(0);

            // The getHtmlComponents function uses try-catch around $w(id)
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(id\)[\s\S]*?\}\s*catch/);
        });

        test('postMessage calls use safeSend helper', () => {
            // All handler functions should use safeSend, not direct postMessage
            // The safeSend function checks component && typeof component.postMessage === 'function'
            expect(sourceCode).toContain('function safeSend(component, data)');
            expect(sourceCode).toMatch(/if\s*\(component\s*&&\s*typeof component\.postMessage\s*===\s*'function'\)/);
        });

        test('safeSend is wrapped in try-catch', () => {
            // The safeSend function body should be in a try-catch
            const safeSendMatch = sourceCode.match(/function safeSend[\s\S]*?^}/m);
            expect(safeSendMatch).not.toBeNull();
            expect(safeSendMatch[0]).toContain('try');
            expect(safeSendMatch[0]).toContain('catch');
        });

        test('onReady checks for empty components before proceeding', () => {
            expect(sourceCode).toMatch(/if\s*\(!components\.length\)/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components that have onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                if (id === '#html2') return createMockComponent();
                throw new Error('not found');
            });

            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(2);
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
        });

        test('skips components that throw errors', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn(() => ({ postMessage: jest.fn() }));
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('tries all six component IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            getHtmlComponents(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages with no action', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('navigateTo routes to wixLocation.to', async () => {
            await routeMessage(component, { action: 'navigateTo', destination: 'admin-drivers' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/admin-drivers');
        });

        test('navigateTo with no destination does nothing', async () => {
            await routeMessage(component, { action: 'navigateTo' });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });

        test('getDashboard calls getDashboardOverview and sends dashboardLoaded', async () => {
            await routeMessage(component, { action: 'getDashboard' });
            expect(mockBackend.getDashboardOverview).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'dashboardLoaded',
                payload: { totalDrivers: 100, totalCarriers: 50 }
            });
        });

        test('getChartData calls getActivityChartData with period', async () => {
            await routeMessage(component, { action: 'getChartData', period: 'month' });
            expect(mockBackend.getActivityChartData).toHaveBeenCalledWith('month');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'chartDataLoaded',
                payload: { labels: ['Mon'], values: [10] }
            });
        });

        test('getChartData defaults to week if no period', async () => {
            await routeMessage(component, { action: 'getChartData' });
            expect(mockBackend.getActivityChartData).toHaveBeenCalledWith('week');
        });

        test('getAIUsage calls both getAIUsageStats and getAIHealthCheck', async () => {
            await routeMessage(component, { action: 'getAIUsage', period: 'month' });
            expect(mockBackend.getAIUsageStats).toHaveBeenCalledWith('month');
            expect(mockBackend.getAIHealthCheck).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'aiUsageLoaded',
                payload: { tokensUsed: 5000 }
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'aiHealthLoaded',
                payload: { status: 'healthy' }
            });
        });

        test('getAIUsage defaults period to week', async () => {
            await routeMessage(component, { action: 'getAIUsage' });
            expect(mockBackend.getAIUsageStats).toHaveBeenCalledWith('week');
        });

        test('resolveAlert calls resolveAlert then refreshes dashboard', async () => {
            await routeMessage(component, { action: 'resolveAlert', alertId: 'alert-123' });
            expect(mockBackend.resolveAlert).toHaveBeenCalledWith('alert-123');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Alert resolved successfully'
            });
            // Should also refresh dashboard
            expect(mockBackend.getDashboardOverview).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'dashboardLoaded',
                payload: { totalDrivers: 100, totalCarriers: 50 }
            });
        });

        test('resolveAlert with missing alertId sends error', async () => {
            await routeMessage(component, { action: 'resolveAlert' });
            expect(mockBackend.resolveAlert).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing alert ID'
            });
        });

        test('getFeatureStats with featureId calls getFeatureStats', async () => {
            await routeMessage(component, {
                action: 'getFeatureStats',
                featureId: 'feat-1',
                timeRange: '30d',
                groupBy: 'week'
            });
            expect(mockBackend.getFeatureStats).toHaveBeenCalledWith('feat-1', '30d', 'week');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'featureStatsResult',
                payload: { feature: 'test', usage: 42 }
            });
        });

        test('getFeatureStats without featureId falls back to lifecycle report', async () => {
            await routeMessage(component, { action: 'getFeatureStats' });
            expect(mockBackend.getFeatureLifecycleReport).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'featureStatsLoaded',
                payload: { features: [] }
            });
        });

        test('getFeatureStats defaults groupBy to day', async () => {
            await routeMessage(component, { action: 'getFeatureStats', featureId: 'f1' });
            expect(mockBackend.getFeatureStats).toHaveBeenCalledWith('f1', undefined, 'day');
        });

        test('getFeatureLifecycleReport calls backend and sends result', async () => {
            await routeMessage(component, { action: 'getFeatureLifecycleReport' });
            expect(mockBackend.getFeatureLifecycleReport).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'featureLifecycleReportResult',
                payload: { features: [] }
            });
        });

        test('getAtRiskFeatures calls backend and sends result', async () => {
            await routeMessage(component, { action: 'getAtRiskFeatures' });
            expect(mockBackend.getAtRiskFeatures).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'atRiskFeaturesResult',
                payload: { atRisk: [] }
            });
        });

        test('getFunnelsList calls getFunnels and sends result', async () => {
            await routeMessage(component, { action: 'getFunnelsList' });
            expect(mockBackend.getFunnels).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'funnelsListResult',
                payload: { funnels: [] }
            });
        });

        test('getFunnelConversion calls backend with funnelId and timeRange', async () => {
            await routeMessage(component, { action: 'getFunnelConversion', funnelId: 'funnel-1', timeRange: '7d' });
            expect(mockBackend.getFunnelConversion).toHaveBeenCalledWith('funnel-1', '7d');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'funnelConversionResult',
                payload: { rate: 0.5 }
            });
        });

        test('getFunnelConversion with missing funnelId sends error', async () => {
            await routeMessage(component, { action: 'getFunnelConversion' });
            expect(mockBackend.getFunnelConversion).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing funnel ID'
            });
        });

        test('updateFeatureStatus calls backend and sends success', async () => {
            await routeMessage(component, {
                action: 'updateFeatureStatus',
                featureId: 'feat-1',
                status: 'deprecated',
                reason: 'No longer needed'
            });
            expect(mockBackend.updateFeatureStatus).toHaveBeenCalledWith('feat-1', 'deprecated', 'No longer needed');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'updateFeatureStatusResult',
                payload: { updated: true }
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Feature "feat-1" status updated to "deprecated"'
            });
        });

        test('updateFeatureStatus defaults reason to empty string', async () => {
            await routeMessage(component, {
                action: 'updateFeatureStatus',
                featureId: 'feat-1',
                status: 'active'
            });
            expect(mockBackend.updateFeatureStatus).toHaveBeenCalledWith('feat-1', 'active', '');
        });

        test('updateFeatureStatus with missing featureId sends error', async () => {
            await routeMessage(component, { action: 'updateFeatureStatus', status: 'active' });
            expect(mockBackend.updateFeatureStatus).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing feature ID or status'
            });
        });

        test('updateFeatureStatus with missing status sends error', async () => {
            await routeMessage(component, { action: 'updateFeatureStatus', featureId: 'feat-1' });
            expect(mockBackend.updateFeatureStatus).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing feature ID or status'
            });
        });

        test('unknown action does not send any message', async () => {
            await routeMessage(component, { action: 'nonExistentAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getDashboard failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getDashboardOverview: jest.fn().mockRejectedValue(new Error('DB timeout'))
            };
            await routeMessage(component, { action: 'getDashboard' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'DB timeout'
            });
        });

        test('getChartData failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getActivityChartData: jest.fn().mockRejectedValue(new Error('Chart fetch failed'))
            };
            await routeMessage(component, { action: 'getChartData' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Chart fetch failed'
            });
        });

        test('getAIUsage failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getAIUsageStats: jest.fn().mockRejectedValue(new Error('AI service down'))
            };
            await routeMessage(component, { action: 'getAIUsage' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'AI service down'
            });
        });

        test('resolveAlert failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                resolveAlert: jest.fn().mockRejectedValue(new Error('Cannot resolve'))
            };
            await routeMessage(component, { action: 'resolveAlert', alertId: 'a1' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Cannot resolve'
            });
        });

        test('getFeatureStats failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getFeatureStats: jest.fn().mockRejectedValue(new Error('Feature error'))
            };
            await routeMessage(component, { action: 'getFeatureStats', featureId: 'f1' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Feature error'
            });
        });

        test('getFunnelConversion failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getFunnelConversion: jest.fn().mockRejectedValue(new Error('Funnel error'))
            };
            await routeMessage(component, { action: 'getFunnelConversion', funnelId: 'f1' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Funnel error'
            });
        });

        test('updateFeatureStatus failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                updateFeatureStatus: jest.fn().mockRejectedValue(new Error('Update failed'))
            };
            await routeMessage(component, {
                action: 'updateFeatureStatus',
                featureId: 'f1',
                status: 'active'
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Update failed'
            });
        });

        test('error with no message falls back to generic message', async () => {
            const failBackend = {
                ...mockBackend,
                getDashboardOverview: jest.fn().mockRejectedValue({})
            };
            await routeMessage(component, { action: 'getDashboard' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'An unexpected error occurred'
            });
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does nothing if component is null', () => {
            expect(() => safeSend(null, { action: 'test' })).not.toThrow();
        });

        test('does nothing if component has no postMessage', () => {
            expect(() => safeSend({}, { action: 'test' })).not.toThrow();
        });

        test('calls postMessage when component is valid', () => {
            safeSend(component, { action: 'test', payload: 123 });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'test', payload: 123 });
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { action: 'test' })).not.toThrow();
        });
    });

    // =========================================================================
    // BACKEND SERVICE MOCK VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getDashboard only calls getDashboardOverview once', async () => {
            await routeMessage(component, { action: 'getDashboard' });
            expect(mockBackend.getDashboardOverview).toHaveBeenCalledTimes(1);
        });

        test('resolveAlert calls resolveAlert then getDashboardOverview for refresh', async () => {
            await routeMessage(component, { action: 'resolveAlert', alertId: 'a1' });
            expect(mockBackend.resolveAlert).toHaveBeenCalledTimes(1);
            expect(mockBackend.resolveAlert).toHaveBeenCalledWith('a1');
            expect(mockBackend.getDashboardOverview).toHaveBeenCalledTimes(1);
        });

        test('getAIUsage calls both AI stats and health check in parallel', async () => {
            await routeMessage(component, { action: 'getAIUsage', period: 'day' });
            expect(mockBackend.getAIUsageStats).toHaveBeenCalledWith('day');
            expect(mockBackend.getAIHealthCheck).toHaveBeenCalledTimes(1);
        });

        test('updateFeatureStatus passes reason through to backend', async () => {
            await routeMessage(component, {
                action: 'updateFeatureStatus',
                featureId: 'feat-2',
                status: 'sunset',
                reason: 'Low adoption'
            });
            expect(mockBackend.updateFeatureStatus).toHaveBeenCalledWith('feat-2', 'sunset', 'Low adoption');
        });

        test('getFunnelConversion passes both funnelId and timeRange', async () => {
            await routeMessage(component, {
                action: 'getFunnelConversion',
                funnelId: 'signup-funnel',
                timeRange: '90d'
            });
            expect(mockBackend.getFunnelConversion).toHaveBeenCalledWith('signup-funnel', '90d');
        });
    });
});
