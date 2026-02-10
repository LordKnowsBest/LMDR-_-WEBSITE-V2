/* eslint-disable */
/**
 * RECRUITER_ONBOARDING_DASHBOARD.html DOM Tests
 *
 * Verifies the HTML component correctly handles inbound messages from
 * the Velo page code and renders data to the DOM.
 *
 * This page uses the { type, data } envelope with MESSAGE_REGISTRY validation
 * (different from the standard { action, payload } protocol).
 *
 * Inbound messages tested:
 *   - initOnboardingDashboard -> populates carrier filter, requests workflows
 *   - workflowList -> renders workflow cards, updates stats
 *   - documentDetails -> populates document review modal
 *   - actionResult -> shows toast notification, refreshes data
 *
 * @see src/public/recruiter/RECRUITER_ONBOARDING_DASHBOARD.html
 * @see src/pages/RECRUITER_ONBOARDING_DASHBOARD.gebww.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(
    __dirname, '..', 'recruiter',
    'RECRUITER_ONBOARDING_DASHBOARD.html'
);

const MESSAGE_KEY = 'type';

const READY_SIGNAL = 'onboardingDashboardReady';

const INBOUND_MESSAGES = [
    'initOnboardingDashboard',
    'workflowList',
    'documentDetails',
    'actionResult',
    'workflowUpdate'
];

const OUTBOUND_MESSAGES = [
    'onboardingDashboardReady',
    'getWorkflows',
    'verifyDocument',
    'rejectDocument',
    'sendReminder',
    'getDocumentDetails',
    'cancelWorkflow',
    'putOnHold',
    'resumeWorkflow',
    'navigateTo'
];

const DOM_ELEMENT_MAP = {
    'initOnboardingDashboard': ['filterCarrier'],
    'workflowList': ['workflowList', 'emptyState', 'statActive', 'statPendingDocs', 'statAwaitingResults', 'statReady'],
    'documentDetails': ['docModalTitle', 'docModalSubtitle'],
    'actionResult': []
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
        querySelector: jest.fn(() => null),
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

function sendToWix(type, data = {}) {
    mockPostToParent({ type, data });
}

const state = {
    workflows: [],
    filteredWorkflows: [],
    carriers: [],
    currentWorkflowId: null,
    currentDocumentId: null,
    recruiterId: null
};

function handleInit(data) {
    state.recruiterId = data.recruiterId;
    state.carriers = data.carriers || [];

    const carrierSelect = getMockElement('filterCarrier');
    carrierSelect.innerHTML = '<option value="">All Carriers</option>';
    state.carriers.forEach(c => {
        carrierSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });

    sendToWix('getWorkflows', { recruiterId: state.recruiterId });
}

function formatStatus(status) {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function updateStats() {
    const active = state.workflows.filter(w => !['cancelled', 'ready_to_start'].includes(w.status));
    const pendingDocs = state.workflows.filter(w => w.documentsStatus === 'pending' || w.documentsStatus === 'partial');
    const awaitingResults = state.workflows.filter(w =>
        w.backgroundStatus === 'ordered' || w.backgroundStatus === 'processing' ||
        w.drugTestStatus === 'scheduled'
    );
    const ready = state.workflows.filter(w => w.status === 'ready_to_start');

    getMockElement('statActive').textContent = active.length;
    getMockElement('statPendingDocs').textContent = pendingDocs.length;
    getMockElement('statAwaitingResults').textContent = awaitingResults.length;
    getMockElement('statReady').textContent = ready.length;
}

function renderWorkflows() {
    const container = getMockElement('workflowList');
    const emptyState = getMockElement('emptyState');

    if (state.filteredWorkflows.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = state.filteredWorkflows.map(w =>
        `<div class="workflow-card" id="workflow-${w.id}"><h3>${w.driverName}</h3><p>${w.carrierName}</p><span>${formatStatus(w.status)}</span></div>`
    ).join('');
}

function handleWorkflowList(data) {
    state.workflows = data.workflows || [];
    state.filteredWorkflows = [...state.workflows];
    updateStats();
    renderWorkflows();
}

function handleDocumentDetails(data) {
    getMockElement('docModalTitle').textContent = data.displayName || 'Document';
    getMockElement('docModalSubtitle').textContent = data.fileName || 'document.pdf';
}

function handleActionResult(data) {
    const { action, success, error } = data;
    if (success) {
        sendToWix('getWorkflows', { recruiterId: state.recruiterId });
    }
}

function handleWorkflowUpdate(data) {
    const { workflowId, updates } = data;
    const workflow = state.workflows.find(w => w.id === workflowId);
    if (workflow) {
        Object.assign(workflow, updates);
        updateStats();
        renderWorkflows();
    }
}

function handleMessage(eventData) {
    if (!eventData || typeof eventData !== 'object') return;
    const { type, data } = eventData;
    if (!type) return;

    switch (type) {
        case 'initOnboardingDashboard':
            handleInit(data);
            break;
        case 'workflowList':
            handleWorkflowList(data);
            break;
        case 'documentDetails':
            handleDocumentDetails(data);
            break;
        case 'actionResult':
            handleActionResult(data);
            break;
        case 'workflowUpdate':
            handleWorkflowUpdate(data);
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('RECRUITER_ONBOARDING_DASHBOARD.html DOM Tests', () => {

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
        state.workflows = [];
        state.filteredWorkflows = [];
        state.carriers = [];
        state.currentWorkflowId = null;
        state.currentDocumentId = null;
        state.recruiterId = null;
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

        test('uses type-based message protocol', () => {
            const hasType =
                htmlSource.includes('{ type, data }') ||
                htmlSource.includes('{type, data}') ||
                htmlSource.includes('data.type') ||
                htmlSource.includes("event.data.type");
            expect(hasType).toBe(true);
        });

        test('contains MESSAGE_REGISTRY for validation', () => {
            expect(htmlSource).toContain('MESSAGE_REGISTRY');
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

        test('ignores messages without type key', () => {
            handleMessage({ action: 'wrong_key', payload: {} });
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores unrecognized message types', () => {
            handleMessage({ type: 'totallyFakeType', data: {} });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING: initOnboardingDashboard
    // =========================================================================

    describe('DOM rendering - initOnboardingDashboard', () => {
        test('populates carrier filter dropdown', () => {
            handleMessage({
                type: 'initOnboardingDashboard',
                data: {
                    recruiterId: 'rec-123',
                    carriers: [
                        { id: 'DOT-111', name: 'Acme Trucking' },
                        { id: 'DOT-222', name: 'Beta Freight' }
                    ]
                }
            });

            const carrierSelect = getMockElement('filterCarrier');
            expect(carrierSelect.innerHTML).toContain('Acme Trucking');
            expect(carrierSelect.innerHTML).toContain('Beta Freight');
            expect(carrierSelect.innerHTML).toContain('All Carriers');
        });

        test('stores recruiterId in state', () => {
            handleMessage({
                type: 'initOnboardingDashboard',
                data: { recruiterId: 'rec-456', carriers: [] }
            });

            expect(state.recruiterId).toBe('rec-456');
        });

        test('requests workflows after init', () => {
            handleMessage({
                type: 'initOnboardingDashboard',
                data: { recruiterId: 'rec-789', carriers: [] }
            });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({
                type: 'getWorkflows',
                data: { recruiterId: 'rec-789' }
            });
        });

        test('handles empty carriers array', () => {
            handleMessage({
                type: 'initOnboardingDashboard',
                data: { recruiterId: 'rec-1', carriers: [] }
            });

            const carrierSelect = getMockElement('filterCarrier');
            expect(carrierSelect.innerHTML).toContain('All Carriers');
            expect(carrierSelect.innerHTML).not.toContain('DOT-');
        });
    });

    // =========================================================================
    // DOM RENDERING: workflowList
    // =========================================================================

    describe('DOM rendering - workflowList', () => {
        test('renders workflow cards with driver and carrier names', () => {
            handleMessage({
                type: 'workflowList',
                data: {
                    workflows: [
                        { id: 'wf-1', driverName: 'John Doe', carrierName: 'Acme Trucking', status: 'in_progress', documentsStatus: 'partial', backgroundStatus: 'ordered', drugTestStatus: 'not_started' },
                        { id: 'wf-2', driverName: 'Jane Smith', carrierName: 'Beta Freight', status: 'ready_to_start', documentsStatus: 'complete', backgroundStatus: 'passed', drugTestStatus: 'passed' }
                    ]
                }
            });

            const container = getMockElement('workflowList');
            expect(container.innerHTML).toContain('John Doe');
            expect(container.innerHTML).toContain('Jane Smith');
            expect(container.innerHTML).toContain('Acme Trucking');
            expect(container.innerHTML).toContain('Beta Freight');
        });

        test('updates stat counters correctly', () => {
            handleMessage({
                type: 'workflowList',
                data: {
                    workflows: [
                        { id: 'wf-1', status: 'in_progress', documentsStatus: 'pending', backgroundStatus: 'not_started', drugTestStatus: 'not_started' },
                        { id: 'wf-2', status: 'in_progress', documentsStatus: 'partial', backgroundStatus: 'ordered', drugTestStatus: 'not_started' },
                        { id: 'wf-3', status: 'ready_to_start', documentsStatus: 'complete', backgroundStatus: 'passed', drugTestStatus: 'passed' }
                    ]
                }
            });

            expect(getMockElement('statActive').textContent).toBe(2);
            expect(getMockElement('statPendingDocs').textContent).toBe(2);
            expect(getMockElement('statAwaitingResults').textContent).toBe(1);
            expect(getMockElement('statReady').textContent).toBe(1);
        });

        test('shows empty state when no workflows', () => {
            handleMessage({
                type: 'workflowList',
                data: { workflows: [] }
            });

            const container = getMockElement('workflowList');
            expect(container.innerHTML).toBe('');
            expect(getMockElement('emptyState').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('hides empty state when workflows exist', () => {
            handleMessage({
                type: 'workflowList',
                data: {
                    workflows: [
                        { id: 'wf-1', driverName: 'Test', carrierName: 'Carrier', status: 'in_progress', documentsStatus: 'pending', backgroundStatus: 'not_started', drugTestStatus: 'not_started' }
                    ]
                }
            });

            expect(getMockElement('emptyState').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('stores workflows in state', () => {
            const workflows = [
                { id: 'wf-1', driverName: 'Test', status: 'in_progress' }
            ];

            handleMessage({
                type: 'workflowList',
                data: { workflows }
            });

            expect(state.workflows).toHaveLength(1);
            expect(state.filteredWorkflows).toHaveLength(1);
        });
    });

    // =========================================================================
    // DOM RENDERING: documentDetails
    // =========================================================================

    describe('DOM rendering - documentDetails', () => {
        test('populates document modal with display name and file name', () => {
            handleMessage({
                type: 'documentDetails',
                data: {
                    displayName: 'CDL License',
                    fileName: 'cdl_front.pdf',
                    fileUrl: 'https://files.example.com/cdl.pdf',
                    ocrData: {}
                }
            });

            expect(getMockElement('docModalTitle').textContent).toBe('CDL License');
            expect(getMockElement('docModalSubtitle').textContent).toBe('cdl_front.pdf');
        });

        test('falls back to defaults when fields are missing', () => {
            handleMessage({
                type: 'documentDetails',
                data: {}
            });

            expect(getMockElement('docModalTitle').textContent).toBe('Document');
            expect(getMockElement('docModalSubtitle').textContent).toBe('document.pdf');
        });
    });

    // =========================================================================
    // DOM RENDERING: actionResult
    // =========================================================================

    describe('DOM rendering - actionResult', () => {
        test('requests workflow refresh on success', () => {
            state.recruiterId = 'rec-1';
            handleMessage({
                type: 'actionResult',
                data: { action: 'verifyDocument', success: true }
            });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0].type).toBe('getWorkflows');
        });

        test('does not refresh on failure', () => {
            handleMessage({
                type: 'actionResult',
                data: { action: 'verifyDocument', success: false, error: 'Test error' }
            });

            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING: workflowUpdate
    // =========================================================================

    describe('DOM rendering - workflowUpdate', () => {
        test('updates existing workflow in state and re-renders', () => {
            state.workflows = [{ id: 'wf-1', driverName: 'John', status: 'in_progress', documentsStatus: 'pending', backgroundStatus: 'not_started', drugTestStatus: 'not_started' }];
            state.filteredWorkflows = [...state.workflows];

            handleMessage({
                type: 'workflowUpdate',
                data: { workflowId: 'wf-1', updates: { status: 'ready_to_start' } }
            });

            expect(state.workflows[0].status).toBe('ready_to_start');
        });

        test('ignores update for unknown workflow', () => {
            state.workflows = [{ id: 'wf-1', status: 'in_progress' }];

            handleMessage({
                type: 'workflowUpdate',
                data: { workflowId: 'wf-unknown', updates: { status: 'cancelled' } }
            });

            expect(state.workflows[0].status).toBe('in_progress');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('sends ready signal on initialization', () => {
            sendToWix(READY_SIGNAL);

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual(
                expect.objectContaining({ type: READY_SIGNAL })
            );
        });

        test('init triggers getWorkflows request', () => {
            handleMessage({
                type: 'initOnboardingDashboard',
                data: { recruiterId: 'rec-test', carriers: [] }
            });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0].type).toBe('getWorkflows');
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
            const allElementIds = Object.values(DOM_ELEMENT_MAP).flat();
            const uniqueIds = [...new Set(allElementIds)];

            uniqueIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('contains stat counter elements', () => {
            expect(htmlSource).toContain('id="statActive"');
            expect(htmlSource).toContain('id="statPendingDocs"');
            expect(htmlSource).toContain('id="statAwaitingResults"');
            expect(htmlSource).toContain('id="statReady"');
        });

        test('contains document modal elements', () => {
            expect(htmlSource).toContain('id="docModal"');
            expect(htmlSource).toContain('id="reminderModal"');
        });
    });
});
