/* eslint-disable */
/**
 * BRIDGE TESTS: Checkout Page
 * ===========================
 * Tests the postMessage bridge between Checkout page code and HTML.
 *
 * This is a simple page with minimal inbound actions:
 *   - checkoutReady: HTML component signals it's ready for initialization
 *
 * Outbound messages (Velo → HTML):
 *   - initCheckout: Sends Stripe config (publishableKey, sessionId, etc.)
 *
 * @module public/__tests__/checkout.bridge.test.js
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockWixLocation = {
    query: { id: null },
    baseUrl: 'https://www.lastmiledr.app',
    url: 'https://www.lastmiledr.app/checkout'
};

// Mock backend services
const mockStripeService = {
    createPlacementDepositCheckout: jest.fn(),
    getPublishableKey: jest.fn()
};

const mockCarrierLeadsService = {
    getLeadDetails: jest.fn()
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

// Mock Wix elements
const mockElements = {
    errorMessage: { text: '', show: jest.fn(), hide: jest.fn() }
};

function resetMocks() {
    capturedMessages = [];
    mockComponent.postMessage.mockClear();
    mockComponent.onMessage.mockClear();

    mockStripeService.createPlacementDepositCheckout.mockReset();
    mockStripeService.getPublishableKey.mockReset();
    mockCarrierLeadsService.getLeadDetails.mockReset();

    mockWixLocation.query.id = null;
    mockElements.errorMessage.text = '';
    mockElements.errorMessage.show.mockClear();
}

// =============================================================================
// SIMULATED PAGE CODE BEHAVIOR
// =============================================================================

async function getCheckoutConfig(lead) {
    // Get Publishable Key
    const keyResult = await mockStripeService.getPublishableKey();
    if (!keyResult.success) throw new Error('Failed to load payment system');

    // Create Stripe checkout session
    const driverCount = parseInt(lead.driversNeeded) || 1;

    const sessionResult = await mockStripeService.createPlacementDepositCheckout(
        lead.companyName,
        lead.email,
        driverCount,
        mockWixLocation.baseUrl + '/payment-success',
        mockWixLocation.url,
        {
            leadId: lead._id,
            companyName: lead.companyName,
            contactName: lead.contactName,
            phone: lead.phone
        }
    );

    if (!sessionResult.success) {
        throw new Error(sessionResult.error);
    }

    return {
        publishableKey: keyResult.publishableKey,
        sessionId: sessionResult.sessionId,
        formattedAmount: `$${(driverCount * 100).toFixed(2)}`
    };
}

async function handleCheckoutReady(lead, component) {
    const checkoutConfig = await getCheckoutConfig(lead);

    component.postMessage({
        type: 'initCheckout',
        data: {
            publishableKey: checkoutConfig.publishableKey,
            sessionId: checkoutConfig.sessionId,
            driverCount: lead.driversNeeded,
            formattedAmount: checkoutConfig.formattedAmount
        }
    });
}

async function initPage(leadId) {
    if (!leadId) {
        return { error: 'No lead ID provided' };
    }

    try {
        const lead = await mockCarrierLeadsService.getLeadDetails(leadId);
        if (!lead) {
            return { error: 'Lead not found' };
        }

        return { success: true, lead };
    } catch (error) {
        return { error: error.message };
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Checkout Bridge Tests', () => {
    beforeEach(() => {
        resetMocks();
    });

    // =========================================================================
    // PAGE INITIALIZATION
    // =========================================================================
    describe('Page Initialization', () => {
        it('should error when no lead ID provided', async () => {
            mockWixLocation.query.id = null;

            const result = await initPage(null);

            expect(result.error).toBe('No lead ID provided');
        });

        it('should error when lead not found', async () => {
            mockCarrierLeadsService.getLeadDetails.mockResolvedValue(null);

            const result = await initPage('lead_123');

            expect(result.error).toBe('Lead not found');
        });

        it('should return lead on successful lookup', async () => {
            const mockLead = {
                _id: 'lead_123',
                companyName: 'Test Trucking',
                contactName: 'John Doe',
                email: 'john@test.com',
                phone: '555-123-4567',
                driversNeeded: 3
            };

            mockCarrierLeadsService.getLeadDetails.mockResolvedValue(mockLead);

            const result = await initPage('lead_123');

            expect(result.success).toBe(true);
            expect(result.lead.companyName).toBe('Test Trucking');
        });
    });

    // =========================================================================
    // CHECKOUT READY
    // =========================================================================
    describe('checkoutReady', () => {
        const mockLead = {
            _id: 'lead_123',
            companyName: 'Test Trucking Co',
            contactName: 'Jane Smith',
            email: 'jane@testtrucking.com',
            phone: '555-987-6543',
            driversNeeded: 5
        };

        it('should send initCheckout with config on checkoutReady', async () => {
            mockStripeService.getPublishableKey.mockResolvedValue({
                success: true,
                publishableKey: 'pk_test_abc123'
            });

            mockStripeService.createPlacementDepositCheckout.mockResolvedValue({
                success: true,
                sessionId: 'cs_test_xyz789'
            });

            await handleCheckoutReady(mockLead, mockComponent);

            expect(mockComponent.postMessage).toHaveBeenCalledWith({
                type: 'initCheckout',
                data: {
                    publishableKey: 'pk_test_abc123',
                    sessionId: 'cs_test_xyz789',
                    driverCount: 5,
                    formattedAmount: '$500.00'
                }
            });
        });

        it('should calculate correct amount for different driver counts', async () => {
            mockStripeService.getPublishableKey.mockResolvedValue({
                success: true,
                publishableKey: 'pk_test_abc123'
            });

            mockStripeService.createPlacementDepositCheckout.mockResolvedValue({
                success: true,
                sessionId: 'cs_test_xyz789'
            });

            const singleDriverLead = { ...mockLead, driversNeeded: 1 };
            await handleCheckoutReady(singleDriverLead, mockComponent);

            const lastCall = capturedMessages[capturedMessages.length - 1];
            expect(lastCall.data.formattedAmount).toBe('$100.00');
            expect(lastCall.data.driverCount).toBe(1);
        });

        it('should default to 1 driver if driversNeeded is missing', async () => {
            mockStripeService.getPublishableKey.mockResolvedValue({
                success: true,
                publishableKey: 'pk_test_abc123'
            });

            mockStripeService.createPlacementDepositCheckout.mockResolvedValue({
                success: true,
                sessionId: 'cs_test_xyz789'
            });

            const leadWithoutDrivers = { ...mockLead, driversNeeded: undefined };
            await handleCheckoutReady(leadWithoutDrivers, mockComponent);

            const lastCall = capturedMessages[capturedMessages.length - 1];
            expect(lastCall.data.formattedAmount).toBe('$100.00');
        });

        it('should throw error if getPublishableKey fails', async () => {
            mockStripeService.getPublishableKey.mockResolvedValue({
                success: false
            });

            await expect(handleCheckoutReady(mockLead, mockComponent))
                .rejects.toThrow('Failed to load payment system');
        });

        it('should throw error if createPlacementDepositCheckout fails', async () => {
            mockStripeService.getPublishableKey.mockResolvedValue({
                success: true,
                publishableKey: 'pk_test_abc123'
            });

            mockStripeService.createPlacementDepositCheckout.mockResolvedValue({
                success: false,
                error: 'Payment service unavailable'
            });

            await expect(handleCheckoutReady(mockLead, mockComponent))
                .rejects.toThrow('Payment service unavailable');
        });

        it('should include lead metadata in checkout session', async () => {
            mockStripeService.getPublishableKey.mockResolvedValue({
                success: true,
                publishableKey: 'pk_test_abc123'
            });

            mockStripeService.createPlacementDepositCheckout.mockResolvedValue({
                success: true,
                sessionId: 'cs_test_xyz789'
            });

            await handleCheckoutReady(mockLead, mockComponent);

            expect(mockStripeService.createPlacementDepositCheckout).toHaveBeenCalledWith(
                'Test Trucking Co',
                'jane@testtrucking.com',
                5,
                expect.stringContaining('/payment-success'),
                expect.any(String),
                expect.objectContaining({
                    leadId: 'lead_123',
                    companyName: 'Test Trucking Co',
                    contactName: 'Jane Smith',
                    phone: '555-987-6543'
                })
            );
        });
    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================
    describe('Edge Cases', () => {
        it('should handle lead lookup failure gracefully', async () => {
            mockCarrierLeadsService.getLeadDetails.mockRejectedValue(
                new Error('Database connection failed')
            );

            const result = await initPage('lead_123');

            expect(result.error).toBe('Database connection failed');
        });

        it('should handle numeric string for driversNeeded', async () => {
            mockStripeService.getPublishableKey.mockResolvedValue({
                success: true,
                publishableKey: 'pk_test_abc123'
            });

            mockStripeService.createPlacementDepositCheckout.mockResolvedValue({
                success: true,
                sessionId: 'cs_test_xyz789'
            });

            const leadWithStringCount = {
                _id: 'lead_123',
                companyName: 'Test',
                email: 'test@test.com',
                driversNeeded: '3'  // String instead of number
            };

            await handleCheckoutReady(leadWithStringCount, mockComponent);

            const lastCall = capturedMessages[capturedMessages.length - 1];
            expect(lastCall.data.driverCount).toBe('3');  // Preserved as-is
            expect(lastCall.data.formattedAmount).toBe('$300.00');  // Calculated correctly
        });
    });
});
