/**
 * HTML DOM TESTS: Checkout Component
 * ===================================
 * Tests that incoming postMessage events correctly initialize the Stripe checkout.
 *
 * Message types tested (from Velo → HTML):
 *   - initCheckout: Initializes Stripe Elements with config
 *
 * This test simulates a minimal Stripe-based checkout HTML component behavior.
 *
 * @module public/__tests__/checkout.html.test.js
 */

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

const mockElements = {};
let capturedOutbound = [];
let stripeState = null;

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
        style: {},
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
    // Checkout UI elements
    mockElements['checkoutContainer'] = createMockElement('checkoutContainer', { classes: ['hidden'] });
    mockElements['loadingState'] = createMockElement('loadingState');
    mockElements['errorState'] = createMockElement('errorState', { classes: ['hidden'] });
    mockElements['errorMessage'] = createMockElement('errorMessage');

    // Order summary
    mockElements['orderSummary'] = createMockElement('orderSummary', { classes: ['hidden'] });
    mockElements['driverCount'] = createMockElement('driverCount', { textContent: '0' });
    mockElements['totalAmount'] = createMockElement('totalAmount', { textContent: '$0.00' });
    mockElements['pricePerDriver'] = createMockElement('pricePerDriver', { textContent: '$100.00' });

    // Stripe elements container
    mockElements['cardElement'] = createMockElement('cardElement');
    mockElements['paymentElement'] = createMockElement('paymentElement');

    // Buttons
    mockElements['submitBtn'] = createMockElement('submitBtn', { disabled: true });
    mockElements['cancelBtn'] = createMockElement('cancelBtn');

    global.document = {
        getElementById: (id) => mockElements[id] || null,
        querySelector: (sel) => mockElements[sel.replace('#', '')] || null,
        querySelectorAll: () => [],
        createElement: (tag) => createMockElement(`dynamic-${tag}-${Date.now()}`)
    };

    capturedOutbound = [];
    stripeState = null;
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
    stripeState = null;
    setupMockDOM();
}

// =============================================================================
// SIMULATED MESSAGE HANDLERS (mimic checkout HTML behavior)
// =============================================================================

function stripHtml(str) {
    return String(str || '').replace(/<[^>]*>/g, '');
}

function showLoading(show) {
    const loadingEl = mockElements['loadingState'];
    const checkoutEl = mockElements['checkoutContainer'];

    if (loadingEl) {
        show ? loadingEl.classList.remove('hidden') : loadingEl.classList.add('hidden');
    }
    if (checkoutEl) {
        show ? checkoutEl.classList.add('hidden') : checkoutEl.classList.remove('hidden');
    }
}

function showError(message) {
    const errorEl = mockElements['errorState'];
    const messageEl = mockElements['errorMessage'];
    const checkoutEl = mockElements['checkoutContainer'];

    if (errorEl) errorEl.classList.remove('hidden');
    if (messageEl) messageEl.textContent = stripHtml(message);
    if (checkoutEl) checkoutEl.classList.add('hidden');
}

function initStripe(publishableKey) {
    // Simulate Stripe initialization
    stripeState = {
        publishableKey,
        initialized: true,
        elements: null,
        checkout: null
    };
    return stripeState;
}

function mountPaymentElement(sessionId) {
    if (!stripeState || !stripeState.initialized) {
        throw new Error('Stripe not initialized');
    }

    stripeState.checkout = {
        sessionId,
        mounted: true
    };

    // Simulate mounting
    const paymentEl = mockElements['paymentElement'];
    if (paymentEl) {
        paymentEl.setAttribute('data-session-id', sessionId);
        paymentEl.setAttribute('data-mounted', 'true');
    }

    return stripeState.checkout;
}

function updateOrderSummary(driverCount, formattedAmount) {
    const summaryEl = mockElements['orderSummary'];
    const countEl = mockElements['driverCount'];
    const amountEl = mockElements['totalAmount'];

    if (summaryEl) summaryEl.classList.remove('hidden');
    if (countEl) countEl.textContent = String(driverCount || 0);
    if (amountEl) amountEl.textContent = formattedAmount || '$0.00';
}

function enableSubmit() {
    const submitBtn = mockElements['submitBtn'];
    if (submitBtn) {
        submitBtn.disabled = false;
    }
}

function handleInitCheckout(data) {
    if (!data.publishableKey) {
        showError('Payment configuration missing');
        return { success: false, error: 'No publishable key' };
    }

    if (!data.sessionId) {
        showError('Checkout session missing');
        return { success: false, error: 'No session ID' };
    }

    try {
        // Hide loading, show checkout
        showLoading(false);

        // Initialize Stripe
        initStripe(data.publishableKey);

        // Mount payment element
        mountPaymentElement(data.sessionId);

        // Update order summary
        updateOrderSummary(data.driverCount, data.formattedAmount);

        // Enable submit button
        enableSubmit();

        return { success: true };
    } catch (error) {
        showError(error.message || 'Failed to initialize checkout');
        return { success: false, error: error.message };
    }
}

function processMessage(msg) {
    if (!msg || !msg.type) return null;

    switch (msg.type) {
        case 'initCheckout':
            return handleInitCheckout(msg.data || {});
        default:
            return null;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Checkout HTML DOM Tests', () => {
    beforeEach(() => {
        resetMockDOM();
    });

    // =========================================================================
    // INIT CHECKOUT
    // =========================================================================
    describe('initCheckout', () => {
        it('should initialize Stripe with publishable key', () => {
            processMessage({
                type: 'initCheckout',
                data: {
                    publishableKey: 'pk_test_abc123',
                    sessionId: 'cs_test_xyz789',
                    driverCount: 3,
                    formattedAmount: '$300.00'
                }
            });

            expect(stripeState.initialized).toBe(true);
            expect(stripeState.publishableKey).toBe('pk_test_abc123');
        });

        it('should mount payment element with session ID', () => {
            processMessage({
                type: 'initCheckout',
                data: {
                    publishableKey: 'pk_test_abc123',
                    sessionId: 'cs_test_xyz789',
                    driverCount: 5,
                    formattedAmount: '$500.00'
                }
            });

            expect(mockElements['paymentElement'].getAttribute('data-session-id')).toBe('cs_test_xyz789');
            expect(mockElements['paymentElement'].getAttribute('data-mounted')).toBe('true');
        });

        it('should update order summary with driver count and amount', () => {
            processMessage({
                type: 'initCheckout',
                data: {
                    publishableKey: 'pk_test_abc123',
                    sessionId: 'cs_test_xyz789',
                    driverCount: 10,
                    formattedAmount: '$1,000.00'
                }
            });

            expect(mockElements['orderSummary'].classList.contains('hidden')).toBe(false);
            expect(mockElements['driverCount'].textContent).toBe('10');
            expect(mockElements['totalAmount'].textContent).toBe('$1,000.00');
        });

        it('should hide loading and show checkout container', () => {
            mockElements['loadingState'].classList.remove('hidden');
            mockElements['checkoutContainer'].classList.add('hidden');

            processMessage({
                type: 'initCheckout',
                data: {
                    publishableKey: 'pk_test_abc123',
                    sessionId: 'cs_test_xyz789',
                    driverCount: 1,
                    formattedAmount: '$100.00'
                }
            });

            expect(mockElements['loadingState'].classList.contains('hidden')).toBe(true);
            expect(mockElements['checkoutContainer'].classList.contains('hidden')).toBe(false);
        });

        it('should enable submit button after initialization', () => {
            mockElements['submitBtn'].disabled = true;

            processMessage({
                type: 'initCheckout',
                data: {
                    publishableKey: 'pk_test_abc123',
                    sessionId: 'cs_test_xyz789',
                    driverCount: 1,
                    formattedAmount: '$100.00'
                }
            });

            expect(mockElements['submitBtn'].disabled).toBe(false);
        });

        it('should show error when publishable key missing', () => {
            const result = processMessage({
                type: 'initCheckout',
                data: {
                    sessionId: 'cs_test_xyz789',
                    driverCount: 1
                }
            });

            expect(result.success).toBe(false);
            expect(mockElements['errorState'].classList.contains('hidden')).toBe(false);
            expect(mockElements['errorMessage'].textContent).toContain('configuration');
        });

        it('should show error when session ID missing', () => {
            const result = processMessage({
                type: 'initCheckout',
                data: {
                    publishableKey: 'pk_test_abc123',
                    driverCount: 1
                }
            });

            expect(result.success).toBe(false);
            expect(mockElements['errorState'].classList.contains('hidden')).toBe(false);
            expect(mockElements['errorMessage'].textContent).toContain('session');
        });

        it('should handle single driver checkout', () => {
            processMessage({
                type: 'initCheckout',
                data: {
                    publishableKey: 'pk_test_abc123',
                    sessionId: 'cs_test_xyz789',
                    driverCount: 1,
                    formattedAmount: '$100.00'
                }
            });

            expect(mockElements['driverCount'].textContent).toBe('1');
            expect(mockElements['totalAmount'].textContent).toBe('$100.00');
        });

        it('should handle missing driver count gracefully', () => {
            processMessage({
                type: 'initCheckout',
                data: {
                    publishableKey: 'pk_test_abc123',
                    sessionId: 'cs_test_xyz789',
                    formattedAmount: '$100.00'
                }
            });

            expect(mockElements['driverCount'].textContent).toBe('0');
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================
    describe('Error Handling', () => {
        it('should display error message and hide checkout on error', () => {
            showError('Payment processing failed');

            expect(mockElements['errorState'].classList.contains('hidden')).toBe(false);
            expect(mockElements['errorMessage'].textContent).toBe('Payment processing failed');
            expect(mockElements['checkoutContainer'].classList.contains('hidden')).toBe(true);
        });

        it('should sanitize XSS in error messages', () => {
            showError('<script>alert("xss")</script>Bad error');

            expect(mockElements['errorMessage'].textContent).not.toContain('<script>');
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
    });
});
