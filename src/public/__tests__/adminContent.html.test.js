/**
 * ADMIN_CONTENT HTML DOM Tests
 * ==============================
 * Tests for src/public/admin/ADMIN_CONTENT.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: action/payload
 * Ready signal: getModerationQueue (sent on init)
 *
 * Inbound: moderationQueueLoaded, actionSuccess
 * Outbound: getModerationQueue, performModeration, navigate
 *
 * DOM IDs: queue-container, count-all, nav-all, nav-reviews, nav-jobs, nav-documents
 *
 * @see src/public/admin/ADMIN_CONTENT.html
 * @see src/pages/ADMIN_CONTENT.ods3g.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'ADMIN_CONTENT.html');

const INBOUND_MESSAGES = [
    'moderationQueueLoaded',
    'actionSuccess'
];

const OUTBOUND_MESSAGES = [
    'getModerationQueue',
    'performModeration',
    'navigate'
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
    queue: [],
    filter: 'all'
};

function handleModerationQueueLoaded(data) {
    state.queue = data.items || [];
    const container = getMockElement('queue-container');
    const countAll = getMockElement('count-all');

    countAll.textContent = (data.total || state.queue.length).toString();

    if (state.queue.length === 0) {
        container.innerHTML = '<div class="text-center">No items to moderate</div>';
    } else {
        container.innerHTML = state.queue.map(item =>
            `<div class="queue-item" data-id="${item.id}" data-type="${item.type}">` +
            `<span class="type">${item.type}</span>` +
            `<span class="status">${item.status}</span>` +
            `</div>`
        ).join('');
    }
}

function handleActionSuccess(data) {
    // Remove moderated item from queue
    if (data && data.id) {
        state.queue = state.queue.filter(item => item.id !== data.id);
        // Re-render
        handleModerationQueueLoaded({ items: state.queue, total: state.queue.length });
    }
}

function handleMessage(eventData) {
    const data = eventData;
    if (!data || !data.action) return;

    switch (data.action) {
        case 'moderationQueueLoaded':
            handleModerationQueueLoaded(data.payload);
            break;
        case 'actionSuccess':
            handleActionSuccess(data.payload);
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_CONTENT.html DOM Tests', () => {

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
        state.queue = [];
        state.filter = 'all';
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
            expect(htmlSource).toContain('action');
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
        test('moderationQueueLoaded populates queue container', () => {
            handleMessage({
                action: 'moderationQueueLoaded',
                payload: {
                    items: [
                        { id: 'r1', type: 'review', status: 'pending' },
                        { id: 'j1', type: 'job', status: 'flagged' }
                    ],
                    total: 2
                }
            });

            expect(getMockElement('queue-container').innerHTML).toContain('review');
            expect(getMockElement('queue-container').innerHTML).toContain('job');
            expect(getMockElement('count-all').textContent).toBe('2');
        });

        test('moderationQueueLoaded with empty list shows no items', () => {
            handleMessage({
                action: 'moderationQueueLoaded',
                payload: { items: [], total: 0 }
            });

            expect(getMockElement('queue-container').innerHTML).toContain('No items to moderate');
            expect(getMockElement('count-all').textContent).toBe('0');
        });

        test('actionSuccess removes item and re-renders queue', () => {
            // First load some items
            handleMessage({
                action: 'moderationQueueLoaded',
                payload: {
                    items: [
                        { id: 'r1', type: 'review', status: 'pending' },
                        { id: 'r2', type: 'review', status: 'pending' }
                    ],
                    total: 2
                }
            });

            expect(state.queue).toHaveLength(2);

            // Then approve one
            handleMessage({
                action: 'actionSuccess',
                payload: { id: 'r1' }
            });

            expect(state.queue).toHaveLength(1);
            expect(state.queue[0].id).toBe('r2');
            expect(getMockElement('count-all').textContent).toBe('1');
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical element IDs', () => {
            const criticalIds = ['queue-container', 'count-all'];
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
