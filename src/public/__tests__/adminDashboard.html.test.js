/* eslint-disable */
/**
 * ADMIN_DASHBOARD HTML DOM Tests
 * ===============================
 * Tests for src/public/admin/ADMIN_DASHBOARD.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: action/payload (admin pages)
 * Ready signal: getDashboard (sent on init)
 *
 * @see src/public/admin/ADMIN_DASHBOARD.html
 * @see src/pages/ADMIN_DASHBOARD.svo6l.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'ADMIN_DASHBOARD.html');
const MESSAGE_KEY = 'action';
const READY_SIGNAL = 'getDashboard';

const INBOUND_MESSAGES = [
    'init',
    'dashboardLoaded',
    'chartDataLoaded',
    'actionSuccess',
    'actionError',
    'aiUsageLoaded',
    'aiHealthLoaded',
    'featureStatsLoaded',
    'featureLifecycleReportResult',
    'featureStatsResult',
    'atRiskFeaturesResult',
    'funnelConversionResult',
    'updateFeatureStatusResult',
    'funnelsListResult',
    'metaApprovalInboxLoaded',
    'metaPolicyEditorLoaded',
    'metaErrorDigestLoaded',
    'metaRateLimitPostureLoaded',
    'metaGovernanceActionResult'
];

const OUTBOUND_MESSAGES = [
    'getDashboard',
    'getChartData',
    'getAIUsage',
    'getFeatureStats',
    'navigateTo',
    'resolveAlert',
    'getFeatureLifecycleReport',
    'getAtRiskFeatures',
    'getFunnelsList',
    'getFunnelConversion',
    'updateFeatureStatus',
    'getMetaApprovalInbox',
    'getMetaPolicyEditorData',
    'getMetaErrorDigest',
    'getMetaRateLimitPosture',
    'setMetaApprovalThresholds',
    'setMetaCampaignGuardrails',
    'setMetaDailyBudgetCaps',
    'quarantineMetaIntegration',
    'refreshMetaSystemUserToken',
    'rebindMetaAdAccount',
    'disableMetaIntegration'
];

const DOM_ELEMENT_MAP = {
    'dashboardLoaded': ['statDrivers', 'statCarriers', 'statMatches', 'statAttention', 'alertsList'],
    'actionSuccess': ['toastContainer'],
    'actionError': ['toastContainer'],
    'aiUsageLoaded': ['aiUsageTotal', 'aiUsageBreakdown'],
    'aiHealthLoaded': ['aiHealthStatus']
};

// =============================================================================
// READ SOURCE FILE
// =============================================================================

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

function createMockElement(id) {
    const children = [];
    const element = {
        id,
        textContent: '',
        innerHTML: '',
        innerText: '',
        value: '',
        className: '',
        style: {},
        hidden: false,
        disabled: false,
        children,
        childNodes: children,
        dataset: {},
        scrollTop: 0,
        scrollHeight: 100,
        classList: {
            _classes: new Set(),
            add: jest.fn(function (...cls) { cls.forEach(c => this._classes.add(c)); }),
            remove: jest.fn(function (...cls) { cls.forEach(c => this._classes.delete(c)); }),
            toggle: jest.fn(function (cls) {
                if (this._classes.has(cls)) this._classes.delete(cls);
                else this._classes.add(cls);
            }),
            contains: jest.fn(function (cls) { return this._classes.has(cls); }),
        },
        appendChild: jest.fn((child) => { children.push(child); return child; }),
        removeChild: jest.fn((child) => {
            const idx = children.indexOf(child);
            if (idx > -1) children.splice(idx, 1);
            return child;
        }),
        remove: jest.fn(),
        insertBefore: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(() => createMockElement('sub')),
        querySelectorAll: jest.fn(() => []),
        closest: jest.fn(() => null),
        focus: jest.fn(),
        blur: jest.fn(),
        click: jest.fn(),
    };
    return element;
}

const mockElements = {};

function getMockElement(id) {
    if (!mockElements[id]) {
        mockElements[id] = createMockElement(id);
    }
    return mockElements[id];
}

const capturedOutbound = [];

function mockPostToParent(message) {
    capturedOutbound.push(message);
}

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function sendToVelo(message) {
    mockPostToParent(message);
}

const state = {
    dashboard: null,
    chartPeriod: 'week',
    aiUsagePeriod: 'week'
};

function showToast(message, type = 'info') {
    const container = getMockElement('toastContainer');
    const toast = createMockElement('toast');
    toast.innerHTML = `<div class="toast toast-${type}">${message}</div>`;
    container.appendChild(toast);
}

function handleDashboardLoaded(data) {
    state.dashboard = data;

    getMockElement('statDrivers').textContent = data.drivers?.total?.toLocaleString() || '0';
    getMockElement('statDriversNew').textContent = `+${data.drivers?.newThisWeek || 0}`;
    getMockElement('statCarriers').textContent = data.carriers?.total?.toLocaleString() || '0';
    getMockElement('statCarriersNew').textContent = `+${data.carriers?.newThisWeek || 0}`;
    getMockElement('statMatches').textContent = data.matches?.today?.toLocaleString() || '0';
    getMockElement('statMatchesWeek').textContent = `${data.matches?.thisWeek || 0} this week`;

    const attention = (data.drivers?.pending || 0) + (data.carriers?.flagged || 0);
    getMockElement('statAttention').textContent = attention.toString();
    getMockElement('attentionBreakdown').textContent =
        `${data.drivers?.pending || 0} pending, ${data.carriers?.flagged || 0} flagged`;

    if (attention > 0) {
        getMockElement('attentionBadge').classList.remove('hidden');
    }

    // Enrichment stats
    getMockElement('enrichmentCoverage').textContent = `${data.enrichment?.coverage || 0}% coverage`;

    // Alerts
    const alertsList = getMockElement('alertsList');
    if (!data.alerts?.items?.length) {
        alertsList.innerHTML = '<div class="text-center">No active alerts</div>';
    } else {
        alertsList.innerHTML = data.alerts.items.map(a => `<div class="alert">${a.message}</div>`).join('');
    }
}

function handleAIUsageLoaded(data) {
    getMockElement('aiUsageTotal').textContent = data.total?.toLocaleString() || '0';
    getMockElement('aiUsageBreakdown').innerHTML =
        `<div>OpenAI: ${data.openai || 0}</div><div>Anthropic: ${data.anthropic || 0}</div>`;
}

function handleAIHealthLoaded(data) {
    const el = getMockElement('aiHealthStatus');
    el.textContent = data.status || 'unknown';
    el.className = `health-${data.status || 'unknown'}`;
}

function handleFeatureStatsLoaded(data) {
    getMockElement('featureStats').innerHTML = JSON.stringify(data);
}

function handleMessage(eventData) {
    const data = eventData;
    if (!data || !data.action) return;

    switch (data.action) {
        case 'init':
            sendToVelo({ action: 'getDashboard' });
            break;
        case 'dashboardLoaded':
            handleDashboardLoaded(data.payload);
            break;
        case 'chartDataLoaded':
            getMockElement('chartContainer').innerHTML = 'Chart updated';
            break;
        case 'actionSuccess':
            showToast(data.message || 'Action completed', 'success');
            break;
        case 'actionError':
            showToast(data.message || 'An error occurred', 'error');
            break;
        case 'aiUsageLoaded':
            handleAIUsageLoaded(data.payload);
            break;
        case 'aiHealthLoaded':
            handleAIHealthLoaded(data.payload);
            break;
        case 'featureStatsLoaded':
            handleFeatureStatsLoaded(data.payload);
            break;
        case 'featureLifecycleReportResult':
            getMockElement('featureLifecycle').innerHTML = JSON.stringify(data.payload);
            break;
        case 'featureStatsResult':
            getMockElement('featureStatsDetail').innerHTML = JSON.stringify(data.payload);
            break;
        case 'atRiskFeaturesResult':
            getMockElement('atRiskFeatures').innerHTML = JSON.stringify(data.payload);
            break;
        case 'funnelConversionResult':
            getMockElement('funnelConversion').innerHTML = JSON.stringify(data.payload);
            break;
        case 'funnelsListResult':
            getMockElement('funnelsList').innerHTML = JSON.stringify(data.payload);
            break;
        case 'updateFeatureStatusResult':
            showToast('Feature status updated', 'success');
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_DASHBOARD.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.innerText = '';
            el.value = '';
            el.hidden = false;
            el.disabled = false;
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.classList.toggle.mockClear();
            el.classList.contains.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.dashboard = null;
    });

    // =========================================================================
    // SOURCE HTML STRUCTURAL CHECKS
    // =========================================================================

    describe('HTML source structure', () => {
        test('file exists and is readable', () => {
            expect(htmlSource.length).toBeGreaterThan(0);
        });

        test('contains a message listener', () => {
            const hasListener =
                htmlSource.includes("addEventListener('message'") ||
                htmlSource.includes('addEventListener("message"') ||
                htmlSource.includes('window.onmessage');
            expect(hasListener).toBe(true);
        });

        test('contains a function to post messages back to parent', () => {
            const hasOutbound =
                htmlSource.includes('window.parent.postMessage') ||
                htmlSource.includes('parent.postMessage');
            expect(hasOutbound).toBe(true);
        });

        test('sends a ready signal on initialization', () => {
            expect(htmlSource).toContain(READY_SIGNAL);
        });

        test('handles all expected inbound message types', () => {
            INBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('references all expected outbound message types', () => {
            OUTBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('uses action-based message protocol', () => {
            const hasAction =
                htmlSource.includes('data.action') ||
                htmlSource.includes("event.data.action");
            expect(hasAction).toBe(true);
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================

    describe('Message validation', () => {
        test('ignores null/undefined messages', () => {
            handleMessage(null);
            handleMessage(undefined);
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores empty object messages', () => {
            handleMessage({});
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores messages without action key', () => {
            handleMessage({ type: 'wrong_key', data: {} });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {

        test('dashboardLoaded updates stat counters', () => {
            handleMessage({
                action: 'dashboardLoaded',
                payload: {
                    drivers: { total: 1234, newThisWeek: 56, pending: 5 },
                    carriers: { total: 89, newThisWeek: 3, flagged: 2 },
                    matches: { today: 150, thisWeek: 890 },
                    enrichment: { coverage: 85 },
                    alerts: { items: [], unresolvedCount: 0 }
                }
            });

            expect(getMockElement('statDrivers').textContent).toBe('1,234');
            expect(getMockElement('statDriversNew').textContent).toBe('+56');
            expect(getMockElement('statCarriers').textContent).toBe('89');
            expect(getMockElement('statCarriersNew').textContent).toBe('+3');
            expect(getMockElement('statMatches').textContent).toBe('150');
            expect(getMockElement('statMatchesWeek').textContent).toBe('890 this week');
            expect(getMockElement('statAttention').textContent).toBe('7'); // 5 pending + 2 flagged
        });

        test('dashboardLoaded shows attention badge when needed', () => {
            handleMessage({
                action: 'dashboardLoaded',
                payload: {
                    drivers: { total: 100, pending: 5 },
                    carriers: { total: 50, flagged: 2 },
                    matches: {},
                    alerts: { items: [] }
                }
            });

            expect(getMockElement('attentionBadge').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('dashboardLoaded renders alerts list', () => {
            handleMessage({
                action: 'dashboardLoaded',
                payload: {
                    drivers: { total: 100 },
                    carriers: { total: 50 },
                    matches: {},
                    alerts: {
                        items: [
                            { id: 'a1', message: 'Critical alert', type: 'critical' },
                            { id: 'a2', message: 'Warning alert', type: 'warning' }
                        ],
                        unresolvedCount: 2
                    }
                }
            });

            const alertsList = getMockElement('alertsList');
            expect(alertsList.innerHTML).toContain('Critical alert');
            expect(alertsList.innerHTML).toContain('Warning alert');
        });

        test('dashboardLoaded renders empty alerts state', () => {
            handleMessage({
                action: 'dashboardLoaded',
                payload: {
                    drivers: { total: 100 },
                    carriers: { total: 50 },
                    matches: {},
                    alerts: { items: [], unresolvedCount: 0 }
                }
            });

            const alertsList = getMockElement('alertsList');
            expect(alertsList.innerHTML).toContain('No active alerts');
        });

        test('dashboardLoaded updates internal state', () => {
            const payload = {
                drivers: { total: 100 },
                carriers: { total: 50 },
                matches: {},
                alerts: { items: [] }
            };
            handleMessage({ action: 'dashboardLoaded', payload });

            expect(state.dashboard).toEqual(payload);
        });

        test('aiUsageLoaded updates AI stats', () => {
            handleMessage({
                action: 'aiUsageLoaded',
                payload: { total: 5000, openai: 3000, anthropic: 2000 }
            });

            expect(getMockElement('aiUsageTotal').textContent).toBe('5,000');
            expect(getMockElement('aiUsageBreakdown').innerHTML).toContain('OpenAI: 3000');
            expect(getMockElement('aiUsageBreakdown').innerHTML).toContain('Anthropic: 2000');
        });

        test('aiHealthLoaded updates health status', () => {
            handleMessage({
                action: 'aiHealthLoaded',
                payload: { status: 'healthy' }
            });

            expect(getMockElement('aiHealthStatus').textContent).toBe('healthy');
            expect(getMockElement('aiHealthStatus').className).toBe('health-healthy');
        });

        test('chartDataLoaded updates chart container', () => {
            handleMessage({
                action: 'chartDataLoaded',
                payload: { labels: ['Mon', 'Tue'], values: [10, 20] }
            });

            expect(getMockElement('chartContainer').innerHTML).toBe('Chart updated');
        });

        test('featureLifecycleReportResult renders feature lifecycle', () => {
            const payload = { features: [{ id: 'f1', name: 'Test' }] };
            handleMessage({ action: 'featureLifecycleReportResult', payload });

            expect(getMockElement('featureLifecycle').innerHTML).toContain('Test');
        });

        test('atRiskFeaturesResult renders at-risk features', () => {
            const payload = { atRisk: [{ id: 'f1', reason: 'low usage' }] };
            handleMessage({ action: 'atRiskFeaturesResult', payload });

            expect(getMockElement('atRiskFeatures').innerHTML).toContain('low usage');
        });

        test('funnelsListResult renders funnels list', () => {
            const payload = { funnels: [{ id: 'funnel1', name: 'Signup' }] };
            handleMessage({ action: 'funnelsListResult', payload });

            expect(getMockElement('funnelsList').innerHTML).toContain('Signup');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {

        test('init action triggers getDashboard request', () => {
            handleMessage({ action: 'init' });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ action: 'getDashboard' });
        });

        test('sendToVelo sends correct message format', () => {
            sendToVelo({ action: 'resolveAlert', alertId: 'a1' });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ action: 'resolveAlert', alertId: 'a1' });
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {

        test('actionError shows toast with error message', () => {
            handleMessage({
                action: 'actionError',
                message: 'Failed to load data'
            });

            const container = getMockElement('toastContainer');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('Failed to load data');
            expect(toast.innerHTML).toContain('toast-error');
        });

        test('actionSuccess shows toast with success message', () => {
            handleMessage({
                action: 'actionSuccess',
                message: 'Alert resolved'
            });

            const container = getMockElement('toastContainer');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('Alert resolved');
            expect(toast.innerHTML).toContain('toast-success');
        });

        test('actionError with no message shows fallback', () => {
            handleMessage({ action: 'actionError' });

            const container = getMockElement('toastContainer');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('An error occurred');
        });

        test('updateFeatureStatusResult shows success toast', () => {
            handleMessage({ action: 'updateFeatureStatusResult', payload: { success: true } });

            const container = getMockElement('toastContainer');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('Feature status updated');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent or stripHtml for user content', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('stripHtml') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('DOMPurify') ||
                htmlSource.includes('sanitize');
            expect(hasSanitization).toBe(true);
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains all element IDs referenced by handlers', () => {
            const criticalIds = [
                'statDrivers', 'statCarriers', 'statMatches', 'alertsList', 'healthIndicator',
                'metaApprovalInboxList', 'metaApprovalInboxCount', 'metaLaunchThresholdInput',
                'metaBudgetCapInput', 'metaIntegrationIdInput', 'metaAdAccountIdInput',
                'metaErrorEventsCount', 'metaThrottledCount'
            ];
            criticalIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });
    });
});
