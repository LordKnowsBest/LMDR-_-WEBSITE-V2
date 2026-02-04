/**
 * ADMIN_DRIVERS Page Code Tests
 *
 * Tests for src/pages/ADMIN_DRIVERS.uo7vb.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'ADMIN_DRIVERS.uo7vb.js'
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
    getDriversList: jest.fn().mockResolvedValue({
        drivers: [{ id: 'd1', name: 'Test Driver' }],
        totalCount: 1,
        currentPage: 1
    }),
    getDriverDetail: jest.fn().mockResolvedValue({
        id: 'd1',
        name: 'Test Driver',
        email: 'driver@test.com'
    }),
    getDriverStats: jest.fn().mockResolvedValue({
        totalDrivers: 200,
        activeDrivers: 150,
        verifiedDrivers: 120
    }),
    verifyDriver: jest.fn().mockResolvedValue({ success: true }),
    suspendDriver: jest.fn().mockResolvedValue({ success: true }),
    bulkUpdateDrivers: jest.fn().mockResolvedValue({ success: 5, failed: 0 }),
    exportDriversCSV: jest.fn().mockResolvedValue('id,name\nd1,Test Driver')
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

function findHtmlComponent($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // not present
        }
    }
    return null;
}

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg || !msg.action) return;

    switch (msg.action) {
        case 'ping':
            component.postMessage({ action: 'pong', timestamp: Date.now() });
            break;

        case 'getDrivers':
            await handleGetDrivers(component, msg, backend);
            break;

        case 'getStats':
            await handleGetStats(component, backend);
            break;

        case 'getDriverDetail':
            await handleGetDriverDetail(component, msg, backend);
            break;

        case 'verifyDriver':
            await handleVerifyDriver(component, msg, backend);
            break;

        case 'suspendDriver':
            await handleSuspendDriver(component, msg, backend);
            break;

        case 'bulkVerify':
            await handleBulkAction(component, msg, 'verify', backend);
            break;

        case 'bulkSuspend':
            await handleBulkAction(component, msg, 'suspend', backend);
            break;

        case 'exportDrivers':
            await handleExportDrivers(component, msg, backend);
            break;

        case 'revealEmail':
            await handleRevealEmail(component, msg, backend);
            break;

        case 'openMessageModal':
        case 'openAddDriverModal':
            // Placeholders - no action
            break;

        default:
            break;
    }
}

async function handleGetDrivers(component, msg, backend) {
    try {
        const result = await backend.getDriversList({
            filters: msg.filters || {},
            page: msg.page || 1,
            pageSize: msg.pageSize || 25,
            sortField: msg.sortField || 'lastActive',
            sortDirection: msg.sortDirection || 'desc'
        });
        component.postMessage({
            action: 'driversLoaded',
            payload: {
                drivers: result.drivers,
                totalCount: result.totalCount,
                currentPage: result.currentPage
            }
        });
    } catch (error) {
        component.postMessage({
            action: 'actionError',
            message: 'Failed to load drivers. Please try again.'
        });
    }
}

async function handleGetStats(component, backend) {
    try {
        const stats = await backend.getDriverStats();
        component.postMessage({ action: 'statsLoaded', payload: stats });
    } catch (error) {
        // Stats failure is non-critical in the source
    }
}

async function handleGetDriverDetail(component, msg, backend) {
    try {
        const driver = await backend.getDriverDetail(msg.driverId);
        component.postMessage({ action: 'driverDetail', payload: driver });
    } catch (error) {
        component.postMessage({
            action: 'actionError',
            message: 'Failed to load driver details.'
        });
    }
}

async function handleVerifyDriver(component, msg, backend) {
    try {
        await backend.verifyDriver(msg.driverId);
        component.postMessage({
            action: 'actionSuccess',
            message: 'Driver verified successfully.'
        });
    } catch (error) {
        component.postMessage({
            action: 'actionError',
            message: 'Failed to verify driver.'
        });
    }
}

async function handleSuspendDriver(component, msg, backend) {
    try {
        await backend.suspendDriver(msg.driverId, msg.reason || '');
        component.postMessage({
            action: 'actionSuccess',
            message: 'Driver suspended successfully.'
        });
    } catch (error) {
        component.postMessage({
            action: 'actionError',
            message: 'Failed to suspend driver.'
        });
    }
}

async function handleBulkAction(component, msg, actionType, backend) {
    try {
        const driverIds = msg.driverIds || [];
        if (driverIds.length === 0) {
            component.postMessage({
                action: 'actionError',
                message: 'No drivers selected for bulk action.'
            });
            return;
        }
        const result = await backend.bulkUpdateDrivers(driverIds, actionType);
        const label = actionType === 'verify' ? 'verified' : 'suspended';
        component.postMessage({
            action: 'actionSuccess',
            message: `${result.success} driver(s) ${label} successfully.${result.failed > 0 ? ` ${result.failed} failed.` : ''}`
        });
    } catch (error) {
        component.postMessage({
            action: 'actionError',
            message: `Bulk ${actionType} failed. Please try again.`
        });
    }
}

async function handleExportDrivers(component, msg, backend) {
    try {
        const csv = await backend.exportDriversCSV(msg.filters || {});
        component.postMessage({
            action: 'exportReady',
            payload: {
                csv: csv,
                filename: `drivers_export_${new Date().toISOString().split('T')[0]}.csv`
            }
        });
    } catch (error) {
        component.postMessage({
            action: 'actionError',
            message: 'Failed to export drivers.'
        });
    }
}

async function handleRevealEmail(component, msg, backend) {
    try {
        const driver = await backend.getDriverDetail(msg.driverId);
        component.postMessage({
            action: 'emailRevealed',
            payload: {
                driverId: msg.driverId,
                email: driver.email || ''
            }
        });
    } catch (error) {
        component.postMessage({
            action: 'actionError',
            message: 'Failed to reveal email.'
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_DRIVERS Page Code', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/admin_service', () => {
            expect(sourceCode).toContain("from 'backend/admin_service'");
        });

        test('imports expected backend functions', () => {
            expect(sourceCode).toContain('getDriversList');
            expect(sourceCode).toContain('getDriverDetail');
            expect(sourceCode).toContain('getDriverStats');
            expect(sourceCode).toContain('verifyDriver');
            expect(sourceCode).toContain('suspendDriver');
            expect(sourceCode).toContain('bulkUpdateDrivers');
            expect(sourceCode).toContain('exportDriversCSV');
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS', () => {
            expect(sourceCode).toContain('HTML_COMPONENT_IDS');
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w calls in findHtmlComponent are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/function findHtmlComponent/);
            // The function body should contain try-catch
            const fnMatch = sourceCode.match(/function findHtmlComponent[\s\S]*?^}/m);
            expect(fnMatch).not.toBeNull();
            expect(fnMatch[0]).toContain('try');
            expect(fnMatch[0]).toContain('catch');
        });

        test('onReady checks for null component before proceeding', () => {
            expect(sourceCode).toMatch(/if\s*\(!component\)/);
        });

        test('component.onMessage check uses typeof', () => {
            expect(sourceCode).toMatch(/typeof\s+el\.onMessage\s*===\s*'function'/);
        });

        test('message handler checks msg.action before routing', () => {
            // In onMessage callback
            expect(sourceCode).toMatch(/if\s*\(!msg\s*\|\|\s*!msg\.action\)\s*return/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('returns first component with onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') throw new Error('not found');
                if (id === '#html2') return createMockComponent();
                throw new Error('not found');
            });
            const comp = findHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
            expect(comp.onMessage).toBeDefined();
        });

        test('returns null when no components found', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const comp = findHtmlComponent(mock$w);
            expect(comp).toBeNull();
        });

        test('skips components without onMessage method', () => {
            const mock$w = jest.fn(() => ({ postMessage: jest.fn() }));
            const comp = findHtmlComponent(mock$w);
            expect(comp).toBeNull();
        });

        test('returns the first valid component and stops', () => {
            const comp1 = createMockComponent();
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return comp1;
                return createMockComponent();
            });
            const result = findHtmlComponent(mock$w);
            expect(result).toBe(comp1);
        });

        test('tries all six IDs when none match', () => {
            const mock$w = jest.fn(() => { throw new Error('nope'); });
            findHtmlComponent(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores null message', async () => {
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ignores message without action', async () => {
            await routeMessage(component, { data: 'something' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ping responds with pong and timestamp', async () => {
            const before = Date.now();
            await routeMessage(component, { action: 'ping' });
            const call = component.postMessage.mock.calls[0][0];
            expect(call.action).toBe('pong');
            expect(call.timestamp).toBeGreaterThanOrEqual(before);
        });

        test('getDrivers calls getDriversList with defaults', async () => {
            await routeMessage(component, { action: 'getDrivers' });
            expect(mockBackend.getDriversList).toHaveBeenCalledWith({
                filters: {},
                page: 1,
                pageSize: 25,
                sortField: 'lastActive',
                sortDirection: 'desc'
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'driversLoaded',
                payload: {
                    drivers: [{ id: 'd1', name: 'Test Driver' }],
                    totalCount: 1,
                    currentPage: 1
                }
            });
        });

        test('getDrivers passes custom filters, page, sort', async () => {
            await routeMessage(component, {
                action: 'getDrivers',
                filters: { status: 'verified' },
                page: 3,
                pageSize: 50,
                sortField: 'name',
                sortDirection: 'asc'
            });
            expect(mockBackend.getDriversList).toHaveBeenCalledWith({
                filters: { status: 'verified' },
                page: 3,
                pageSize: 50,
                sortField: 'name',
                sortDirection: 'asc'
            });
        });

        test('getStats calls getDriverStats and sends statsLoaded', async () => {
            await routeMessage(component, { action: 'getStats' });
            expect(mockBackend.getDriverStats).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'statsLoaded',
                payload: {
                    totalDrivers: 200,
                    activeDrivers: 150,
                    verifiedDrivers: 120
                }
            });
        });

        test('getDriverDetail calls backend with driverId', async () => {
            await routeMessage(component, { action: 'getDriverDetail', driverId: 'd1' });
            expect(mockBackend.getDriverDetail).toHaveBeenCalledWith('d1');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'driverDetail',
                payload: { id: 'd1', name: 'Test Driver', email: 'driver@test.com' }
            });
        });

        test('verifyDriver calls backend and sends actionSuccess', async () => {
            await routeMessage(component, { action: 'verifyDriver', driverId: 'd1' });
            expect(mockBackend.verifyDriver).toHaveBeenCalledWith('d1');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Driver verified successfully.'
            });
        });

        test('suspendDriver calls backend with driverId and reason', async () => {
            await routeMessage(component, {
                action: 'suspendDriver',
                driverId: 'd1',
                reason: 'Policy violation'
            });
            expect(mockBackend.suspendDriver).toHaveBeenCalledWith('d1', 'Policy violation');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Driver suspended successfully.'
            });
        });

        test('suspendDriver defaults reason to empty string', async () => {
            await routeMessage(component, { action: 'suspendDriver', driverId: 'd1' });
            expect(mockBackend.suspendDriver).toHaveBeenCalledWith('d1', '');
        });

        test('bulkVerify calls bulkUpdateDrivers with verify action', async () => {
            await routeMessage(component, {
                action: 'bulkVerify',
                driverIds: ['d1', 'd2', 'd3']
            });
            expect(mockBackend.bulkUpdateDrivers).toHaveBeenCalledWith(['d1', 'd2', 'd3'], 'verify');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: '5 driver(s) verified successfully.'
            });
        });

        test('bulkSuspend calls bulkUpdateDrivers with suspend action', async () => {
            await routeMessage(component, {
                action: 'bulkSuspend',
                driverIds: ['d1', 'd2']
            });
            expect(mockBackend.bulkUpdateDrivers).toHaveBeenCalledWith(['d1', 'd2'], 'suspend');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: '5 driver(s) suspended successfully.'
            });
        });

        test('bulkVerify with empty driverIds sends error', async () => {
            await routeMessage(component, { action: 'bulkVerify', driverIds: [] });
            expect(mockBackend.bulkUpdateDrivers).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'No drivers selected for bulk action.'
            });
        });

        test('bulkVerify with missing driverIds sends error', async () => {
            await routeMessage(component, { action: 'bulkVerify' });
            expect(mockBackend.bulkUpdateDrivers).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'No drivers selected for bulk action.'
            });
        });

        test('bulk action includes failed count in message when failures exist', async () => {
            const partialBackend = {
                ...mockBackend,
                bulkUpdateDrivers: jest.fn().mockResolvedValue({ success: 3, failed: 2 })
            };
            await routeMessage(component, {
                action: 'bulkVerify',
                driverIds: ['d1', 'd2', 'd3', 'd4', 'd5']
            }, partialBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: '3 driver(s) verified successfully. 2 failed.'
            });
        });

        test('exportDrivers calls exportDriversCSV and sends exportReady', async () => {
            await routeMessage(component, { action: 'exportDrivers', filters: { status: 'active' } });
            expect(mockBackend.exportDriversCSV).toHaveBeenCalledWith({ status: 'active' });
            const call = component.postMessage.mock.calls[0][0];
            expect(call.action).toBe('exportReady');
            expect(call.payload.csv).toBe('id,name\nd1,Test Driver');
            expect(call.payload.filename).toMatch(/^drivers_export_\d{4}-\d{2}-\d{2}\.csv$/);
        });

        test('exportDrivers defaults filters to empty object', async () => {
            await routeMessage(component, { action: 'exportDrivers' });
            expect(mockBackend.exportDriversCSV).toHaveBeenCalledWith({});
        });

        test('revealEmail calls getDriverDetail and sends emailRevealed', async () => {
            await routeMessage(component, { action: 'revealEmail', driverId: 'd1' });
            expect(mockBackend.getDriverDetail).toHaveBeenCalledWith('d1');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'emailRevealed',
                payload: {
                    driverId: 'd1',
                    email: 'driver@test.com'
                }
            });
        });

        test('revealEmail sends empty string when driver has no email', async () => {
            const noEmailBackend = {
                ...mockBackend,
                getDriverDetail: jest.fn().mockResolvedValue({ id: 'd2', name: 'No Email' })
            };
            await routeMessage(component, { action: 'revealEmail', driverId: 'd2' }, noEmailBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'emailRevealed',
                payload: { driverId: 'd2', email: '' }
            });
        });

        test('openMessageModal does not send any response', async () => {
            await routeMessage(component, { action: 'openMessageModal', driverId: 'd1' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('openAddDriverModal does not send any response', async () => {
            await routeMessage(component, { action: 'openAddDriverModal' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('unknown action does not send any message', async () => {
            await routeMessage(component, { action: 'unknownAction123' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getDrivers failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getDriversList: jest.fn().mockRejectedValue(new Error('DB error'))
            };
            await routeMessage(component, { action: 'getDrivers' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to load drivers. Please try again.'
            });
        });

        test('getStats failure does not send actionError (non-critical)', async () => {
            const failBackend = {
                ...mockBackend,
                getDriverStats: jest.fn().mockRejectedValue(new Error('Stats unavailable'))
            };
            await routeMessage(component, { action: 'getStats' }, failBackend);
            // The source code swallows stat errors silently
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('getDriverDetail failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getDriverDetail: jest.fn().mockRejectedValue(new Error('Not found'))
            };
            await routeMessage(component, { action: 'getDriverDetail', driverId: 'd999' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to load driver details.'
            });
        });

        test('verifyDriver failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                verifyDriver: jest.fn().mockRejectedValue(new Error('Permission denied'))
            };
            await routeMessage(component, { action: 'verifyDriver', driverId: 'd1' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to verify driver.'
            });
        });

        test('suspendDriver failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                suspendDriver: jest.fn().mockRejectedValue(new Error('Suspend error'))
            };
            await routeMessage(component, { action: 'suspendDriver', driverId: 'd1' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to suspend driver.'
            });
        });

        test('bulkVerify failure sends actionError with verify label', async () => {
            const failBackend = {
                ...mockBackend,
                bulkUpdateDrivers: jest.fn().mockRejectedValue(new Error('Bulk failed'))
            };
            await routeMessage(component, {
                action: 'bulkVerify',
                driverIds: ['d1']
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Bulk verify failed. Please try again.'
            });
        });

        test('bulkSuspend failure sends actionError with suspend label', async () => {
            const failBackend = {
                ...mockBackend,
                bulkUpdateDrivers: jest.fn().mockRejectedValue(new Error('Bulk failed'))
            };
            await routeMessage(component, {
                action: 'bulkSuspend',
                driverIds: ['d1']
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Bulk suspend failed. Please try again.'
            });
        });

        test('exportDrivers failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                exportDriversCSV: jest.fn().mockRejectedValue(new Error('Export timeout'))
            };
            await routeMessage(component, { action: 'exportDrivers' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to export drivers.'
            });
        });

        test('revealEmail failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getDriverDetail: jest.fn().mockRejectedValue(new Error('Access denied'))
            };
            await routeMessage(component, { action: 'revealEmail', driverId: 'd1' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to reveal email.'
            });
        });
    });

    // =========================================================================
    // BACKEND SERVICE MOCK VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getDriversList receives properly shaped options object', async () => {
            await routeMessage(component, {
                action: 'getDrivers',
                filters: { cdlType: 'A' },
                page: 2,
                pageSize: 10,
                sortField: 'name',
                sortDirection: 'asc'
            });
            expect(mockBackend.getDriversList).toHaveBeenCalledTimes(1);
            const args = mockBackend.getDriversList.mock.calls[0][0];
            expect(args).toEqual({
                filters: { cdlType: 'A' },
                page: 2,
                pageSize: 10,
                sortField: 'name',
                sortDirection: 'asc'
            });
        });

        test('verifyDriver is called with only driverId', async () => {
            await routeMessage(component, { action: 'verifyDriver', driverId: 'driver-xyz' });
            expect(mockBackend.verifyDriver).toHaveBeenCalledWith('driver-xyz');
        });

        test('suspendDriver is called with driverId and reason', async () => {
            await routeMessage(component, {
                action: 'suspendDriver',
                driverId: 'driver-xyz',
                reason: 'Fraud'
            });
            expect(mockBackend.suspendDriver).toHaveBeenCalledWith('driver-xyz', 'Fraud');
        });

        test('bulkUpdateDrivers receives array and action type', async () => {
            await routeMessage(component, {
                action: 'bulkVerify',
                driverIds: ['a', 'b', 'c']
            });
            expect(mockBackend.bulkUpdateDrivers).toHaveBeenCalledWith(['a', 'b', 'c'], 'verify');
        });

        test('exportDriversCSV receives filters object', async () => {
            await routeMessage(component, {
                action: 'exportDrivers',
                filters: { state: 'CA', status: 'active' }
            });
            expect(mockBackend.exportDriversCSV).toHaveBeenCalledWith({ state: 'CA', status: 'active' });
        });

        test('revealEmail uses getDriverDetail to fetch full driver', async () => {
            await routeMessage(component, { action: 'revealEmail', driverId: 'd1' });
            expect(mockBackend.getDriverDetail).toHaveBeenCalledWith('d1');
            expect(mockBackend.getDriverDetail).toHaveBeenCalledTimes(1);
        });

        test('getStats calls getDriverStats with no arguments', async () => {
            await routeMessage(component, { action: 'getStats' });
            expect(mockBackend.getDriverStats).toHaveBeenCalledWith();
        });
    });
});
