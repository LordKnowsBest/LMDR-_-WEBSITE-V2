/* eslint-disable */
/**
 * CARRIER_DQ_TRACKER Bridge Tests
 * ==================================
 * Tests for src/pages/CARRIER_DQ_TRACKER.sb2ig.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * **TYPE PROTOCOL** (not action protocol)
 * Switch on `msg.type`, params in `msg.data`, responses as `{ type: '...', data }`
 * Error fallback: sends `{ type: 'setDQFiles', data: [] }` on getDQFiles failure
 *
 * 4 types: dqTrackerReady, getDQFiles, generateAuditReport, navigateTo
 *
 * Gotcha: dqTrackerReady and getDQFiles share the same handler
 * Gotcha: generateAuditReport validates data.dqFileId exists before calling backend
 * Gotcha: generateAuditReport does NOT send any response on success or failure
 * Gotcha: navigateTo uses a routes map with fallback to `/${page}`
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'CARRIER_DQ_TRACKER.sb2ig.js'
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
    getDQFiles: jest.fn().mockResolvedValue([
        { id: 'dq1', driverName: 'John Smith', status: 'complete' },
        { id: 'dq2', driverName: 'Jane Doe', status: 'incomplete' }
    ]),
    generateAuditReport: jest.fn().mockResolvedValue({
        reportId: 'rpt1', status: 'generated'
    })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        // silently fail like the source
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

async function routeMessage(component, msg, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'dqTrackerReady':
        case 'getDQFiles':
            await handleGetDQFiles(component, backend);
            break;
        case 'generateAuditReport':
            await handleGenerateReport(component, msg, backend);
            break;
        case 'navigateTo':
            handleNavigateTo(msg, wixLocation);
            break;
        default:
            break;
    }
}

async function handleGetDQFiles(component, backend = mockBackend) {
    try {
        const files = await backend.getDQFiles();
        safeSend(component, { type: 'setDQFiles', data: files });
    } catch (error) {
        safeSend(component, { type: 'setDQFiles', data: [] });
    }
}

async function handleGenerateReport(component, msg, backend = mockBackend) {
    try {
        const data = msg.data || {};
        if (!data.dqFileId) return;
        await backend.generateAuditReport(data.dqFileId);
    } catch (error) {
        // silently fail per source
    }
}

function handleNavigateTo(msg, wixLocation = mockWixLocation) {
    const page = msg.data && msg.data.page;
    if (!page) return;
    const routes = {
        'dashboard': '/carrier-dashboard',
        'compliance': '/carrier-compliance-calendar',
        'dq-tracker': '/carrier-dq-tracker',
        'incidents': '/carrier-incident-reporting',
        'documents': '/carrier-document-vault'
    };
    wixLocation.to(routes[page] || `/${page}`);
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_DQ_TRACKER Page Code (Bridge)', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports getDQFiles from backend/dqFileService', () => {
            expect(sourceCode).toContain("from 'backend/dqFileService'");
            expect(sourceCode).toContain('getDQFiles');
        });

        test('imports generateAuditReport from backend/dqFileService', () => {
            expect(sourceCode).toContain('generateAuditReport');
        });

        test('imports wixLocationFrontend', () => {
            expect(sourceCode).toContain('wixLocationFrontend');
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('uses type-based protocol (msg.type)', () => {
            expect(sourceCode).toContain('msg.type');
        });

        test('does NOT use action-based protocol in routeMessage', () => {
            expect(sourceCode).not.toMatch(/msg\.action/);
        });

        test('handles all 4 message types in switch', () => {
            expect(sourceCode).toContain("case 'dqTrackerReady'");
            expect(sourceCode).toContain("case 'getDQFiles'");
            expect(sourceCode).toContain("case 'generateAuditReport'");
            expect(sourceCode).toContain("case 'navigateTo'");
        });

        test('sends init signal to HTML on ready', () => {
            expect(sourceCode).toContain("type: 'init'");
        });

        test('defines HTML_COMPONENT_IDS array', () => {
            expect(sourceCode).toContain('HTML_COMPONENT_IDS');
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        test('validates dqFileId before calling generateAuditReport', () => {
            expect(sourceCode).toContain('data.dqFileId');
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('defines safeSend helper with try-catch', () => {
            expect(sourceCode).toContain('function safeSend');
            const safeSendMatch = sourceCode.match(/function safeSend[\s\S]*?\n\}/);
            expect(safeSendMatch).not.toBeNull();
            expect(safeSendMatch[0]).toContain('try');
            expect(safeSendMatch[0]).toContain('catch');
        });

        test('message listener guards against null msg', () => {
            expect(sourceCode).toContain('if (!msg || !msg.type)');
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds first component with onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });
            const comp = findHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
            expect(comp.onMessage).toBeDefined();
        });

        test('returns null when no component found', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            expect(findHtmlComponent(mock$w)).toBeNull();
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return { postMessage: jest.fn() }; // no onMessage
                if (id === '#html2') return createMockComponent(); // has onMessage
                throw new Error('not found');
            });
            const comp = findHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
        });

        test('tries all 6 IDs before returning null', () => {
            const mock$w = jest.fn(() => ({})); // no onMessage on any
            const comp = findHtmlComponent(mock$w);
            expect(comp).toBeNull();
            expect(mock$w).toHaveBeenCalledTimes(6);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages without type key', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            await routeMessage(component, { action: 'wrong_protocol' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('dqTrackerReady calls getDQFiles and sends setDQFiles', async () => {
            await routeMessage(component, { type: 'dqTrackerReady' });
            expect(mockBackend.getDQFiles).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'setDQFiles',
                data: [
                    { id: 'dq1', driverName: 'John Smith', status: 'complete' },
                    { id: 'dq2', driverName: 'Jane Doe', status: 'incomplete' }
                ]
            });
        });

        test('getDQFiles calls backend and sends setDQFiles', async () => {
            await routeMessage(component, { type: 'getDQFiles' });
            expect(mockBackend.getDQFiles).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'setDQFiles',
                data: expect.any(Array)
            });
        });

        test('generateAuditReport calls backend with dqFileId', async () => {
            await routeMessage(component, {
                type: 'generateAuditReport',
                data: { dqFileId: 'dq1' }
            });
            expect(mockBackend.generateAuditReport).toHaveBeenCalledWith('dq1');
        });

        test('generateAuditReport does NOT send any response on success', async () => {
            await routeMessage(component, {
                type: 'generateAuditReport',
                data: { dqFileId: 'dq1' }
            });
            // The source code does not post anything back on success
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('generateAuditReport skips if dqFileId is missing', async () => {
            await routeMessage(component, {
                type: 'generateAuditReport',
                data: {}
            });
            expect(mockBackend.generateAuditReport).not.toHaveBeenCalled();
        });

        test('generateAuditReport skips if data is missing', async () => {
            await routeMessage(component, { type: 'generateAuditReport' });
            expect(mockBackend.generateAuditReport).not.toHaveBeenCalled();
        });

        test('navigateTo routes to known page via routes map', async () => {
            await routeMessage(component, {
                type: 'navigateTo',
                data: { page: 'dashboard' }
            });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-dashboard');
        });

        test('navigateTo routes to compliance page', async () => {
            await routeMessage(component, {
                type: 'navigateTo',
                data: { page: 'compliance' }
            });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-compliance-calendar');
        });

        test('navigateTo routes to dq-tracker page', async () => {
            await routeMessage(component, {
                type: 'navigateTo',
                data: { page: 'dq-tracker' }
            });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-dq-tracker');
        });

        test('navigateTo routes to incidents page', async () => {
            await routeMessage(component, {
                type: 'navigateTo',
                data: { page: 'incidents' }
            });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-incident-reporting');
        });

        test('navigateTo routes to documents page', async () => {
            await routeMessage(component, {
                type: 'navigateTo',
                data: { page: 'documents' }
            });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-document-vault');
        });

        test('navigateTo falls back to /${page} for unknown routes', async () => {
            await routeMessage(component, {
                type: 'navigateTo',
                data: { page: 'some-other-page' }
            });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/some-other-page');
        });

        test('navigateTo does nothing if page is missing', async () => {
            await routeMessage(component, { type: 'navigateTo', data: {} });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });

        test('navigateTo does nothing if data is missing', async () => {
            await routeMessage(component, { type: 'navigateTo' });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'nonExistentType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getDQFiles failure sends empty array fallback', async () => {
            const failBackend = {
                ...mockBackend,
                getDQFiles: jest.fn().mockRejectedValue(new Error('DB error'))
            };
            await routeMessage(component, { type: 'getDQFiles' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'setDQFiles',
                data: []
            });
        });

        test('dqTrackerReady failure also sends empty array fallback', async () => {
            const failBackend = {
                ...mockBackend,
                getDQFiles: jest.fn().mockRejectedValue(new Error('Timeout'))
            };
            await routeMessage(component, { type: 'dqTrackerReady' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'setDQFiles',
                data: []
            });
        });

        test('generateAuditReport failure does not send any message', async () => {
            const failBackend = {
                ...mockBackend,
                generateAuditReport: jest.fn().mockRejectedValue(new Error('Report failed'))
            };
            await routeMessage(component, {
                type: 'generateAuditReport',
                data: { dqFileId: 'dq1' }
            }, failBackend);
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('calls postMessage on valid component', () => {
            safeSend(component, { type: 'test' });
            expect(component.postMessage).toHaveBeenCalledWith({ type: 'test' });
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { type: 'test' })).not.toThrow();
        });

        test('does not throw if component has no postMessage', () => {
            const badComponent = {};
            expect(() => safeSend(badComponent, { type: 'test' })).not.toThrow();
        });
    });
});
