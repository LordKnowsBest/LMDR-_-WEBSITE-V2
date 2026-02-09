/**
 * DRIVER_POLICIES Bridge Tests
 * ==============================
 * Tests for src/pages/DRIVER_POLICIES.mbmmh.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * **TYPE PROTOCOL** using `{ type, data }` envelope (NOTE: no timestamp)
 * Uses `safeSend(component, data)` wrapper - different from carrier pages.
 * Imports from 'backend/carrierPolicyService' (no .jsw extension)
 * Uses HTML_COMPONENT_IDS array and findHtmlComponent() pattern.
 *
 * 4 inbound types:
 *   driverPoliciesReady, getDriverPolicies,
 *   getPolicyContent, acknowledgePolicy
 *
 * 4 outbound types:
 *   driverPoliciesData, policyContentData,
 *   policyAcknowledgeResult, driverContext
 *
 * Gotcha: driverId comes from wixUsers.currentUser.id
 * Gotcha: carrierId comes from wixLocationFrontend.query.carrierId
 * Gotcha: acknowledgePolicy requires both policyId and driverId, else silent return
 * Gotcha: getPolicyContent requires policyId, else silent return
 *
 * @see src/pages/DRIVER_POLICIES.mbmmh.js
 * @see src/public/driver/DRIVER_POLICIES.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'DRIVER_POLICIES.mbmmh.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// EXPECTED IMPORTS AND ACTIONS
// =============================================================================

const EXPECTED_IMPORTS = [
    "from 'backend/carrierPolicyService'",
    "from 'wix-users'",
    "from 'wix-location-frontend'"
];

const ALL_ACTIONS = [
    'driverPoliciesReady',
    'getDriverPolicies',
    'getPolicyContent',
    'acknowledgePolicy'
];

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
    getPoliciesForDriver: jest.fn().mockResolvedValue([
        { _id: 'pol-1', title: 'Safety Handbook', status: 'published', requires_acknowledgment: true, acknowledged: false },
        { _id: 'pol-2', title: 'PTO Policy', status: 'published', requires_acknowledgment: false, acknowledged: true }
    ]),
    getPolicyContent: jest.fn().mockResolvedValue({
        _id: 'pol-1',
        title: 'Safety Handbook',
        content: '# Safety Rules\n\n1. Wear seatbelt',
        category: 'safety',
        version: 3
    }),
    acknowledgePolicy: jest.fn().mockResolvedValue({
        policyId: 'pol-1',
        driverId: 'test-driver-1',
        acknowledged_at: new Date().toISOString()
    })
};

// =============================================================================
// REPLICATED CORE LOGIC
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
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'driverPoliciesReady':
            await handlePoliciesReady(component);
            break;
        case 'getDriverPolicies':
            await handleGetPolicies(component, msg, backend);
            break;
        case 'getPolicyContent':
            await handleGetPolicyContent(component, msg, backend);
            break;
        case 'acknowledgePolicy':
            await handleAcknowledgePolicy(component, msg, backend);
            break;
        default:
            break;
    }
}

// Mock wixUsers and wixLocation
const mockUserId = 'test-driver-1';
const mockCarrierId = 'carrier-test-1';

async function handlePoliciesReady(component) {
    try {
        safeSend(component, {
            type: 'driverContext',
            data: { driverId: mockUserId, carrierId: mockCarrierId }
        });
    } catch (error) {
        // silently fail
    }
}

async function handleGetPolicies(component, msg, backend) {
    try {
        const data = msg.data || {};
        const driverId = data.driverId || mockUserId;
        const carrierId = data.carrierId || '';
        if (!carrierId) {
            safeSend(component, {
                type: 'driverPoliciesData',
                data: { success: true, policies: [] }
            });
            return;
        }
        const policies = await backend.getPoliciesForDriver(driverId, carrierId);
        safeSend(component, {
            type: 'driverPoliciesData',
            data: { success: true, policies: policies || [] }
        });
    } catch (error) {
        safeSend(component, {
            type: 'driverPoliciesData',
            data: { success: false, policies: [], error: error.message }
        });
    }
}

async function handleGetPolicyContent(component, msg, backend) {
    try {
        const data = msg.data || {};
        if (!data.policyId) return; // Silent return
        const policy = await backend.getPolicyContent(data.policyId);
        safeSend(component, {
            type: 'policyContentData',
            data: { success: true, policy: policy || {} }
        });
    } catch (error) {
        safeSend(component, {
            type: 'policyContentData',
            data: { success: false, error: error.message }
        });
    }
}

async function handleAcknowledgePolicy(component, msg, backend) {
    try {
        const data = msg.data || {};
        if (!data.policyId || !data.driverId) return; // Silent return
        const result = await backend.acknowledgePolicy(
            data.policyId,
            data.driverId,
            data.signatureType || 'checkbox',
            data.ipAddress || '',
            data.deviceInfo || ''
        );
        safeSend(component, {
            type: 'policyAcknowledgeResult',
            data: { success: true, acknowledgment: result }
        });
    } catch (error) {
        safeSend(component, {
            type: 'policyAcknowledgeResult',
            data: { success: false, error: error.message }
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('DRIVER_POLICIES Bridge Tests', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
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

        EXPECTED_IMPORTS.forEach(importPath => {
            test(`imports ${importPath}`, () => {
                expect(sourceCode).toContain(importPath);
            });
        });

        test('defines safeSend helper', () => {
            expect(sourceCode).toContain('function safeSend');
        });

        test('contains all inbound types', () => {
            ALL_ACTIONS.forEach(action => {
                expect(sourceCode).toContain(`'${action}'`);
            });
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('safeSend wraps postMessage in try-catch', () => {
            expect(sourceCode).toMatch(/function safeSend/);
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?postMessage/);
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
            const comp = findHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
        });

        test('skips components that throw errors', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const comp = findHtmlComponent(mock$w);
            expect(comp).toBeNull();
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn(() => ({ postMessage: jest.fn() }));
            const comp = findHtmlComponent(mock$w);
            expect(comp).toBeNull();
        });

        test('tries all six component IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            findHtmlComponent(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'nonExistentType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('driverPoliciesReady sends driverContext', async () => {
            await routeMessage(component, { type: 'driverPoliciesReady' });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'driverContext',
                data: { driverId: 'test-driver-1', carrierId: 'carrier-test-1' }
            });
        });

        test('getDriverPolicies calls backend and sends data', async () => {
            await routeMessage(component, {
                type: 'getDriverPolicies',
                data: { driverId: 'drv-1', carrierId: 'c-1' }
            });
            expect(mockBackend.getPoliciesForDriver).toHaveBeenCalledWith('drv-1', 'c-1');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'driverPoliciesData',
                data: expect.objectContaining({ success: true, policies: expect.any(Array) })
            });
        });

        test('getDriverPolicies with empty carrierId sends empty policies', async () => {
            await routeMessage(component, {
                type: 'getDriverPolicies',
                data: { driverId: 'drv-1', carrierId: '' }
            });
            expect(mockBackend.getPoliciesForDriver).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'driverPoliciesData',
                data: { success: true, policies: [] }
            });
        });

        test('getPolicyContent calls backend and sends data', async () => {
            await routeMessage(component, {
                type: 'getPolicyContent',
                data: { policyId: 'pol-1' }
            });
            expect(mockBackend.getPolicyContent).toHaveBeenCalledWith('pol-1');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'policyContentData',
                data: expect.objectContaining({ success: true, policy: expect.any(Object) })
            });
        });

        test('getPolicyContent with missing policyId does nothing (silent)', async () => {
            await routeMessage(component, {
                type: 'getPolicyContent',
                data: {}
            });
            expect(mockBackend.getPolicyContent).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('acknowledgePolicy calls backend with all params', async () => {
            await routeMessage(component, {
                type: 'acknowledgePolicy',
                data: {
                    policyId: 'pol-1',
                    driverId: 'drv-1',
                    signatureType: 'e_signature',
                    ipAddress: '10.0.0.1',
                    deviceInfo: 'Chrome/Win'
                }
            });
            expect(mockBackend.acknowledgePolicy).toHaveBeenCalledWith(
                'pol-1', 'drv-1', 'e_signature', '10.0.0.1', 'Chrome/Win'
            );
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'policyAcknowledgeResult',
                data: expect.objectContaining({ success: true, acknowledgment: expect.any(Object) })
            });
        });

        test('acknowledgePolicy with missing policyId or driverId does nothing (silent)', async () => {
            await routeMessage(component, {
                type: 'acknowledgePolicy',
                data: { policyId: 'pol-1' }
            });
            expect(mockBackend.acknowledgePolicy).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('acknowledgePolicy uses default signatureType checkbox', async () => {
            await routeMessage(component, {
                type: 'acknowledgePolicy',
                data: { policyId: 'pol-1', driverId: 'drv-1' }
            });
            expect(mockBackend.acknowledgePolicy).toHaveBeenCalledWith(
                'pol-1', 'drv-1', 'checkbox', '', ''
            );
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getDriverPolicies failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                getPoliciesForDriver: jest.fn().mockRejectedValue(new Error('DB error'))
            };
            await routeMessage(component, {
                type: 'getDriverPolicies',
                data: { driverId: 'drv-1', carrierId: 'c-1' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'driverPoliciesData',
                data: expect.objectContaining({ success: false, error: 'DB error' })
            });
        });

        test('getPolicyContent failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                getPolicyContent: jest.fn().mockRejectedValue(new Error('Not found'))
            };
            await routeMessage(component, {
                type: 'getPolicyContent',
                data: { policyId: 'pol-999' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'policyContentData',
                data: expect.objectContaining({ success: false, error: 'Not found' })
            });
        });

        test('acknowledgePolicy failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                acknowledgePolicy: jest.fn().mockRejectedValue(new Error('Already acknowledged'))
            };
            await routeMessage(component, {
                type: 'acknowledgePolicy',
                data: { policyId: 'pol-1', driverId: 'drv-1' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'policyAcknowledgeResult',
                data: expect.objectContaining({ success: false, error: 'Already acknowledged' })
            });
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does not throw if component throws on postMessage', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { type: 'test' })).not.toThrow();
        });

        test('calls postMessage with data directly', () => {
            safeSend(component, { type: 'test', data: { key: 'val' } });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'test',
                data: { key: 'val' }
            });
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getDriverPolicies only calls backend once', async () => {
            await routeMessage(component, {
                type: 'getDriverPolicies',
                data: { driverId: 'drv-1', carrierId: 'c-1' }
            });
            expect(mockBackend.getPoliciesForDriver).toHaveBeenCalledTimes(1);
        });

        test('acknowledgePolicy passes all five arguments', async () => {
            await routeMessage(component, {
                type: 'acknowledgePolicy',
                data: {
                    policyId: 'pol-1',
                    driverId: 'drv-1',
                    signatureType: 'checkbox',
                    ipAddress: '192.168.1.1',
                    deviceInfo: 'Safari/iOS'
                }
            });
            expect(mockBackend.acknowledgePolicy).toHaveBeenCalledWith(
                'pol-1', 'drv-1', 'checkbox', '192.168.1.1', 'Safari/iOS'
            );
        });
    });
});
