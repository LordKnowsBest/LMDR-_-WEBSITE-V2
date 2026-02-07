/**
 * CARRIER_CSA_MONITOR Bridge Tests
 * ==================================
 * Tests for src/pages/CARRIER_CSA_MONITOR.bov8u.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * **TYPE PROTOCOL** (not action protocol)
 * Switch on `message.type`, delegates to handleComplianceMessage for all
 * non-navigateTo types. Uses getHtmlComponents (multi-component pattern).
 *
 * Unique behavior:
 * - Gets carrierDot from getCarrierIdentity() on init
 * - Redirects to /carrier-welcome if no identity/needsOnboarding/no dotNumber
 * - Sends initialData from getCompliancePageData('csaMonitor', carrierDot)
 * - Sends carrierContext { carrierDot, companyName } to each component
 * - navigateTo: wixLocation.to(`/${page}`) (no routes map, direct slug)
 * - All other types: handleComplianceMessage(PAGE_TYPE, carrierDot, message)
 * - Error: sends { type: 'error', data: { error: message } }
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'CARRIER_CSA_MONITOR.bov8u.js'
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
    getCarrierIdentity: jest.fn().mockResolvedValue({
        success: true,
        needsOnboarding: false,
        dotNumber: 1234567,
        companyName: 'Test Carrier LLC'
    }),
    getCompliancePageData: jest.fn().mockResolvedValue({
        type: 'csaMonitorData',
        data: { scores: [{ category: 'Unsafe Driving', score: 45 }] }
    }),
    handleComplianceMessage: jest.fn().mockResolvedValue({
        type: 'csaScoresResult',
        data: { scores: [{ category: 'HOS', score: 30 }] }
    })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

const PAGE_TYPE = 'csaMonitor';

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
            // Ignore missing IDs
        }
    }
    return found;
}

async function routeMessage(component, carrierDot, message, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!message || !message.type) return;

    if (message.type === 'navigateTo') {
        const page = message && message.data && message.data.page;
        if (page) {
            wixLocation.to(`/${page}`);
        }
        return;
    }

    try {
        const response = await backend.handleComplianceMessage(PAGE_TYPE, carrierDot, message);
        if (response && typeof component.postMessage === 'function') {
            component.postMessage(response);
        }
    } catch (error) {
        component.postMessage({
            type: 'error',
            data: { error: error.message || 'Unknown error' }
        });
    }
}

async function initPage(backend = mockBackend, wixLocation = mockWixLocation) {
    const identity = await backend.getCarrierIdentity();
    if (!identity || !identity.success || identity.needsOnboarding || !identity.dotNumber) {
        wixLocation.to('/carrier-welcome');
        return null;
    }
    return {
        carrierDot: String(identity.dotNumber),
        companyName: identity.companyName || ''
    };
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_CSA_MONITOR Page Code (Bridge)', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports getCarrierIdentity from backend/recruiter_service', () => {
            expect(sourceCode).toContain("from 'backend/recruiter_service'");
            expect(sourceCode).toContain('getCarrierIdentity');
        });

        test('imports getCompliancePageData from backend/complianceBridge', () => {
            expect(sourceCode).toContain("from 'backend/complianceBridge'");
            expect(sourceCode).toContain('getCompliancePageData');
        });

        test('imports handleComplianceMessage from backend/complianceBridge', () => {
            expect(sourceCode).toContain('handleComplianceMessage');
        });

        test('imports wixLocation', () => {
            expect(sourceCode).toContain("from 'wix-location'");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('uses type-based protocol (message.type)', () => {
            expect(sourceCode).toContain('message.type');
            // Also uses message?.type for optional chaining check
            expect(sourceCode).toContain("message?.type");
        });

        test('does NOT use action-based protocol', () => {
            expect(sourceCode).not.toMatch(/message\.action/);
            expect(sourceCode).not.toMatch(/msg\.action/);
        });

        test('defines PAGE_TYPE as csaMonitor', () => {
            expect(sourceCode).toContain("const PAGE_TYPE = 'csaMonitor'");
        });

        test('handles navigateTo type', () => {
            expect(sourceCode).toContain("message.type === 'navigateTo'");
        });

        test('defines HTML_COMPONENT_IDS array', () => {
            expect(sourceCode).toContain('HTML_COMPONENT_IDS');
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        test('sends carrierContext to components', () => {
            expect(sourceCode).toContain("type: 'carrierContext'");
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('checks identity success and dotNumber before proceeding', () => {
            expect(sourceCode).toContain('identity.needsOnboarding');
            expect(sourceCode).toContain('identity.dotNumber');
        });

        test('redirects to carrier-welcome if identity fails', () => {
            expect(sourceCode).toContain("wixLocation.to('/carrier-welcome')");
        });

        test('wraps handleComplianceMessage in try-catch', () => {
            // The routeMessage function has a try-catch around handleComplianceMessage
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?handleComplianceMessage/);
        });

        test('checks response before posting', () => {
            expect(sourceCode).toContain("typeof component.postMessage === 'function'");
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds all components with onMessage (multi-component pattern)', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1' || id === '#html2') return createMockComponent();
                throw new Error('not found');
            });
            const comps = getHtmlComponents(mock$w);
            expect(comps).toHaveLength(2);
        });

        test('returns empty array when no component found', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            expect(getHtmlComponents(mock$w)).toEqual([]);
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return { postMessage: jest.fn() }; // no onMessage
                if (id === '#html2') return createMockComponent(); // has onMessage
                throw new Error('not found');
            });
            const comps = getHtmlComponents(mock$w);
            expect(comps).toHaveLength(1);
        });

        test('tries all 6 IDs', () => {
            const mock$w = jest.fn(() => ({})); // no onMessage on any
            getHtmlComponents(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
        });
    });

    // =========================================================================
    // INIT / IDENTITY FLOW
    // =========================================================================

    describe('Init / identity flow', () => {
        test('redirects to /carrier-welcome if identity has no success', async () => {
            const failBackend = {
                ...mockBackend,
                getCarrierIdentity: jest.fn().mockResolvedValue({ success: false })
            };
            const result = await initPage(failBackend, mockWixLocation);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-welcome');
            expect(result).toBeNull();
        });

        test('redirects to /carrier-welcome if needsOnboarding is true', async () => {
            const onboardingBackend = {
                ...mockBackend,
                getCarrierIdentity: jest.fn().mockResolvedValue({
                    success: true,
                    needsOnboarding: true,
                    dotNumber: 1234567
                })
            };
            const result = await initPage(onboardingBackend, mockWixLocation);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-welcome');
            expect(result).toBeNull();
        });

        test('redirects to /carrier-welcome if no dotNumber', async () => {
            const noDotBackend = {
                ...mockBackend,
                getCarrierIdentity: jest.fn().mockResolvedValue({
                    success: true,
                    needsOnboarding: false,
                    dotNumber: null
                })
            };
            const result = await initPage(noDotBackend, mockWixLocation);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-welcome');
            expect(result).toBeNull();
        });

        test('returns carrierDot as string and companyName on success', async () => {
            const result = await initPage(mockBackend, mockWixLocation);
            expect(result).toEqual({
                carrierDot: '1234567',
                companyName: 'Test Carrier LLC'
            });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });

        test('defaults companyName to empty string if missing', async () => {
            const noNameBackend = {
                ...mockBackend,
                getCarrierIdentity: jest.fn().mockResolvedValue({
                    success: true,
                    needsOnboarding: false,
                    dotNumber: 9999999
                })
            };
            const result = await initPage(noNameBackend, mockWixLocation);
            expect(result.companyName).toBe('');
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        const carrierDot = '1234567';

        test('ignores messages without type key', async () => {
            await routeMessage(component, carrierDot, {});
            await routeMessage(component, carrierDot, null);
            await routeMessage(component, carrierDot, undefined);
            await routeMessage(component, carrierDot, { action: 'wrong_protocol' });
            expect(component.postMessage).not.toHaveBeenCalled();
            expect(mockBackend.handleComplianceMessage).not.toHaveBeenCalled();
        });

        test('navigateTo routes directly to /${page}', async () => {
            await routeMessage(component, carrierDot, {
                type: 'navigateTo',
                data: { page: 'carrier-dashboard' }
            });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-dashboard');
            // Should NOT call handleComplianceMessage
            expect(mockBackend.handleComplianceMessage).not.toHaveBeenCalled();
        });

        test('navigateTo does nothing if page is missing', async () => {
            await routeMessage(component, carrierDot, {
                type: 'navigateTo',
                data: {}
            });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });

        test('navigateTo does nothing if data is missing', async () => {
            await routeMessage(component, carrierDot, {
                type: 'navigateTo'
            });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });

        test('non-navigateTo types delegate to handleComplianceMessage', async () => {
            const msg = { type: 'getCSAScores', data: { timeRange: '90d' } };
            await routeMessage(component, carrierDot, msg);
            expect(mockBackend.handleComplianceMessage).toHaveBeenCalledWith(
                'csaMonitor', '1234567', msg
            );
        });

        test('handleComplianceMessage response is posted back to component', async () => {
            await routeMessage(component, carrierDot, {
                type: 'getCSAScores',
                data: {}
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'csaScoresResult',
                data: { scores: [{ category: 'HOS', score: 30 }] }
            });
        });

        test('null response from handleComplianceMessage does not post', async () => {
            const nullResponseBackend = {
                ...mockBackend,
                handleComplianceMessage: jest.fn().mockResolvedValue(null)
            };
            await routeMessage(component, carrierDot, {
                type: 'someType',
                data: {}
            }, nullResponseBackend);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('unknown type still delegates to handleComplianceMessage', async () => {
            await routeMessage(component, carrierDot, { type: 'unknownAction' });
            expect(mockBackend.handleComplianceMessage).toHaveBeenCalledWith(
                'csaMonitor', '1234567', { type: 'unknownAction' }
            );
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        const carrierDot = '1234567';

        test('handleComplianceMessage failure sends error type with message', async () => {
            const failBackend = {
                ...mockBackend,
                handleComplianceMessage: jest.fn().mockRejectedValue(new Error('CSA fetch failed'))
            };
            await routeMessage(component, carrierDot, {
                type: 'getCSAScores',
                data: {}
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error',
                data: { error: 'CSA fetch failed' }
            });
        });

        test('error with no message string sends Unknown error', async () => {
            const failBackend = {
                ...mockBackend,
                handleComplianceMessage: jest.fn().mockRejectedValue(new Error())
            };
            await routeMessage(component, carrierDot, {
                type: 'getCSAScores',
                data: {}
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error',
                data: { error: 'Unknown error' }
            });
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY (CSA Monitor uses direct postMessage, no safeSend)
    // =========================================================================

    describe('Direct postMessage pattern', () => {
        test('source does NOT define safeSend (uses direct postMessage)', () => {
            // CSA Monitor uses component.postMessage directly, not a safeSend wrapper
            expect(sourceCode).not.toContain('function safeSend');
        });

        test('source checks typeof component.postMessage before calling', () => {
            expect(sourceCode).toContain("typeof component.postMessage === 'function'");
        });
    });
});
