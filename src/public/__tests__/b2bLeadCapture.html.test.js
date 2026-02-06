/**
 * B2B Lead Capture HTML DOM Tests
 *
 * Tests the B2B_LEAD_CAPTURE.html message handling and DOM rendering.
 * Source: src/public/admin/B2B_LEAD_CAPTURE.html
 *
 * Inbound: init, leadCaptured, actionError, actionSuccess
 * Outbound: captureLead
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'B2B_LEAD_CAPTURE.html');
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id) {
    const el = {
        id, innerHTML: '', textContent: '', className: '', style: { display: '' },
        classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn(() => false) },
        setAttribute: jest.fn(), querySelector: jest.fn(() => null), querySelectorAll: jest.fn(() => []),
        value: '', dataset: {}
    };
    mockElements[id] = el;
    return el;
}

function getMockElement(id) { return mockElements[id] || createMockElement(id); }

function resetMockDOM() {
    Object.keys(mockElements).forEach(k => delete mockElements[k]);
    capturedOutbound = [];
    createMockElement('captureForm');
    createMockElement('successPanel');
    createMockElement('capturedCompany');
    createMockElement('capturedAccountId');
    createMockElement('errorMessage');
    createMockElement('submitBtn');
    createMockElement('toastContainer');
}

function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// =============================================================================
// REPLICATED MESSAGE HANDLER
// =============================================================================

function handleMessage(msg) {
    if (!msg || !msg.action) return null;

    switch (msg.action) {
        case 'init':
            return 'init';

        case 'leadCaptured': {
            const data = msg.payload || {};
            const form = getMockElement('captureForm');
            const success = getMockElement('successPanel');

            form.style.display = 'none';
            success.style.display = 'block';
            getMockElement('capturedCompany').textContent = sanitize(data.companyName || 'Unknown');
            getMockElement('capturedAccountId').textContent = data.accountId || '';
            getMockElement('submitBtn').textContent = 'Submit';
            return 'leadCaptured';
        }

        case 'actionError': {
            const errEl = getMockElement('errorMessage');
            errEl.textContent = sanitize(msg.message || 'An error occurred');
            errEl.style.display = 'block';
            getMockElement('submitBtn').textContent = 'Submit';
            return 'actionError';
        }

        case 'actionSuccess': {
            getMockElement('toastContainer').innerHTML = `<div class="toast success">${sanitize(msg.message || 'Success')}</div>`;
            return 'actionSuccess';
        }

        default:
            return null;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('B2B Lead Capture HTML DOM Tests', () => {
    beforeEach(() => resetMockDOM());

    describe('HTML source', () => {
        it('should exist', () => { expect(htmlSource.length).toBeGreaterThan(0); });
        it('should have message listener', () => { expect(htmlSource).toMatch(/addEventListener.*message|onmessage/i); });
    });

    describe('leadCaptured', () => {
        it('should hide form and show success panel', () => {
            handleMessage({
                action: 'leadCaptured',
                payload: { accountId: 'acc-123', companyName: 'Acme Trucking' }
            });

            expect(getMockElement('captureForm').style.display).toBe('none');
            expect(getMockElement('successPanel').style.display).toBe('block');
            expect(getMockElement('capturedCompany').textContent).toBe('Acme Trucking');
            expect(getMockElement('capturedAccountId').textContent).toBe('acc-123');
        });

        it('should handle missing payload', () => {
            handleMessage({ action: 'leadCaptured' });
            expect(getMockElement('capturedCompany').textContent).toBe('Unknown');
        });

        it('should reset submit button text', () => {
            getMockElement('submitBtn').textContent = 'Submitting...';
            handleMessage({ action: 'leadCaptured', payload: { companyName: 'Test' } });
            expect(getMockElement('submitBtn').textContent).toBe('Submit');
        });

        it('should sanitize company name', () => {
            handleMessage({ action: 'leadCaptured', payload: { companyName: '<script>alert(1)</script>' } });
            expect(getMockElement('capturedCompany').textContent).not.toContain('<script>');
        });
    });

    describe('actionError', () => {
        it('should display error message', () => {
            handleMessage({ action: 'actionError', message: 'Company name is required.' });
            const errEl = getMockElement('errorMessage');
            expect(errEl.textContent).toBe('Company name is required.');
            expect(errEl.style.display).toBe('block');
        });

        it('should reset submit button', () => {
            getMockElement('submitBtn').textContent = 'Submitting...';
            handleMessage({ action: 'actionError', message: 'Failed' });
            expect(getMockElement('submitBtn').textContent).toBe('Submit');
        });
    });

    describe('Message validation', () => {
        it('should return null for null', () => { expect(handleMessage(null)).toBeNull(); });
        it('should return null for no action', () => { expect(handleMessage({})).toBeNull(); });
        it('should return null for unknown', () => { expect(handleMessage({ action: 'xyz' })).toBeNull(); });
    });
});
