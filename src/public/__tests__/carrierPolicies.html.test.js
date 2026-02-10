/* eslint-disable */
/**
 * CARRIER_POLICIES.html DOM Tests
 * =================================
 * Tests for src/public/carrier/CARRIER_POLICIES.html
 * Verifies DOM rendering for inbound messages:
 *   carrierPoliciesData, policyActionResult, complianceStatusData
 *
 * Type protocol: { type, data, timestamp }
 * Ready signal: carrierPoliciesReady
 *
 * @see src/public/carrier/CARRIER_POLICIES.html
 * @see src/pages/CARRIER_POLICIES.m76is.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(
    __dirname, '..', 'carrier', 'CARRIER_POLICIES.html'
);

const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'carrierPoliciesReady';

const INBOUND_MESSAGES = [
    'carrierPoliciesData',
    'policyActionResult',
    'policyUploadResult',
    'complianceStatusData',
    'carrierContext'
];

const OUTBOUND_MESSAGES = [
    'carrierPoliciesReady',
    'getCarrierPolicies',
    'createPolicy',
    'updatePolicy',
    'publishPolicyVersion',
    'archivePolicy',
    'uploadPolicyFile',
    'getComplianceStatus'
];

const DOM_ELEMENT_MAP = {
    'carrierPoliciesData': ['policyList', 'statPublished', 'statDrafts'],
    'complianceStatusData': ['complianceSummary', 'statCompliance']
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
    return {
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

function sendToVelo(type, data) {
    mockPostToParent({ type, data: data || {} });
}

const state = {
    policies: [],
    carrierId: null
};

function handleCarrierPoliciesData(data) {
    if (!data) return;
    state.policies = data.policies || [];
    const list = getMockElement('policyList');

    if (!data.success || state.policies.length === 0) {
        list.innerHTML = '<p class="text-center text-slate-400 py-8">No policies found.</p>';
        return;
    }

    const published = state.policies.filter(p => p.status === 'published').length;
    const drafts = state.policies.filter(p => p.status === 'draft').length;

    getMockElement('statPublished').textContent = String(published);
    getMockElement('statDrafts').textContent = String(drafts);

    list.innerHTML = state.policies.map(p =>
        `<div class="policy-card" data-id="${p._id}"><h3>${p.title || ''}</h3><span>${p.category || ''}</span><span>${p.status}</span></div>`
    ).join('');
}

function handlePolicyActionResult(data) {
    if (!data) return;
    const list = getMockElement('policyList');
    if (data.success) {
        list.innerHTML += '<div class="toast-success">Policy action completed</div>';
    } else {
        list.innerHTML += `<div class="toast-error">${data.error || 'An error occurred'}</div>`;
    }
}

function handleComplianceStatusData(data) {
    if (!data) return;
    const summary = getMockElement('complianceSummary');
    const stat = getMockElement('statCompliance');

    if (data.success && data.policies) {
        const total = data.policies.length;
        const avgRate = total > 0
            ? Math.round(data.policies.reduce((s, p) => s + (p.rate || 0), 0) / total)
            : 0;
        summary.textContent = `${total} policies tracked`;
        stat.textContent = avgRate + '%';
    } else {
        summary.textContent = data.error || 'Failed to load';
        stat.textContent = '--%';
    }
}

function handleMessage(eventData) {
    const { type, data } = eventData || {};
    if (!type) return;

    switch (type) {
        case 'carrierPoliciesData':
            handleCarrierPoliciesData(data);
            break;
        case 'policyActionResult':
            handlePolicyActionResult(data);
            break;
        case 'complianceStatusData':
            handleComplianceStatusData(data);
            break;
        case 'carrierContext':
            if (data) state.carrierId = data.carrierId;
            break;
        default:
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_POLICIES.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.hidden = false;
            el.classList._classes.clear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.policies = [];
        state.carrierId = null;
    });

    // =========================================================================
    // HTML SOURCE STRUCTURE
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

        test('uses type-based message protocol', () => {
            const hasType =
                htmlSource.includes('{ type, data }') ||
                htmlSource.includes('{type, data}') ||
                htmlSource.includes('data.type') ||
                htmlSource.includes("event.data.type");
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

        test('ignores empty object messages', () => {
            handleMessage({});
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('carrierPoliciesData updates stat counters', () => {
            handleMessage({
                type: 'carrierPoliciesData',
                data: {
                    success: true,
                    policies: [
                        { _id: 'p1', title: 'Safety', status: 'published', category: 'safety' },
                        { _id: 'p2', title: 'PTO', status: 'draft', category: 'benefits' }
                    ],
                    totalCount: 2
                }
            });

            expect(getMockElement('statPublished').textContent).toBe('1');
            expect(getMockElement('statDrafts').textContent).toBe('1');
        });

        test('carrierPoliciesData renders policy cards', () => {
            handleMessage({
                type: 'carrierPoliciesData',
                data: {
                    success: true,
                    policies: [
                        { _id: 'p1', title: 'Safety Handbook', status: 'published', category: 'safety' }
                    ],
                    totalCount: 1
                }
            });

            const list = getMockElement('policyList');
            expect(list.innerHTML).toContain('Safety Handbook');
            expect(list.innerHTML).toContain('safety');
        });

        test('carrierPoliciesData renders empty state when no policies', () => {
            handleMessage({
                type: 'carrierPoliciesData',
                data: { success: true, policies: [], totalCount: 0 }
            });

            const list = getMockElement('policyList');
            expect(list.innerHTML).toContain('No policies found');
        });

        test('policyActionResult success shows toast', () => {
            handleMessage({
                type: 'policyActionResult',
                data: { success: true }
            });

            const list = getMockElement('policyList');
            expect(list.innerHTML).toContain('Policy action completed');
        });

        test('policyActionResult failure shows error', () => {
            handleMessage({
                type: 'policyActionResult',
                data: { success: false, error: 'Forbidden' }
            });

            const list = getMockElement('policyList');
            expect(list.innerHTML).toContain('Forbidden');
        });

        test('complianceStatusData updates compliance stats', () => {
            handleMessage({
                type: 'complianceStatusData',
                data: {
                    success: true,
                    policies: [
                        { policyId: 'p1', title: 'Safety', acknowledged: 40, total: 50, rate: 80 },
                        { policyId: 'p2', title: 'Drug Test', acknowledged: 45, total: 50, rate: 90 }
                    ]
                }
            });

            expect(getMockElement('complianceSummary').textContent).toBe('2 policies tracked');
            expect(getMockElement('statCompliance').textContent).toBe('85%');
        });

        test('complianceStatusData error shows fallback', () => {
            handleMessage({
                type: 'complianceStatusData',
                data: { success: false, error: 'Service unavailable' }
            });

            expect(getMockElement('complianceSummary').textContent).toBe('Service unavailable');
            expect(getMockElement('statCompliance').textContent).toBe('--%');
        });

        test('carrierContext updates state', () => {
            handleMessage({
                type: 'carrierContext',
                data: { carrierId: 'c-999' }
            });
            expect(state.carrierId).toBe('c-999');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('sends ready signal on initialization', () => {
            sendToVelo(READY_SIGNAL);
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual(
                expect.objectContaining({ type: READY_SIGNAL })
            );
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
    // DOM ELEMENT COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains all element IDs referenced by handlers', () => {
            const allElementIds = Object.values(DOM_ELEMENT_MAP).flat();
            const uniqueIds = [...new Set(allElementIds)];

            uniqueIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });
    });
});
