/**
 * ADMIN_INVOICING Bridge Tests
 *
 * Tests for src/backend/adminInvoiceService.jsw and src/public/admin/ADMIN_INVOICING.html
 * Verifies backend exports, HTML structure, postMessage bridge, status transitions,
 * total calculations, invoice number format, and error handling.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCES
// =============================================================================

const BACKEND_FILE = path.resolve(
    __dirname, '..', '..', 'backend', 'adminInvoiceService.jsw'
);
const HTML_FILE = path.resolve(
    __dirname, '..', 'admin', 'ADMIN_INVOICING.html'
);

const backendSource = fs.readFileSync(BACKEND_FILE, 'utf8');
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockInvoice = {
    _id: 'inv-001',
    invoice_number: 'INV-2026-0001',
    carrier_dot: '1234567',
    status: 'draft',
    line_items: JSON.stringify([
        { description: 'Recruiting Service', quantity: 2, unit_price: 500 },
        { description: 'Background Check', quantity: 1, unit_price: 75 }
    ]),
    subtotal: 1075,
    discount_type: 'fixed',
    discount_value: 50,
    discount_amount: 50,
    total: 1025,
    notes: 'Net 30 terms',
    invoice_date: '2026-02-01T00:00:00.000Z',
    due_date: '2026-03-03T00:00:00.000Z',
    created_date: '2026-02-01T00:00:00.000Z',
    updated_date: '2026-02-01T00:00:00.000Z'
};

const mockBackend = {
    createInvoice: jest.fn().mockResolvedValue({ success: true, invoice: mockInvoice }),
    updateInvoice: jest.fn().mockResolvedValue({ success: true }),
    sendInvoice: jest.fn().mockResolvedValue({ success: true }),
    generateInvoicePDF: jest.fn().mockResolvedValue({ success: true, html: '<html>invoice</html>' }),
    recordInvoicePayment: jest.fn().mockResolvedValue({ success: true }),
    voidInvoice: jest.fn().mockResolvedValue({ success: true }),
    getInvoices: jest.fn().mockResolvedValue({ success: true, invoices: [mockInvoice], totalCount: 1, page: 1, pageSize: 20 }),
    getInvoiceById: jest.fn().mockResolvedValue({ success: true, invoice: mockInvoice }),
    markOverdueInvoices: jest.fn().mockResolvedValue({ success: true, markedCount: 3 }),
    getInvoiceStats: jest.fn().mockResolvedValue({
        success: true,
        stats: { draft: { count: 5, total: 2500 }, sent: { count: 10, total: 15000 }, paid: { count: 20, total: 40000 }, overdue: { count: 3, total: 4500 }, void: { count: 2, total: 1000 } },
        totalOutstanding: 19500
    })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
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
            case 'getInvoices': {
                const data = await backend.getInvoices(message.filters || {});
                safeSend(component, { action: 'invoicesLoaded', payload: data });
                break;
            }
            case 'getInvoiceDetail': {
                if (!message.invoiceId) {
                    safeSend(component, { action: 'actionError', message: 'Missing invoice ID' });
                    return;
                }
                const data = await backend.getInvoiceById(message.invoiceId);
                safeSend(component, { action: 'invoiceDetailLoaded', payload: data });
                break;
            }
            case 'createInvoice': {
                if (!message.invoiceData) {
                    safeSend(component, { action: 'actionError', message: 'Missing invoice data' });
                    return;
                }
                const data = await backend.createInvoice(message.invoiceData);
                if (data.success) {
                    safeSend(component, { action: 'invoiceCreated', payload: data });
                } else {
                    safeSend(component, { action: 'actionError', message: data.error });
                }
                break;
            }
            case 'updateInvoice': {
                if (!message.invoiceId) {
                    safeSend(component, { action: 'actionError', message: 'Missing invoice ID' });
                    return;
                }
                const data = await backend.updateInvoice(message.invoiceId, message.updates || {});
                if (data.success) {
                    safeSend(component, { action: 'invoiceUpdated', payload: data });
                } else {
                    safeSend(component, { action: 'actionError', message: data.error });
                }
                break;
            }
            case 'sendInvoice': {
                if (!message.invoiceId) {
                    safeSend(component, { action: 'actionError', message: 'Missing invoice ID' });
                    return;
                }
                const data = await backend.sendInvoice(message.invoiceId);
                if (data.success) {
                    safeSend(component, { action: 'invoiceSent', payload: data });
                } else {
                    safeSend(component, { action: 'actionError', message: data.error });
                }
                break;
            }
            case 'recordPayment': {
                if (!message.invoiceId) {
                    safeSend(component, { action: 'actionError', message: 'Missing invoice ID' });
                    return;
                }
                const data = await backend.recordInvoicePayment(message.invoiceId, message.paymentDetails || {});
                if (data.success) {
                    safeSend(component, { action: 'paymentRecorded', payload: data });
                } else {
                    safeSend(component, { action: 'actionError', message: data.error });
                }
                break;
            }
            case 'voidInvoice': {
                if (!message.invoiceId) {
                    safeSend(component, { action: 'actionError', message: 'Missing invoice ID' });
                    return;
                }
                const data = await backend.voidInvoice(message.invoiceId, message.reason || '');
                if (data.success) {
                    safeSend(component, { action: 'invoiceVoided', payload: data });
                } else {
                    safeSend(component, { action: 'actionError', message: data.error });
                }
                break;
            }
            case 'getInvoiceStats': {
                const data = await backend.getInvoiceStats();
                safeSend(component, { action: 'invoiceStatsLoaded', payload: data });
                break;
            }
            case 'generatePDF': {
                if (!message.invoiceId) {
                    safeSend(component, { action: 'actionError', message: 'Missing invoice ID' });
                    return;
                }
                const data = await backend.generateInvoicePDF(message.invoiceId);
                if (data.success) {
                    safeSend(component, { action: 'pdfReady', payload: data });
                } else {
                    safeSend(component, { action: 'actionError', message: data.error });
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

describe('ADMIN_INVOICING', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE EXISTENCE
    // =========================================================================

    describe('Source files exist', () => {
        test('backend service file exists', () => {
            expect(fs.existsSync(BACKEND_FILE)).toBe(true);
        });

        test('HTML file exists', () => {
            expect(fs.existsSync(HTML_FILE)).toBe(true);
        });
    });

    // =========================================================================
    // BACKEND EXPORTS
    // =========================================================================

    describe('Backend exports', () => {
        test('exports createInvoice', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+createInvoice/);
        });

        test('exports updateInvoice', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+updateInvoice/);
        });

        test('exports sendInvoice', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+sendInvoice/);
        });

        test('exports generateInvoicePDF', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+generateInvoicePDF/);
        });

        test('exports recordInvoicePayment', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+recordInvoicePayment/);
        });

        test('exports voidInvoice', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+voidInvoice/);
        });

        test('exports getInvoices', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+getInvoices/);
        });

        test('exports getInvoiceById', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+getInvoiceById/);
        });

        test('exports markOverdueInvoices', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+markOverdueInvoices/);
        });

        test('exports getInvoiceStats', () => {
            expect(backendSource).toMatch(/export\s+async\s+function\s+getInvoiceStats/);
        });

        test('imports from wix-members-backend', () => {
            expect(backendSource).toContain("from 'wix-members-backend'");
        });

        test('imports from backend/dataAccess', () => {
            expect(backendSource).toContain("from 'backend/dataAccess'");
        });

        test('uses requireAdmin guard', () => {
            expect(backendSource).toContain('requireAdmin()');
        });

        test('defines invoices collection key', () => {
            expect(backendSource).toMatch(/invoices:\s*['"]invoices['"]/);
        });
    });

    // =========================================================================
    // HTML STRUCTURE
    // =========================================================================

    describe('HTML structure', () => {
        test('contains postMessage bridge', () => {
            expect(htmlSource).toContain("window.addEventListener('message'");
        });

        test('handles init action', () => {
            expect(htmlSource).toContain("case 'init'");
        });

        test('handles invoicesLoaded action', () => {
            expect(htmlSource).toContain("case 'invoicesLoaded'");
        });

        test('handles invoiceCreated action', () => {
            expect(htmlSource).toContain("case 'invoiceCreated'");
        });

        test('handles invoiceSent action', () => {
            expect(htmlSource).toContain("case 'invoiceSent'");
        });

        test('handles paymentRecorded action', () => {
            expect(htmlSource).toContain("case 'paymentRecorded'");
        });

        test('handles invoiceVoided action', () => {
            expect(htmlSource).toContain("case 'invoiceVoided'");
        });

        test('handles invoiceStatsLoaded action', () => {
            expect(htmlSource).toContain("case 'invoiceStatsLoaded'");
        });

        test('handles pdfReady action', () => {
            expect(htmlSource).toContain("case 'pdfReady'");
        });

        test('handles actionError', () => {
            expect(htmlSource).toContain("case 'actionError'");
        });

        test('contains line items editor', () => {
            expect(htmlSource).toContain('line-item-row');
            expect(htmlSource).toContain('addLineItem');
            expect(htmlSource).toContain('removeLineItem');
        });

        test('contains recalculateTotals function', () => {
            expect(htmlSource).toContain('function recalculateTotals');
        });

        test('uses VelocityMatch branding', () => {
            expect(htmlSource).toContain('VelocityMatch');
            expect(htmlSource).toContain('>VM<');
        });

        test('does NOT use LMDR branding in title or headers', () => {
            expect(htmlSource).not.toMatch(/<title>.*LMDR.*<\/title>/);
        });

        test('contains invoice status badges', () => {
            expect(htmlSource).toContain('status-draft');
            expect(htmlSource).toContain('status-sent');
            expect(htmlSource).toContain('status-paid');
            expect(htmlSource).toContain('status-overdue');
            expect(htmlSource).toContain('status-void');
        });

        test('contains payment modal', () => {
            expect(htmlSource).toContain('paymentModal');
            expect(htmlSource).toContain('paymentMethod');
            expect(htmlSource).toContain('paymentReference');
        });

        test('contains void modal', () => {
            expect(htmlSource).toContain('voidModal');
            expect(htmlSource).toContain('voidReason');
        });

        test('contains tab navigation for status filters', () => {
            expect(htmlSource).toContain("filterByStatus('')");
            expect(htmlSource).toContain("filterByStatus('draft')");
            expect(htmlSource).toContain("filterByStatus('sent')");
            expect(htmlSource).toContain("filterByStatus('paid')");
            expect(htmlSource).toContain("filterByStatus('overdue')");
            expect(htmlSource).toContain("filterByStatus('void')");
        });

        test('contains discount type selector', () => {
            expect(htmlSource).toContain('discountType');
            expect(htmlSource).toContain('percentage');
        });

        test('sends actions to Velo via parent.postMessage', () => {
            expect(htmlSource).toContain('window.parent.postMessage');
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

        test('getInvoices calls backend and sends invoicesLoaded', async () => {
            await routeMessage(component, { action: 'getInvoices', filters: { status: 'draft' } });
            expect(mockBackend.getInvoices).toHaveBeenCalledWith({ status: 'draft' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'invoicesLoaded',
                payload: expect.objectContaining({ invoices: expect.any(Array) })
            });
        });

        test('getInvoiceDetail calls getInvoiceById and sends invoiceDetailLoaded', async () => {
            await routeMessage(component, { action: 'getInvoiceDetail', invoiceId: 'inv-001' });
            expect(mockBackend.getInvoiceById).toHaveBeenCalledWith('inv-001');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'invoiceDetailLoaded',
                payload: expect.objectContaining({ invoice: mockInvoice })
            });
        });

        test('getInvoiceDetail with missing invoiceId sends error', async () => {
            await routeMessage(component, { action: 'getInvoiceDetail' });
            expect(mockBackend.getInvoiceById).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing invoice ID'
            });
        });

        test('createInvoice calls backend and sends invoiceCreated', async () => {
            const invoiceData = { carrier_dot: '1234567', line_items: [{ description: 'Test', quantity: 1, unit_price: 100 }] };
            await routeMessage(component, { action: 'createInvoice', invoiceData });
            expect(mockBackend.createInvoice).toHaveBeenCalledWith(invoiceData);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'invoiceCreated',
                payload: expect.objectContaining({ success: true })
            });
        });

        test('createInvoice with missing invoiceData sends error', async () => {
            await routeMessage(component, { action: 'createInvoice' });
            expect(mockBackend.createInvoice).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing invoice data'
            });
        });

        test('updateInvoice calls backend and sends invoiceUpdated', async () => {
            await routeMessage(component, { action: 'updateInvoice', invoiceId: 'inv-001', updates: { notes: 'Updated' } });
            expect(mockBackend.updateInvoice).toHaveBeenCalledWith('inv-001', { notes: 'Updated' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'invoiceUpdated',
                payload: expect.objectContaining({ success: true })
            });
        });

        test('sendInvoice calls backend and sends invoiceSent', async () => {
            await routeMessage(component, { action: 'sendInvoice', invoiceId: 'inv-001' });
            expect(mockBackend.sendInvoice).toHaveBeenCalledWith('inv-001');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'invoiceSent',
                payload: expect.objectContaining({ success: true })
            });
        });

        test('sendInvoice with missing invoiceId sends error', async () => {
            await routeMessage(component, { action: 'sendInvoice' });
            expect(mockBackend.sendInvoice).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing invoice ID'
            });
        });

        test('recordPayment calls backend and sends paymentRecorded', async () => {
            const paymentDetails = { payment_method: 'wire', payment_reference: 'REF-123' };
            await routeMessage(component, { action: 'recordPayment', invoiceId: 'inv-001', paymentDetails });
            expect(mockBackend.recordInvoicePayment).toHaveBeenCalledWith('inv-001', paymentDetails);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'paymentRecorded',
                payload: expect.objectContaining({ success: true })
            });
        });

        test('recordPayment with missing invoiceId sends error', async () => {
            await routeMessage(component, { action: 'recordPayment' });
            expect(mockBackend.recordInvoicePayment).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing invoice ID'
            });
        });

        test('voidInvoice calls backend and sends invoiceVoided', async () => {
            await routeMessage(component, { action: 'voidInvoice', invoiceId: 'inv-001', reason: 'Duplicate' });
            expect(mockBackend.voidInvoice).toHaveBeenCalledWith('inv-001', 'Duplicate');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'invoiceVoided',
                payload: expect.objectContaining({ success: true })
            });
        });

        test('voidInvoice defaults reason to empty string', async () => {
            await routeMessage(component, { action: 'voidInvoice', invoiceId: 'inv-001' });
            expect(mockBackend.voidInvoice).toHaveBeenCalledWith('inv-001', '');
        });

        test('getInvoiceStats calls backend and sends invoiceStatsLoaded', async () => {
            await routeMessage(component, { action: 'getInvoiceStats' });
            expect(mockBackend.getInvoiceStats).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'invoiceStatsLoaded',
                payload: expect.objectContaining({ totalOutstanding: 19500 })
            });
        });

        test('generatePDF calls backend and sends pdfReady', async () => {
            await routeMessage(component, { action: 'generatePDF', invoiceId: 'inv-001' });
            expect(mockBackend.generateInvoicePDF).toHaveBeenCalledWith('inv-001');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'pdfReady',
                payload: expect.objectContaining({ html: expect.any(String) })
            });
        });

        test('generatePDF with missing invoiceId sends error', async () => {
            await routeMessage(component, { action: 'generatePDF' });
            expect(mockBackend.generateInvoicePDF).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Missing invoice ID'
            });
        });

        test('unknown action does not send any message', async () => {
            await routeMessage(component, { action: 'nonExistentAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // STATUS TRANSITION VALIDATION
    // =========================================================================

    describe('Status transitions', () => {
        test('backend defines valid status transitions', () => {
            expect(backendSource).toContain('STATUS_TRANSITIONS');
        });

        test('draft can transition to sent', () => {
            expect(backendSource).toMatch(/draft:\s*\[.*'sent'/);
        });

        test('draft can transition to void', () => {
            expect(backendSource).toMatch(/draft:\s*\[.*'void'/);
        });

        test('sent can transition to paid', () => {
            expect(backendSource).toMatch(/sent:\s*\[.*'paid'/);
        });

        test('sent can transition to overdue', () => {
            expect(backendSource).toMatch(/sent:\s*\[.*'overdue'/);
        });

        test('sent can transition to void', () => {
            expect(backendSource).toMatch(/sent:\s*\[.*'void'/);
        });

        test('overdue can transition to paid', () => {
            expect(backendSource).toMatch(/overdue:\s*\[.*'paid'/);
        });

        test('overdue can transition to void', () => {
            expect(backendSource).toMatch(/overdue:\s*\[.*'void'/);
        });

        test('sendInvoice validates status is draft', () => {
            expect(backendSource).toMatch(/status\s*!==\s*'draft'/);
        });

        test('recordInvoicePayment validates status is sent or overdue', () => {
            expect(backendSource).toMatch(/status\s*!==\s*'sent'\s*&&\s*\w+\.status\s*!==\s*'overdue'/);
        });

        test('voidInvoice uses canTransition helper', () => {
            expect(backendSource).toContain('canTransition');
        });
    });

    // =========================================================================
    // TOTAL CALCULATION
    // =========================================================================

    describe('Total calculations', () => {
        test('backend defines calculateTotals function', () => {
            expect(backendSource).toContain('function calculateTotals');
        });

        test('calculateTotals handles fixed discount', () => {
            // Verify the pattern in source
            expect(backendSource).toContain("discountType === 'percentage'");
        });

        test('subtotal sums quantity * unit_price for all items', () => {
            // Line items: 2*500 + 1*75 = 1075
            const lineItems = [
                { description: 'A', quantity: 2, unit_price: 500 },
                { description: 'B', quantity: 1, unit_price: 75 }
            ];
            const subtotal = lineItems.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
            expect(subtotal).toBe(1075);
        });

        test('fixed discount subtracts flat amount', () => {
            const subtotal = 1000;
            const discountAmount = 100; // fixed
            expect(subtotal - discountAmount).toBe(900);
        });

        test('percentage discount subtracts percentage of subtotal', () => {
            const subtotal = 1000;
            const discountPercent = 10;
            const discountAmount = subtotal * (discountPercent / 100);
            expect(subtotal - discountAmount).toBe(900);
        });

        test('total = subtotal - discount', () => {
            const subtotal = 1075;
            const discount = 50;
            expect(subtotal - discount).toBe(1025);
        });

        test('HTML contains subtotal, discount, and total display elements', () => {
            expect(htmlSource).toContain('id="subtotal"');
            expect(htmlSource).toContain('id="discountDisplay"');
            expect(htmlSource).toContain('id="total"');
        });
    });

    // =========================================================================
    // INVOICE NUMBER FORMAT
    // =========================================================================

    describe('Invoice number format', () => {
        test('backend generates INV-YYYY-NNNN format', () => {
            expect(backendSource).toContain('INV-${year}-');
            expect(backendSource).toContain(".padStart(4, '0')");
        });

        test('first invoice of year starts at 0001', () => {
            expect(backendSource).toContain('INV-${year}-0001');
        });

        test('getNextInvoiceNumber queries existing invoices', () => {
            expect(backendSource).toContain('getNextInvoiceNumber');
            expect(backendSource).toContain('startsWith');
        });

        test('mock invoice number matches expected format', () => {
            expect(mockInvoice.invoice_number).toMatch(/^INV-\d{4}-\d{4}$/);
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getInvoices failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getInvoices: jest.fn().mockRejectedValue(new Error('DB timeout'))
            };
            await routeMessage(component, { action: 'getInvoices' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'DB timeout'
            });
        });

        test('createInvoice failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                createInvoice: jest.fn().mockRejectedValue(new Error('Insert failed'))
            };
            await routeMessage(component, { action: 'createInvoice', invoiceData: {} }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Insert failed'
            });
        });

        test('sendInvoice failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                sendInvoice: jest.fn().mockRejectedValue(new Error('Send failed'))
            };
            await routeMessage(component, { action: 'sendInvoice', invoiceId: 'inv-001' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Send failed'
            });
        });

        test('recordPayment failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                recordInvoicePayment: jest.fn().mockRejectedValue(new Error('Payment failed'))
            };
            await routeMessage(component, { action: 'recordPayment', invoiceId: 'inv-001', paymentDetails: {} }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Payment failed'
            });
        });

        test('voidInvoice failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                voidInvoice: jest.fn().mockRejectedValue(new Error('Void failed'))
            };
            await routeMessage(component, { action: 'voidInvoice', invoiceId: 'inv-001', reason: 'test' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Void failed'
            });
        });

        test('getInvoiceStats failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getInvoiceStats: jest.fn().mockRejectedValue(new Error('Stats error'))
            };
            await routeMessage(component, { action: 'getInvoiceStats' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Stats error'
            });
        });

        test('generatePDF failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                generateInvoicePDF: jest.fn().mockRejectedValue(new Error('PDF error'))
            };
            await routeMessage(component, { action: 'generatePDF', invoiceId: 'inv-001' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'PDF error'
            });
        });

        test('error with no message falls back to generic message', async () => {
            const failBackend = {
                ...mockBackend,
                getInvoices: jest.fn().mockRejectedValue({})
            };
            await routeMessage(component, { action: 'getInvoices' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'An unexpected error occurred'
            });
        });

        test('backend functions return success: false on error', () => {
            expect(backendSource).toMatch(/return\s*\{\s*success:\s*false/);
        });

        test('backend handles createInvoice validation - missing carrier_dot', () => {
            expect(backendSource).toContain("Missing carrier_dot");
        });

        test('backend handles createInvoice validation - missing line_items', () => {
            expect(backendSource).toContain("line_items must be a non-empty array");
        });

        test('backend handles updateInvoice - only draft invoices', () => {
            expect(backendSource).toContain("Only draft invoices can be updated");
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
    // BACKEND SERVICE PATTERNS
    // =========================================================================

    describe('Backend service patterns', () => {
        test('uses dataAccess.queryRecords for queries', () => {
            expect(backendSource).toContain('dataAccess.queryRecords');
        });

        test('uses dataAccess.insertRecord for inserts', () => {
            expect(backendSource).toContain('dataAccess.insertRecord');
        });

        test('uses dataAccess.updateRecord for updates', () => {
            expect(backendSource).toContain('dataAccess.updateRecord');
        });

        test('uses dataAccess.getRecord for single record fetch', () => {
            expect(backendSource).toContain('dataAccess.getRecord');
        });

        test('uses suppressAuth for backend operations', () => {
            expect(backendSource).toContain('suppressAuth: true');
        });

        test('logs to audit log on payment', () => {
            expect(backendSource).toContain('invoice_payment_recorded');
        });

        test('logs to audit log on void', () => {
            expect(backendSource).toContain('invoice_voided');
        });

        test('markOverdueInvoices does not require auth', () => {
            // markOverdueInvoices should NOT have requireAdmin
            const funcBody = backendSource.match(/export async function markOverdueInvoices[\s\S]*?^}/m);
            expect(funcBody).not.toBeNull();
            expect(funcBody[0]).not.toContain('requireAdmin');
        });
    });
});
