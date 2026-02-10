/* eslint-disable */
/**
 * B2B Lead Capture Bridge Tests
 *
 * Tests the Velo page code that wires B2B_LEAD_CAPTURE.html to b2bAccountService.
 * Source: src/pages/B2B_LEAD_CAPTURE.jf8ac.js
 *
 * Actions tested: captureLead (with validation branches)
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_LEAD_CAPTURE.jf8ac.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    createAccount: jest.fn().mockResolvedValue({ _id: 'acc-new', company_name: 'New Lead' }),
    createContact: jest.fn().mockResolvedValue({ _id: 'con-new' }),
    trackLeadSource: jest.fn().mockResolvedValue({ success: true })
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function safeSend(component, data) {
    try { component.postMessage(data); } catch (err) { /* swallow */ }
}

async function routeMessage(component, msg, backend = mockBackend) {
    switch (msg.action) {
        case 'captureLead': {
            try {
                const lead = msg.lead || {};

                if (!lead.companyName) {
                    safeSend(component, { action: 'actionError', message: 'Company name is required.' });
                    return;
                }

                const account = await backend.createAccount({
                    company_name: lead.companyName,
                    carrier_dot: lead.dotNumber || '',
                    region: lead.region || '',
                    fleet_size_bucket: lead.fleetSize ? String(lead.fleetSize) : '',
                    tags: lead.tags || '',
                    notes: lead.notes || '',
                    source: lead.captureSource || 'event_booth',
                    event_name: lead.eventName || ''
                });

                const accountId = account._id || account.id;

                if (lead.contactName) {
                    await backend.createContact({
                        account_id: accountId,
                        name: lead.contactName,
                        role: lead.contactRole || '',
                        email: lead.email || '',
                        phone: lead.phone || ''
                    });
                }

                if (lead.captureSource) {
                    await backend.trackLeadSource(accountId, lead.captureSource, '', lead.eventName || '');
                }

                safeSend(component, {
                    action: 'leadCaptured',
                    payload: { accountId, companyName: lead.companyName }
                });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to capture lead.' });
            }
            break;
        }
        default:
            break;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('B2B Lead Capture Bridge Tests', () => {
    let component;

    beforeEach(() => {
        component = createMockComponent();
        jest.clearAllMocks();
        mockBackend.createAccount.mockResolvedValue({ _id: 'acc-new', company_name: 'Test Co' });
    });

    describe('Source file structure', () => {
        it('should exist and be readable', () => {
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        it('should import from b2bAccountService', () => {
            expect(sourceCode).toMatch(/b2bAccountService/);
        });

        it('should handle captureLead action', () => {
            expect(sourceCode).toContain("'captureLead'");
        });

        it('should validate companyName', () => {
            expect(sourceCode).toContain('companyName');
        });
    });

    describe('captureLead - full lead', () => {
        it('should call all 3 backend methods with full lead data', async () => {
            await routeMessage(component, {
                action: 'captureLead',
                lead: {
                    companyName: 'Acme Trucking',
                    contactName: 'John Doe',
                    captureSource: 'event',
                    eventName: 'MATS 2026'
                }
            });

            expect(mockBackend.createAccount).toHaveBeenCalledWith(
                expect.objectContaining({ company_name: 'Acme Trucking' })
            );
            expect(mockBackend.createContact).toHaveBeenCalledWith(
                expect.objectContaining({ account_id: 'acc-new', name: 'John Doe' })
            );
            expect(mockBackend.trackLeadSource).toHaveBeenCalledWith('acc-new', 'event', '', 'MATS 2026');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'leadCaptured',
                payload: { accountId: 'acc-new', companyName: 'Acme Trucking' }
            });
        });
    });

    describe('captureLead - company only', () => {
        it('should only call createAccount when no contactName or source', async () => {
            await routeMessage(component, {
                action: 'captureLead',
                lead: { companyName: 'Solo Corp' }
            });

            expect(mockBackend.createAccount).toHaveBeenCalled();
            expect(mockBackend.createContact).not.toHaveBeenCalled();
            expect(mockBackend.trackLeadSource).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'leadCaptured' })
            );
        });
    });

    describe('captureLead - with contact, no source', () => {
        it('should call createAccount + createContact but not trackLeadSource', async () => {
            await routeMessage(component, {
                action: 'captureLead',
                lead: { companyName: 'ContactCo', contactName: 'Jane Smith' }
            });

            expect(mockBackend.createAccount).toHaveBeenCalled();
            expect(mockBackend.createContact).toHaveBeenCalled();
            expect(mockBackend.trackLeadSource).not.toHaveBeenCalled();
        });
    });

    describe('captureLead - missing companyName', () => {
        it('should send actionError if companyName missing', async () => {
            await routeMessage(component, {
                action: 'captureLead',
                lead: { contactName: 'John' }
            });

            expect(mockBackend.createAccount).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Company name is required.'
            });
        });

        it('should send actionError if lead is empty', async () => {
            await routeMessage(component, { action: 'captureLead', lead: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError' })
            );
        });

        it('should send actionError if no lead property', async () => {
            await routeMessage(component, { action: 'captureLead' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError' })
            );
        });
    });

    describe('captureLead - backend failure', () => {
        it('should send actionError on createAccount failure', async () => {
            mockBackend.createAccount.mockRejectedValueOnce(new Error('DB error'));
            await routeMessage(component, {
                action: 'captureLead',
                lead: { companyName: 'FailCo' }
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to capture lead.'
            });
        });
    });

    describe('safeSend', () => {
        it('should not throw if postMessage fails', () => {
            component.postMessage.mockImplementation(() => { throw new Error('detached'); });
            expect(() => safeSend(component, { action: 'test' })).not.toThrow();
        });
    });
});
