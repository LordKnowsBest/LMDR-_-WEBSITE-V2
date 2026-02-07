/**
 * CARRIER_COMPLIANCE_CALENDAR Bridge Tests
 * ==========================================
 * Tests for src/pages/CARRIER_COMPLIANCE_CALENDAR.ww0h3.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * **TYPE PROTOCOL** (not action protocol)
 * Switch on `msg.type`, params in `msg.data`, responses as `{ type: '...', data }`
 * Error fallback: sends `{ type: 'setComplianceData', data: [] }` on getComplianceData failure
 *
 * 4 types: calendarReady, getComplianceData, createComplianceEvent, navigateTo
 *
 * Gotcha: calendarReady and getComplianceData share the same handler
 * Gotcha: navigateTo uses a routes map with fallback to `/${page}`
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'CARRIER_COMPLIANCE_CALENDAR.ww0h3.js'
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
    getComplianceEvents: jest.fn().mockResolvedValue([
        { id: 'evt1', title: 'DOT Audit', date: '2026-03-01' },
        { id: 'evt2', title: 'Safety Review', date: '2026-04-15' }
    ]),
    createComplianceEvent: jest.fn().mockResolvedValue({
        id: 'evt3', title: 'New Event', date: '2026-05-01'
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
        case 'calendarReady':
        case 'getComplianceData':
            await handleGetComplianceData(component, msg, backend);
            break;
        case 'createComplianceEvent':
            await handleCreateEvent(component, msg, backend);
            break;
        case 'navigateTo':
            handleNavigateTo(msg, wixLocation);
            break;
        default:
            break;
    }
}

async function handleGetComplianceData(component, msg, backend = mockBackend) {
    try {
        const data = msg.data || {};
        const events = await backend.getComplianceEvents({
            start: data.start,
            end: data.end
        });
        safeSend(component, { type: 'setComplianceData', data: events });
    } catch (error) {
        safeSend(component, { type: 'setComplianceData', data: [] });
    }
}

async function handleCreateEvent(component, msg, backend = mockBackend) {
    try {
        const data = msg.data || {};
        const result = await backend.createComplianceEvent(data);
        safeSend(component, { type: 'eventCreated', data: result });
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

describe('CARRIER_COMPLIANCE_CALENDAR Page Code (Bridge)', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports getComplianceEvents from backend/complianceCalendarService', () => {
            expect(sourceCode).toContain("from 'backend/complianceCalendarService'");
            expect(sourceCode).toContain('getComplianceEvents');
        });

        test('imports createComplianceEvent from backend/complianceCalendarService', () => {
            expect(sourceCode).toContain('createComplianceEvent');
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
            // routeMessage should switch on msg.type, not msg.action
            expect(sourceCode).not.toMatch(/msg\.action/);
        });

        test('handles all 4 message types in switch', () => {
            expect(sourceCode).toContain("case 'calendarReady'");
            expect(sourceCode).toContain("case 'getComplianceData'");
            expect(sourceCode).toContain("case 'createComplianceEvent'");
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

        test('calendarReady calls getComplianceEvents and sends setComplianceData', async () => {
            await routeMessage(component, { type: 'calendarReady' });
            expect(mockBackend.getComplianceEvents).toHaveBeenCalledWith({
                start: undefined,
                end: undefined
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'setComplianceData',
                data: [
                    { id: 'evt1', title: 'DOT Audit', date: '2026-03-01' },
                    { id: 'evt2', title: 'Safety Review', date: '2026-04-15' }
                ]
            });
        });

        test('getComplianceData passes start and end from msg.data', async () => {
            await routeMessage(component, {
                type: 'getComplianceData',
                data: { start: '2026-01-01', end: '2026-12-31' }
            });
            expect(mockBackend.getComplianceEvents).toHaveBeenCalledWith({
                start: '2026-01-01',
                end: '2026-12-31'
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'setComplianceData',
                data: expect.any(Array)
            });
        });

        test('getComplianceData with no msg.data defaults gracefully', async () => {
            await routeMessage(component, { type: 'getComplianceData' });
            expect(mockBackend.getComplianceEvents).toHaveBeenCalledWith({
                start: undefined,
                end: undefined
            });
        });

        test('createComplianceEvent calls backend and sends eventCreated', async () => {
            const eventData = { title: 'New Event', date: '2026-05-01' };
            await routeMessage(component, {
                type: 'createComplianceEvent',
                data: eventData
            });
            expect(mockBackend.createComplianceEvent).toHaveBeenCalledWith(eventData);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'eventCreated',
                data: { id: 'evt3', title: 'New Event', date: '2026-05-01' }
            });
        });

        test('createComplianceEvent with no data defaults to empty object', async () => {
            await routeMessage(component, { type: 'createComplianceEvent' });
            expect(mockBackend.createComplianceEvent).toHaveBeenCalledWith({});
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
        test('getComplianceData failure sends empty array fallback', async () => {
            const failBackend = {
                ...mockBackend,
                getComplianceEvents: jest.fn().mockRejectedValue(new Error('DB error'))
            };
            await routeMessage(component, { type: 'getComplianceData' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'setComplianceData',
                data: []
            });
        });

        test('calendarReady failure also sends empty array fallback', async () => {
            const failBackend = {
                ...mockBackend,
                getComplianceEvents: jest.fn().mockRejectedValue(new Error('Timeout'))
            };
            await routeMessage(component, { type: 'calendarReady' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'setComplianceData',
                data: []
            });
        });

        test('createComplianceEvent failure does not send any message', async () => {
            const failBackend = {
                ...mockBackend,
                createComplianceEvent: jest.fn().mockRejectedValue(new Error('Create failed'))
            };
            await routeMessage(component, {
                type: 'createComplianceEvent',
                data: { title: 'Fail Event' }
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

        test('does not throw if component is null-like', () => {
            // safeSend receives a component, but if postMessage is absent it would throw
            // The try-catch should still protect
            const badComponent = {};
            expect(() => safeSend(badComponent, { type: 'test' })).not.toThrow();
        });
    });
});
