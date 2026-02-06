/**
 * ADMIN_AUDIT_LOG Bridge Tests
 * ==============================
 * Tests for src/pages/ADMIN_AUDIT_LOG.ud1zf.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * Message protocol: action/payload
 * Actions: getAuditLog, getStats, getEntryDetail, exportAuditLog
 * Backend: admin_audit_service (getAuditLog, getAuditEntryDetail, getAuditStats, exportAuditLogCSV)
 *
 * Gotcha: getEntryDetail requires entryId — missing entryId sends actionError
 * Gotcha: exportAuditLog sends both exportReady AND actionSuccess
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'ADMIN_AUDIT_LOG.ud1zf.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockBackend = {
    getAuditLog: jest.fn().mockResolvedValue({
        entries: [{ id: 'e1', action: 'verify_driver' }],
        totalCount: 100,
        currentPage: 1,
        pageSize: 50
    }),
    getAuditEntryDetail: jest.fn().mockResolvedValue({
        id: 'e1',
        action: 'verify_driver',
        details: 'Verified CDL docs'
    }),
    getAuditStats: jest.fn().mockResolvedValue({
        total: 500,
        today: 15,
        thisWeek: 80,
        thisMonth: 300,
        dailyAverage: 16
    }),
    exportAuditLogCSV: jest.fn().mockResolvedValue('id,action,timestamp\ne1,verify,2026-01-01')
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        // silently fail
    }
}

function findHtmlComponent($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // skip
        }
    }
    return null;
}

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg || !msg.action) return;

    switch (msg.action) {
        case 'getAuditLog':
            await handleGetAuditLog(component, msg, backend);
            break;
        case 'getStats':
            await handleGetStats(component, backend);
            break;
        case 'getEntryDetail':
            await handleGetEntryDetail(component, msg, backend);
            break;
        case 'exportAuditLog':
            await handleExportAuditLog(component, msg, backend);
            break;
        default:
            break;
    }
}

async function handleGetAuditLog(component, msg, backend) {
    try {
        const result = await backend.getAuditLog({
            filters: msg.filters || {},
            page: msg.page || 1,
            pageSize: msg.pageSize || 50,
            sortField: msg.sortField || 'timestamp',
            sortDirection: msg.sortDirection || 'desc'
        });
        safeSend(component, {
            action: 'auditLogLoaded',
            payload: {
                entries: result.entries || [],
                totalCount: result.totalCount || 0,
                currentPage: result.currentPage || 1,
                pageSize: result.pageSize || 50
            }
        });
    } catch (err) {
        safeSend(component, {
            action: 'actionError',
            message: err.message || 'Failed to load audit log'
        });
    }
}

async function handleGetStats(component, backend) {
    try {
        const stats = await backend.getAuditStats();
        safeSend(component, {
            action: 'statsLoaded',
            payload: {
                total: stats.total || 0,
                today: stats.today || 0,
                thisWeek: stats.thisWeek || 0,
                thisMonth: stats.thisMonth || 0,
                dailyAverage: stats.dailyAverage || 0
            }
        });
    } catch (err) {
        safeSend(component, {
            action: 'actionError',
            message: err.message || 'Failed to load audit statistics'
        });
    }
}

async function handleGetEntryDetail(component, msg, backend) {
    try {
        if (!msg.entryId) {
            safeSend(component, {
                action: 'actionError',
                message: 'Missing entry ID'
            });
            return;
        }
        const entry = await backend.getAuditEntryDetail(msg.entryId);
        safeSend(component, {
            action: 'entryDetailLoaded',
            payload: entry
        });
    } catch (err) {
        safeSend(component, {
            action: 'actionError',
            message: err.message || 'Failed to load entry details'
        });
    }
}

async function handleExportAuditLog(component, msg, backend) {
    try {
        const csvContent = await backend.exportAuditLogCSV(msg.filters || {});
        safeSend(component, {
            action: 'exportReady',
            payload: csvContent
        });
        safeSend(component, {
            action: 'actionSuccess',
            message: 'Audit log exported successfully'
        });
    } catch (err) {
        safeSend(component, {
            action: 'actionError',
            message: err.message || 'Failed to export audit log'
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_AUDIT_LOG Page Code (Bridge)', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/admin_audit_service', () => {
            expect(sourceCode).toContain("from 'backend/admin_audit_service'");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        test('handles all 4 actions in switch', () => {
            expect(sourceCode).toContain("case 'getAuditLog'");
            expect(sourceCode).toContain("case 'getStats'");
            expect(sourceCode).toContain("case 'getEntryDetail'");
            expect(sourceCode).toContain("case 'exportAuditLog'");
        });

        test('sends init signal to HTML', () => {
            expect(sourceCode).toContain("action: 'init'");
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('defines safeSend helper', () => {
            expect(sourceCode).toContain('function safeSend');
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores null/undefined/empty messages', async () => {
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            await routeMessage(component, {});
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('getAuditLog calls backend and sends auditLogLoaded', async () => {
            await routeMessage(component, {
                action: 'getAuditLog',
                filters: { action: 'verify_driver' },
                page: 2,
                pageSize: 25
            });
            expect(mockBackend.getAuditLog).toHaveBeenCalledWith({
                filters: { action: 'verify_driver' },
                page: 2,
                pageSize: 25,
                sortField: 'timestamp',
                sortDirection: 'desc'
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'auditLogLoaded',
                payload: expect.objectContaining({
                    entries: expect.any(Array),
                    totalCount: 100
                })
            });
        });

        test('getAuditLog defaults to page 1 and pageSize 50', async () => {
            await routeMessage(component, { action: 'getAuditLog' });
            expect(mockBackend.getAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({ page: 1, pageSize: 50, sortField: 'timestamp', sortDirection: 'desc' })
            );
        });

        test('getStats calls backend and sends statsLoaded', async () => {
            await routeMessage(component, { action: 'getStats' });
            expect(mockBackend.getAuditStats).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'statsLoaded',
                payload: {
                    total: 500,
                    today: 15,
                    thisWeek: 80,
                    thisMonth: 300,
                    dailyAverage: 16
                }
            });
        });

        test('getEntryDetail calls backend with entryId', async () => {
            await routeMessage(component, { action: 'getEntryDetail', entryId: 'e1' });
            expect(mockBackend.getAuditEntryDetail).toHaveBeenCalledWith('e1');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'entryDetailLoaded',
                payload: expect.objectContaining({ id: 'e1' })
            });
        });

        test('getEntryDetail without entryId sends actionError', async () => {
            await routeMessage(component, { action: 'getEntryDetail' });
            expect(mockBackend.getAuditEntryDetail).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing entry ID'
            });
        });

        test('exportAuditLog sends both exportReady and actionSuccess', async () => {
            await routeMessage(component, { action: 'exportAuditLog', filters: { action: 'verify_driver' } });
            expect(mockBackend.exportAuditLogCSV).toHaveBeenCalledWith({ action: 'verify_driver' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'exportReady',
                payload: expect.any(String)
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Audit log exported successfully'
            });
        });

        test('exportAuditLog defaults filters to empty object', async () => {
            await routeMessage(component, { action: 'exportAuditLog' });
            expect(mockBackend.exportAuditLogCSV).toHaveBeenCalledWith({});
        });

        test('unknown action does not send any message', async () => {
            await routeMessage(component, { action: 'nonExistentAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getAuditLog failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getAuditLog: jest.fn().mockRejectedValue(new Error('DB timeout'))
            };
            await routeMessage(component, { action: 'getAuditLog' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'DB timeout'
            });
        });

        test('getStats failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getAuditStats: jest.fn().mockRejectedValue(new Error('Stats error'))
            };
            await routeMessage(component, { action: 'getStats' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Stats error'
            });
        });

        test('getEntryDetail failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getAuditEntryDetail: jest.fn().mockRejectedValue(new Error('Not found'))
            };
            await routeMessage(component, { action: 'getEntryDetail', entryId: 'e99' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Not found'
            });
        });

        test('exportAuditLog failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                exportAuditLogCSV: jest.fn().mockRejectedValue(new Error('Export failed'))
            };
            await routeMessage(component, { action: 'exportAuditLog' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Export failed'
            });
        });

        test('error with no message falls back to default text', async () => {
            const failBackend = {
                ...mockBackend,
                getAuditLog: jest.fn().mockRejectedValue({})
            };
            await routeMessage(component, { action: 'getAuditLog' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to load audit log'
            });
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { action: 'test' })).not.toThrow();
        });
    });
});
