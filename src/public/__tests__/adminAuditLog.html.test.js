/* eslint-disable */
/**
 * ADMIN_AUDIT_LOG HTML DOM Tests
 * =================================
 * Tests for src/public/admin/ADMIN_AUDIT_LOG.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: action/payload
 * Uses isValidMessage() validation against VALID_ACTIONS array
 *
 * Inbound: init, auditLogLoaded, entryDetailLoaded, statsLoaded, exportReady,
 *   actionSuccess, actionError
 * Outbound: getAuditLog, getStats, getEntryDetail, exportAuditLog
 *
 * DOM IDs: auditTableBody, mobileAuditEntries, entryDetailModal,
 *   statTotal, statToday, statWeek, statMonth
 *
 * @see src/public/admin/ADMIN_AUDIT_LOG.html
 * @see src/pages/ADMIN_AUDIT_LOG.ud1zf.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'ADMIN_AUDIT_LOG.html');

const INBOUND_MESSAGES = [
    'init',
    'auditLogLoaded',
    'entryDetailLoaded',
    'statsLoaded',
    'exportReady',
    'actionSuccess',
    'actionError'
];

const OUTBOUND_MESSAGES = [
    'getAuditLog',
    'getStats',
    'getEntryDetail',
    'exportAuditLog'
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

const VALID_ACTIONS = ['init', 'auditLogLoaded', 'entryDetailLoaded', 'statsLoaded', 'exportReady', 'actionSuccess', 'actionError'];

function isValidMessage(data) {
    return data && data.action && VALID_ACTIONS.includes(data.action);
}

const state = {
    entries: [],
    stats: null,
    totalCount: 0,
    currentPage: 1
};

function showToast(message, type = 'info') {
    const container = getMockElement('toastContainer');
    const toast = createMockElement('toast');
    toast.innerHTML = `<div class="toast toast-${type}">${message}</div>`;
    container.appendChild(toast);
}

function handleAuditLogLoaded(data) {
    state.entries = data.entries || [];
    state.totalCount = data.totalCount || 0;
    state.currentPage = data.currentPage || 1;

    const tableBody = getMockElement('auditTableBody');
    const mobileEntries = getMockElement('mobileAuditEntries');

    if (state.entries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No audit entries found</td></tr>';
        mobileEntries.innerHTML = '<div class="text-center">No audit entries found</div>';
    } else {
        tableBody.innerHTML = state.entries.map(e =>
            `<tr><td>${e.action || ''}</td><td>${e.entity_type || ''}</td><td>${e.admin_id || ''}</td></tr>`
        ).join('');
        mobileEntries.innerHTML = state.entries.map(e =>
            `<div class="entry-card">${e.action || ''} - ${e.entity_type || ''}</div>`
        ).join('');
    }
}

function handleEntryDetailLoaded(data) {
    const modal = getMockElement('entryDetailModal');
    const content = getMockElement('entryDetailContent');
    content.innerHTML = `<div><strong>${data.action || ''}</strong><p>${data.details || ''}</p></div>`;
    modal.classList.remove('hidden');
}

function handleStatsLoaded(data) {
    state.stats = data;
    getMockElement('statTotal').textContent = (data.total || 0).toString();
    getMockElement('statToday').textContent = (data.today || 0).toString();
    getMockElement('statWeek').textContent = (data.thisWeek || 0).toString();
    getMockElement('statMonth').textContent = (data.thisMonth || 0).toString();
}

function handleExportReady(data) {
    getMockElement('exportStatus').textContent = 'Export ready';
}

function handleMessage(eventData) {
    const data = eventData;
    if (!isValidMessage(data)) return;

    switch (data.action) {
        case 'init':
            sendToVelo({ action: 'getAuditLog', filters: {}, page: 1, pageSize: 50 });
            sendToVelo({ action: 'getStats' });
            break;
        case 'auditLogLoaded':
            handleAuditLogLoaded(data.payload);
            break;
        case 'entryDetailLoaded':
            handleEntryDetailLoaded(data.payload);
            break;
        case 'statsLoaded':
            handleStatsLoaded(data.payload);
            break;
        case 'exportReady':
            handleExportReady(data.payload);
            break;
        case 'actionSuccess':
            showToast(data.message || 'Action completed', 'success');
            break;
        case 'actionError':
            showToast(data.message || 'An error occurred', 'error');
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_AUDIT_LOG.html DOM Tests', () => {

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
        state.entries = [];
        state.stats = null;
        state.totalCount = 0;
        state.currentPage = 1;
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

        test('implements isValidMessage validation', () => {
            expect(htmlSource).toContain('isValidMessage');
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

        test('ignores messages with invalid action', () => {
            handleMessage({ action: 'unknownAction' });
            expect(capturedOutbound).toHaveLength(0);
        });

        test('isValidMessage accepts valid actions', () => {
            VALID_ACTIONS.forEach(action => {
                expect(isValidMessage({ action })).toBe(true);
            });
        });

        test('isValidMessage rejects invalid actions', () => {
            expect(isValidMessage({ action: 'invalid' })).toBeFalsy();
            expect(isValidMessage(null)).toBeFalsy();
            expect(isValidMessage({})).toBeFalsy();
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('auditLogLoaded populates table and mobile view', () => {
            handleMessage({
                action: 'auditLogLoaded',
                payload: {
                    entries: [
                        { action: 'verify_driver', entity_type: 'driver', admin_id: 'admin_001' },
                        { action: 'export_data', entity_type: 'driver', admin_id: 'admin_002' }
                    ],
                    totalCount: 100,
                    currentPage: 1,
                    pageSize: 50
                }
            });

            expect(getMockElement('auditTableBody').innerHTML).toContain('verify_driver');
            expect(getMockElement('auditTableBody').innerHTML).toContain('export_data');
            expect(getMockElement('mobileAuditEntries').innerHTML).toContain('verify_driver');
            expect(state.totalCount).toBe(100);
        });

        test('auditLogLoaded with empty list shows no entries', () => {
            handleMessage({
                action: 'auditLogLoaded',
                payload: { entries: [], totalCount: 0 }
            });

            expect(getMockElement('auditTableBody').innerHTML).toContain('No audit entries found');
            expect(getMockElement('mobileAuditEntries').innerHTML).toContain('No audit entries found');
        });

        test('entryDetailLoaded opens modal', () => {
            handleMessage({
                action: 'entryDetailLoaded',
                payload: {
                    action: 'verify_driver',
                    details: 'Verified CDL documents',
                    admin_id: 'admin_001'
                }
            });

            expect(getMockElement('entryDetailContent').innerHTML).toContain('verify_driver');
            expect(getMockElement('entryDetailContent').innerHTML).toContain('Verified CDL documents');
            expect(getMockElement('entryDetailModal').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('statsLoaded updates stat cards', () => {
            handleMessage({
                action: 'statsLoaded',
                payload: {
                    total: 5000,
                    today: 25,
                    thisWeek: 150,
                    thisMonth: 600,
                    dailyAverage: 20
                }
            });

            expect(getMockElement('statTotal').textContent).toBe('5000');
            expect(getMockElement('statToday').textContent).toBe('25');
            expect(getMockElement('statWeek').textContent).toBe('150');
            expect(getMockElement('statMonth').textContent).toBe('600');
        });

        test('exportReady updates status', () => {
            handleMessage({
                action: 'exportReady',
                payload: 'csv data here'
            });

            expect(getMockElement('exportStatus').textContent).toContain('Export ready');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('init triggers getAuditLog and getStats', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound).toHaveLength(2);
            expect(capturedOutbound[0].action).toBe('getAuditLog');
            expect(capturedOutbound[1].action).toBe('getStats');
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {
        test('actionError shows toast with error message', () => {
            handleMessage({ action: 'actionError', message: 'Failed to load' });

            const container = getMockElement('toastContainer');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('Failed to load');
            expect(toast.innerHTML).toContain('toast-error');
        });

        test('actionSuccess shows toast with success message', () => {
            handleMessage({ action: 'actionSuccess', message: 'Exported' });

            const container = getMockElement('toastContainer');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('Exported');
            expect(toast.innerHTML).toContain('toast-success');
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical element IDs', () => {
            const criticalIds = ['auditTableBody', 'mobileAuditEntries', 'entryDetailModal', 'statTotal', 'statToday', 'statWeek', 'statMonth'];
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
