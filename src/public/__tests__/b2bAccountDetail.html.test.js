/**
 * B2B Account Detail HTML DOM Tests
 *
 * Tests the B2B_ACCOUNT_DETAIL.html message handling and DOM rendering.
 * Source: src/public/admin/B2B_ACCOUNT_DETAIL.html
 *
 * Inbound: init, accountLoaded, signalLoaded, opportunityLoaded,
 *   contactsLoaded, timelineLoaded, risksLoaded, actionSuccess, actionError
 * Outbound: getAccount, getSignal, getOpportunity, getContacts,
 *   getTimeline, getRisks, accountAction, navigate
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'B2B_ACCOUNT_DETAIL.html');
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id) {
    const el = {
        id, innerHTML: '', textContent: '', className: '',
        style: { display: '' },
        classList: {
            add: jest.fn(), remove: jest.fn(), toggle: jest.fn(),
            contains: jest.fn(() => false)
        },
        setAttribute: jest.fn(), querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []), appendChild: jest.fn(), dataset: {}
    };
    mockElements[id] = el;
    return el;
}

function getMockElement(id) { return mockElements[id] || createMockElement(id); }

function resetMockDOM() {
    Object.keys(mockElements).forEach(k => delete mockElements[k]);
    capturedOutbound = [];
    createMockElement('accountName');
    createMockElement('accountMeta');
    createMockElement('statusBadge');
    createMockElement('signalScore');
    createMockElement('signalDrivers');
    createMockElement('signalRegions');
    createMockElement('signalEquipment');
    createMockElement('oppStage');
    createMockElement('oppValue');
    createMockElement('oppNextStep');
    createMockElement('oppNextStepDate');
    createMockElement('contactList');
    createMockElement('timeline');
    createMockElement('riskList');
    createMockElement('toastContainer');
}

function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatCurrency(v) {
    const n = Number(v) || 0;
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k';
    return '$' + n;
}

// =============================================================================
// REPLICATED MESSAGE HANDLER
// =============================================================================

let currentAccountId = null;

const VALID_ACTIONS = ['init', 'accountLoaded', 'signalLoaded', 'opportunityLoaded', 'contactsLoaded', 'timelineLoaded', 'risksLoaded', 'actionSuccess', 'actionError'];

function handleMessage(msg) {
    if (!msg || typeof msg.action !== 'string' || !VALID_ACTIONS.includes(msg.action)) return null;

    switch (msg.action) {
        case 'init':
            if (msg.accountId) {
                currentAccountId = msg.accountId;
                capturedOutbound.push({ action: 'getAccount', accountId: msg.accountId });
                capturedOutbound.push({ action: 'getSignal', accountId: msg.accountId });
                capturedOutbound.push({ action: 'getOpportunity', accountId: msg.accountId });
                capturedOutbound.push({ action: 'getContacts', accountId: msg.accountId });
                capturedOutbound.push({ action: 'getTimeline', accountId: msg.accountId, limit: 30 });
                capturedOutbound.push({ action: 'getRisks', accountId: msg.accountId });
            }
            return 'init';

        case 'accountLoaded': {
            const account = msg.payload;
            if (!account) return 'accountLoaded';
            currentAccountId = account._id || account.id;
            getMockElement('accountName').textContent = account.carrier_name || 'Unknown';
            getMockElement('accountMeta').textContent =
                `DOT ${account.carrier_dot || '—'} · ${account.segment || '—'} · ${account.region || '—'} · Fleet ${account.fleet_size || '?'}`;
            const badge = getMockElement('statusBadge');
            badge.textContent = (account.status || 'target').replace('_', ' ');
            return 'accountLoaded';
        }

        case 'signalLoaded': {
            const signal = msg.payload;
            if (!signal) return 'signalLoaded';
            getMockElement('signalScore').textContent = signal.signal_score || '—';
            getMockElement('signalDrivers').textContent = (signal.driver_count_high_match || 0) + ' matching drivers';
            getMockElement('signalRegions').textContent = 'Regions: ' + (signal.top_regions || '—');
            getMockElement('signalEquipment').textContent = 'Equipment: ' + (signal.top_equipment || '—');
            return 'signalLoaded';
        }

        case 'opportunityLoaded': {
            const opp = msg.payload;
            if (!opp) { getMockElement('oppStage').textContent = 'None'; return 'opportunityLoaded'; }
            getMockElement('oppStage').textContent = opp.stage || '—';
            getMockElement('oppValue').textContent = formatCurrency(opp.value_estimate || 0);
            getMockElement('oppNextStep').textContent = opp.next_step || 'Not set';
            getMockElement('oppNextStepDate').textContent = opp.next_step_at ? 'Due: ' + new Date(opp.next_step_at).toLocaleDateString() : '';
            return 'opportunityLoaded';
        }

        case 'contactsLoaded': {
            const contacts = msg.payload || [];
            const container = getMockElement('contactList');
            if (!contacts || contacts.length === 0) {
                container.innerHTML = '<div class="empty-state">No contacts yet</div>';
            } else {
                container.innerHTML = contacts.map(c =>
                    `<div class="contact"><p>${sanitize(c.name)}</p><p>${sanitize(c.role || 'No role')}</p>` +
                    `<span>${sanitize(c.consent_status || 'pending')}</span></div>`
                ).join('');
            }
            return 'contactsLoaded';
        }

        case 'timelineLoaded': {
            const activities = msg.payload || [];
            const container = getMockElement('timeline');
            if (!activities || activities.length === 0) {
                container.innerHTML = '<div class="empty-state">No activities yet</div>';
            } else {
                container.innerHTML = activities.map(a =>
                    `<div class="timeline-item" data-type="${sanitize(a.type)}">${sanitize(a.subject || a.type)}` +
                    `${a.notes ? '<p>' + sanitize(a.notes) + '</p>' : ''}` +
                    `${a.outcome ? '<span>' + sanitize(a.outcome) + '</span>' : ''}</div>`
                ).join('');
            }
            return 'timelineLoaded';
        }

        case 'risksLoaded': {
            const risks = msg.payload || [];
            const container = getMockElement('riskList');
            if (!risks || risks.length === 0) {
                container.innerHTML = '<p class="no-risks">No risks identified</p>';
            } else {
                container.innerHTML = risks.map(r =>
                    `<div class="risk ${r.type === 'sla_breach' || r.type === 'overdue' ? 'risk-high' : 'risk-medium'}">${sanitize(r.message)}</div>`
                ).join('');
            }
            return 'risksLoaded';
        }

        case 'actionSuccess': {
            getMockElement('toastContainer').innerHTML = `<div class="toast success">${sanitize(msg.message || 'Done')}</div>`;
            return 'actionSuccess';
        }

        case 'actionError': {
            getMockElement('toastContainer').innerHTML = `<div class="toast error">${sanitize(msg.message || 'Error')}</div>`;
            return 'actionError';
        }

        default:
            return null;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('B2B Account Detail HTML DOM Tests', () => {
    beforeEach(() => {
        resetMockDOM();
        currentAccountId = null;
    });

    describe('HTML source', () => {
        it('should exist', () => { expect(htmlSource.length).toBeGreaterThan(0); });
        it('should have message listener', () => { expect(htmlSource).toMatch(/addEventListener.*message|onmessage/i); });
        it('should have VALID_ACTIONS whitelist', () => { expect(htmlSource).toContain('VALID_ACTIONS'); });
    });

    describe('init', () => {
        it('should request all 6 data types when accountId provided', () => {
            handleMessage({ action: 'init', accountId: 'acc-123' });
            expect(capturedOutbound.length).toBe(6);
            expect(capturedOutbound).toContainEqual({ action: 'getAccount', accountId: 'acc-123' });
            expect(capturedOutbound).toContainEqual({ action: 'getSignal', accountId: 'acc-123' });
            expect(capturedOutbound).toContainEqual({ action: 'getOpportunity', accountId: 'acc-123' });
            expect(capturedOutbound).toContainEqual({ action: 'getContacts', accountId: 'acc-123' });
            expect(capturedOutbound).toContainEqual({ action: 'getTimeline', accountId: 'acc-123', limit: 30 });
            expect(capturedOutbound).toContainEqual({ action: 'getRisks', accountId: 'acc-123' });
        });

        it('should not request data when no accountId', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    describe('accountLoaded', () => {
        it('should render account header', () => {
            handleMessage({ action: 'accountLoaded', payload: {
                _id: 'acc-123', carrier_name: 'Acme Trucking', carrier_dot: '1234567',
                segment: 'enterprise', region: 'Southeast', fleet_size: 200, status: 'engaged'
            }});
            expect(getMockElement('accountName').textContent).toBe('Acme Trucking');
            expect(getMockElement('accountMeta').textContent).toContain('1234567');
            expect(getMockElement('accountMeta').textContent).toContain('enterprise');
            expect(getMockElement('statusBadge').textContent).toBe('engaged');
        });

        it('should handle missing payload', () => {
            handleMessage({ action: 'accountLoaded' });
            expect(getMockElement('accountName').textContent).toBe('');
        });

        it('should default status to target', () => {
            handleMessage({ action: 'accountLoaded', payload: { carrier_name: 'Test' } });
            expect(getMockElement('statusBadge').textContent).toBe('target');
        });
    });

    describe('signalLoaded', () => {
        it('should render signal data', () => {
            handleMessage({ action: 'signalLoaded', payload: {
                signal_score: 85, driver_count_high_match: 12,
                top_regions: 'Southeast, Midwest', top_equipment: 'Dry Van, Reefer'
            }});
            expect(getMockElement('signalScore').textContent).toBe(85);
            expect(getMockElement('signalDrivers').textContent).toBe('12 matching drivers');
            expect(getMockElement('signalRegions').textContent).toContain('Southeast');
            expect(getMockElement('signalEquipment').textContent).toContain('Dry Van');
        });

        it('should handle missing signal', () => {
            handleMessage({ action: 'signalLoaded' });
            expect(getMockElement('signalScore').textContent).toBe('');
        });
    });

    describe('opportunityLoaded', () => {
        it('should render opportunity data', () => {
            handleMessage({ action: 'opportunityLoaded', payload: {
                stage: 'proposal', value_estimate: 75000, next_step: 'Send contract',
                next_step_at: '2026-03-15'
            }});
            expect(getMockElement('oppStage').textContent).toBe('proposal');
            expect(getMockElement('oppValue').textContent).toBe('$75k');
            expect(getMockElement('oppNextStep').textContent).toBe('Send contract');
            expect(getMockElement('oppNextStepDate').textContent).toContain('Due');
        });

        it('should show None when no opportunity', () => {
            handleMessage({ action: 'opportunityLoaded' });
            expect(getMockElement('oppStage').textContent).toBe('None');
        });
    });

    describe('contactsLoaded', () => {
        it('should render contact rows', () => {
            handleMessage({ action: 'contactsLoaded', payload: [
                { name: 'John Doe', role: 'Fleet Manager', phone: '555-0100', email: 'john@acme.com', consent_status: 'opted_in' },
                { name: 'Jane Smith', role: 'HR Director', consent_status: 'pending' }
            ]});
            const list = getMockElement('contactList');
            expect(list.innerHTML).toContain('John Doe');
            expect(list.innerHTML).toContain('Jane Smith');
            expect(list.innerHTML).toContain('opted_in');
        });

        it('should show empty state for no contacts', () => {
            handleMessage({ action: 'contactsLoaded', payload: [] });
            expect(getMockElement('contactList').innerHTML).toContain('No contacts yet');
        });
    });

    describe('timelineLoaded', () => {
        it('should render timeline items', () => {
            handleMessage({ action: 'timelineLoaded', payload: [
                { type: 'email', subject: 'Intro email sent', created_at: '2026-02-01T10:00:00Z', notes: 'Sent pricing', outcome: 'delivered' },
                { type: 'call', subject: 'Discovery call', created_at: '2026-02-03T14:00:00Z' }
            ]});
            const timeline = getMockElement('timeline');
            expect(timeline.innerHTML).toContain('Intro email sent');
            expect(timeline.innerHTML).toContain('Discovery call');
            expect(timeline.innerHTML).toContain('Sent pricing');
            expect(timeline.innerHTML).toContain('delivered');
        });

        it('should show empty state for no activities', () => {
            handleMessage({ action: 'timelineLoaded', payload: [] });
            expect(getMockElement('timeline').innerHTML).toContain('No activities yet');
        });
    });

    describe('risksLoaded', () => {
        it('should render risk items with severity', () => {
            handleMessage({ action: 'risksLoaded', payload: [
                { type: 'sla_breach', message: 'SLA breach in 2 days' },
                { type: 'stale', message: 'No activity in 14 days' }
            ]});
            const list = getMockElement('riskList');
            expect(list.innerHTML).toContain('SLA breach');
            expect(list.innerHTML).toContain('risk-high');
            expect(list.innerHTML).toContain('risk-medium');
        });

        it('should show no risks message when empty', () => {
            handleMessage({ action: 'risksLoaded', payload: [] });
            expect(getMockElement('riskList').innerHTML).toContain('No risks identified');
        });

        it('should treat overdue as high severity', () => {
            handleMessage({ action: 'risksLoaded', payload: [
                { type: 'overdue', message: 'Task overdue' }
            ]});
            expect(getMockElement('riskList').innerHTML).toContain('risk-high');
        });
    });

    describe('actionError', () => {
        it('should display error toast', () => {
            handleMessage({ action: 'actionError', message: 'Account load failed' });
            expect(getMockElement('toastContainer').innerHTML).toContain('error');
            expect(getMockElement('toastContainer').innerHTML).toContain('Account load failed');
        });

        it('should sanitize XSS in error message', () => {
            handleMessage({ action: 'actionError', message: '<script>alert(1)</script>' });
            expect(getMockElement('toastContainer').innerHTML).not.toContain('<script>');
        });
    });

    describe('Message validation', () => {
        it('should return null for null', () => { expect(handleMessage(null)).toBeNull(); });
        it('should return null for no action', () => { expect(handleMessage({})).toBeNull(); });
        it('should return null for unknown action', () => { expect(handleMessage({ action: 'xyz' })).toBeNull(); });
    });
});
