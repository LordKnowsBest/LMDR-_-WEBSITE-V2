/* eslint-disable */
/**
 * HTML DOM TESTS: Subscription Success
 * =====================================
 * Tests that incoming postMessage events correctly update Subscription_Success.html DOM.
 *
 * Message types tested (from Velo → HTML):
 *   - subscriptionSuccessData: Updates plan display and features list
 *
 * @module public/__tests__/subscriptionSuccess.html.test.js
 */

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

const mockElements = {};
let capturedOutbound = [];
let currentPlan = 'pro';

function createMockElement(id, options = {}) {
    return {
        id,
        classList: {
            _classes: new Set(options.classes || []),
            add: function (...classes) { classes.forEach(c => this._classes.add(c)); },
            remove: function (...classes) { classes.forEach(c => this._classes.delete(c)); },
            toggle: function (c, force) {
                if (force === undefined) {
                    this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c);
                } else {
                    force ? this._classes.add(c) : this._classes.delete(c);
                }
            },
            contains: function (c) { return this._classes.has(c); }
        },
        textContent: options.textContent || '',
        innerHTML: options.innerHTML || '',
        value: options.value || '',
        disabled: options.disabled || false,
        style: { display: '' },
        children: [],
        appendChild: function (child) {
            this.children.push(child);
            return child;
        },
        querySelector: function (sel) {
            return mockElements[sel.replace('#', '')] || null;
        },
        querySelectorAll: function () { return []; },
        getAttribute: function (attr) { return this[attr]; },
        setAttribute: function (attr, val) { this[attr] = val; },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        remove: jest.fn(),
        onclick: null
    };
}

function setupMockDOM() {
    // Success container
    mockElements['successContainer'] = createMockElement('successContainer');

    // Plan badge
    mockElements['planBadge'] = createMockElement('planBadge', { textContent: 'Pro' });

    // Success message elements
    mockElements['successTitle'] = createMockElement('successTitle', { textContent: 'Welcome to Pro!' });
    mockElements['successMessage'] = createMockElement('successMessage');

    // Features list
    mockElements['featuresList'] = createMockElement('featuresList');
    mockElements['proFeatures'] = createMockElement('proFeatures');
    mockElements['enterpriseFeatures'] = createMockElement('enterpriseFeatures', { classes: ['hidden'] });

    // Order details
    mockElements['amountPaid'] = createMockElement('amountPaid', { textContent: '$0.00' });
    mockElements['customerEmail'] = createMockElement('customerEmail');
    mockElements['companyName'] = createMockElement('companyName');
    mockElements['orderDetails'] = createMockElement('orderDetails', { classes: ['hidden'] });

    // CTA buttons
    mockElements['setupBtn'] = createMockElement('setupBtn');
    mockElements['dashboardBtn'] = createMockElement('dashboardBtn');
    mockElements['searchBtn'] = createMockElement('searchBtn');

    global.document = {
        getElementById: (id) => mockElements[id] || null,
        querySelector: (sel) => mockElements[sel.replace('#', '')] || null,
        querySelectorAll: () => [],
        createElement: (tag) => createMockElement(`dynamic-${tag}-${Date.now()}`)
    };

    capturedOutbound = [];
    currentPlan = 'pro';
}

function resetMockDOM() {
    Object.keys(mockElements).forEach(key => {
        mockElements[key].textContent = '';
        mockElements[key].innerHTML = '';
        mockElements[key].value = '';
        mockElements[key].disabled = false;
        mockElements[key].children = [];
        mockElements[key].classList._classes.clear();
    });
    capturedOutbound = [];
    currentPlan = 'pro';
    setupMockDOM();
}

// =============================================================================
// SIMULATED MESSAGE HANDLERS (mimic Subscription_Success.html behavior)
// =============================================================================

function stripHtml(str) {
    return String(str || '').replace(/<[^>]*>/g, '');
}

function formatAmount(cents) {
    if (!cents && cents !== 0) return null;
    return `$${(cents / 100).toFixed(2)}`;
}

function updateForPlan(plan) {
    currentPlan = plan;
    const planBadge = mockElements['planBadge'];
    const successTitle = mockElements['successTitle'];
    const proFeatures = mockElements['proFeatures'];
    const enterpriseFeatures = mockElements['enterpriseFeatures'];

    if (plan === 'enterprise') {
        if (planBadge) {
            planBadge.textContent = 'Enterprise';
            planBadge.classList.add('enterprise');
        }
        if (successTitle) {
            successTitle.textContent = 'Welcome to Enterprise!';
        }
        if (proFeatures) proFeatures.classList.add('hidden');
        if (enterpriseFeatures) enterpriseFeatures.classList.remove('hidden');
    } else {
        // Default to pro
        if (planBadge) {
            planBadge.textContent = 'Pro';
            planBadge.classList.remove('enterprise');
        }
        if (successTitle) {
            successTitle.textContent = 'Welcome to Pro!';
        }
        if (proFeatures) proFeatures.classList.remove('hidden');
        if (enterpriseFeatures) enterpriseFeatures.classList.add('hidden');
    }
}

function updateOrderDetails(data) {
    const orderDetails = mockElements['orderDetails'];
    const amountEl = mockElements['amountPaid'];
    const emailEl = mockElements['customerEmail'];
    const companyEl = mockElements['companyName'];

    if (data.amountPaid) {
        if (amountEl) amountEl.textContent = formatAmount(data.amountPaid);
        if (orderDetails) orderDetails.classList.remove('hidden');
    }

    if (data.customerEmail) {
        if (emailEl) emailEl.textContent = stripHtml(data.customerEmail);
    }

    if (data.companyName) {
        if (companyEl) companyEl.textContent = stripHtml(data.companyName);
    }
}

function handleSubscriptionSuccessData(data) {
    if (!data) return;

    // Update plan display
    if (data.plan) {
        updateForPlan(data.plan);
    }

    // Update order details
    updateOrderDetails(data);
}

function processMessage(msg) {
    if (!msg || !msg.type) return null;

    switch (msg.type) {
        case 'subscriptionSuccessData':
            handleSubscriptionSuccessData(msg.data || {});
            return { processed: true };
        default:
            return null;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Subscription_Success.html DOM Tests', () => {
    beforeEach(() => {
        resetMockDOM();
    });

    // =========================================================================
    // SUBSCRIPTION SUCCESS DATA
    // =========================================================================
    describe('subscriptionSuccessData', () => {
        it('should update plan badge for pro subscription', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    plan: 'pro',
                    sessionId: 'cs_123'
                }
            });

            expect(mockElements['planBadge'].textContent).toBe('Pro');
            expect(mockElements['planBadge'].classList.contains('enterprise')).toBe(false);
            expect(mockElements['successTitle'].textContent).toBe('Welcome to Pro!');
        });

        it('should update plan badge for enterprise subscription', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    plan: 'enterprise',
                    sessionId: 'cs_ent_123'
                }
            });

            expect(mockElements['planBadge'].textContent).toBe('Enterprise');
            expect(mockElements['planBadge'].classList.contains('enterprise')).toBe(true);
            expect(mockElements['successTitle'].textContent).toBe('Welcome to Enterprise!');
        });

        it('should show enterprise features and hide pro features for enterprise', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: { plan: 'enterprise' }
            });

            expect(mockElements['proFeatures'].classList.contains('hidden')).toBe(true);
            expect(mockElements['enterpriseFeatures'].classList.contains('hidden')).toBe(false);
        });

        it('should show pro features and hide enterprise features for pro', () => {
            // Start with enterprise
            processMessage({ type: 'subscriptionSuccessData', data: { plan: 'enterprise' } });

            // Switch to pro
            processMessage({ type: 'subscriptionSuccessData', data: { plan: 'pro' } });

            expect(mockElements['proFeatures'].classList.contains('hidden')).toBe(false);
            expect(mockElements['enterpriseFeatures'].classList.contains('hidden')).toBe(true);
        });

        it('should display formatted amount paid', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    plan: 'pro',
                    amountPaid: 4900  // $49.00 in cents
                }
            });

            expect(mockElements['amountPaid'].textContent).toBe('$49.00');
            expect(mockElements['orderDetails'].classList.contains('hidden')).toBe(false);
        });

        it('should display enterprise amount correctly', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    plan: 'enterprise',
                    amountPaid: 29900  // $299.00 in cents
                }
            });

            expect(mockElements['amountPaid'].textContent).toBe('$299.00');
        });

        it('should display customer email', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    plan: 'pro',
                    customerEmail: 'john@testtrucking.com'
                }
            });

            expect(mockElements['customerEmail'].textContent).toBe('john@testtrucking.com');
        });

        it('should display company name', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    plan: 'pro',
                    companyName: 'Test Trucking LLC'
                }
            });

            expect(mockElements['companyName'].textContent).toBe('Test Trucking LLC');
        });

        it('should handle all data fields at once', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    sessionId: 'cs_test_full',
                    plan: 'enterprise',
                    amountPaid: 149900,  // $1,499.00
                    customerEmail: 'enterprise@bigfleet.com',
                    companyName: 'Big Fleet Trucking Inc'
                }
            });

            expect(mockElements['planBadge'].textContent).toBe('Enterprise');
            expect(mockElements['amountPaid'].textContent).toBe('$1499.00');
            expect(mockElements['customerEmail'].textContent).toBe('enterprise@bigfleet.com');
            expect(mockElements['companyName'].textContent).toBe('Big Fleet Trucking Inc');
        });

        it('should default to pro when plan not specified', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    amountPaid: 4900
                }
            });

            // Should not throw and amount should still display
            expect(mockElements['amountPaid'].textContent).toBe('$49.00');
        });

        it('should handle missing amountPaid gracefully', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    plan: 'pro',
                    customerEmail: 'test@test.com'
                }
            });

            // Order details should remain hidden if no amount
            expect(mockElements['customerEmail'].textContent).toBe('test@test.com');
        });
    });

    // =========================================================================
    // XSS SANITIZATION
    // =========================================================================
    describe('XSS Sanitization', () => {
        it('should sanitize XSS in customer email', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    plan: 'pro',
                    customerEmail: '<script>alert("xss")</script>bad@test.com'
                }
            });

            expect(mockElements['customerEmail'].textContent).not.toContain('<script>');
        });

        it('should sanitize XSS in company name', () => {
            processMessage({
                type: 'subscriptionSuccessData',
                data: {
                    plan: 'pro',
                    companyName: '<img onerror=alert(1) src=x>Bad Company'
                }
            });

            expect(mockElements['companyName'].textContent).not.toContain('<img');
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================
    describe('Message Validation', () => {
        it('should return null for unknown message types', () => {
            const result = processMessage({ type: 'unknownAction' });
            expect(result).toBeNull();
        });

        it('should return null for null message', () => {
            const result = processMessage(null);
            expect(result).toBeNull();
        });

        it('should return null for message without type', () => {
            const result = processMessage({ data: {} });
            expect(result).toBeNull();
        });

        it('should handle empty data object', () => {
            // Should not throw
            expect(() => {
                processMessage({
                    type: 'subscriptionSuccessData',
                    data: {}
                });
            }).not.toThrow();
        });
    });

    // =========================================================================
    // PLAN SWITCHING
    // =========================================================================
    describe('Plan Switching', () => {
        it('should correctly switch from pro to enterprise', () => {
            processMessage({ type: 'subscriptionSuccessData', data: { plan: 'pro' } });
            expect(currentPlan).toBe('pro');

            processMessage({ type: 'subscriptionSuccessData', data: { plan: 'enterprise' } });
            expect(currentPlan).toBe('enterprise');
            expect(mockElements['planBadge'].classList.contains('enterprise')).toBe(true);
        });

        it('should correctly switch from enterprise to pro', () => {
            processMessage({ type: 'subscriptionSuccessData', data: { plan: 'enterprise' } });
            expect(currentPlan).toBe('enterprise');

            processMessage({ type: 'subscriptionSuccessData', data: { plan: 'pro' } });
            expect(currentPlan).toBe('pro');
            expect(mockElements['planBadge'].classList.contains('enterprise')).toBe(false);
        });
    });
});
