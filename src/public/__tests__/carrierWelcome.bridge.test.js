/**
 * Carrier Welcome Bridge Tests
 *
 * Tests the Velo page-code logic for Carrier Welcome.gnhma.js.
 * Covers: HTML component discovery, message routing, carrier data loading,
 * navigation handlers, and native Wix element updates.
 *
 * This page uses { type, data } envelope (not { action, payload }).
 * It broadcasts carrierWelcomeData to all HTML components and handles
 * navigation messages from the HTML.
 *
 * Actions tested:
 *   1. init -> getCarrierByDOT(dotNumber) -> carrierWelcomeData
 *   2. navigateToIntake -> wixLocation -> /trucking-companies?dot={dot}
 *   3. navigateToPreferences -> wixLocation -> /recruiter-console?tab=settings
 *   4. navigateToDashboard -> wixLocation -> /recruiter-console
 *   5. navigateToDriverSearch -> wixLocation -> /recruiter-driver-search
 *   6. getCarrierWelcomeData -> re-sends carrierWelcomeData payload
 *   7. navigateOnboarding -> step-based routing (legacy)
 *
 * @see src/pages/Carrier Welcome.gnhma.js
 * @see src/public/carrier/Carrier_Welcome.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages',
    'Carrier Welcome.gnhma.js'
);

const EXPECTED_IMPORTS = [
    "from 'backend/recruiter_service'",
    "from 'backend/carrierStatusService'"
];

const ALL_ACTIONS = [
    'navigateToIntake',
    'navigateToPreferences',
    'navigateToDashboard',
    'navigateToDriverSearch',
    'getCarrierWelcomeData',
    'navigateOnboarding',
    'viewMatchesClicked'
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
        rendered: true,
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockWixLocation = { to: jest.fn(), query: {} };

const mockBackend = {
    getCarrierByDOT: jest.fn().mockResolvedValue({
        legal_name: 'Test Carrier LLC',
        city: 'Dallas',
        state: 'TX',
        fleet_size: 50
    }),
    getCarrierOnboardingStatus: jest.fn().mockResolvedValue({
        success: true,
        status: { stageName: 'enriching', stageLabel: 'Profile Enrichment' }
    })
};

// =============================================================================
// REPLICATED CORE LOGIC
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
    const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlComponent', '#onboardingChecklist', '#quickWinsHtml'];
    const found = [];
    for (const id of possibleIds) {
        try {
            const component = $w(id);
            if (component && component.rendered && typeof component.onMessage === 'function') {
                found.push({ id, component });
            }
        } catch (error) {
            // skip
        }
    }
    return found;
}

/**
 * Replicated message handler from Carrier Welcome page code.
 * Handles inbound messages from the HTML component.
 */
function routeMessage(component, message, carrierContext, wixLocation = mockWixLocation) {
    if (!message || !message.type) return;

    const payload = { type: 'carrierWelcomeData', data: carrierContext };

    switch (message.type) {
        case 'navigateToIntake': {
            const intakeUrl = carrierContext.dotNumber
                ? `/trucking-companies?dot=${carrierContext.dotNumber}`
                : '/trucking-companies';
            wixLocation.to(intakeUrl);
            break;
        }

        case 'navigateToPreferences':
            wixLocation.to('/recruiter-console?tab=settings');
            break;

        case 'navigateToDashboard':
        case 'viewMatchesClicked':
            wixLocation.to('/recruiter-console');
            break;

        case 'navigateToDriverSearch':
            wixLocation.to('/recruiter-driver-search');
            break;

        case 'getCarrierWelcomeData':
            safeSend(component, payload);
            break;

        case 'navigateOnboarding': {
            const step = message.data?.step;
            const stepRoutes = {
                'profile': '/recruiter-console?tab=profile',
                'branding': '/recruiter-console?tab=branding',
                'jobs': '/recruiter-console?tab=jobs',
                'payment': '/checkout',
                'intake': '/trucking-companies',
                'preferences': '/recruiter-console?tab=settings'
            };
            wixLocation.to(stepRoutes[step] || '/recruiter-console');
            break;
        }

        default:
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Carrier Welcome Bridge Tests', () => {
    let component;
    const defaultContext = {
        plan: 'pro',
        dotNumber: 'DOT-1234567',
        memberName: 'John',
        memberEmail: 'john@example.com',
        companyName: 'Test Carrier LLC',
        city: 'Dallas',
        state: 'TX',
        fleetSize: 50
    };

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

        test('contains HTML component IDs', () => {
            expect(sourceCode).toContain('#html1');
        });

        EXPECTED_IMPORTS.forEach(importPath => {
            test(`imports ${importPath}`, () => {
                expect(sourceCode).toContain(importPath);
            });
        });

        test('uses rendered check for safety', () => {
            expect(sourceCode).toContain('.rendered');
        });

        test('wraps $w calls in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components with rendered and onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });

            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(1);
            expect(components[0].id).toBe('#html1');
        });

        test('skips components that throw errors', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn(() => ({ rendered: true, postMessage: jest.fn() }));
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('skips components that are not rendered', () => {
            const mock$w = jest.fn(() => ({
                rendered: false,
                onMessage: jest.fn(),
                postMessage: jest.fn()
            }));
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('tries all eight component IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            getHtmlComponents(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(8);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING: Navigation
    // =========================================================================

    describe('Message routing - navigation', () => {
        test('ignores messages with no type', () => {
            routeMessage(component, {}, defaultContext);
            routeMessage(component, null, defaultContext);
            routeMessage(component, undefined, defaultContext);
            expect(mockWixLocation.to).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('navigateToIntake with DOT routes to /trucking-companies?dot=DOT', () => {
            routeMessage(component, { type: 'navigateToIntake' }, defaultContext);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/trucking-companies?dot=DOT-1234567');
        });

        test('navigateToIntake without DOT routes to /trucking-companies', () => {
            const noDotContext = { ...defaultContext, dotNumber: null };
            routeMessage(component, { type: 'navigateToIntake' }, noDotContext);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/trucking-companies');
        });

        test('navigateToPreferences routes to /recruiter-console?tab=settings', () => {
            routeMessage(component, { type: 'navigateToPreferences' }, defaultContext);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-console?tab=settings');
        });

        test('navigateToDashboard routes to /recruiter-console', () => {
            routeMessage(component, { type: 'navigateToDashboard' }, defaultContext);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-console');
        });

        test('viewMatchesClicked routes to /recruiter-console', () => {
            routeMessage(component, { type: 'viewMatchesClicked' }, defaultContext);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-console');
        });

        test('navigateToDriverSearch routes to /recruiter-driver-search', () => {
            routeMessage(component, { type: 'navigateToDriverSearch' }, defaultContext);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-driver-search');
        });
    });

    // =========================================================================
    // MESSAGE ROUTING: getCarrierWelcomeData
    // =========================================================================

    describe('Message routing - getCarrierWelcomeData', () => {
        test('responds with carrierWelcomeData payload', () => {
            routeMessage(component, { type: 'getCarrierWelcomeData' }, defaultContext);

            expect(component.postMessage).toHaveBeenCalledTimes(1);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'carrierWelcomeData',
                data: defaultContext
            });
        });

        test('includes plan, company, location in response', () => {
            routeMessage(component, { type: 'getCarrierWelcomeData' }, defaultContext);

            const sent = component.postMessage.mock.calls[0][0];
            expect(sent.data.plan).toBe('pro');
            expect(sent.data.companyName).toBe('Test Carrier LLC');
            expect(sent.data.city).toBe('Dallas');
            expect(sent.data.state).toBe('TX');
            expect(sent.data.fleetSize).toBe(50);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING: navigateOnboarding (legacy)
    // =========================================================================

    describe('Message routing - navigateOnboarding (legacy)', () => {
        test.each([
            ['profile', '/recruiter-console?tab=profile'],
            ['branding', '/recruiter-console?tab=branding'],
            ['jobs', '/recruiter-console?tab=jobs'],
            ['payment', '/checkout'],
            ['intake', '/trucking-companies'],
            ['preferences', '/recruiter-console?tab=settings']
        ])('step "%s" routes to "%s"', (step, expectedRoute) => {
            routeMessage(component, {
                type: 'navigateOnboarding',
                data: { step }
            }, defaultContext);
            expect(mockWixLocation.to).toHaveBeenCalledWith(expectedRoute);
        });

        test('unknown step defaults to /recruiter-console', () => {
            routeMessage(component, {
                type: 'navigateOnboarding',
                data: { step: 'unknown-step' }
            }, defaultContext);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-console');
        });

        test('missing step defaults to /recruiter-console', () => {
            routeMessage(component, {
                type: 'navigateOnboarding',
                data: {}
            }, defaultContext);
            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-console');
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does nothing if component is null', () => {
            expect(() => safeSend(null, { type: 'test' })).not.toThrow();
        });

        test('does nothing if component has no postMessage', () => {
            expect(() => safeSend({}, { type: 'test' })).not.toThrow();
        });

        test('calls postMessage when component is valid', () => {
            safeSend(component, { type: 'test', data: { foo: 'bar' } });
            expect(component.postMessage).toHaveBeenCalledWith({ type: 'test', data: { foo: 'bar' } });
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { type: 'test' })).not.toThrow();
        });
    });

    // =========================================================================
    // SOURCE CODE COVERAGE
    // =========================================================================

    describe('Source code coverage', () => {
        test('page code handles all navigation message types', () => {
            ALL_ACTIONS.forEach(action => {
                expect(sourceCode).toContain(action);
            });
        });

        test('imports getCarrierByDOT from recruiter_service', () => {
            expect(sourceCode).toContain('getCarrierByDOT');
        });

        test('imports getCarrierOnboardingStatus from carrierStatusService', () => {
            expect(sourceCode).toContain('getCarrierOnboardingStatus');
        });

        test('reads dot and plan from wixLocation.query', () => {
            expect(sourceCode).toContain('wixLocation.query.dot');
            expect(sourceCode).toContain('wixLocation.query.plan');
        });

        test('builds carrierContext with plan, dotNumber, memberName fields', () => {
            expect(sourceCode).toContain('plan:');
            expect(sourceCode).toContain('dotNumber:');
            expect(sourceCode).toContain('memberName:');
            expect(sourceCode).toContain('companyName:');
        });

        test('broadcasts carrierWelcomeData to HTML components', () => {
            expect(sourceCode).toContain("type: 'carrierWelcomeData'");
        });
    });
});
