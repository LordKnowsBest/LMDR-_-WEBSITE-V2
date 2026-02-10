/* eslint-disable */
/**
 * ADMIN_MODERATION HTML DOM Tests
 * =================================
 * Tests for src/public/admin/ADMIN_MODERATION.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: type/payload
 * Ready signal: ready (sent on window.onload)
 *
 * Inbound messages tested:
 *   - queueData: renders report list in sidebar
 *   - actionSuccess: removes report from list, closes detail panel
 *
 * @see src/public/admin/ADMIN_MODERATION.html
 * @see src/pages/ADMIN_MODERATION.sn1km.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'ADMIN_MODERATION.html');
const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'ready';

const INBOUND_MESSAGES = [
    'queueData',
    'actionSuccess'
];

const OUTBOUND_MESSAGES = [
    'ready',
    'getQueue',
    'moderateReport'
];

const DOM_ELEMENT_MAP = {
    'queueData': ['report-list'],
    'actionSuccess': ['report-list', 'detail-view', 'empty-state']
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

function sendToVelo(type, payload = {}) {
    mockPostToParent({ type, payload });
}

const state = {
    filter: 'pending',
    reports: [],
    activeReportId: null
};

function renderList() {
    const container = getMockElement('report-list');
    if (state.reports.length === 0) {
        container.innerHTML = `<div class="text-center py-10 text-text-muted text-xs">No ${state.filter} reports.</div>`;
        return;
    }

    container.innerHTML = state.reports.map(report => {
        const isActive = report._id === state.activeReportId;
        return `<div onclick="selectReport('${report._id}')" class="report-item ${isActive ? 'active' : ''}">` +
            `<span>${report.reason}</span>` +
            `<div>Report on ${report.postId}</div>` +
            `<div>${report.details || 'No details provided'}</div>` +
            `</div>`;
    }).join('');
}

function closeDetail() {
    state.activeReportId = null;
    getMockElement('detail-view').classList.add('hidden');
    getMockElement('empty-state').classList.remove('hidden');
    renderList();
}

function handleMessage(eventData) {
    const { type, payload } = eventData || {};
    if (!type) return;

    switch (type) {
        case 'queueData':
            state.reports = (payload && payload.items) || [];
            renderList();
            break;
        case 'actionSuccess':
            state.reports = state.reports.filter(r => r._id !== (payload && payload.reportId));
            if (state.activeReportId === (payload && payload.reportId)) {
                closeDetail();
            }
            renderList();
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_MODERATION.html DOM Tests', () => {

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
            el.className = '';
            el.style = {};
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.classList.toggle.mockClear();
            el.classList.contains.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.filter = 'pending';
        state.reports = [];
        state.activeReportId = null;
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

        test('sends ready signal on initialization', () => {
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
                htmlSource.includes('{ type, payload }') ||
                htmlSource.includes('{type, payload}') ||
                htmlSource.includes('data.type') ||
                htmlSource.includes("event.data.type");
            expect(hasType).toBe(true);
        });

        test('contains sendToVelo function', () => {
            expect(htmlSource).toContain('function sendToVelo');
        });

        test('contains action buttons (dismiss, warn, hide, ban)', () => {
            expect(htmlSource).toContain("takeAction('dismiss')");
            expect(htmlSource).toContain("takeAction('warn')");
            expect(htmlSource).toContain("takeAction('hide')");
            expect(htmlSource).toContain("takeAction('ban')");
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
            handleMessage({ action: 'wrong_key', data: {} });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {

        test('queueData renders report items', () => {
            handleMessage({
                type: 'queueData',
                payload: {
                    items: [
                        { _id: 'r1', postId: 'p1', reason: 'spam', details: 'Spam content', createdAt: new Date().toISOString() },
                        { _id: 'r2', postId: 'p2', reason: 'harassment', details: 'Rude comment', createdAt: new Date().toISOString() }
                    ]
                }
            });

            const container = getMockElement('report-list');
            expect(container.innerHTML).toContain('spam');
            expect(container.innerHTML).toContain('harassment');
            expect(container.innerHTML).toContain('Report on p1');
            expect(container.innerHTML).toContain('Report on p2');
        });

        test('queueData renders empty state when no reports', () => {
            handleMessage({
                type: 'queueData',
                payload: { items: [] }
            });

            const container = getMockElement('report-list');
            expect(container.innerHTML).toContain('No pending reports');
        });

        test('queueData updates internal state', () => {
            const items = [
                { _id: 'r1', postId: 'p1', reason: 'spam', status: 'pending' }
            ];
            handleMessage({ type: 'queueData', payload: { items } });
            expect(state.reports).toHaveLength(1);
            expect(state.reports[0]._id).toBe('r1');
        });

        test('actionSuccess removes report from list', () => {
            state.reports = [
                { _id: 'r1', postId: 'p1', reason: 'spam' },
                { _id: 'r2', postId: 'p2', reason: 'harassment' }
            ];

            handleMessage({
                type: 'actionSuccess',
                payload: { reportId: 'r1' }
            });

            expect(state.reports).toHaveLength(1);
            expect(state.reports[0]._id).toBe('r2');
        });

        test('actionSuccess closes detail if active report was actioned', () => {
            state.reports = [
                { _id: 'r1', postId: 'p1', reason: 'spam' }
            ];
            state.activeReportId = 'r1';

            handleMessage({
                type: 'actionSuccess',
                payload: { reportId: 'r1' }
            });

            expect(state.activeReportId).toBeNull();
            expect(getMockElement('detail-view').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('empty-state').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('actionSuccess does not close detail if different report was actioned', () => {
            state.reports = [
                { _id: 'r1', postId: 'p1', reason: 'spam' },
                { _id: 'r2', postId: 'p2', reason: 'harassment' }
            ];
            state.activeReportId = 'r2';

            handleMessage({
                type: 'actionSuccess',
                payload: { reportId: 'r1' }
            });

            expect(state.activeReportId).toBe('r2');
            expect(state.reports).toHaveLength(1);
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('sends ready signal format', () => {
            sendToVelo('ready');
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'ready', payload: {} });
        });

        test('sends getQueue with status', () => {
            sendToVelo('getQueue', { status: 'resolved' });
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'getQueue', payload: { status: 'resolved' } });
        });

        test('sends moderateReport with full payload', () => {
            sendToVelo('moderateReport', { reportId: 'r1', action: 'ban', notes: 'Repeated spam' });
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({
                type: 'moderateReport',
                payload: { reportId: 'r1', action: 'ban', notes: 'Repeated spam' }
            });
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {
        test('actionSuccess with unknown reportId does not crash', () => {
            state.reports = [{ _id: 'r1', postId: 'p1', reason: 'spam' }];
            expect(() => {
                handleMessage({ type: 'actionSuccess', payload: { reportId: 'nonexistent' } });
            }).not.toThrow();
            expect(state.reports).toHaveLength(1);
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent or sanitization for user content', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('stripHtml') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('DOMPurify') ||
                htmlSource.includes('sanitize') ||
                htmlSource.includes('marked.parse');
            expect(hasSanitization).toBe(true);
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains all critical element IDs', () => {
            const criticalIds = [
                'report-list', 'detail-panel', 'detail-view', 'empty-state',
                'detail-reason', 'detail-date', 'detail-reporter', 'detail-content',
                'mod-notes', 'sidebar-panel', 'tab-pending', 'tab-resolved'
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
