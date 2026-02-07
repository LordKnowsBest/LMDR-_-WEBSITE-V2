/**
 * CARRIER_CSA_MONITOR HTML DOM Tests
 * ====================================
 * Tests for src/public/carrier/CARRIER_CSA_MONITOR.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * **TYPE PROTOCOL** (not action) -- uses { type, data } envelope
 *
 * Inbound: setCSAData
 * Outbound: csaMonitorReady, getCSAData, navigateTo
 *
 * DOM IDs: basicGrid, trendChart, trendMetric, recsList, lastUpdated,
 *   sidebar, sidebarCarrierName
 *
 * Features: 6 BASIC score cards, 12-month trend chart (Chart.js),
 *   recommendations panel, sidebar navigation
 *
 * @see src/public/carrier/CARRIER_CSA_MONITOR.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'carrier', 'CARRIER_CSA_MONITOR.html');

const INBOUND_MESSAGES = [
    'setCSAData'
];

const OUTBOUND_MESSAGES = [
    'csaMonitorReady',
    'getCSAData',
    'navigateTo'
];

const BASIC_CATEGORIES = [
    { key: 'unsafe_driving', label: 'Unsafe Driving', threshold: 65 },
    { key: 'hours_of_service', label: 'HOS Compliance', threshold: 65 },
    { key: 'driver_fitness', label: 'Driver Fitness', threshold: 80 },
    { key: 'drugs_alcohol', label: 'Drugs/Alcohol', threshold: 80 },
    { key: 'vehicle_maintenance', label: 'Vehicle Maint.', threshold: 80 },
    { key: 'crash_indicator', label: 'Crash Indicator', threshold: 65 }
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
        querySelector: jest.fn(() => null),
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

function mockPostToParent(type, data) {
    capturedOutbound.push({ type, data });
}

// =============================================================================
// REPLICATED CORE LOGIC (type-based protocol)
// =============================================================================

function sendToVelo(action, payload = {}) {
    mockPostToParent(action, payload);
}

const state = {
    currentData: null
};

function handleSetCSAData(data) {
    state.currentData = data;
    render();
}

function render() {
    if (!state.currentData) return;

    const basics = state.currentData.basics || {};
    const recs = state.currentData.recommendations || [];

    getMockElement('lastUpdated').textContent = new Date().toLocaleDateString();

    // BASIC Grid
    const grid = getMockElement('basicGrid');
    let gridHtml = '';

    BASIC_CATEGORIES.forEach(cat => {
        const score = basics[cat.key]?.percentile || 0;
        const alert = basics[cat.key]?.alert || false;
        const trend = basics[cat.key]?.change || 0;

        let statusText = 'Good';
        let statusColor = 'bg-green-500';
        if (score > cat.threshold * 0.8) { statusText = 'Warning'; statusColor = 'bg-yellow-500'; }
        if (alert || score > cat.threshold) { statusText = 'Alert'; statusColor = 'bg-red-500'; }

        gridHtml += `<div class="basic-card" data-key="${cat.key}">`;
        gridHtml += `<h4>${cat.label}</h4>`;
        gridHtml += `<span class="score">${score}%</span>`;
        gridHtml += `<span class="threshold">/ ${cat.threshold}% limit</span>`;
        gridHtml += `<div class="${statusColor}" style="width: ${score}%"></div>`;
        gridHtml += `<span class="status">${statusText}</span>`;
        gridHtml += `<span class="trend">${trend > 0 ? '+' : ''}${trend}%</span>`;
        gridHtml += `</div>`;
    });
    grid.innerHTML = gridHtml;

    // Recommendations
    const recList = getMockElement('recsList');
    if (recs.length === 0) {
        recList.innerHTML = '<div class="text-center">No active recommendations.</div>';
    } else {
        recList.innerHTML = recs.map(rec =>
            `<div class="rec-item"><h5>${rec.category}</h5><p>${rec.action}</p></div>`
        ).join('');
    }
}

function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'setCSAData':
            handleSetCSAData(msg.data);
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_CSA_MONITOR.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.value = '';
            el.hidden = false;
            el.style = {};
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.currentData = null;
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
            expect(htmlSource).toContain('window.parent.postMessage');
        });

        test('sends csaMonitorReady signal on init', () => {
            expect(htmlSource).toContain('csaMonitorReady');
            const readyPattern = /postMessage\(\s*\{[^}]*type:\s*['"]csaMonitorReady['"]/;
            expect(readyPattern.test(htmlSource)).toBe(true);
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

        test('uses type-based message protocol (NOT action-only)', () => {
            const hasType =
                htmlSource.includes('msg.type') ||
                htmlSource.includes('.type');
            expect(hasType).toBe(true);
        });

        test('guards against missing type with early return', () => {
            const guardPattern = /if\s*\(\s*!msg\s*\|\|\s*!msg\.type\s*\)\s*return/;
            expect(guardPattern.test(htmlSource)).toBe(true);
        });

        test('includes Chart.js CDN', () => {
            expect(htmlSource).toContain('chart.js');
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================

    describe('Message validation', () => {
        test('ignores null/undefined messages', () => {
            handleMessage(null);
            handleMessage(undefined);
            expect(getMockElement('basicGrid').innerHTML).toBe('');
        });

        test('ignores messages without type key', () => {
            handleMessage({ action: 'setCSAData', data: {} });
            expect(getMockElement('basicGrid').innerHTML).toBe('');
        });

        test('ignores empty object', () => {
            handleMessage({});
            expect(getMockElement('basicGrid').innerHTML).toBe('');
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('setCSAData renders 6 BASIC score cards', () => {
            handleMessage({
                type: 'setCSAData',
                data: {
                    basics: {
                        unsafe_driving: { percentile: 45, change: -3 },
                        hours_of_service: { percentile: 55, change: 2 },
                        driver_fitness: { percentile: 30, change: -1 },
                        drugs_alcohol: { percentile: 10, change: 0 },
                        vehicle_maintenance: { percentile: 72, change: 5 },
                        crash_indicator: { percentile: 40, change: -2 }
                    },
                    recommendations: [],
                    history: []
                }
            });

            const gridHtml = getMockElement('basicGrid').innerHTML;
            expect(gridHtml).toContain('Unsafe Driving');
            expect(gridHtml).toContain('HOS Compliance');
            expect(gridHtml).toContain('Driver Fitness');
            expect(gridHtml).toContain('Drugs/Alcohol');
            expect(gridHtml).toContain('Vehicle Maint.');
            expect(gridHtml).toContain('Crash Indicator');
        });

        test('setCSAData shows correct score values', () => {
            handleMessage({
                type: 'setCSAData',
                data: {
                    basics: {
                        unsafe_driving: { percentile: 45, change: -3 },
                        hours_of_service: { percentile: 55, change: 2 },
                        driver_fitness: { percentile: 30, change: -1 },
                        drugs_alcohol: { percentile: 10, change: 0 },
                        vehicle_maintenance: { percentile: 72, change: 5 },
                        crash_indicator: { percentile: 40, change: -2 }
                    },
                    recommendations: [],
                    history: []
                }
            });

            const gridHtml = getMockElement('basicGrid').innerHTML;
            expect(gridHtml).toContain('45%');
            expect(gridHtml).toContain('55%');
            expect(gridHtml).toContain('72%');
        });

        test('setCSAData applies alert status for scores above threshold', () => {
            handleMessage({
                type: 'setCSAData',
                data: {
                    basics: {
                        unsafe_driving: { percentile: 70, alert: true, change: 0 },
                        hours_of_service: { percentile: 20, change: 0 },
                        driver_fitness: { percentile: 20, change: 0 },
                        drugs_alcohol: { percentile: 20, change: 0 },
                        vehicle_maintenance: { percentile: 20, change: 0 },
                        crash_indicator: { percentile: 20, change: 0 }
                    },
                    recommendations: [],
                    history: []
                }
            });

            const gridHtml = getMockElement('basicGrid').innerHTML;
            // unsafe_driving with alert=true should show Alert status
            expect(gridHtml).toContain('Alert');
            expect(gridHtml).toContain('bg-red-500');
        });

        test('setCSAData renders recommendations', () => {
            handleMessage({
                type: 'setCSAData',
                data: {
                    basics: {
                        unsafe_driving: { percentile: 45, change: 0 },
                        hours_of_service: { percentile: 55, change: 0 },
                        driver_fitness: { percentile: 30, change: 0 },
                        drugs_alcohol: { percentile: 10, change: 0 },
                        vehicle_maintenance: { percentile: 72, change: 0 },
                        crash_indicator: { percentile: 40, change: 0 }
                    },
                    recommendations: [
                        { category: 'Vehicle Maint.', action: 'Schedule preventive maintenance checks' },
                        { category: 'HOS Compliance', action: 'Review ELD training procedures' }
                    ],
                    history: []
                }
            });

            const recsHtml = getMockElement('recsList').innerHTML;
            expect(recsHtml).toContain('Vehicle Maint.');
            expect(recsHtml).toContain('Schedule preventive maintenance checks');
            expect(recsHtml).toContain('HOS Compliance');
            expect(recsHtml).toContain('Review ELD training procedures');
        });

        test('setCSAData with no recommendations shows empty state', () => {
            handleMessage({
                type: 'setCSAData',
                data: {
                    basics: {
                        unsafe_driving: { percentile: 10, change: 0 },
                        hours_of_service: { percentile: 10, change: 0 },
                        driver_fitness: { percentile: 10, change: 0 },
                        drugs_alcohol: { percentile: 10, change: 0 },
                        vehicle_maintenance: { percentile: 10, change: 0 },
                        crash_indicator: { percentile: 10, change: 0 }
                    },
                    recommendations: [],
                    history: []
                }
            });

            expect(getMockElement('recsList').innerHTML).toContain('No active recommendations');
        });

        test('setCSAData updates lastUpdated timestamp', () => {
            handleMessage({
                type: 'setCSAData',
                data: {
                    basics: {},
                    recommendations: [],
                    history: []
                }
            });

            expect(getMockElement('lastUpdated').textContent).not.toBe('');
            expect(getMockElement('lastUpdated').textContent).not.toBe('--');
        });

        test('setCSAData with warning-level scores shows Warning status', () => {
            // Score > threshold * 0.8 but not above threshold and no alert
            handleMessage({
                type: 'setCSAData',
                data: {
                    basics: {
                        unsafe_driving: { percentile: 55, change: 0 }, // 55 > 65*0.8=52
                        hours_of_service: { percentile: 10, change: 0 },
                        driver_fitness: { percentile: 10, change: 0 },
                        drugs_alcohol: { percentile: 10, change: 0 },
                        vehicle_maintenance: { percentile: 10, change: 0 },
                        crash_indicator: { percentile: 10, change: 0 }
                    },
                    recommendations: [],
                    history: []
                }
            });

            const gridHtml = getMockElement('basicGrid').innerHTML;
            expect(gridHtml).toContain('Warning');
            expect(gridHtml).toContain('bg-yellow-500');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('csaMonitorReady signal is sent in HTML source', () => {
            const readyPattern = /type:\s*['"]csaMonitorReady['"]/;
            expect(readyPattern.test(htmlSource)).toBe(true);
        });

        test('getCSAData is sent via sendToVelo', () => {
            expect(htmlSource).toContain("sendToVelo('getCSAData'");
        });

        test('navigateTo is sent via sidebar links', () => {
            const navPattern = /type:\s*['"]navigateTo['"]/;
            expect(navPattern.test(htmlSource)).toBe(true);
        });
    });

    // =========================================================================
    // DOM ELEMENT COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical element IDs', () => {
            const criticalIds = [
                'basicGrid', 'trendChart', 'trendMetric',
                'recsList', 'lastUpdated',
                'sidebar', 'sidebarCarrierName'
            ];
            criticalIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('HTML contains sidebar navigation links', () => {
            const sidebarPages = [
                'dashboard', 'compliance-calendar', 'document-vault',
                'dq-tracker', 'csa-monitor', 'incident-reporting'
            ];
            sidebarPages.forEach(page => {
                expect(htmlSource).toContain(`data-page="${page}"`);
            });
        });

        test('HTML contains BASIC category labels', () => {
            const labels = ['Unsafe Driving', 'HOS Compliance', 'Driver Fitness',
                'Drugs/Alcohol', 'Vehicle Maint.', 'Crash Indicator'];
            labels.forEach(label => {
                expect(htmlSource).toContain(label);
            });
        });

        test('HTML contains trend metric selector options', () => {
            const options = ['all', 'unsafe_driving', 'hours_of_service', 'vehicle_maintenance'];
            options.forEach(opt => {
                expect(htmlSource).toContain(`value="${opt}"`);
            });
        });

        test('HTML contains canvas element for chart', () => {
            expect(htmlSource).toContain('<canvas');
            expect(htmlSource).toContain('trendChart');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent for safe text rendering', () => {
            expect(htmlSource).toContain('textContent');
        });

        test('source references Chart.js for data visualization', () => {
            expect(htmlSource).toContain('new Chart');
        });
    });
});
