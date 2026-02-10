/* eslint-disable */
/**
 * BRIDGE TEST TEMPLATE
 * ====================
 * Copy this file and rename to: {yourPage}.bridge.test.js
 * Example: aiMatching.bridge.test.js, recruiterConsole.bridge.test.js
 *
 * PURPOSE:
 * Verifies the postMessage bridge contract between:
 *   HTML Component <-> Wix Page Code <-> Backend Services
 *
 * This template tests:
 *   1. Source file structure (imports, $w.onReady, component IDs)
 *   2. Safety checks (try-catch around $w, safeSend helper)
 *   3. HTML component discovery (finding #html1..#html5, #htmlEmbed1)
 *   4. Message routing (action -> handler -> response)
 *   5. Error handling (backend failures -> actionError responses)
 *   6. Backend service call verification (correct args, call counts)
 *
 * INSTRUCTIONS FOR JUNIORS:
 * 1. Replace all {PLACEHOLDER} values with your page-specific values
 * 2. Read your page code file to identify all message actions
 * 3. Read your page code to identify all backend service imports
 * 4. Add one test per action in the "Message routing" describe block
 * 5. Add one error test per action in the "Error handling" describe block
 * 6. Run: npm test -- --testPathPattern="{yourPage}.bridge"
 *
 * @see src/pages/{PAGE_FILE} - The page code being tested
 * @see src/public/{SURFACE}/{HTML_FILE} - The HTML component
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION - {REPLACE} these values
// =============================================================================

/**
 * Path to the page code file being tested
 * Find this in src/pages/ - the file with the random 5-char suffix
 */
const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages',
    '{PAGE_NAME}.{HASH}.js'  // {REPLACE}: e.g., 'ADMIN_DASHBOARD.svo6l.js'
);

/**
 * Backend service import paths expected in the page code
 * {REPLACE}: List all backend imports your page code uses
 */
const EXPECTED_IMPORTS = [
    // "from 'backend/yourService'",
    // "from 'backend/anotherService'",
];

/**
 * All message actions the page code handles
 * {REPLACE}: List every action string from the routeMessage switch
 */
const ALL_ACTIONS = [
    // 'getData',
    // 'saveItem',
    // 'deleteItem',
    // 'navigateTo',
];

// =============================================================================
// READ SOURCE FILE
// =============================================================================

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

/**
 * Mock backend services
 * {REPLACE}: Add mock implementations for every backend function your page calls
 *
 * Pattern:
 *   methodName: jest.fn().mockResolvedValue({ expectedShape })
 */
const mockBackend = {
    // {REPLACE}: Add your mocks
    // getData: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    // saveItem: jest.fn().mockResolvedValue({ success: true, id: 'new-id' }),
    // deleteItem: jest.fn().mockResolvedValue({ success: true }),
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// Copy these functions from your page code exactly as written
// =============================================================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        // silently fail
    }
}

function getHtmlComponents($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {
            // skip
        }
    }
    return found;
}

/**
 * {REPLACE}: Copy your routeMessage function from the page code
 * Add backend and wixLocation as injectable parameters for testing
 */
async function routeMessage(component, message, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!message?.action) return;

    const { action } = message;

    // Navigation handler (common to all pages)
    if (action === 'navigateTo') {
        if (message.destination) wixLocation.to(`/${message.destination}`);
        return;
    }

    try {
        switch (action) {
            // {REPLACE}: Add your action cases here
            // Example:
            // case 'getData': {
            //     const data = await backend.getData(message.filters);
            //     safeSend(component, { action: 'dataLoaded', payload: data });
            //     break;
            // }
            default:
                break;
        }
    } catch (error) {
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('{PAGE_NAME} Bridge Tests', () => {  // {REPLACE}: Page name
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // Verifies the page code file has the expected structure
    // =========================================================================

    describe('Source file structure', () => {
        test('file exists and is readable', () => {
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS', () => {
            expect(sourceCode).toContain('#html1');
        });

        // {REPLACE}: Add import checks
        // EXPECTED_IMPORTS.forEach(importPath => {
        //     test(`imports ${importPath}`, () => {
        //         expect(sourceCode).toContain(importPath);
        //     });
        // });

        test('defines safeSend or equivalent helper', () => {
            // Check for safeSend, sendMessage, or postToComponent
            const hasSafeSend = sourceCode.includes('function safeSend') ||
                sourceCode.includes('function sendMessage') ||
                sourceCode.includes('function postToComponent');
            expect(hasSafeSend).toBe(true);
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // Verifies no bare $w() calls without try-catch
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are wrapped in try-catch', () => {
            const wCalls = sourceCode.match(/\$w\(/g) || [];
            expect(wCalls.length).toBeGreaterThan(0);
            // Component discovery should use try-catch
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('safeSend wraps postMessage in try-catch', () => {
            expect(sourceCode).toMatch(/typeof component\.postMessage\s*===\s*'function'/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components with onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });

            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(1);
        });

        test('skips components that throw errors', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn(() => ({ postMessage: jest.fn() }));
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('tries all six component IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            getHtmlComponents(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // {REPLACE}: Add one test per action your page handles
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages with no action', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('navigateTo routes to wixLocation.to', async () => {
            await routeMessage(component, { action: 'navigateTo', destination: 'some-page' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/some-page');
        });

        test('navigateTo with no destination does nothing', async () => {
            await routeMessage(component, { action: 'navigateTo' });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });

        test('unknown action does not send any message', async () => {
            await routeMessage(component, { action: 'nonExistentAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        // {REPLACE}: Add your action tests below
        // Pattern:
        //
        // test('{action} calls {backendMethod} and sends {responseAction}', async () => {
        //     await routeMessage(component, { action: '{action}', ...params });
        //     expect(mockBackend.{method}).toHaveBeenCalledWith(expectedArgs);
        //     expect(component.postMessage).toHaveBeenCalledWith({
        //         action: '{responseAction}',
        //         payload: expectedPayload
        //     });
        // });
    });

    // =========================================================================
    // ERROR HANDLING
    // {REPLACE}: Add one error test per action
    // =========================================================================

    describe('Error handling', () => {
        // {REPLACE}: Add error tests
        // Pattern:
        //
        // test('{action} failure sends actionError', async () => {
        //     const failBackend = {
        //         ...mockBackend,
        //         {method}: jest.fn().mockRejectedValue(new Error('Test error'))
        //     };
        //     await routeMessage(component, { action: '{action}' }, failBackend);
        //     expect(component.postMessage).toHaveBeenCalledWith({
        //         action: 'actionError',
        //         message: 'Test error'
        //     });
        // });

        test('error with no message falls back to generic', async () => {
            // This test verifies the catch block's fallback message
            // {REPLACE}: Use any action that calls a backend method
            // const failBackend = {
            //     ...mockBackend,
            //     getData: jest.fn().mockRejectedValue({})
            // };
            // await routeMessage(component, { action: 'getData' }, failBackend);
            // expect(component.postMessage).toHaveBeenCalledWith({
            //     action: 'actionError',
            //     message: 'An unexpected error occurred'
            // });
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does nothing if component is null', () => {
            expect(() => safeSend(null, { action: 'test' })).not.toThrow();
        });

        test('does nothing if component has no postMessage', () => {
            expect(() => safeSend({}, { action: 'test' })).not.toThrow();
        });

        test('calls postMessage when component is valid', () => {
            safeSend(component, { action: 'test', payload: 123 });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'test', payload: 123 });
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { action: 'test' })).not.toThrow();
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // {REPLACE}: Verify exact call counts and argument passing
    // =========================================================================

    describe('Backend service call verification', () => {
        // {REPLACE}: Add verification tests
        // Pattern:
        //
        // test('{action} only calls {method} once', async () => {
        //     await routeMessage(component, { action: '{action}' });
        //     expect(mockBackend.{method}).toHaveBeenCalledTimes(1);
        // });
        //
        // test('{action} passes all parameters through', async () => {
        //     await routeMessage(component, {
        //         action: '{action}',
        //         param1: 'value1',
        //         param2: 'value2'
        //     });
        //     expect(mockBackend.{method}).toHaveBeenCalledWith('value1', 'value2');
        // });
    });
});
