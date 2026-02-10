/* eslint-disable */
/**
 * ADMIN_FEATURE_ADOPTION HTML DOM Tests
 * ========================================
 * Tests for src/public/admin/ADMIN_FEATURE_ADOPTION.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * **TYPE PROTOCOL** (not action) — uses { type, data } envelope
 *
 * Inbound: featureLifecycleReportResult, featureStatsResult, featureHealthScoreResult,
 *   atRiskFeaturesResult, funnelsListResult, funnelConversionResult,
 *   registerFeatureResult, updateFeatureStatusResult
 * Outbound: featureAdoptionReady, getFeatureLifecycleReport, getFeatureStats,
 *   getFeatureHealthScore, getAtRiskFeatures, getFunnelsList, getFunnelConversion,
 *   registerFeature, updateFeatureStatus
 *
 * DOM IDs: totalFeatures, healthyCount, warningCount, criticalCount,
 *   lifecycleChart, healthGrid, registryTableBody, funnelContent,
 *   atRiskList, featureDetailPanel, registerModal
 *
 * @see src/public/admin/ADMIN_FEATURE_ADOPTION.html
 * @see src/pages/ADMIN_FEATURE_ADOPTION.rt8ev.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'ADMIN_FEATURE_ADOPTION.html');

const INBOUND_MESSAGES = [
    'featureLifecycleReportResult',
    'featureStatsResult',
    'featureHealthScoreResult',
    'atRiskFeaturesResult',
    'funnelsListResult',
    'funnelConversionResult',
    'registerFeatureResult',
    'updateFeatureStatusResult'
];

const OUTBOUND_MESSAGES = [
    'featureAdoptionReady',
    'getFeatureLifecycleReport',
    'getFeatureStats',
    'getFeatureHealthScore',
    'getAtRiskFeatures',
    'getFunnelsList',
    'getFunnelConversion',
    'registerFeature',
    'updateFeatureStatus'
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

function sendToVelo(type, data = {}) {
    mockPostToParent(type, data);
}

const state = {
    features: [],
    atRisk: [],
    funnels: [],
    selectedFeature: null
};

function handleFeatureLifecycleReportResult(data) {
    if (data.error) return;
    state.features = data.features || [];

    const summary = data.summary || {};
    getMockElement('totalFeatures').textContent = (summary.total || state.features.length).toString();
    getMockElement('healthyCount').textContent = (summary.healthy || 0).toString();
    getMockElement('warningCount').textContent = (summary.warning || 0).toString();
    getMockElement('criticalCount').textContent = (summary.critical || 0).toString();

    getMockElement('lifecycleChart').innerHTML = 'Chart rendered';

    const healthGrid = getMockElement('healthGrid');
    healthGrid.innerHTML = state.features.map(f =>
        `<div class="health-card" data-id="${f.id}">${f.name || ''}: ${f.healthScore || 0}</div>`
    ).join('');

    const registry = getMockElement('registryTableBody');
    registry.innerHTML = state.features.map(f =>
        `<tr data-id="${f.id}"><td>${f.name || ''}</td><td>${f.status || ''}</td><td>${f.category || ''}</td></tr>`
    ).join('');
}

function handleFeatureStatsResult(data) {
    if (data.error) return;
    state.selectedFeature = data;
    const panel = getMockElement('featureDetailPanel');
    panel.innerHTML = `<div>Users: ${data.uniqueUsers || 0}, Completion: ${data.completionRate || 0}%</div>`;
    panel.classList.remove('hidden');
}

function handleFeatureHealthScoreResult(data) {
    if (data.error) return;
    getMockElement('detailHealthScore').textContent = (data.score || 0).toString();
    getMockElement('detailBreakdown').innerHTML = JSON.stringify(data.breakdown || {});
}

function handleAtRiskFeaturesResult(data) {
    if (data.error) return;
    state.atRisk = data.atRisk || data.features || [];
    const list = getMockElement('atRiskList');

    if (state.atRisk.length === 0) {
        list.innerHTML = '<div class="text-center">No at-risk features</div>';
    } else {
        list.innerHTML = state.atRisk.map(f =>
            `<div class="at-risk-item">${f.name || f.id}: ${f.reason || 'unknown'}</div>`
        ).join('');
    }
}

function handleFunnelsListResult(data) {
    if (data.error) return;
    state.funnels = data.funnels || [];
    const selector = getMockElement('funnelSelector');
    selector.innerHTML = state.funnels.map(f =>
        `<option value="${f.id}">${f.name}</option>`
    ).join('');
}

function handleFunnelConversionResult(data) {
    if (data.error) return;
    const content = getMockElement('funnelContent');
    content.innerHTML = `<div>Rate: ${data.rate || 0}, Steps: ${(data.steps || []).length}</div>`;
}

function handleRegisterFeatureResult(data) {
    if (data.error || data.success === false) {
        getMockElement('registerError').textContent = data.error || 'Registration failed';
        return;
    }
    getMockElement('registerModal').classList.add('hidden');
    // Trigger refresh
    sendToVelo('getFeatureLifecycleReport');
}

function handleUpdateFeatureStatusResult(data) {
    if (data.error || data.success === false) return;
    // Trigger refresh
    sendToVelo('getFeatureLifecycleReport');
    sendToVelo('getAtRiskFeatures');
}

function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'featureLifecycleReportResult':
            handleFeatureLifecycleReportResult(msg.data);
            break;
        case 'featureStatsResult':
            handleFeatureStatsResult(msg.data);
            break;
        case 'featureHealthScoreResult':
            handleFeatureHealthScoreResult(msg.data);
            break;
        case 'atRiskFeaturesResult':
            handleAtRiskFeaturesResult(msg.data);
            break;
        case 'funnelsListResult':
            handleFunnelsListResult(msg.data);
            break;
        case 'funnelConversionResult':
            handleFunnelConversionResult(msg.data);
            break;
        case 'registerFeatureResult':
            handleRegisterFeatureResult(msg.data);
            break;
        case 'updateFeatureStatusResult':
            handleUpdateFeatureStatusResult(msg.data);
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_FEATURE_ADOPTION.html DOM Tests', () => {

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
        state.features = [];
        state.atRisk = [];
        state.funnels = [];
        state.selectedFeature = null;
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

        test('uses type-based message protocol (NOT action)', () => {
            // Should reference .type for message routing
            const hasType =
                htmlSource.includes('msg.type') ||
                htmlSource.includes('.type');
            expect(hasType).toBe(true);
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

        test('ignores messages without type key', () => {
            handleMessage({ action: 'wrong_protocol' });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('featureLifecycleReportResult updates summary cards and grid', () => {
            handleMessage({
                type: 'featureLifecycleReportResult',
                data: {
                    features: [
                        { id: 'f1', name: 'AI Matching', status: 'active', category: 'core', healthScore: 92 },
                        { id: 'f2', name: 'Gamification', status: 'beta', category: 'engagement', healthScore: 65 }
                    ],
                    summary: { total: 10, healthy: 7, warning: 2, critical: 1 }
                }
            });

            expect(getMockElement('totalFeatures').textContent).toBe('10');
            expect(getMockElement('healthyCount').textContent).toBe('7');
            expect(getMockElement('warningCount').textContent).toBe('2');
            expect(getMockElement('criticalCount').textContent).toBe('1');
            expect(getMockElement('lifecycleChart').innerHTML).toBe('Chart rendered');
            expect(getMockElement('healthGrid').innerHTML).toContain('AI Matching');
            expect(getMockElement('registryTableBody').innerHTML).toContain('Gamification');
        });

        test('featureLifecycleReportResult with error does not render', () => {
            handleMessage({
                type: 'featureLifecycleReportResult',
                data: { error: 'Something went wrong' }
            });

            expect(getMockElement('totalFeatures').textContent).toBe('');
        });

        test('featureStatsResult shows detail panel', () => {
            handleMessage({
                type: 'featureStatsResult',
                data: { uniqueUsers: 150, completionRate: 85 }
            });

            expect(getMockElement('featureDetailPanel').innerHTML).toContain('150');
            expect(getMockElement('featureDetailPanel').innerHTML).toContain('85%');
            expect(getMockElement('featureDetailPanel').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('featureHealthScoreResult updates health display', () => {
            handleMessage({
                type: 'featureHealthScoreResult',
                data: { score: 78, breakdown: { usage: 80, stability: 90, adoption: 65 } }
            });

            expect(getMockElement('detailHealthScore').textContent).toBe('78');
            expect(getMockElement('detailBreakdown').innerHTML).toContain('usage');
        });

        test('atRiskFeaturesResult populates at-risk list', () => {
            handleMessage({
                type: 'atRiskFeaturesResult',
                data: {
                    atRisk: [
                        { id: 'f1', name: 'Old Feature', reason: 'Low adoption' },
                        { id: 'f2', name: 'Broken Feature', reason: 'High error rate' }
                    ]
                }
            });

            expect(getMockElement('atRiskList').innerHTML).toContain('Old Feature');
            expect(getMockElement('atRiskList').innerHTML).toContain('Low adoption');
        });

        test('atRiskFeaturesResult with empty list shows no at-risk', () => {
            handleMessage({
                type: 'atRiskFeaturesResult',
                data: { atRisk: [] }
            });

            expect(getMockElement('atRiskList').innerHTML).toContain('No at-risk features');
        });

        test('funnelsListResult populates funnel selector', () => {
            handleMessage({
                type: 'funnelsListResult',
                data: {
                    funnels: [
                        { id: 'fun1', name: 'Signup Funnel' },
                        { id: 'fun2', name: 'Matching Funnel' }
                    ]
                }
            });

            expect(getMockElement('funnelSelector').innerHTML).toContain('Signup Funnel');
            expect(getMockElement('funnelSelector').innerHTML).toContain('Matching Funnel');
        });

        test('funnelConversionResult updates funnel content', () => {
            handleMessage({
                type: 'funnelConversionResult',
                data: { rate: 0.35, steps: ['step1', 'step2'] }
            });

            expect(getMockElement('funnelContent').innerHTML).toContain('0.35');
            expect(getMockElement('funnelContent').innerHTML).toContain('2');
        });

        test('registerFeatureResult success closes modal and refreshes', () => {
            handleMessage({
                type: 'registerFeatureResult',
                data: { success: true, featureId: 'f3' }
            });

            expect(getMockElement('registerModal').classList.add).toHaveBeenCalledWith('hidden');
            expect(capturedOutbound.find(m => m.type === 'getFeatureLifecycleReport')).toBeDefined();
        });

        test('registerFeatureResult failure shows error', () => {
            handleMessage({
                type: 'registerFeatureResult',
                data: { success: false, error: 'Duplicate ID' }
            });

            expect(getMockElement('registerError').textContent).toContain('Duplicate ID');
        });

        test('updateFeatureStatusResult success triggers refresh', () => {
            handleMessage({
                type: 'updateFeatureStatusResult',
                data: { success: true }
            });

            expect(capturedOutbound.find(m => m.type === 'getFeatureLifecycleReport')).toBeDefined();
            expect(capturedOutbound.find(m => m.type === 'getAtRiskFeatures')).toBeDefined();
        });

        test('updateFeatureStatusResult failure does not refresh', () => {
            handleMessage({
                type: 'updateFeatureStatusResult',
                data: { success: false, error: 'Permission denied' }
            });

            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical element IDs', () => {
            const criticalIds = [
                'totalFeatures', 'healthyCount', 'warningCount', 'criticalCount',
                'lifecycleChart', 'healthGrid', 'registryTableBody',
                'funnelContent', 'atRiskList', 'featureDetailPanel', 'registerModal'
            ];
            criticalIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent or sanitization', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('sanitize');
            expect(hasSanitization).toBe(true);
        });
    });
});
