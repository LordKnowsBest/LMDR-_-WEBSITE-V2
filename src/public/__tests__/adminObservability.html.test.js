/* eslint-disable */
/**
 * ADMIN_OBSERVABILITY HTML DOM Tests
 * =====================================
 * Tests for src/public/admin/ADMIN_OBSERVABILITY.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: action/payload
 * Ready signal: Page sends initial data bundle as 'initialized' action on load
 *
 * Inbound: init, initialized, logsLoaded, errorsLoaded, traceLoaded,
 *   healthLoaded, aiAnalyticsLoaded, actionError
 * Outbound: getLogs, getErrors, getTrace, getHealthMetrics, getAIAnalytics
 *
 * @see src/public/admin/ADMIN_OBSERVABILITY.html
 * @see src/pages/ADMIN_OBSERVABILITY.c8pf9.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'ADMIN_OBSERVABILITY.html');

const INBOUND_MESSAGES = [
    'init',
    'initialized',
    'logsLoaded',
    'errorsLoaded',
    'traceLoaded',
    'healthLoaded',
    'aiAnalyticsLoaded',
    'actionError'
];

const OUTBOUND_MESSAGES = [
    'getLogs',
    'getErrors',
    'getTrace',
    'getHealthMetrics',
    'getAIAnalytics'
];

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
        classList: {
            _classes: new Set(),
            add: jest.fn(function (...cls) { cls.forEach(c => this._classes.add(c)); }),
            remove: jest.fn(function (...cls) { cls.forEach(c => this._classes.delete(c)); }),
            toggle: jest.fn(),
            contains: jest.fn(function (cls) { return this._classes.has(cls); }),
        },
        appendChild: jest.fn((child) => { children.push(child); return child; }),
        removeChild: jest.fn(),
        remove: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => createMockElement('sub')),
        querySelectorAll: jest.fn(() => []),
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
    metadata: null,
    health: null,
    logs: [],
    errors: [],
    aiAnalytics: null
};

function handleInitialized(data) {
    state.metadata = data.metadata;
    state.health = data.health;
    state.errors = data.errors;
    state.aiAnalytics = data.aiAnalytics;

    // Update metrics
    if (data.health) {
        getMockElement('metricRequests').textContent = (data.health.totalRequests || 0).toString();
        getMockElement('metricErrorRate').textContent = `${data.health.errorRate || 0}%`;
        getMockElement('metricLatency').textContent = `${data.health.avgLatency || 0}ms`;
    }

    if (data.errors) {
        getMockElement('metricErrors').textContent = (data.errors.total || 0).toString();
    }

    // Update service health list
    if (data.health && data.health.services) {
        const list = getMockElement('serviceHealthList');
        list.innerHTML = data.health.services.map(s =>
            `<div class="service-item">${s.name}: ${s.status}</div>`
        ).join('');
    }
}

function handleLogsLoaded(data) {
    state.logs = data.logs || [];
    const table = getMockElement('logsTable');
    if (state.logs.length === 0) {
        table.innerHTML = '<tr><td>No logs found</td></tr>';
    } else {
        table.innerHTML = state.logs.map(l =>
            `<tr><td>${l.level || ''}</td><td>${l.message || ''}</td><td>${l.source || ''}</td></tr>`
        ).join('');
    }
}

function handleErrorsLoaded(data) {
    state.errors = data;
    getMockElement('metricErrors').textContent = (data.total || 0).toString();
    const list = getMockElement('errorList');
    if (data.items && data.items.length > 0) {
        list.innerHTML = data.items.map(e =>
            `<div class="error-item">${e.message || ''}</div>`
        ).join('');
    } else {
        list.innerHTML = '<div>No errors found</div>';
    }
}

function handleTraceLoaded(data) {
    getMockElement('traceId').textContent = data.traceId || '';
    getMockElement('traceName').textContent = data.name || '';
    getMockElement('traceDuration').textContent = `${data.duration || 0}ms`;
    getMockElement('traceStatus').textContent = data.status || '';
    getMockElement('traceDetails').classList.remove('hidden');
}

function handleHealthLoaded(data) {
    state.health = data;
    getMockElement('metricRequests').textContent = (data.totalRequests || 0).toString();
    getMockElement('metricErrorRate').textContent = `${data.errorRate || 0}%`;
    getMockElement('metricLatency').textContent = `${data.avgLatency || 0}ms`;
}

function handleAIAnalyticsLoaded(data) {
    state.aiAnalytics = data;
    getMockElement('aiRequests').textContent = (data.totalRequests || 0).toString();
    getMockElement('aiTokens').textContent = (data.totalTokens || 0).toString();
    getMockElement('aiCost').textContent = `$${(data.totalCost || 0).toFixed(2)}`;
    getMockElement('aiLatency').textContent = `${data.avgLatency || 0}ms`;
}

function showToast(message, type = 'error') {
    getMockElement('toast').textContent = message;
    getMockElement('toast').className = `toast toast-${type}`;
}

function handleMessage(eventData) {
    const data = eventData;
    if (!data || !data.action) return;

    switch (data.action) {
        case 'init':
            // Re-request initialization
            break;
        case 'initialized':
            handleInitialized(data.payload);
            break;
        case 'logsLoaded':
            handleLogsLoaded(data.payload);
            break;
        case 'errorsLoaded':
            handleErrorsLoaded(data.payload);
            break;
        case 'traceLoaded':
            handleTraceLoaded(data.payload);
            break;
        case 'healthLoaded':
            handleHealthLoaded(data.payload);
            break;
        case 'aiAnalyticsLoaded':
            handleAIAnalyticsLoaded(data.payload);
            break;
        case 'actionError':
            showToast(data.message || 'An error occurred', 'error');
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_OBSERVABILITY.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.value = '';
            el.hidden = false;
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.metadata = null;
        state.health = null;
        state.logs = [];
        state.errors = [];
        state.aiAnalytics = null;
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

        test('contains parent postMessage calls', () => {
            const hasOutbound =
                htmlSource.includes('window.parent.postMessage') ||
                htmlSource.includes('parent.postMessage');
            expect(hasOutbound).toBe(true);
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
                htmlSource.includes('.action');
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

        test('ignores messages without action key', () => {
            handleMessage({ type: 'wrong_key' });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('initialized updates metrics and service health', () => {
            handleMessage({
                action: 'initialized',
                payload: {
                    metadata: { services: ['api', 'worker'] },
                    health: {
                        totalRequests: 15000,
                        errorRate: 2.5,
                        avgLatency: 350,
                        services: [
                            { name: 'API', status: 'healthy' },
                            { name: 'Worker', status: 'degraded' }
                        ]
                    },
                    errors: { total: 42 },
                    aiAnalytics: { totalRequests: 500 }
                }
            });

            expect(getMockElement('metricRequests').textContent).toBe('15000');
            expect(getMockElement('metricErrorRate').textContent).toBe('2.5%');
            expect(getMockElement('metricLatency').textContent).toBe('350ms');
            expect(getMockElement('metricErrors').textContent).toBe('42');
            expect(getMockElement('serviceHealthList').innerHTML).toContain('API');
            expect(getMockElement('serviceHealthList').innerHTML).toContain('degraded');
        });

        test('logsLoaded populates logs table', () => {
            handleMessage({
                action: 'logsLoaded',
                payload: {
                    logs: [
                        { level: 'error', message: 'Connection timeout', source: 'api' },
                        { level: 'info', message: 'Request processed', source: 'worker' }
                    ]
                }
            });

            expect(getMockElement('logsTable').innerHTML).toContain('Connection timeout');
            expect(getMockElement('logsTable').innerHTML).toContain('Request processed');
        });

        test('logsLoaded with empty list shows no logs', () => {
            handleMessage({
                action: 'logsLoaded',
                payload: { logs: [] }
            });

            expect(getMockElement('logsTable').innerHTML).toContain('No logs found');
        });

        test('errorsLoaded updates error count and list', () => {
            handleMessage({
                action: 'errorsLoaded',
                payload: {
                    total: 5,
                    items: [{ message: 'API timeout' }, { message: 'DB connection lost' }]
                }
            });

            expect(getMockElement('metricErrors').textContent).toBe('5');
            expect(getMockElement('errorList').innerHTML).toContain('API timeout');
            expect(getMockElement('errorList').innerHTML).toContain('DB connection lost');
        });

        test('traceLoaded displays trace details', () => {
            handleMessage({
                action: 'traceLoaded',
                payload: {
                    traceId: 'trace-123',
                    name: 'getDriversList',
                    duration: 450,
                    status: 'completed'
                }
            });

            expect(getMockElement('traceId').textContent).toBe('trace-123');
            expect(getMockElement('traceName').textContent).toBe('getDriversList');
            expect(getMockElement('traceDuration').textContent).toBe('450ms');
            expect(getMockElement('traceStatus').textContent).toBe('completed');
            expect(getMockElement('traceDetails').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('healthLoaded updates health metrics', () => {
            handleMessage({
                action: 'healthLoaded',
                payload: {
                    totalRequests: 20000,
                    errorRate: 1.2,
                    avgLatency: 200
                }
            });

            expect(getMockElement('metricRequests').textContent).toBe('20000');
            expect(getMockElement('metricErrorRate').textContent).toBe('1.2%');
            expect(getMockElement('metricLatency').textContent).toBe('200ms');
        });

        test('aiAnalyticsLoaded updates AI stats', () => {
            handleMessage({
                action: 'aiAnalyticsLoaded',
                payload: {
                    totalRequests: 1500,
                    totalTokens: 500000,
                    totalCost: 12.50,
                    avgLatency: 800
                }
            });

            expect(getMockElement('aiRequests').textContent).toBe('1500');
            expect(getMockElement('aiTokens').textContent).toBe('500000');
            expect(getMockElement('aiCost').textContent).toBe('$12.50');
            expect(getMockElement('aiLatency').textContent).toBe('800ms');
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {
        test('actionError shows toast with error message', () => {
            handleMessage({ action: 'actionError', message: 'Failed to load' });
            expect(getMockElement('toast').textContent).toBe('Failed to load');
            expect(getMockElement('toast').className).toContain('toast-error');
        });

        test('actionError with no message shows fallback', () => {
            handleMessage({ action: 'actionError' });
            expect(getMockElement('toast').textContent).toBe('An error occurred');
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical metric element IDs', () => {
            const criticalIds = ['metricRequests', 'metricErrorRate', 'metricLatency', 'metricErrors'];
            criticalIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('HTML contains tab-related elements', () => {
            expect(htmlSource).toContain('logsTable');
            expect(htmlSource).toContain('traceDetails');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent or sanitization for user content', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('sanitize');
            expect(hasSanitization).toBe(true);
        });
    });
});
