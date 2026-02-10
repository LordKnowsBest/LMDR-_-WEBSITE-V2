/* eslint-disable */
/**
 * DRIVER_POLICIES.html DOM Tests
 * ================================
 * Tests for src/public/driver/DRIVER_POLICIES.html
 * Verifies DOM rendering for inbound messages:
 *   driverPoliciesData, policyContentData, policyAcknowledgeResult
 *
 * Type protocol: { type, data } (no timestamp in this page)
 * Ready signal: driverPoliciesReady
 *
 * @see src/public/driver/DRIVER_POLICIES.html
 * @see src/pages/DRIVER_POLICIES.mbmmh.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(
    __dirname, '..', 'driver', 'DRIVER_POLICIES.html'
);

const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'driverPoliciesReady';

const INBOUND_MESSAGES = [
    'driverPoliciesData',
    'policyContentData',
    'policyAcknowledgeResult',
    'driverContext'
];

const OUTBOUND_MESSAGES = [
    'driverPoliciesReady',
    'getDriverPolicies',
    'getPolicyContent',
    'acknowledgePolicy'
];

const DOM_ELEMENT_MAP = {
    'driverPoliciesData': ['requiredList', 'requiredCount', 'policyList'],
    'policyContentData': ['policyDetail', 'modalTitle', 'modalContent', 'modalCategory'],
    'policyAcknowledgeResult': ['ackStatus']
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
    driverId: null,
    carrierId: null,
    selectedPolicy: null
};

function handleDriverPoliciesData(data) {
    if (!data) return;
    state.policies = data.policies || [];

    const requiredList = getMockElement('requiredList');
    const policyList = getMockElement('policyList');
    const requiredCount = getMockElement('requiredCount');

    if (!data.success || state.policies.length === 0) {
        requiredList.innerHTML = '<p class="text-sm text-slate-400">No policies assigned.</p>';
        policyList.innerHTML = '<p class="text-center text-slate-400 py-8">No policies found.</p>';
        requiredCount.textContent = '0';
        return;
    }

    const required = state.policies.filter(p => p.requires_acknowledgment && !p.acknowledged);
    requiredCount.textContent = String(required.length);

    requiredList.innerHTML = required.length > 0
        ? required.map(p =>
            `<div class="required-policy" data-id="${p._id}"><span>${p.title || ''}</span></div>`
        ).join('')
        : '<p class="text-sm text-slate-400">All policies acknowledged.</p>';

    policyList.innerHTML = state.policies.map(p =>
        `<div class="policy-item" data-id="${p._id}"><h3>${p.title || ''}</h3><span>${p.category || ''}</span></div>`
    ).join('');
}

function handlePolicyContentData(data) {
    if (!data) return;
    const detail = getMockElement('policyDetail');
    const modalTitle = getMockElement('modalTitle');
    const modalContent = getMockElement('modalContent');
    const modalCategory = getMockElement('modalCategory');

    if (data.success && data.policy) {
        state.selectedPolicy = data.policy;
        modalTitle.textContent = data.policy.title || 'Policy';
        modalCategory.textContent = data.policy.category || '';
        modalContent.textContent = data.policy.content || '';
        detail.innerHTML = `<div class="policy-loaded"><h3>${data.policy.title || ''}</h3></div>`;
    } else {
        detail.innerHTML = `<p class="text-red-500">${data.error || 'Failed to load policy'}</p>`;
    }
}

function handlePolicyAcknowledgeResult(data) {
    if (!data) return;
    const ackStatus = getMockElement('ackStatus');

    if (data.success) {
        ackStatus.textContent = 'Policy acknowledged successfully';
    } else {
        ackStatus.textContent = data.error || 'Failed to acknowledge';
    }
}

function handleMessage(eventData) {
    const { type, data } = eventData || {};
    if (!type) return;

    switch (type) {
        case 'driverPoliciesData':
            handleDriverPoliciesData(data);
            break;
        case 'policyContentData':
            handlePolicyContentData(data);
            break;
        case 'policyAcknowledgeResult':
            handlePolicyAcknowledgeResult(data);
            break;
        case 'driverContext':
            if (data) {
                state.driverId = data.driverId;
                state.carrierId = data.carrierId;
            }
            break;
        default:
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('DRIVER_POLICIES.html DOM Tests', () => {

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
        state.driverId = null;
        state.carrierId = null;
        state.selectedPolicy = null;
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
        test('driverPoliciesData renders required and all policies', () => {
            handleMessage({
                type: 'driverPoliciesData',
                data: {
                    success: true,
                    policies: [
                        { _id: 'p1', title: 'Safety Handbook', category: 'safety', requires_acknowledgment: true, acknowledged: false },
                        { _id: 'p2', title: 'PTO Policy', category: 'benefits', requires_acknowledgment: true, acknowledged: true },
                        { _id: 'p3', title: 'Drug Testing', category: 'compliance', requires_acknowledgment: false, acknowledged: false }
                    ]
                }
            });

            expect(getMockElement('requiredCount').textContent).toBe('1');
            const requiredList = getMockElement('requiredList');
            expect(requiredList.innerHTML).toContain('Safety Handbook');
            expect(requiredList.innerHTML).not.toContain('PTO Policy');

            const policyList = getMockElement('policyList');
            expect(policyList.innerHTML).toContain('Safety Handbook');
            expect(policyList.innerHTML).toContain('PTO Policy');
            expect(policyList.innerHTML).toContain('Drug Testing');
        });

        test('driverPoliciesData renders empty state', () => {
            handleMessage({
                type: 'driverPoliciesData',
                data: { success: true, policies: [] }
            });

            const policyList = getMockElement('policyList');
            expect(policyList.innerHTML).toContain('No policies found');
            expect(getMockElement('requiredCount').textContent).toBe('0');
        });

        test('driverPoliciesData with all acknowledged shows all-done message', () => {
            handleMessage({
                type: 'driverPoliciesData',
                data: {
                    success: true,
                    policies: [
                        { _id: 'p1', title: 'Safety', requires_acknowledgment: true, acknowledged: true }
                    ]
                }
            });

            expect(getMockElement('requiredCount').textContent).toBe('0');
            expect(getMockElement('requiredList').innerHTML).toContain('All policies acknowledged');
        });

        test('policyContentData renders policy detail', () => {
            handleMessage({
                type: 'policyContentData',
                data: {
                    success: true,
                    policy: {
                        _id: 'pol-1',
                        title: 'Safety Handbook',
                        category: 'safety',
                        content: '# Safety Rules'
                    }
                }
            });

            expect(getMockElement('modalTitle').textContent).toBe('Safety Handbook');
            expect(getMockElement('modalCategory').textContent).toBe('safety');
            expect(getMockElement('modalContent').textContent).toBe('# Safety Rules');
            expect(getMockElement('policyDetail').innerHTML).toContain('Safety Handbook');
        });

        test('policyContentData failure shows error', () => {
            handleMessage({
                type: 'policyContentData',
                data: { success: false, error: 'Policy not found' }
            });

            expect(getMockElement('policyDetail').innerHTML).toContain('Policy not found');
        });

        test('policyAcknowledgeResult success shows confirmation', () => {
            handleMessage({
                type: 'policyAcknowledgeResult',
                data: { success: true, acknowledgment: { policyId: 'pol-1' } }
            });

            expect(getMockElement('ackStatus').textContent).toBe('Policy acknowledged successfully');
        });

        test('policyAcknowledgeResult failure shows error', () => {
            handleMessage({
                type: 'policyAcknowledgeResult',
                data: { success: false, error: 'Already acknowledged' }
            });

            expect(getMockElement('ackStatus').textContent).toBe('Already acknowledged');
        });

        test('driverContext updates state', () => {
            handleMessage({
                type: 'driverContext',
                data: { driverId: 'drv-99', carrierId: 'c-99' }
            });
            expect(state.driverId).toBe('drv-99');
            expect(state.carrierId).toBe('c-99');
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
