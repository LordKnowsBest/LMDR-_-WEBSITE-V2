/**
 * ADMIN_REVENUE_DASHBOARD Bridge Tests
 *
 * Tests for the Revenue Dashboard page wiring:
 * - Backend service structure (adminRevenueService.jsw)
 * - HTML file structure (ADMIN_REVENUE_DASHBOARD.html)
 * - PostMessage bridge routing
 * - safeSend error handling
 * - Component discovery
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCES
// =============================================================================

const SERVICE_FILE = path.resolve(
    __dirname, '..', '..', 'backend', 'adminRevenueService.jsw'
);
const HTML_FILE = path.resolve(
    __dirname, '..', 'admin', 'ADMIN_REVENUE_DASHBOARD.html'
);

const serviceCode = fs.readFileSync(SERVICE_FILE, 'utf8');
const htmlCode = fs.readFileSync(HTML_FILE, 'utf8');

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
    getRevenueSnapshot: jest.fn().mockResolvedValue({
        success: true,
        data: { mrr: 12450, arr: 149400, totalActive: 58, arpu: 214.66, ltv: 4293, churnRate: 0.034, mrrChange: 5.2, subscriberChange: 3.1, tierCounts: { free: 10, pro: 38, enterprise: 10 } }
    }),
    getMRRTrend: jest.fn().mockResolvedValue({
        success: true,
        data: [{ date: '2025-12-01', mrr: 11000, arr: 132000 }, { date: '2026-01-01', mrr: 12450, arr: 149400 }]
    }),
    getRevenueByTier: jest.fn().mockResolvedValue({
        success: true,
        data: [{ tier: 'pro', count: 38, revenue: 9462 }, { tier: 'enterprise', count: 10, revenue: 7490 }]
    }),
    getCohortAnalysis: jest.fn().mockResolvedValue({
        success: true,
        data: [{ cohort: '2025-10', total: 12, retention: [100, 83, 75] }]
    }),
    getChurnAnalysis: jest.fn().mockResolvedValue({
        success: true,
        data: { totalChurned: 3, churnRate: 0.034, reasons: [{ reason: 'Too expensive', count: 2 }] }
    }),
    getLTVByTier: jest.fn().mockResolvedValue({
        success: true,
        data: [{ tier: 'pro', avgLTV: 3985, avgLifetimeMonths: 16 }]
    }),
    exportRevenueCSV: jest.fn().mockResolvedValue({
        success: true,
        data: { csv: 'Metric,Value\nMRR,$12450', filename: 'revenue_snapshot_2026-02-07.csv' }
    }),
    recordDailyMetrics: jest.fn().mockResolvedValue({ success: true, data: { mrr: 12450 } })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors expected page code for testability)
// =============================================================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        // silently fail
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

async function routeMessage(component, message, backend = mockBackend) {
    if (!message?.action) return;

    try {
        switch (message.action) {
            case 'getRevenue': {
                const result = await backend.getRevenueSnapshot();
                if (result.success) {
                    safeSend(component, { action: 'revenueLoaded', payload: result.data });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'getMRRTrend': {
                const result = await backend.getMRRTrend(message.months || 12);
                if (result.success) {
                    safeSend(component, { action: 'mrrTrendLoaded', payload: result.data });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'getTierRevenue': {
                const result = await backend.getRevenueByTier();
                if (result.success) {
                    safeSend(component, { action: 'tierRevenueLoaded', payload: result.data });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'getCohort': {
                const result = await backend.getCohortAnalysis(message.months || 6);
                if (result.success) {
                    safeSend(component, { action: 'cohortLoaded', payload: result.data });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'getChurn': {
                const result = await backend.getChurnAnalysis(message.days || 30);
                if (result.success) {
                    safeSend(component, { action: 'churnLoaded', payload: result.data });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'exportCSV': {
                const result = await backend.exportRevenueCSV(message.exportType);
                if (result.success) {
                    safeSend(component, { action: 'exportReady', payload: result.data });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
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

describe('ADMIN_REVENUE_DASHBOARD', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // BACKEND SERVICE STRUCTURE
    // =========================================================================

    describe('Backend service structure', () => {
        test('adminRevenueService.jsw exists', () => {
            expect(fs.existsSync(SERVICE_FILE)).toBe(true);
        });

        test('exports getRevenueSnapshot', () => {
            expect(serviceCode).toContain('export async function getRevenueSnapshot');
        });

        test('exports getMRRTrend', () => {
            expect(serviceCode).toContain('export async function getMRRTrend');
        });

        test('exports getRevenueByTier', () => {
            expect(serviceCode).toContain('export async function getRevenueByTier');
        });

        test('exports getCohortAnalysis', () => {
            expect(serviceCode).toContain('export async function getCohortAnalysis');
        });

        test('exports getChurnAnalysis', () => {
            expect(serviceCode).toContain('export async function getChurnAnalysis');
        });

        test('exports getLTVByTier', () => {
            expect(serviceCode).toContain('export async function getLTVByTier');
        });

        test('exports exportRevenueCSV', () => {
            expect(serviceCode).toContain('export async function exportRevenueCSV');
        });

        test('exports recordDailyMetrics', () => {
            expect(serviceCode).toContain('export async function recordDailyMetrics');
        });

        test('imports from backend/dataAccess', () => {
            expect(serviceCode).toContain("from 'backend/dataAccess'");
        });

        test('imports currentMember from wix-members-backend', () => {
            expect(serviceCode).toContain("from 'wix-members-backend'");
        });

        test('uses suppressAuth for backend queries', () => {
            expect(serviceCode).toContain('suppressAuth: true');
        });

        test('defines requireAdmin authorization', () => {
            expect(serviceCode).toContain('async function requireAdmin');
        });

        test('defines PLAN_PRICING constants', () => {
            expect(serviceCode).toContain('PLAN_PRICING');
            expect(serviceCode).toContain('249');
            expect(serviceCode).toContain('749');
        });
    });

    // =========================================================================
    // HTML FILE STRUCTURE
    // =========================================================================

    describe('HTML file structure', () => {
        test('ADMIN_REVENUE_DASHBOARD.html exists', () => {
            expect(fs.existsSync(HTML_FILE)).toBe(true);
        });

        test('uses VelocityMatch branding (not LMDR)', () => {
            expect(htmlCode).toContain('VelocityMatch');
            expect(htmlCode).toContain('VM');
            // Should NOT have LMDR branding in the title/header
            expect(htmlCode).not.toMatch(/<title>.*LMDR.*<\/title>/);
        });

        test('includes postMessage listener', () => {
            expect(htmlCode).toContain("window.addEventListener('message'");
        });

        test('includes Chart.js CDN', () => {
            expect(htmlCode).toContain('chart.js');
        });

        test('includes Tailwind CDN', () => {
            expect(htmlCode).toContain('cdn.tailwindcss.com');
        });

        test('includes inline Tailwind config', () => {
            expect(htmlCode).toContain('tailwind.config');
        });

        test('handles revenueLoaded action', () => {
            expect(htmlCode).toContain('revenueLoaded');
        });

        test('handles mrrTrendLoaded action', () => {
            expect(htmlCode).toContain('mrrTrendLoaded');
        });

        test('handles tierRevenueLoaded action', () => {
            expect(htmlCode).toContain('tierRevenueLoaded');
        });

        test('handles cohortLoaded action', () => {
            expect(htmlCode).toContain('cohortLoaded');
        });

        test('handles churnLoaded action', () => {
            expect(htmlCode).toContain('churnLoaded');
        });

        test('handles exportReady action', () => {
            expect(htmlCode).toContain('exportReady');
        });

        test('handles actionError action', () => {
            expect(htmlCode).toContain('actionError');
        });

        test('has KPI card elements', () => {
            expect(htmlCode).toContain('mrrValue');
            expect(htmlCode).toContain('arrValue');
            expect(htmlCode).toContain('churnRateValue');
            expect(htmlCode).toContain('activeSubsValue');
            expect(htmlCode).toContain('arpuValue');
            expect(htmlCode).toContain('ltvValue');
        });

        test('has chart canvases', () => {
            expect(htmlCode).toContain('mrrChart');
            expect(htmlCode).toContain('tierChart');
            expect(htmlCode).toContain('churnChart');
        });

        test('has cohort table', () => {
            expect(htmlCode).toContain('cohortTable');
            expect(htmlCode).toContain('cohortBody');
        });

        test('has skeleton loading states', () => {
            expect(htmlCode).toContain('skeleton');
        });

        test('sends data requests to Velo via sendToVelo', () => {
            expect(htmlCode).toContain('sendToVelo');
            expect(htmlCode).toContain("sendToVelo('getRevenue')");
            expect(htmlCode).toContain("sendToVelo('getMRRTrend'");
            expect(htmlCode).toContain("sendToVelo('getTierRevenue')");
            expect(htmlCode).toContain("sendToVelo('getCohort'");
            expect(htmlCode).toContain("sendToVelo('getChurn'");
        });

        test('has export CSV functionality', () => {
            expect(htmlCode).toContain('handleExport');
            expect(htmlCode).toContain('downloadCSV');
            expect(htmlCode).toContain('exportCSV');
        });
    });

    // =========================================================================
    // COMPONENT DISCOVERY
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

    describe('routeMessage', () => {
        test('ignores messages with no action', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('getRevenue calls getRevenueSnapshot and sends revenueLoaded', async () => {
            await routeMessage(component, { action: 'getRevenue' });
            expect(mockBackend.getRevenueSnapshot).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'revenueLoaded',
                payload: expect.objectContaining({ mrr: 12450, arr: 149400 })
            });
        });

        test('getMRRTrend calls getMRRTrend with months param', async () => {
            await routeMessage(component, { action: 'getMRRTrend', months: 6 });
            expect(mockBackend.getMRRTrend).toHaveBeenCalledWith(6);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'mrrTrendLoaded',
                payload: expect.arrayContaining([expect.objectContaining({ mrr: 11000 })])
            });
        });

        test('getMRRTrend defaults to 12 months', async () => {
            await routeMessage(component, { action: 'getMRRTrend' });
            expect(mockBackend.getMRRTrend).toHaveBeenCalledWith(12);
        });

        test('getTierRevenue calls getRevenueByTier and sends tierRevenueLoaded', async () => {
            await routeMessage(component, { action: 'getTierRevenue' });
            expect(mockBackend.getRevenueByTier).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'tierRevenueLoaded',
                payload: expect.arrayContaining([expect.objectContaining({ tier: 'pro' })])
            });
        });

        test('getCohort calls getCohortAnalysis with months param', async () => {
            await routeMessage(component, { action: 'getCohort', months: 3 });
            expect(mockBackend.getCohortAnalysis).toHaveBeenCalledWith(3);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'cohortLoaded',
                payload: expect.arrayContaining([expect.objectContaining({ cohort: '2025-10' })])
            });
        });

        test('getCohort defaults to 6 months', async () => {
            await routeMessage(component, { action: 'getCohort' });
            expect(mockBackend.getCohortAnalysis).toHaveBeenCalledWith(6);
        });

        test('getChurn calls getChurnAnalysis with days param', async () => {
            await routeMessage(component, { action: 'getChurn', days: 60 });
            expect(mockBackend.getChurnAnalysis).toHaveBeenCalledWith(60);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'churnLoaded',
                payload: expect.objectContaining({ totalChurned: 3 })
            });
        });

        test('getChurn defaults to 30 days', async () => {
            await routeMessage(component, { action: 'getChurn' });
            expect(mockBackend.getChurnAnalysis).toHaveBeenCalledWith(30);
        });

        test('exportCSV calls exportRevenueCSV and sends exportReady', async () => {
            await routeMessage(component, { action: 'exportCSV', exportType: 'snapshot' });
            expect(mockBackend.exportRevenueCSV).toHaveBeenCalledWith('snapshot');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'exportReady',
                payload: expect.objectContaining({ csv: expect.any(String), filename: expect.any(String) })
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
        test('getRevenue failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getRevenueSnapshot: jest.fn().mockRejectedValue(new Error('DB timeout'))
            };
            await routeMessage(component, { action: 'getRevenue' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'DB timeout'
            });
        });

        test('getMRRTrend failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getMRRTrend: jest.fn().mockRejectedValue(new Error('Trend fetch failed'))
            };
            await routeMessage(component, { action: 'getMRRTrend' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Trend fetch failed'
            });
        });

        test('getTierRevenue failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getRevenueByTier: jest.fn().mockRejectedValue(new Error('Tier error'))
            };
            await routeMessage(component, { action: 'getTierRevenue' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Tier error'
            });
        });

        test('getCohort failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getCohortAnalysis: jest.fn().mockRejectedValue(new Error('Cohort error'))
            };
            await routeMessage(component, { action: 'getCohort' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Cohort error'
            });
        });

        test('getChurn failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getChurnAnalysis: jest.fn().mockRejectedValue(new Error('Churn error'))
            };
            await routeMessage(component, { action: 'getChurn' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Churn error'
            });
        });

        test('exportCSV failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                exportRevenueCSV: jest.fn().mockRejectedValue(new Error('Export failed'))
            };
            await routeMessage(component, { action: 'exportCSV', exportType: 'snapshot' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Export failed'
            });
        });

        test('error with no message falls back to generic message', async () => {
            const failBackend = {
                ...mockBackend,
                getRevenueSnapshot: jest.fn().mockRejectedValue({})
            };
            await routeMessage(component, { action: 'getRevenue' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'An unexpected error occurred'
            });
        });

        test('backend returning success:false sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getRevenueSnapshot: jest.fn().mockResolvedValue({ success: false, error: 'Unauthorized' })
            };
            await routeMessage(component, { action: 'getRevenue' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Unauthorized'
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
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getRevenue only calls getRevenueSnapshot once', async () => {
            await routeMessage(component, { action: 'getRevenue' });
            expect(mockBackend.getRevenueSnapshot).toHaveBeenCalledTimes(1);
        });

        test('getMRRTrend passes months parameter correctly', async () => {
            await routeMessage(component, { action: 'getMRRTrend', months: 24 });
            expect(mockBackend.getMRRTrend).toHaveBeenCalledWith(24);
        });

        test('getCohort passes months parameter correctly', async () => {
            await routeMessage(component, { action: 'getCohort', months: 12 });
            expect(mockBackend.getCohortAnalysis).toHaveBeenCalledWith(12);
        });

        test('getChurn passes days parameter correctly', async () => {
            await routeMessage(component, { action: 'getChurn', days: 90 });
            expect(mockBackend.getChurnAnalysis).toHaveBeenCalledWith(90);
        });

        test('exportCSV passes exportType parameter correctly', async () => {
            await routeMessage(component, { action: 'exportCSV', exportType: 'trend' });
            expect(mockBackend.exportRevenueCSV).toHaveBeenCalledWith('trend');
        });
    });
});
