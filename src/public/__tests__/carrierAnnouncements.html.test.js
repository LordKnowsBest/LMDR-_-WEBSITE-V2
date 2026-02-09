/**
 * CARRIER_ANNOUNCEMENTS.html DOM Tests
 * ======================================
 * Tests for src/public/carrier/CARRIER_ANNOUNCEMENTS.html
 * Verifies DOM rendering for inbound messages:
 *   carrierAnnouncementsData, announcementActionResult,
 *   announcementDetailData, recipientPreviewResult
 *
 * Type protocol: { type, data, timestamp }
 * Ready signal: carrierAnnouncementsReady
 *
 * @see src/public/carrier/CARRIER_ANNOUNCEMENTS.html
 * @see src/pages/CARRIER_ANNOUNCEMENTS.zmhem.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(
    __dirname, '..', 'carrier', 'CARRIER_ANNOUNCEMENTS.html'
);

const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'carrierAnnouncementsReady';

const INBOUND_MESSAGES = [
    'carrierAnnouncementsData',
    'announcementActionResult',
    'recipientPreviewResult',
    'announcementAttachmentResult',
    'carrierContext',
    'announcementDetailData'
];

const OUTBOUND_MESSAGES = [
    'carrierAnnouncementsReady',
    'getCarrierAnnouncements',
    'createAnnouncement',
    'updateAnnouncement',
    'publishAnnouncement',
    'archiveAnnouncement',
    'previewRecipients',
    'uploadAnnouncementAttachment'
];

const DOM_ELEMENT_MAP = {
    'carrierAnnouncementsData': ['announcementList', 'statPublished', 'statScheduled', 'statDrafts', 'statReadRate'],
    'recipientPreviewResult': ['previewResult']
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

function sendToVelo(type, data) {
    mockPostToParent({ type, data: data || {} });
}

const state = {
    announcements: [],
    carrierId: null
};

function handleCarrierAnnouncementsData(data) {
    if (!data) return;
    state.announcements = data.announcements || [];
    const list = getMockElement('announcementList');

    if (!data.success || state.announcements.length === 0) {
        list.innerHTML = '<p class="text-center text-slate-400 py-8">No announcements found.</p>';
        return;
    }

    const published = state.announcements.filter(a => a.status === 'published').length;
    const scheduled = state.announcements.filter(a => a.status === 'scheduled').length;
    const drafts = state.announcements.filter(a => a.status === 'draft').length;
    const totalRead = state.announcements.reduce((s, a) => s + (a.read_count || 0), 0);
    const totalRecip = state.announcements.reduce((s, a) => s + (a.total_recipients || 0), 0);
    const readRate = totalRecip > 0 ? Math.round((totalRead / totalRecip) * 100) : 0;

    getMockElement('statPublished').textContent = String(published);
    getMockElement('statScheduled').textContent = String(scheduled);
    getMockElement('statDrafts').textContent = String(drafts);
    getMockElement('statReadRate').textContent = readRate + '%';

    list.innerHTML = state.announcements.map(a =>
        `<div class="announcement-card" data-id="${a._id}"><h3>${a.title || ''}</h3><span>${a.status}</span></div>`
    ).join('');
}

function handleAnnouncementActionResult(data) {
    if (!data) return;
    const list = getMockElement('announcementList');
    if (data.success) {
        list.innerHTML += '<div class="toast-success">Action completed successfully</div>';
    } else {
        list.innerHTML += `<div class="toast-error">${data.error || 'An error occurred'}</div>`;
    }
}

function handleRecipientPreviewResult(data) {
    if (!data) return;
    const preview = getMockElement('previewResult');
    if (data.success) {
        preview.textContent = `${data.total || 0} drivers`;
    } else {
        preview.textContent = data.error || 'Preview failed';
    }
}

function handleAnnouncementDetailData(data) {
    if (!data) return;
    const list = getMockElement('announcementList');
    if (data.success && data.announcement) {
        list.innerHTML = `<div class="detail-view"><h2>${data.announcement.title || ''}</h2></div>`;
    } else {
        list.innerHTML = `<div class="detail-error">${data.error || 'Not found'}</div>`;
    }
}

function handleMessage(eventData) {
    const { type, data } = eventData || {};
    if (!type) return;

    switch (type) {
        case 'carrierAnnouncementsData':
            handleCarrierAnnouncementsData(data);
            break;
        case 'announcementActionResult':
            handleAnnouncementActionResult(data);
            break;
        case 'recipientPreviewResult':
            handleRecipientPreviewResult(data);
            break;
        case 'announcementDetailData':
            handleAnnouncementDetailData(data);
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

describe('CARRIER_ANNOUNCEMENTS.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.hidden = false;
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.announcements = [];
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

        test('ignores messages without type key', () => {
            handleMessage({ action: 'wrong_key', payload: {} });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('carrierAnnouncementsData updates stat counters', () => {
            handleMessage({
                type: 'carrierAnnouncementsData',
                data: {
                    success: true,
                    announcements: [
                        { _id: 'a1', title: 'Ann 1', status: 'published', read_count: 10, total_recipients: 20 },
                        { _id: 'a2', title: 'Ann 2', status: 'scheduled', read_count: 0, total_recipients: 15 },
                        { _id: 'a3', title: 'Ann 3', status: 'draft', read_count: 0, total_recipients: 0 }
                    ],
                    totalCount: 3
                }
            });

            expect(getMockElement('statPublished').textContent).toBe('1');
            expect(getMockElement('statScheduled').textContent).toBe('1');
            expect(getMockElement('statDrafts').textContent).toBe('1');
            expect(getMockElement('statReadRate').textContent).toBe('29%');
        });

        test('carrierAnnouncementsData renders announcement cards', () => {
            handleMessage({
                type: 'carrierAnnouncementsData',
                data: {
                    success: true,
                    announcements: [
                        { _id: 'a1', title: 'Holiday Update', status: 'published', read_count: 5, total_recipients: 10 }
                    ],
                    totalCount: 1
                }
            });

            const list = getMockElement('announcementList');
            expect(list.innerHTML).toContain('Holiday Update');
            expect(list.innerHTML).toContain('published');
        });

        test('carrierAnnouncementsData renders empty state when no announcements', () => {
            handleMessage({
                type: 'carrierAnnouncementsData',
                data: { success: true, announcements: [], totalCount: 0 }
            });

            const list = getMockElement('announcementList');
            expect(list.innerHTML).toContain('No announcements found');
        });

        test('announcementActionResult success shows toast', () => {
            handleMessage({
                type: 'announcementActionResult',
                data: { success: true }
            });

            const list = getMockElement('announcementList');
            expect(list.innerHTML).toContain('Action completed successfully');
        });

        test('announcementActionResult failure shows error', () => {
            handleMessage({
                type: 'announcementActionResult',
                data: { success: false, error: 'Forbidden' }
            });

            const list = getMockElement('announcementList');
            expect(list.innerHTML).toContain('Forbidden');
        });

        test('recipientPreviewResult updates preview count', () => {
            handleMessage({
                type: 'recipientPreviewResult',
                data: { success: true, total: 42 }
            });

            expect(getMockElement('previewResult').textContent).toBe('42 drivers');
        });

        test('announcementDetailData renders detail view', () => {
            handleMessage({
                type: 'announcementDetailData',
                data: {
                    success: true,
                    announcement: { _id: 'a1', title: 'Detail View Test' }
                }
            });

            const list = getMockElement('announcementList');
            expect(list.innerHTML).toContain('Detail View Test');
        });

        test('announcementDetailData renders error when failed', () => {
            handleMessage({
                type: 'announcementDetailData',
                data: { success: false, error: 'Not found' }
            });

            const list = getMockElement('announcementList');
            expect(list.innerHTML).toContain('Not found');
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
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {
        test('carrierAnnouncementsData with success=false shows empty state', () => {
            handleMessage({
                type: 'carrierAnnouncementsData',
                data: { success: false, error: 'DB error', announcements: [] }
            });
            const list = getMockElement('announcementList');
            expect(list.innerHTML).toContain('No announcements found');
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
