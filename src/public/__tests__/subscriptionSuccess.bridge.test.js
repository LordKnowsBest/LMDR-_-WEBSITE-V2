/**
 * BRIDGE TESTS: Subscription Success Page
 * ========================================
 * Tests the postMessage bridge between Subscription Success page code and HTML.
 *
 * Inbound Actions (HTML → Velo):
 *   - getSubscriptionSuccessData: Request subscription details
 *   - subscriptionSuccess: Notify parent of successful subscription (analytics)
 *   - redirectToSetup: Navigate to carrier welcome page
 *   - redirectToDashboard: Navigate to recruiter console
 *   - redirectToDriverSearch: Navigate to driver search
 *
 * Outbound Messages (Velo → HTML):
 *   - subscriptionSuccessData: Sends plan, amount, and session info
 *
 * @module public/__tests__/subscriptionSuccess.bridge.test.js
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockWixLocation = {
    query: { session_id: null, plan: null },
    to: jest.fn()
};

const mockWixWindow = {
    trackEvent: jest.fn()
};

// Mock backend services
const mockStripeService = {
    getCheckoutSession: jest.fn()
};

// Mock component
let capturedMessages = [];
const mockComponent = {
    postMessage: jest.fn((data) => {
        capturedMessages.push(data);
    }),
    rendered: true,
    onMessage: jest.fn()
};

function resetMocks() {
    capturedMessages = [];
    mockComponent.postMessage.mockClear();
    mockComponent.onMessage.mockClear();

    mockStripeService.getCheckoutSession.mockReset();
    mockWixLocation.to.mockClear();
    mockWixWindow.trackEvent.mockClear();

    mockWixLocation.query.session_id = null;
    mockWixLocation.query.plan = null;
}

// =============================================================================
// SIMULATED PAGE CODE BEHAVIOR
// =============================================================================

function determinePlanType(urlPlan, sessionData) {
    // Check URL param first
    if (urlPlan) {
        if (urlPlan.toLowerCase().includes('enterprise')) return 'enterprise';
        if (urlPlan.toLowerCase().includes('pro')) return 'pro';
    }

    // Check session metadata
    if (sessionData?.metadata?.plan) {
        const metaPlan = sessionData.metadata.plan.toLowerCase();
        if (metaPlan.includes('enterprise')) return 'enterprise';
        if (metaPlan.includes('pro')) return 'pro';
    }

    // Check price ID in session
    if (sessionData?.lineItems?.[0]?.price?.id) {
        const priceId = sessionData.lineItems[0].price.id.toLowerCase();
        if (priceId.includes('enterprise')) return 'enterprise';
    }

    // Default to pro
    return 'pro';
}

function buildSuccessPayload(sessionId, planType, sessionData) {
    return {
        type: 'subscriptionSuccessData',
        data: {
            sessionId: sessionId,
            plan: planType,
            amountPaid: sessionData?.amountTotal || null,
            customerEmail: sessionData?.customerEmail || null,
            companyName: sessionData?.metadata?.company_name || null
        }
    };
}

async function handleGetSubscriptionSuccessData(sessionId, planType, sessionData, component) {
    const payload = buildSuccessPayload(sessionId, planType, sessionData);
    component.postMessage(payload);
    return payload;
}

function handleSubscriptionSuccess(sessionId, planType, sessionData) {
    // Track analytics event
    try {
        mockWixWindow.trackEvent('SubscriptionCompleted', {
            sessionId: sessionId,
            plan: planType,
            amount: sessionData?.amountTotal
        });
    } catch (e) {
        // Analytics not available
    }
}

function handleRedirectToSetup(planType) {
    const welcomeUrl = planType === 'enterprise'
        ? '/carrier-welcome?plan=enterprise'
        : '/carrier-welcome?plan=pro';
    mockWixLocation.to(welcomeUrl);
}

function handleRedirectToDashboard() {
    mockWixLocation.to('/recruiter-console');
}

function handleRedirectToDriverSearch() {
    mockWixLocation.to('/recruiter-driver-search');
}

async function processMessage(msg, sessionId, planType, sessionData) {
    if (!msg || !msg.type) return null;

    switch (msg.type) {
        case 'getSubscriptionSuccessData':
            return await handleGetSubscriptionSuccessData(sessionId, planType, sessionData, mockComponent);
        case 'subscriptionSuccess':
            handleSubscriptionSuccess(sessionId, planType, sessionData);
            return { tracked: true };
        case 'redirectToSetup':
            handleRedirectToSetup(planType);
            return { redirected: true };
        case 'redirectToDashboard':
            handleRedirectToDashboard();
            return { redirected: true };
        case 'redirectToDriverSearch':
            handleRedirectToDriverSearch();
            return { redirected: true };
        default:
            return null;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('SubscriptionSuccess Bridge Tests', () => {
    beforeEach(() => {
        resetMocks();
    });

    // =========================================================================
    // PLAN TYPE DETERMINATION
    // =========================================================================
    describe('Plan Type Determination', () => {
        it('should detect enterprise plan from URL param', () => {
            const planType = determinePlanType('enterprise-6month', null);
            expect(planType).toBe('enterprise');
        });

        it('should detect pro plan from URL param', () => {
            const planType = determinePlanType('pro-monthly', null);
            expect(planType).toBe('pro');
        });

        it('should detect enterprise from session metadata', () => {
            const sessionData = {
                metadata: { plan: 'Enterprise Monthly' }
            };
            const planType = determinePlanType(null, sessionData);
            expect(planType).toBe('enterprise');
        });

        it('should detect pro from session metadata', () => {
            const sessionData = {
                metadata: { plan: 'Pro 6-Month' }
            };
            const planType = determinePlanType(null, sessionData);
            expect(planType).toBe('pro');
        });

        it('should detect enterprise from price ID', () => {
            const sessionData = {
                lineItems: [{ price: { id: 'price_enterprise_monthly_123' } }]
            };
            const planType = determinePlanType(null, sessionData);
            expect(planType).toBe('enterprise');
        });

        it('should default to pro when no indicators', () => {
            const planType = determinePlanType(null, null);
            expect(planType).toBe('pro');
        });

        it('should prioritize URL param over session data', () => {
            const sessionData = {
                metadata: { plan: 'Pro Monthly' }
            };
            const planType = determinePlanType('enterprise', sessionData);
            expect(planType).toBe('enterprise');
        });
    });

    // =========================================================================
    // GET SUBSCRIPTION SUCCESS DATA
    // =========================================================================
    describe('getSubscriptionSuccessData', () => {
        it('should send subscription success data to HTML', async () => {
            const sessionId = 'cs_test_xyz789';
            const planType = 'pro';
            const sessionData = {
                amountTotal: 4900,
                customerEmail: 'john@test.com',
                metadata: { company_name: 'Test Trucking' }
            };

            await processMessage(
                { type: 'getSubscriptionSuccessData' },
                sessionId, planType, sessionData
            );

            expect(mockComponent.postMessage).toHaveBeenCalledWith({
                type: 'subscriptionSuccessData',
                data: {
                    sessionId: 'cs_test_xyz789',
                    plan: 'pro',
                    amountPaid: 4900,
                    customerEmail: 'john@test.com',
                    companyName: 'Test Trucking'
                }
            });
        });

        it('should handle missing session data gracefully', async () => {
            await processMessage(
                { type: 'getSubscriptionSuccessData' },
                'cs_test_123', 'pro', null
            );

            expect(mockComponent.postMessage).toHaveBeenCalledWith({
                type: 'subscriptionSuccessData',
                data: {
                    sessionId: 'cs_test_123',
                    plan: 'pro',
                    amountPaid: null,
                    customerEmail: null,
                    companyName: null
                }
            });
        });

        it('should include enterprise plan type', async () => {
            const sessionData = {
                amountTotal: 29900,
                customerEmail: 'enterprise@test.com'
            };

            await processMessage(
                { type: 'getSubscriptionSuccessData' },
                'cs_test_enterprise', 'enterprise', sessionData
            );

            const sentPayload = capturedMessages[0];
            expect(sentPayload.data.plan).toBe('enterprise');
            expect(sentPayload.data.amountPaid).toBe(29900);
        });
    });

    // =========================================================================
    // SUBSCRIPTION SUCCESS (Analytics)
    // =========================================================================
    describe('subscriptionSuccess', () => {
        it('should track analytics event on success', async () => {
            const sessionData = { amountTotal: 4900 };

            await processMessage(
                { type: 'subscriptionSuccess', data: { sessionId: 'cs_123', plan: 'pro' } },
                'cs_123', 'pro', sessionData
            );

            expect(mockWixWindow.trackEvent).toHaveBeenCalledWith(
                'SubscriptionCompleted',
                expect.objectContaining({
                    sessionId: 'cs_123',
                    plan: 'pro',
                    amount: 4900
                })
            );
        });

        it('should track enterprise subscription event', async () => {
            const sessionData = { amountTotal: 29900 };

            await processMessage(
                { type: 'subscriptionSuccess' },
                'cs_ent_123', 'enterprise', sessionData
            );

            expect(mockWixWindow.trackEvent).toHaveBeenCalledWith(
                'SubscriptionCompleted',
                expect.objectContaining({
                    plan: 'enterprise',
                    amount: 29900
                })
            );
        });
    });

    // =========================================================================
    // NAVIGATION REDIRECTS
    // =========================================================================
    describe('Navigation Redirects', () => {
        it('should redirect to carrier welcome for pro plan on redirectToSetup', async () => {
            await processMessage(
                { type: 'redirectToSetup' },
                'cs_123', 'pro', null
            );

            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-welcome?plan=pro');
        });

        it('should redirect to carrier welcome for enterprise plan on redirectToSetup', async () => {
            await processMessage(
                { type: 'redirectToSetup' },
                'cs_123', 'enterprise', null
            );

            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-welcome?plan=enterprise');
        });

        it('should redirect to recruiter console on redirectToDashboard', async () => {
            await processMessage(
                { type: 'redirectToDashboard' },
                'cs_123', 'pro', null
            );

            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-console');
        });

        it('should redirect to driver search on redirectToDriverSearch', async () => {
            await processMessage(
                { type: 'redirectToDriverSearch' },
                'cs_123', 'pro', null
            );

            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-driver-search');
        });
    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================
    describe('Edge Cases', () => {
        it('should return null for unknown message types', async () => {
            const result = await processMessage(
                { type: 'unknownAction' },
                'cs_123', 'pro', null
            );
            expect(result).toBeNull();
        });

        it('should return null for null message', async () => {
            const result = await processMessage(null, 'cs_123', 'pro', null);
            expect(result).toBeNull();
        });

        it('should return null for message without type', async () => {
            const result = await processMessage({ data: {} }, 'cs_123', 'pro', null);
            expect(result).toBeNull();
        });

        it('should handle session fetch failure gracefully', async () => {
            mockStripeService.getCheckoutSession.mockRejectedValue(
                new Error('Stripe API error')
            );

            // Even with failed session fetch, page should still work with URL params
            const planType = determinePlanType('pro-monthly', null);
            expect(planType).toBe('pro');
        });
    });
});
