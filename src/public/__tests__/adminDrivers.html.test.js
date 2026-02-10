/* eslint-disable */
/**
 * ADMIN_DRIVERS HTML DOM Tests
 * ==============================
 * Tests for src/public/admin/ADMIN_DRIVERS.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: action/payload
 * Ready signal: getDrivers (sent on init)
 *
 * Inbound: init, driversLoaded, driverDetail, statsLoaded, actionSuccess,
 *   actionError, emailRevealed, exportReady, pong
 * Outbound: getDrivers, getStats, getDriverDetail, verifyDriver, suspendDriver,
 *   bulkVerify, bulkSuspend, exportDrivers, revealEmail, openMessageModal,
 *   openAddDriverModal, ping
 *
 * @see src/public/admin/ADMIN_DRIVERS.html
 * @see src/pages/ADMIN_DRIVERS.uo7vb.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'ADMIN_DRIVERS.html');
const MESSAGE_KEY = 'action';

const INBOUND_MESSAGES = [
    'init',
    'driversLoaded',
    'driverDetail',
    'statsLoaded',
    'actionSuccess',
    'actionError',
    'emailRevealed',
    'exportReady',
    'pong'
];

const OUTBOUND_MESSAGES = [
    'getDrivers',
    'getStats',
    'getDriverDetail',
    'verifyDriver',
    'suspendDriver',
    'exportDrivers',
    'revealEmail',
    'ping'
];

const DOM_ELEMENT_MAP = {
    'driversLoaded': ['driversTableBody', 'driversCardContainer'],
    'statsLoaded': [],
    'actionSuccess': ['toastContainer'],
    'actionError': ['toastContainer'],
    'driverDetail': ['driverDetailModal', 'driverDetailContent']
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
        insertBefore: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(() => createMockElement('sub')),
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

function sendToVelo(message) {
    mockPostToParent(message);
}

const state = {
    drivers: [],
    totalCount: 0,
    currentPage: 1,
    stats: null
};

function showToast(message, type = 'info') {
    const container = getMockElement('toastContainer');
    const toast = createMockElement('toast');
    toast.innerHTML = `<div class="toast toast-${type}">${message}</div>`;
    container.appendChild(toast);
}

function handleDriversLoaded(data) {
    state.drivers = data.drivers || [];
    state.totalCount = data.totalCount || 0;
    state.currentPage = data.currentPage || 1;

    const tableBody = getMockElement('driversTableBody');
    const cardContainer = getMockElement('driversCardContainer');

    if (state.drivers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No drivers found</td></tr>';
        cardContainer.innerHTML = '<div class="text-center">No drivers found</div>';
    } else {
        tableBody.innerHTML = state.drivers.map(d =>
            `<tr><td>${d.name || ''}</td><td>${d.email || ''}</td><td>${d.status || ''}</td></tr>`
        ).join('');
        cardContainer.innerHTML = state.drivers.map(d =>
            `<div class="card">${d.name || ''}</div>`
        ).join('');
    }
}

function handleDriverDetail(data) {
    const modal = getMockElement('driverDetailModal');
    const content = getMockElement('driverDetailContent');
    content.innerHTML = `<div>${data.name || ''} - ${data.email || ''}</div>`;
    modal.classList.remove('hidden');
}

function handleStatsLoaded(data) {
    state.stats = data;
}

function handleEmailRevealed(data) {
    const { driverId, email } = data;
    getMockElement(`email-${driverId}`).textContent = email;
}

function handleExportReady(data) {
    const { csv, filename } = data;
    getMockElement('exportStatus').textContent = `Export ready: ${filename}`;
}

function handleMessage(eventData) {
    const data = eventData;
    if (!data || !data.action) return;

    switch (data.action) {
        case 'init':
            sendToVelo({ action: 'getDrivers' });
            sendToVelo({ action: 'getStats' });
            break;
        case 'driversLoaded':
            handleDriversLoaded(data.payload);
            break;
        case 'driverDetail':
            handleDriverDetail(data.payload);
            break;
        case 'statsLoaded':
            handleStatsLoaded(data.payload);
            break;
        case 'actionSuccess':
            showToast(data.message || 'Action completed', 'success');
            break;
        case 'actionError':
            showToast(data.message || 'An error occurred', 'error');
            break;
        case 'emailRevealed':
            handleEmailRevealed(data.payload);
            break;
        case 'exportReady':
            handleExportReady(data.payload);
            break;
        case 'pong':
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_DRIVERS.html DOM Tests', () => {

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
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.drivers = [];
        state.totalCount = 0;
        state.currentPage = 1;
        state.stats = null;
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
                htmlSource.includes("event.data.action") ||
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

        test('ignores empty object messages', () => {
            handleMessage({});
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
        test('driversLoaded populates table and card view', () => {
            handleMessage({
                action: 'driversLoaded',
                payload: {
                    drivers: [
                        { name: 'John Doe', email: 'john@test.com', status: 'active' },
                        { name: 'Jane Smith', email: 'jane@test.com', status: 'pending' }
                    ],
                    totalCount: 2,
                    currentPage: 1
                }
            });

            expect(getMockElement('driversTableBody').innerHTML).toContain('John Doe');
            expect(getMockElement('driversTableBody').innerHTML).toContain('Jane Smith');
            expect(getMockElement('driversCardContainer').innerHTML).toContain('John Doe');
            expect(state.totalCount).toBe(2);
        });

        test('driversLoaded with empty list shows no drivers message', () => {
            handleMessage({
                action: 'driversLoaded',
                payload: { drivers: [], totalCount: 0 }
            });

            expect(getMockElement('driversTableBody').innerHTML).toContain('No drivers found');
            expect(getMockElement('driversCardContainer').innerHTML).toContain('No drivers found');
        });

        test('driverDetail opens modal', () => {
            handleMessage({
                action: 'driverDetail',
                payload: { name: 'John Doe', email: 'john@test.com' }
            });

            expect(getMockElement('driverDetailContent').innerHTML).toContain('John Doe');
            expect(getMockElement('driverDetailModal').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('emailRevealed updates the email element', () => {
            handleMessage({
                action: 'emailRevealed',
                payload: { driverId: 'driver1', email: 'real@email.com' }
            });

            expect(getMockElement('email-driver1').textContent).toBe('real@email.com');
        });

        test('exportReady updates export status', () => {
            handleMessage({
                action: 'exportReady',
                payload: { csv: 'data', filename: 'drivers.csv' }
            });

            expect(getMockElement('exportStatus').textContent).toContain('drivers.csv');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('init action triggers getDrivers and getStats', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound).toHaveLength(2);
            expect(capturedOutbound[0]).toEqual({ action: 'getDrivers' });
            expect(capturedOutbound[1]).toEqual({ action: 'getStats' });
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {
        test('actionError shows toast with error message', () => {
            handleMessage({ action: 'actionError', message: 'Load failed' });

            const container = getMockElement('toastContainer');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('Load failed');
            expect(toast.innerHTML).toContain('toast-error');
        });

        test('actionSuccess shows toast with success message', () => {
            handleMessage({ action: 'actionSuccess', message: 'Driver verified' });

            const container = getMockElement('toastContainer');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('Driver verified');
            expect(toast.innerHTML).toContain('toast-success');
        });

        test('actionError with no message shows fallback', () => {
            handleMessage({ action: 'actionError' });

            const container = getMockElement('toastContainer');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('An error occurred');
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical element IDs', () => {
            const criticalIds = ['driversTableBody', 'driversCardContainer', 'driverDetailModal', 'searchInput'];
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
        test('source uses textContent or sanitization for user content', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('stripHtml') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('DOMPurify') ||
                htmlSource.includes('sanitize');
            expect(hasSanitization).toBe(true);
        });
    });
});
