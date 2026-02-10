/* eslint-disable */
/**
 * ADMIN_BILLING_MANAGEMENT Bridge Tests
 *
 * Tests for src/backend/adminBillingService.jsw
 * and src/public/admin/ADMIN_BILLING_MANAGEMENT.html
 *
 * Verifies backend exports, HTML structure, postMessage bridge,
 * VelocityMatch branding, route message coverage, and approval workflows.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCES
// =============================================================================

const SERVICE_FILE = path.resolve(
    __dirname, '..', '..', 'backend', 'adminBillingService.jsw'
);
const HTML_FILE = path.resolve(
    __dirname, '..', 'admin', 'ADMIN_BILLING_MANAGEMENT.html'
);

const serviceCode = fs.readFileSync(SERVICE_FILE, 'utf8');
const htmlCode = fs.readFileSync(HTML_FILE, 'utf8');

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
    searchBillingCustomer: jest.fn().mockResolvedValue({
        success: true,
        results: [{ carrier_dot: '123456', company_name: 'Test Carrier', status: 'active' }]
    }),
    getBillingDetails: jest.fn().mockResolvedValue({
        success: true,
        subscription: { plan_type: 'pro', status: 'active', stripe_customer_id: 'cus_123' },
        billingHistory: [{ event_type: 'payment', amount: 99 }],
        adjustments: [],
        carrier: { company_name: 'Test Carrier', dot_number: 123456 }
    }),
    applyCredit: jest.fn().mockResolvedValue({ success: true, message: 'Credit applied' }),
    processRefund: jest.fn().mockResolvedValue({ success: true, message: 'Refund submitted' }),
    changeSubscriptionPlan: jest.fn().mockResolvedValue({ success: true, message: 'Plan changed' }),
    pauseSubscription: jest.fn().mockResolvedValue({ success: true, message: 'Subscription paused' }),
    cancelSubscription: jest.fn().mockResolvedValue({ success: true, message: 'Subscription cancelled' }),
    getBillingAdjustments: jest.fn().mockResolvedValue({ success: true, adjustments: [] }),
    getPendingApprovals: jest.fn().mockResolvedValue({
        success: true,
        pending: [{ _id: 'adj_1', type: 'credit', amount: 200, status: 'pending', carrier_dot: '123456' }]
    }),
    approveAdjustment: jest.fn().mockResolvedValue({ success: true, message: 'Approved' }),
    rejectAdjustment: jest.fn().mockResolvedValue({ success: true, message: 'Rejected' })
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

async function routeMessage(component, message, backend = mockBackend) {
    if (!message?.action) return;

    try {
        switch (message.action) {
            case 'searchCustomer': {
                if (!message.query) {
                    safeSend(component, { action: 'actionError', message: 'Missing search query' });
                    return;
                }
                const result = await backend.searchBillingCustomer(message.query);
                if (result.success) {
                    safeSend(component, { action: 'searchResults', payload: result });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'getBillingDetails': {
                if (!message.carrierDot) {
                    safeSend(component, { action: 'actionError', message: 'Missing carrier DOT' });
                    return;
                }
                const result = await backend.getBillingDetails(message.carrierDot);
                if (result.success) {
                    safeSend(component, { action: 'customerLoaded', payload: result });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'applyCredit': {
                if (!message.carrierDot || !message.amount || !message.reason) {
                    safeSend(component, { action: 'actionError', message: 'Missing required fields' });
                    return;
                }
                const result = await backend.applyCredit(message.carrierDot, message.amount, message.reason, 'admin');
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: result.message });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'processRefund': {
                if (!message.carrierDot || !message.invoiceId || !message.amount || !message.reason) {
                    safeSend(component, { action: 'actionError', message: 'Missing required fields' });
                    return;
                }
                const result = await backend.processRefund(message.carrierDot, message.invoiceId, message.amount, message.reason, 'admin');
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: result.message });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'changePlan': {
                if (!message.carrierDot || !message.newPlan) {
                    safeSend(component, { action: 'actionError', message: 'Missing required fields' });
                    return;
                }
                const result = await backend.changeSubscriptionPlan(message.carrierDot, message.newPlan, message.immediate || false);
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: result.message });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'pauseSubscription': {
                if (!message.carrierDot || !message.days) {
                    safeSend(component, { action: 'actionError', message: 'Missing required fields' });
                    return;
                }
                const result = await backend.pauseSubscription(message.carrierDot, message.days, message.reason || '');
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: result.message });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'cancelSubscription': {
                if (!message.carrierDot || !message.reason) {
                    safeSend(component, { action: 'actionError', message: 'Missing required fields' });
                    return;
                }
                const result = await backend.cancelSubscription(message.carrierDot, message.immediate || false, message.reason);
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: result.message });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'getPendingApprovals': {
                const result = await backend.getPendingApprovals();
                if (result.success) {
                    safeSend(component, { action: 'pendingApprovalsLoaded', payload: result });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'approveAdjustment': {
                if (!message.adjustmentId) {
                    safeSend(component, { action: 'actionError', message: 'Missing adjustment ID' });
                    return;
                }
                const result = await backend.approveAdjustment(message.adjustmentId, 'admin');
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: result.message });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
            case 'rejectAdjustment': {
                if (!message.adjustmentId) {
                    safeSend(component, { action: 'actionError', message: 'Missing adjustment ID' });
                    return;
                }
                const result = await backend.rejectAdjustment(message.adjustmentId, 'admin', message.notes || '');
                if (result.success) {
                    safeSend(component, { action: 'actionSuccess', message: result.message });
                } else {
                    safeSend(component, { action: 'actionError', message: result.error });
                }
                break;
            }
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

describe('ADMIN_BILLING_MANAGEMENT', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('backend service file exists', () => {
            expect(fs.existsSync(SERVICE_FILE)).toBe(true);
        });

        test('HTML file exists', () => {
            expect(fs.existsSync(HTML_FILE)).toBe(true);
        });

        test('backend imports from wix-members-backend', () => {
            expect(serviceCode).toContain("from 'wix-members-backend'");
        });

        test('backend imports from wix-secrets-backend', () => {
            expect(serviceCode).toContain("from 'wix-secrets-backend'");
        });

        test('backend imports dataAccess', () => {
            expect(serviceCode).toContain("from 'backend/dataAccess'");
        });
    });

    // =========================================================================
    // BACKEND EXPORT VERIFICATION
    // =========================================================================

    describe('Backend exports', () => {
        const expectedExports = [
            'searchBillingCustomer',
            'getBillingDetails',
            'applyCredit',
            'processRefund',
            'changeSubscriptionPlan',
            'pauseSubscription',
            'cancelSubscription',
            'getBillingAdjustments',
            'getPendingApprovals',
            'approveAdjustment',
            'rejectAdjustment'
        ];

        expectedExports.forEach(fn => {
            test(`exports ${fn}`, () => {
                expect(serviceCode).toMatch(new RegExp(`export\\s+async\\s+function\\s+${fn}\\s*\\(`));
            });
        });
    });

    // =========================================================================
    // BACKEND COLLECTION KEYS
    // =========================================================================

    describe('Backend collection usage', () => {
        test('uses carrierSubscriptions collection', () => {
            expect(serviceCode).toContain("'carrierSubscriptions'");
        });

        test('uses billingHistory collection', () => {
            expect(serviceCode).toContain("'billingHistory'");
        });

        test('uses billingAdjustments collection', () => {
            expect(serviceCode).toContain("'billingAdjustments'");
        });

        test('uses carriers collection', () => {
            expect(serviceCode).toContain("'carriers'");
        });

        test('uses auditLog collection', () => {
            expect(serviceCode).toContain("'auditLog'");
        });
    });

    // =========================================================================
    // BACKEND AUTH PATTERN
    // =========================================================================

    describe('Backend authorization', () => {
        test('defines requireAdmin function', () => {
            expect(serviceCode).toContain('async function requireAdmin()');
        });

        test('defines isAdmin function', () => {
            expect(serviceCode).toContain('async function isAdmin()');
        });

        test('all exported functions call requireAdmin', () => {
            const exportedFns = serviceCode.match(/export\s+async\s+function\s+\w+[\s\S]*?(?=export\s+async\s+function|\Z)/g) || [];
            for (const fn of exportedFns) {
                expect(fn).toContain('requireAdmin()');
            }
        });
    });

    // =========================================================================
    // HTML STRUCTURE CHECKS
    // =========================================================================

    describe('HTML structure', () => {
        test('has VelocityMatch branding (VM icon)', () => {
            expect(htmlCode).toContain('>VM</div>');
        });

        test('does not use LMDR branding', () => {
            expect(htmlCode).not.toMatch(/>\s*LM\s*<\/div>/);
            expect(htmlCode.toLowerCase()).not.toContain('lmdr driver');
        });

        test('title is VelocityMatch Billing Management', () => {
            expect(htmlCode).toContain('<title>VelocityMatch Billing Management</title>');
        });

        test('has search input', () => {
            expect(htmlCode).toContain('id="searchInput"');
        });

        test('has search dropdown', () => {
            expect(htmlCode).toContain('id="searchDropdown"');
        });

        test('has modal dialogs', () => {
            expect(htmlCode).toContain('id="changePlanModal"');
            expect(htmlCode).toContain('id="applyCreditModal"');
            expect(htmlCode).toContain('id="pauseModal"');
            expect(htmlCode).toContain('id="cancelModal"');
            expect(htmlCode).toContain('id="refundModal"');
        });

        test('has modal overlay', () => {
            expect(htmlCode).toContain('id="modalOverlay"');
        });

        test('has pending approvals panel', () => {
            expect(htmlCode).toContain('id="approvalsPanel"');
            expect(htmlCode).toContain('id="approvalsBody"');
        });

        test('has billing history table', () => {
            expect(htmlCode).toContain('id="billingHistoryBody"');
        });

        test('has adjustments timeline', () => {
            expect(htmlCode).toContain('id="adjustmentsTimeline"');
        });

        test('has customer details panel', () => {
            expect(htmlCode).toContain('id="customerPanel"');
        });

        test('has toast container', () => {
            expect(htmlCode).toContain('id="toastContainer"');
        });

        test('has usage progress bar', () => {
            expect(htmlCode).toContain('id="usageBar"');
        });
    });

    // =========================================================================
    // HTML POSTMESSAGE BRIDGE
    // =========================================================================

    describe('HTML postMessage bridge', () => {
        test('listens for message events', () => {
            expect(htmlCode).toContain("window.addEventListener('message'");
        });

        test('sends messages to parent', () => {
            expect(htmlCode).toContain("window.parent.postMessage(data, '*')");
        });

        test('handles init action', () => {
            expect(htmlCode).toContain("case 'init':");
        });

        test('handles searchResults action', () => {
            expect(htmlCode).toContain("case 'searchResults':");
        });

        test('handles customerLoaded action', () => {
            expect(htmlCode).toContain("case 'customerLoaded':");
        });

        test('handles billingHistoryLoaded action', () => {
            expect(htmlCode).toContain("case 'billingHistoryLoaded':");
        });

        test('handles adjustmentsLoaded action', () => {
            expect(htmlCode).toContain("case 'adjustmentsLoaded':");
        });

        test('handles pendingApprovalsLoaded action', () => {
            expect(htmlCode).toContain("case 'pendingApprovalsLoaded':");
        });

        test('handles actionSuccess', () => {
            expect(htmlCode).toContain("case 'actionSuccess':");
        });

        test('handles actionError', () => {
            expect(htmlCode).toContain("case 'actionError':");
        });

        test('sends searchCustomer action', () => {
            expect(htmlCode).toContain("action: 'searchCustomer'");
        });

        test('sends getBillingDetails action', () => {
            expect(htmlCode).toContain("action: 'getBillingDetails'");
        });

        test('sends applyCredit action', () => {
            expect(htmlCode).toContain("action: 'applyCredit'");
        });

        test('sends processRefund action', () => {
            expect(htmlCode).toContain("action: 'processRefund'");
        });

        test('sends changePlan action', () => {
            expect(htmlCode).toContain("action: 'changePlan'");
        });

        test('sends pauseSubscription action', () => {
            expect(htmlCode).toContain("action: 'pauseSubscription'");
        });

        test('sends cancelSubscription action', () => {
            expect(htmlCode).toContain("action: 'cancelSubscription'");
        });

        test('sends getPendingApprovals action', () => {
            expect(htmlCode).toContain("action: 'getPendingApprovals'");
        });

        test('sends approveAdjustment action', () => {
            expect(htmlCode).toContain("action: 'approveAdjustment'");
        });

        test('sends rejectAdjustment action', () => {
            expect(htmlCode).toContain("action: 'rejectAdjustment'");
        });
    });

    // =========================================================================
    // HTML STYLES
    // =========================================================================

    describe('HTML styles', () => {
        test('has Tailwind CDN', () => {
            expect(htmlCode).toContain('cdn.tailwindcss.com');
        });

        test('has inline Tailwind config (not external lmdr-config.js)', () => {
            expect(htmlCode).toContain('tailwind.config');
            expect(htmlCode).not.toContain('src="../lmdr-config.js"');
        });

        test('has Inter font', () => {
            expect(htmlCode).toContain('Inter');
        });

        test('has Material Symbols', () => {
            expect(htmlCode).toContain('Material+Symbols+Outlined');
        });

        test('has dark theme', () => {
            expect(htmlCode).toContain('class="dark"');
            expect(htmlCode).toContain('bg-slate-900');
        });

        test('has skeleton loading animation', () => {
            expect(htmlCode).toContain('@keyframes shimmer');
            expect(htmlCode).toContain('skeleton');
        });

        test('has toast animation', () => {
            expect(htmlCode).toContain('@keyframes slideIn');
        });

        test('has status badge classes', () => {
            expect(htmlCode).toContain('.status-active');
            expect(htmlCode).toContain('.status-paused');
            expect(htmlCode).toContain('.status-cancelled');
            expect(htmlCode).toContain('.status-pending');
        });

        test('has usage bar color classes', () => {
            expect(htmlCode).toContain('.usage-bar-green');
            expect(htmlCode).toContain('.usage-bar-yellow');
            expect(htmlCode).toContain('.usage-bar-red');
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages with no action', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('searchCustomer calls searchBillingCustomer and sends searchResults', async () => {
            await routeMessage(component, { action: 'searchCustomer', query: '123456' });
            expect(mockBackend.searchBillingCustomer).toHaveBeenCalledWith('123456');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'searchResults',
                payload: expect.objectContaining({ success: true })
            });
        });

        test('searchCustomer with missing query sends error', async () => {
            await routeMessage(component, { action: 'searchCustomer' });
            expect(mockBackend.searchBillingCustomer).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing search query'
            });
        });

        test('getBillingDetails calls backend and sends customerLoaded', async () => {
            await routeMessage(component, { action: 'getBillingDetails', carrierDot: '123456' });
            expect(mockBackend.getBillingDetails).toHaveBeenCalledWith('123456');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'customerLoaded',
                payload: expect.objectContaining({ success: true })
            });
        });

        test('getBillingDetails with missing DOT sends error', async () => {
            await routeMessage(component, { action: 'getBillingDetails' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing carrier DOT'
            });
        });

        test('applyCredit calls backend and sends actionSuccess', async () => {
            await routeMessage(component, {
                action: 'applyCredit',
                carrierDot: '123456',
                amount: 50,
                reason: 'Test credit'
            });
            expect(mockBackend.applyCredit).toHaveBeenCalledWith('123456', 50, 'Test credit', 'admin');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Credit applied'
            });
        });

        test('applyCredit with missing fields sends error', async () => {
            await routeMessage(component, { action: 'applyCredit', carrierDot: '123456' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing required fields'
            });
        });

        test('processRefund calls backend and sends actionSuccess', async () => {
            await routeMessage(component, {
                action: 'processRefund',
                carrierDot: '123456',
                invoiceId: 'inv_abc',
                amount: 25,
                reason: 'Overcharge'
            });
            expect(mockBackend.processRefund).toHaveBeenCalledWith('123456', 'inv_abc', 25, 'Overcharge', 'admin');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Refund submitted'
            });
        });

        test('processRefund with missing fields sends error', async () => {
            await routeMessage(component, { action: 'processRefund', carrierDot: '123456' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing required fields'
            });
        });

        test('changePlan calls changeSubscriptionPlan and sends actionSuccess', async () => {
            await routeMessage(component, {
                action: 'changePlan',
                carrierDot: '123456',
                newPlan: 'enterprise',
                immediate: true
            });
            expect(mockBackend.changeSubscriptionPlan).toHaveBeenCalledWith('123456', 'enterprise', true);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Plan changed'
            });
        });

        test('changePlan with missing fields sends error', async () => {
            await routeMessage(component, { action: 'changePlan' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing required fields'
            });
        });

        test('changePlan defaults immediate to false', async () => {
            await routeMessage(component, {
                action: 'changePlan',
                carrierDot: '123456',
                newPlan: 'pro'
            });
            expect(mockBackend.changeSubscriptionPlan).toHaveBeenCalledWith('123456', 'pro', false);
        });

        test('pauseSubscription calls backend and sends actionSuccess', async () => {
            await routeMessage(component, {
                action: 'pauseSubscription',
                carrierDot: '123456',
                days: 30,
                reason: 'Seasonal pause'
            });
            expect(mockBackend.pauseSubscription).toHaveBeenCalledWith('123456', 30, 'Seasonal pause');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Subscription paused'
            });
        });

        test('pauseSubscription with missing fields sends error', async () => {
            await routeMessage(component, { action: 'pauseSubscription', carrierDot: '123456' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing required fields'
            });
        });

        test('pauseSubscription defaults reason to empty string', async () => {
            await routeMessage(component, {
                action: 'pauseSubscription',
                carrierDot: '123456',
                days: 7
            });
            expect(mockBackend.pauseSubscription).toHaveBeenCalledWith('123456', 7, '');
        });

        test('cancelSubscription calls backend and sends actionSuccess', async () => {
            await routeMessage(component, {
                action: 'cancelSubscription',
                carrierDot: '123456',
                immediate: true,
                reason: 'Customer request'
            });
            expect(mockBackend.cancelSubscription).toHaveBeenCalledWith('123456', true, 'Customer request');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Subscription cancelled'
            });
        });

        test('cancelSubscription with missing reason sends error', async () => {
            await routeMessage(component, { action: 'cancelSubscription', carrierDot: '123456' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing required fields'
            });
        });

        test('cancelSubscription defaults immediate to false', async () => {
            await routeMessage(component, {
                action: 'cancelSubscription',
                carrierDot: '123456',
                reason: 'End of contract'
            });
            expect(mockBackend.cancelSubscription).toHaveBeenCalledWith('123456', false, 'End of contract');
        });

        test('getPendingApprovals calls backend and sends pendingApprovalsLoaded', async () => {
            await routeMessage(component, { action: 'getPendingApprovals' });
            expect(mockBackend.getPendingApprovals).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'pendingApprovalsLoaded',
                payload: expect.objectContaining({ success: true })
            });
        });

        test('unknown action does not send any message', async () => {
            await routeMessage(component, { action: 'nonExistentAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // APPROVAL WORKFLOW
    // =========================================================================

    describe('Approval workflow', () => {
        test('approveAdjustment calls backend and sends actionSuccess', async () => {
            await routeMessage(component, {
                action: 'approveAdjustment',
                adjustmentId: 'adj_1'
            });
            expect(mockBackend.approveAdjustment).toHaveBeenCalledWith('adj_1', 'admin');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Approved'
            });
        });

        test('approveAdjustment with missing ID sends error', async () => {
            await routeMessage(component, { action: 'approveAdjustment' });
            expect(mockBackend.approveAdjustment).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing adjustment ID'
            });
        });

        test('rejectAdjustment calls backend with notes and sends actionSuccess', async () => {
            await routeMessage(component, {
                action: 'rejectAdjustment',
                adjustmentId: 'adj_1',
                notes: 'Invalid request'
            });
            expect(mockBackend.rejectAdjustment).toHaveBeenCalledWith('adj_1', 'admin', 'Invalid request');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                message: 'Rejected'
            });
        });

        test('rejectAdjustment with missing ID sends error', async () => {
            await routeMessage(component, { action: 'rejectAdjustment' });
            expect(mockBackend.rejectAdjustment).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing adjustment ID'
            });
        });

        test('rejectAdjustment defaults notes to empty string', async () => {
            await routeMessage(component, {
                action: 'rejectAdjustment',
                adjustmentId: 'adj_2'
            });
            expect(mockBackend.rejectAdjustment).toHaveBeenCalledWith('adj_2', 'admin', '');
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('searchCustomer failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                searchBillingCustomer: jest.fn().mockRejectedValue(new Error('Search failed'))
            };
            await routeMessage(component, { action: 'searchCustomer', query: 'test' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Search failed'
            });
        });

        test('getBillingDetails failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getBillingDetails: jest.fn().mockRejectedValue(new Error('Billing fetch failed'))
            };
            await routeMessage(component, { action: 'getBillingDetails', carrierDot: '123' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Billing fetch failed'
            });
        });

        test('applyCredit failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                applyCredit: jest.fn().mockRejectedValue(new Error('Credit failed'))
            };
            await routeMessage(component, {
                action: 'applyCredit', carrierDot: '123', amount: 50, reason: 'test'
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Credit failed'
            });
        });

        test('changeSubscriptionPlan failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                changeSubscriptionPlan: jest.fn().mockRejectedValue(new Error('Plan change failed'))
            };
            await routeMessage(component, {
                action: 'changePlan', carrierDot: '123', newPlan: 'pro'
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Plan change failed'
            });
        });

        test('pauseSubscription failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                pauseSubscription: jest.fn().mockRejectedValue(new Error('Pause failed'))
            };
            await routeMessage(component, {
                action: 'pauseSubscription', carrierDot: '123', days: 30
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Pause failed'
            });
        });

        test('cancelSubscription failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                cancelSubscription: jest.fn().mockRejectedValue(new Error('Cancel failed'))
            };
            await routeMessage(component, {
                action: 'cancelSubscription', carrierDot: '123', reason: 'test'
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Cancel failed'
            });
        });

        test('approveAdjustment failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                approveAdjustment: jest.fn().mockRejectedValue(new Error('Approve failed'))
            };
            await routeMessage(component, {
                action: 'approveAdjustment', adjustmentId: 'adj_1'
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Approve failed'
            });
        });

        test('rejectAdjustment failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                rejectAdjustment: jest.fn().mockRejectedValue(new Error('Reject failed'))
            };
            await routeMessage(component, {
                action: 'rejectAdjustment', adjustmentId: 'adj_1'
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Reject failed'
            });
        });

        test('error with no message falls back to generic message', async () => {
            const failBackend = {
                ...mockBackend,
                getPendingApprovals: jest.fn().mockRejectedValue({})
            };
            await routeMessage(component, { action: 'getPendingApprovals' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'An unexpected error occurred'
            });
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
    // =========================================================================

    describe('Backend service call verification', () => {
        test('searchCustomer only calls searchBillingCustomer once', async () => {
            await routeMessage(component, { action: 'searchCustomer', query: 'test' });
            expect(mockBackend.searchBillingCustomer).toHaveBeenCalledTimes(1);
        });

        test('applyCredit passes adminId through to backend', async () => {
            await routeMessage(component, {
                action: 'applyCredit',
                carrierDot: '123',
                amount: 50,
                reason: 'Test'
            });
            expect(mockBackend.applyCredit).toHaveBeenCalledWith('123', 50, 'Test', 'admin');
        });

        test('processRefund passes all parameters to backend', async () => {
            await routeMessage(component, {
                action: 'processRefund',
                carrierDot: '123',
                invoiceId: 'inv_abc',
                amount: 25,
                reason: 'Overcharge'
            });
            expect(mockBackend.processRefund).toHaveBeenCalledWith('123', 'inv_abc', 25, 'Overcharge', 'admin');
        });

        test('changePlan passes immediate flag to backend', async () => {
            await routeMessage(component, {
                action: 'changePlan',
                carrierDot: '123',
                newPlan: 'enterprise',
                immediate: true
            });
            expect(mockBackend.changeSubscriptionPlan).toHaveBeenCalledWith('123', 'enterprise', true);
        });

        test('cancelSubscription passes reason and immediate to backend', async () => {
            await routeMessage(component, {
                action: 'cancelSubscription',
                carrierDot: '123',
                immediate: true,
                reason: 'Customer request'
            });
            expect(mockBackend.cancelSubscription).toHaveBeenCalledWith('123', true, 'Customer request');
        });
    });
});
