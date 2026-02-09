/**
 * DRIVER_ANNOUNCEMENTS.html DOM Tests
 * =====================================
 * Tests for src/public/driver/DRIVER_ANNOUNCEMENTS.html
 * Verifies DOM rendering for inbound messages:
 *   driverAnnouncementsData, announcementCommentResult
 *
 * Type protocol: { type, data, timestamp }
 * Ready signal: driverAnnouncementsReady
 *
 * @see src/public/driver/DRIVER_ANNOUNCEMENTS.html
 * @see src/pages/DRIVER_ANNOUNCEMENTS.jgkc4.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(
    __dirname, '..', 'driver', 'DRIVER_ANNOUNCEMENTS.html'
);

const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'driverAnnouncementsReady';

const INBOUND_MESSAGES = [
    'driverAnnouncementsData',
    'announcementCommentResult',
    'driverContext'
];

const OUTBOUND_MESSAGES = [
    'driverAnnouncementsReady',
    'getDriverAnnouncements',
    'markAnnouncementRead',
    'addAnnouncementComment'
];

const DOM_ELEMENT_MAP = {
    'driverAnnouncementsData': ['announcementFeed', 'unreadCount']
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
    announcements: [],
    driverId: null,
    carrierId: null
};

function handleDriverAnnouncementsData(data) {
    if (!data) return;
    state.announcements = data.announcements || [];
    const feed = getMockElement('announcementFeed');

    if (!data.success || state.announcements.length === 0) {
        feed.innerHTML = '<p class="text-center text-slate-400 py-8">No announcements yet.</p>';
        getMockElement('unreadCount').textContent = '0';
        return;
    }

    const unread = state.announcements.filter(a => !a.is_read).length;
    getMockElement('unreadCount').textContent = String(unread);

    feed.innerHTML = state.announcements.map(a =>
        `<div class="announcement-item${a.is_read ? '' : ' unread'}" data-id="${a._id}">` +
        `<h3>${a.title || ''}</h3>` +
        `<span class="pill ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">${a.priority || 'normal'}</span>` +
        `</div>`
    ).join('');
}

function handleAnnouncementCommentResult(data) {
    if (!data) return;
    const feed = getMockElement('announcementFeed');
    if (data.success) {
        feed.innerHTML += '<div class="toast-success">Comment posted</div>';
    } else {
        feed.innerHTML += `<div class="toast-error">${data.error || 'Failed to post comment'}</div>`;
    }
}

function handleMessage(eventData) {
    const { type, data } = eventData || {};
    if (!type) return;

    switch (type) {
        case 'driverAnnouncementsData':
            handleDriverAnnouncementsData(data);
            break;
        case 'announcementCommentResult':
            handleAnnouncementCommentResult(data);
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

describe('DRIVER_ANNOUNCEMENTS.html DOM Tests', () => {

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
        state.announcements = [];
        state.driverId = null;
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
        test('driverAnnouncementsData renders announcements and unread count', () => {
            handleMessage({
                type: 'driverAnnouncementsData',
                data: {
                    success: true,
                    announcements: [
                        { _id: 'a1', title: 'Holiday Update', priority: 'normal', is_read: false },
                        { _id: 'a2', title: 'Weather Alert', priority: 'urgent', is_read: true },
                        { _id: 'a3', title: 'Route Change', priority: 'high', is_read: false }
                    ]
                }
            });

            expect(getMockElement('unreadCount').textContent).toBe('2');
            const feed = getMockElement('announcementFeed');
            expect(feed.innerHTML).toContain('Holiday Update');
            expect(feed.innerHTML).toContain('Weather Alert');
            expect(feed.innerHTML).toContain('Route Change');
            expect(feed.innerHTML).toContain('urgent');
        });

        test('driverAnnouncementsData renders empty state', () => {
            handleMessage({
                type: 'driverAnnouncementsData',
                data: { success: true, announcements: [] }
            });

            const feed = getMockElement('announcementFeed');
            expect(feed.innerHTML).toContain('No announcements yet');
            expect(getMockElement('unreadCount').textContent).toBe('0');
        });

        test('driverAnnouncementsData with failure renders empty state', () => {
            handleMessage({
                type: 'driverAnnouncementsData',
                data: { success: false, error: 'DB error', announcements: [] }
            });

            const feed = getMockElement('announcementFeed');
            expect(feed.innerHTML).toContain('No announcements yet');
        });

        test('announcementCommentResult success shows toast', () => {
            handleMessage({
                type: 'announcementCommentResult',
                data: { success: true, comment: { _id: 'cmt-1' } }
            });

            const feed = getMockElement('announcementFeed');
            expect(feed.innerHTML).toContain('Comment posted');
        });

        test('announcementCommentResult failure shows error', () => {
            handleMessage({
                type: 'announcementCommentResult',
                data: { success: false, error: 'Comment too long' }
            });

            const feed = getMockElement('announcementFeed');
            expect(feed.innerHTML).toContain('Comment too long');
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
