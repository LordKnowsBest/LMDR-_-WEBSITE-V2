/**
 * ADMIN_CARRIERS Page Code Tests
 *
 * Tests for src/pages/ADMIN_CARRIERS.qa2w1.js
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
    __dirname, '..', '..', 'pages', 'ADMIN_CARRIERS.qa2w1.js'
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

const mockWixLocation = { to: jest.fn() };

const mockBackend = {
    getCarriersList: jest.fn().mockResolvedValue({
        carriers: [{ id: 'c1', name: 'Test Carrier', dot: '123456' }],
        totalCount: 1,
        currentPage: 1,
        pageSize: 25
    }),
    getCarrierDetail: jest.fn().mockResolvedValue({
        id: 'c1',
        name: 'Test Carrier',
        dotNumber: '123456',
        status: 'active'
    }),
    updateCarrierStatus: jest.fn().mockResolvedValue({ success: true }),
    flagCarrier: jest.fn().mockResolvedValue({ success: true }),
    unflagCarrier: jest.fn().mockResolvedValue({ success: true }),
    refreshCarrierEnrichment: jest.fn().mockResolvedValue({ message: 'Enrichment cache refreshed.' }),
    bulkUpdateCarriers: jest.fn().mockResolvedValue({ success: 5, failed: 0 }),
    getCarrierStats: jest.fn().mockResolvedValue({
        totalCarriers: 300,
        activeCarriers: 250,
        flaggedCarriers: 10
    }),
    exportCarriersCSV: jest.fn().mockResolvedValue('id,name,dot\nc1,Test Carrier,123456')
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

function sendMessage(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (err) {
        // silently fail
    }
}

function discoverHtmlComponents($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                found.push(el);
            }
        } catch (_err) {
            // skip
        }
    }
    return found;
}

async function routeMessage(component, message, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!message || !message.action) return;

    switch (message.action) {
        case 'getCarriers':
            await handleGetCarriers(component, message, backend);
            break;

        case 'getStats':
            await handleGetStats(component, backend);
            break;

        case 'getCarrierDetail':
            await handleGetCarrierDetail(component, message, backend);
            break;

        case 'updateStatus':
            await handleUpdateStatus(component, message, backend);
            break;

        case 'flagCarrier':
            await handleFlagCarrier(component, message, backend);
            break;

        case 'unflagCarrier':
            await handleUnflagCarrier(component, message, backend);
            break;

        case 'refreshEnrichment':
            await handleRefreshEnrichment(component, message, backend);
            break;

        case 'bulkActivate':
            await handleBulkAction(component, message.carrierIds, 'activate', backend);
            break;

        case 'bulkFlag':
            await handleBulkAction(component, message.carrierIds, 'flag', backend);
            break;

        case 'exportCarriers':
            await handleExport(component, message, backend);
            break;

        case 'viewFMCSA':
            handleViewFMCSA(message, wixLocation);
            break;

        case 'openAddCarrierModal':
            // Future placeholder - no action
            break;

        default:
            break;
    }
}

async function handleGetCarriers(component, message, backend) {
    try {
        const result = await backend.getCarriersList({
            filters: message.filters || {},
            page: message.page || 1,
            pageSize: message.pageSize || 25,
            sortField: message.sortField || 'lastUpdated',
            sortDirection: message.sortDirection || 'desc'
        });
        sendMessage(component, {
            action: 'carriersLoaded',
            payload: {
                carriers: result.carriers,
                totalCount: result.totalCount,
                currentPage: result.currentPage,
                pageSize: result.pageSize
            }
        });
    } catch (error) {
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to load carriers. Please try again.'
        });
    }
}

async function handleGetStats(component, backend) {
    try {
        const stats = await backend.getCarrierStats();
        sendMessage(component, { action: 'statsLoaded', payload: stats });
    } catch (error) {
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to load carrier statistics.'
        });
    }
}

async function handleGetCarrierDetail(component, message, backend) {
    try {
        const detail = await backend.getCarrierDetail(message.carrierId);
        sendMessage(component, { action: 'carrierDetail', payload: detail });
    } catch (error) {
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to load carrier details.'
        });
    }
}

async function handleUpdateStatus(component, message, backend) {
    try {
        await backend.updateCarrierStatus(message.carrierId, message.status, message.reason || '');
        sendMessage(component, {
            action: 'actionSuccess',
            message: `Carrier status updated to ${message.status}.`
        });
    } catch (error) {
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to update carrier status.'
        });
    }
}

async function handleFlagCarrier(component, message, backend) {
    try {
        await backend.flagCarrier(message.carrierId, message.reason || 'Flagged via admin panel');
        sendMessage(component, {
            action: 'actionSuccess',
            message: 'Carrier flagged for review.'
        });
    } catch (error) {
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to flag carrier.'
        });
    }
}

async function handleUnflagCarrier(component, message, backend) {
    try {
        await backend.unflagCarrier(message.carrierId);
        sendMessage(component, {
            action: 'actionSuccess',
            message: 'Carrier flag removed.'
        });
    } catch (error) {
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to remove carrier flag.'
        });
    }
}

async function handleRefreshEnrichment(component, message, backend) {
    try {
        const result = await backend.refreshCarrierEnrichment(message.carrierId);
        sendMessage(component, {
            action: 'actionSuccess',
            message: result.message || 'Enrichment cache refreshed.'
        });
    } catch (error) {
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to refresh enrichment.'
        });
    }
}

async function handleBulkAction(component, carrierIds, action, backend) {
    if (!carrierIds || !carrierIds.length) {
        sendMessage(component, {
            action: 'actionError',
            message: 'No carriers selected.'
        });
        return;
    }

    try {
        const result = await backend.bulkUpdateCarriers(carrierIds, action);
        const label = action === 'activate' ? 'activated' : 'flagged';
        sendMessage(component, {
            action: 'actionSuccess',
            message: `${result.success} carrier(s) ${label} successfully.${result.failed ? ` ${result.failed} failed.` : ''}`
        });
    } catch (error) {
        sendMessage(component, {
            action: 'actionError',
            message: `Failed to perform bulk ${action}.`
        });
    }
}

async function handleExport(component, message, backend) {
    try {
        const csv = await backend.exportCarriersCSV(message.filters || {});
        sendMessage(component, {
            action: 'exportReady',
            payload: csv
        });
    } catch (error) {
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to export carriers.'
        });
    }
}

function handleViewFMCSA(message, wixLocation) {
    if (message.dotNumber) {
        wixLocation.to(`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${message.dotNumber}`);
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_CARRIERS Page Code', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/carrierAdminService', () => {
            expect(sourceCode).toContain("from 'backend/carrierAdminService'");
        });

        test('imports wixLocation', () => {
            expect(sourceCode).toContain("import wixLocation from 'wix-location'");
        });

        test('imports expected backend functions', () => {
            expect(sourceCode).toContain('getCarriersList');
            expect(sourceCode).toContain('getCarrierDetail');
            expect(sourceCode).toContain('updateCarrierStatus');
            expect(sourceCode).toContain('flagCarrier');
            expect(sourceCode).toContain('unflagCarrier');
            expect(sourceCode).toContain('refreshCarrierEnrichment');
            expect(sourceCode).toContain('bulkUpdateCarriers');
            expect(sourceCode).toContain('getCarrierStats');
            expect(sourceCode).toContain('exportCarriersCSV');
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS array', () => {
            expect(sourceCode).toContain('HTML_COMPONENT_IDS');
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w calls in discoverHtmlComponents are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/function discoverHtmlComponents/);
            const fnMatch = sourceCode.match(/function discoverHtmlComponents[\s\S]*?^}/m);
            expect(fnMatch).not.toBeNull();
            expect(fnMatch[0]).toContain('try');
            expect(fnMatch[0]).toContain('catch');
        });

        test('sendMessage utility checks component exists and has postMessage', () => {
            expect(sourceCode).toContain('function sendMessage(component, data)');
            expect(sourceCode).toMatch(/if\s*\(component\s*&&\s*typeof component\.postMessage\s*===\s*'function'\)/);
        });

        test('sendMessage is wrapped in try-catch', () => {
            const fnMatch = sourceCode.match(/function sendMessage[\s\S]*?^}/m);
            expect(fnMatch).not.toBeNull();
            expect(fnMatch[0]).toContain('try');
            expect(fnMatch[0]).toContain('catch');
        });

        test('onReady checks for empty components array', () => {
            expect(sourceCode).toMatch(/if\s*\(!components\.length\)/);
        });

        test('routeMessage guards against missing message or action', () => {
            expect(sourceCode).toMatch(/if\s*\(!message\s*\|\|\s*!message\.action\)\s*return/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds all components with onMessage method', () => {
            const comps = [createMockComponent(), createMockComponent()];
            let idx = 0;
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return comps[0];
                if (id === '#html2') return comps[1];
                throw new Error('not found');
            });
            const result = discoverHtmlComponents(mock$w);
            expect(result).toHaveLength(2);
            expect(result[0]).toBe(comps[0]);
            expect(result[1]).toBe(comps[1]);
        });

        test('returns empty array when no components exist', () => {
            const mock$w = jest.fn(() => { throw new Error('not found'); });
            const result = discoverHtmlComponents(mock$w);
            expect(result).toHaveLength(0);
        });

        test('skips elements without onMessage', () => {
            const mock$w = jest.fn(() => ({ postMessage: jest.fn() }));
            const result = discoverHtmlComponents(mock$w);
            expect(result).toHaveLength(0);
        });

        test('skips null elements', () => {
            const mock$w = jest.fn(() => null);
            const result = discoverHtmlComponents(mock$w);
            expect(result).toHaveLength(0);
        });

        test('tries all six candidate IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            discoverHtmlComponents(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html5');
            expect(mock$w).toHaveBeenCalledWith('#htmlEmbed1');
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
            await routeMessage(component, { filters: {} });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('getCarriers calls getCarriersList with defaults and sends carriersLoaded', async () => {
            await routeMessage(component, { action: 'getCarriers' });
            expect(mockBackend.getCarriersList).toHaveBeenCalledWith({
                filters: {},
                page: 1,
                pageSize: 25,
                sortField: 'lastUpdated',
                sortDirection: 'desc'
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'carriersLoaded',
                payload: {
                    carriers: [{ id: 'c1', name: 'Test Carrier', dot: '123456' }],
                    totalCount: 1,
                    currentPage: 1,
                    pageSize: 25
                }
            });
        });

        test('getCarriers passes custom filters, page, sort', async () => {
            await routeMessage(component, {
                action: 'getCarriers',
                filters: { status: 'flagged' },
                page: 2,
                pageSize: 50,
                sortField: 'name',
                sortDirection: 'asc'
            });
            expect(mockBackend.getCarriersList).toHaveBeenCalledWith({
                filters: { status: 'flagged' },
                page: 2,
                pageSize: 50,
                sortField: 'name',
                sortDirection: 'asc'
            });
        });

        test('getStats calls getCarrierStats and sends statsLoaded', async () => {
            await routeMessage(component, { action: 'getStats' });
            expect(mockBackend.getCarrierStats).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'statsLoaded',
                payload: {
                    totalCarriers: 300,
                    activeCarriers: 250,
                    flaggedCarriers: 10
                }
            });
        });

        test('getCarrierDetail calls backend with carrierId', async () => {
            await routeMessage(component, { action: 'getCarrierDetail', carrierId: 'c1' });
            expect(mockBackend.getCarrierDetail).toHaveBeenCalledWith('c1');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'carrierDetail',
                payload: { id: 'c1', name: 'Test Carrier', dotNumber: '123456', status: 'active' }
            });
        });

        test('updateStatus calls updateCarrierStatus and sends actionSuccess', async () => {
            await routeMessage(component, {
                action: 'updateStatus',
                carrierId: 'c1',
                status: 'suspended',
                reason: 'Safety issue'
            });
            expect(mockBackend.updateCarrierStatus).toHaveBeenCalledWith('c1', 'suspended', 'Safety issue');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Carrier status updated to suspended.'
            });
        });

        test('updateStatus defaults reason to empty string', async () => {
            await routeMessage(component, {
                action: 'updateStatus',
                carrierId: 'c1',
                status: 'active'
            });
            expect(mockBackend.updateCarrierStatus).toHaveBeenCalledWith('c1', 'active', '');
        });

        test('flagCarrier calls backend with carrierId and reason', async () => {
            await routeMessage(component, {
                action: 'flagCarrier',
                carrierId: 'c1',
                reason: 'Poor safety record'
            });
            expect(mockBackend.flagCarrier).toHaveBeenCalledWith('c1', 'Poor safety record');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Carrier flagged for review.'
            });
        });

        test('flagCarrier defaults reason', async () => {
            await routeMessage(component, { action: 'flagCarrier', carrierId: 'c1' });
            expect(mockBackend.flagCarrier).toHaveBeenCalledWith('c1', 'Flagged via admin panel');
        });

        test('unflagCarrier calls backend and sends actionSuccess', async () => {
            await routeMessage(component, { action: 'unflagCarrier', carrierId: 'c1' });
            expect(mockBackend.unflagCarrier).toHaveBeenCalledWith('c1');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Carrier flag removed.'
            });
        });

        test('refreshEnrichment calls backend and sends success message', async () => {
            await routeMessage(component, { action: 'refreshEnrichment', carrierId: 'c1' });
            expect(mockBackend.refreshCarrierEnrichment).toHaveBeenCalledWith('c1');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Enrichment cache refreshed.'
            });
        });

        test('refreshEnrichment falls back to default message when result has none', async () => {
            const backend = {
                ...mockBackend,
                refreshCarrierEnrichment: jest.fn().mockResolvedValue({})
            };
            await routeMessage(component, { action: 'refreshEnrichment', carrierId: 'c1' }, backend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Enrichment cache refreshed.'
            });
        });

        test('bulkActivate calls bulkUpdateCarriers with activate', async () => {
            await routeMessage(component, {
                action: 'bulkActivate',
                carrierIds: ['c1', 'c2', 'c3']
            });
            expect(mockBackend.bulkUpdateCarriers).toHaveBeenCalledWith(['c1', 'c2', 'c3'], 'activate');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: '5 carrier(s) activated successfully.'
            });
        });

        test('bulkFlag calls bulkUpdateCarriers with flag', async () => {
            await routeMessage(component, {
                action: 'bulkFlag',
                carrierIds: ['c1', 'c2']
            });
            expect(mockBackend.bulkUpdateCarriers).toHaveBeenCalledWith(['c1', 'c2'], 'flag');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: '5 carrier(s) flagged successfully.'
            });
        });

        test('bulkActivate with empty carrierIds sends error', async () => {
            await routeMessage(component, { action: 'bulkActivate', carrierIds: [] });
            expect(mockBackend.bulkUpdateCarriers).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'No carriers selected.'
            });
        });

        test('bulkFlag with missing carrierIds sends error', async () => {
            await routeMessage(component, { action: 'bulkFlag' });
            expect(mockBackend.bulkUpdateCarriers).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'No carriers selected.'
            });
        });

        test('bulk action includes failed count when failures exist', async () => {
            const partialBackend = {
                ...mockBackend,
                bulkUpdateCarriers: jest.fn().mockResolvedValue({ success: 3, failed: 2 })
            };
            await routeMessage(component, {
                action: 'bulkActivate',
                carrierIds: ['c1', 'c2', 'c3', 'c4', 'c5']
            }, partialBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: '3 carrier(s) activated successfully. 2 failed.'
            });
        });

        test('exportCarriers calls exportCarriersCSV and sends exportReady', async () => {
            await routeMessage(component, {
                action: 'exportCarriers',
                filters: { status: 'active' }
            });
            expect(mockBackend.exportCarriersCSV).toHaveBeenCalledWith({ status: 'active' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'exportReady',
                payload: 'id,name,dot\nc1,Test Carrier,123456'
            });
        });

        test('exportCarriers defaults filters to empty object', async () => {
            await routeMessage(component, { action: 'exportCarriers' });
            expect(mockBackend.exportCarriersCSV).toHaveBeenCalledWith({});
        });

        test('viewFMCSA navigates to FMCSA SAFER site with dotNumber', async () => {
            await routeMessage(component, { action: 'viewFMCSA', dotNumber: '123456' });
            expect(mockWixLocation.to).toHaveBeenCalledWith(
                'https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=123456'
            );
        });

        test('viewFMCSA with no dotNumber does nothing', async () => {
            await routeMessage(component, { action: 'viewFMCSA' });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });

        test('openAddCarrierModal does not send any message', async () => {
            await routeMessage(component, { action: 'openAddCarrierModal' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('unknown action does not send any message', async () => {
            await routeMessage(component, { action: 'someRandomAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getCarriers failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getCarriersList: jest.fn().mockRejectedValue(new Error('DB timeout'))
            };
            await routeMessage(component, { action: 'getCarriers' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to load carriers. Please try again.'
            });
        });

        test('getStats failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getCarrierStats: jest.fn().mockRejectedValue(new Error('Stats unavailable'))
            };
            await routeMessage(component, { action: 'getStats' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to load carrier statistics.'
            });
        });

        test('getCarrierDetail failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getCarrierDetail: jest.fn().mockRejectedValue(new Error('Not found'))
            };
            await routeMessage(component, { action: 'getCarrierDetail', carrierId: 'c999' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to load carrier details.'
            });
        });

        test('updateStatus failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                updateCarrierStatus: jest.fn().mockRejectedValue(new Error('Permission denied'))
            };
            await routeMessage(component, {
                action: 'updateStatus',
                carrierId: 'c1',
                status: 'active'
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to update carrier status.'
            });
        });

        test('flagCarrier failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                flagCarrier: jest.fn().mockRejectedValue(new Error('Flag error'))
            };
            await routeMessage(component, { action: 'flagCarrier', carrierId: 'c1' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to flag carrier.'
            });
        });

        test('unflagCarrier failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                unflagCarrier: jest.fn().mockRejectedValue(new Error('Unflag error'))
            };
            await routeMessage(component, { action: 'unflagCarrier', carrierId: 'c1' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to remove carrier flag.'
            });
        });

        test('refreshEnrichment failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                refreshCarrierEnrichment: jest.fn().mockRejectedValue(new Error('Enrichment timeout'))
            };
            await routeMessage(component, { action: 'refreshEnrichment', carrierId: 'c1' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to refresh enrichment.'
            });
        });

        test('bulkActivate failure sends actionError with activate label', async () => {
            const failBackend = {
                ...mockBackend,
                bulkUpdateCarriers: jest.fn().mockRejectedValue(new Error('Bulk error'))
            };
            await routeMessage(component, {
                action: 'bulkActivate',
                carrierIds: ['c1']
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to perform bulk activate.'
            });
        });

        test('bulkFlag failure sends actionError with flag label', async () => {
            const failBackend = {
                ...mockBackend,
                bulkUpdateCarriers: jest.fn().mockRejectedValue(new Error('Bulk error'))
            };
            await routeMessage(component, {
                action: 'bulkFlag',
                carrierIds: ['c1']
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to perform bulk flag.'
            });
        });

        test('exportCarriers failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                exportCarriersCSV: jest.fn().mockRejectedValue(new Error('Export timeout'))
            };
            await routeMessage(component, { action: 'exportCarriers' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to export carriers.'
            });
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('sendMessage utility', () => {
        test('does nothing if component is null', () => {
            expect(() => sendMessage(null, { action: 'test' })).not.toThrow();
        });

        test('does nothing if component lacks postMessage', () => {
            expect(() => sendMessage({}, { action: 'test' })).not.toThrow();
        });

        test('calls postMessage when component is valid', () => {
            sendMessage(component, { action: 'test', payload: 42 });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'test', payload: 42 });
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => sendMessage(throwingComponent, { action: 'test' })).not.toThrow();
        });
    });

    // =========================================================================
    // BACKEND SERVICE MOCK VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getCarriersList receives properly shaped options', async () => {
            await routeMessage(component, {
                action: 'getCarriers',
                filters: { state: 'TX' },
                page: 5,
                pageSize: 10,
                sortField: 'safetyScore',
                sortDirection: 'asc'
            });
            expect(mockBackend.getCarriersList).toHaveBeenCalledTimes(1);
            expect(mockBackend.getCarriersList).toHaveBeenCalledWith({
                filters: { state: 'TX' },
                page: 5,
                pageSize: 10,
                sortField: 'safetyScore',
                sortDirection: 'asc'
            });
        });

        test('updateCarrierStatus receives carrierId, status, and reason', async () => {
            await routeMessage(component, {
                action: 'updateStatus',
                carrierId: 'c-abc',
                status: 'inactive',
                reason: 'Out of business'
            });
            expect(mockBackend.updateCarrierStatus).toHaveBeenCalledWith('c-abc', 'inactive', 'Out of business');
        });

        test('flagCarrier receives carrierId and reason', async () => {
            await routeMessage(component, {
                action: 'flagCarrier',
                carrierId: 'c-def',
                reason: 'Complaints received'
            });
            expect(mockBackend.flagCarrier).toHaveBeenCalledWith('c-def', 'Complaints received');
        });

        test('unflagCarrier receives only carrierId', async () => {
            await routeMessage(component, { action: 'unflagCarrier', carrierId: 'c-ghi' });
            expect(mockBackend.unflagCarrier).toHaveBeenCalledWith('c-ghi');
        });

        test('refreshCarrierEnrichment receives carrierId', async () => {
            await routeMessage(component, { action: 'refreshEnrichment', carrierId: 'c-jkl' });
            expect(mockBackend.refreshCarrierEnrichment).toHaveBeenCalledWith('c-jkl');
        });

        test('bulkUpdateCarriers receives array and action string', async () => {
            await routeMessage(component, {
                action: 'bulkActivate',
                carrierIds: ['x', 'y', 'z']
            });
            expect(mockBackend.bulkUpdateCarriers).toHaveBeenCalledWith(['x', 'y', 'z'], 'activate');
        });

        test('exportCarriersCSV receives filters', async () => {
            await routeMessage(component, {
                action: 'exportCarriers',
                filters: { flagged: true }
            });
            expect(mockBackend.exportCarriersCSV).toHaveBeenCalledWith({ flagged: true });
        });

        test('getCarrierStats is called with no arguments', async () => {
            await routeMessage(component, { action: 'getStats' });
            expect(mockBackend.getCarrierStats).toHaveBeenCalledWith();
        });

        test('getCarrierDetail is called with carrierId', async () => {
            await routeMessage(component, { action: 'getCarrierDetail', carrierId: 'carrier-999' });
            expect(mockBackend.getCarrierDetail).toHaveBeenCalledWith('carrier-999');
        });
    });
});
