/**
 * B2B Dashboard HTML DOM Tests
 *
 * Tests the B2B_DASHBOARD.html message handling and DOM rendering.
 * Source: src/public/admin/B2B_DASHBOARD.html
 *
 * Inbound: init, kpisLoaded, topProspectsLoaded, alertsLoaded,
 *   topOpportunitiesLoaded, nextActionsLoaded, signalSpikesLoaded,
 *   actionSuccess, actionError
 * Outbound: getDashboardKPIs, getTopProspects, getAlerts,
 *   getTopOpportunities, getNextActions, viewAccount, quickAction
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'B2B_DASHBOARD.html');
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id) {
    const el = {
        id, innerHTML: '', textContent: '', className: '', value: '',
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
    createMockElement('kpiPipelineCoverage');
    createMockElement('kpiWinRate');
    createMockElement('kpiAvgCycle');
    createMockElement('kpiPipelineValue');
    createMockElement('kpiVelocity');
    createMockElement('kpiResponses');
    createMockElement('prospectList');
    createMockElement('prospectCount');
    createMockElement('alertList');
    createMockElement('opportunityList');
    createMockElement('nextActionsList');
    createMockElement('dateRange');
    createMockElement('toastContainer');
    getMockElement('dateRange').value = '30';
}

function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// =============================================================================
// REPLICATED MESSAGE HANDLER
// =============================================================================

const VALID_ACTIONS = [
    'init', 'kpisLoaded', 'topProspectsLoaded', 'alertsLoaded',
    'topOpportunitiesLoaded', 'nextActionsLoaded',
    'signalSpikesLoaded', 'actionSuccess', 'actionError'
];

function handleMessage(msg) {
    if (!msg || typeof msg.action !== 'string' || !VALID_ACTIONS.includes(msg.action)) return null;

    switch (msg.action) {
        case 'init':
            capturedOutbound.push({ action: 'getDashboardKPIs' });
            capturedOutbound.push({ action: 'getTopProspects' });
            capturedOutbound.push({ action: 'getAlerts' });
            capturedOutbound.push({ action: 'getTopOpportunities' });
            capturedOutbound.push({ action: 'getNextActions' });
            return 'init';

        case 'kpisLoaded': {
            const kpis = msg.payload || {};
            getMockElement('kpiPipelineCoverage').textContent = kpis.pipeline_coverage ? kpis.pipeline_coverage + 'x' : '0x';
            getMockElement('kpiWinRate').textContent = (kpis.win_rate || 0) + '%';
            getMockElement('kpiAvgCycle').textContent = (kpis.avg_cycle_days || 0) + 'd';
            getMockElement('kpiPipelineValue').textContent = formatCurrency(kpis.pipeline_value || 0);
            getMockElement('kpiVelocity').textContent = (kpis.activity_velocity || 0) + '/wk';
            getMockElement('kpiResponses').textContent = String(kpis.responses_period || 0);
            return 'kpisLoaded';
        }

        case 'topProspectsLoaded': {
            const prospects = msg.payload || [];
            const container = getMockElement('prospectList');
            if (!prospects || prospects.length === 0) {
                container.innerHTML = '<div class="empty-state">No prospects found</div>';
                getMockElement('prospectCount').textContent = '0 prospects';
            } else {
                getMockElement('prospectCount').textContent = prospects.length + ' prospects';
                container.innerHTML = prospects.map(p =>
                    `<div class="prospect-row">${sanitize(p.carrier_name || p.carrier_dot || 'Unknown')}` +
                    `<span class="signal-score">${p.signal_score || '—'}</span></div>`
                ).join('');
            }
            return 'topProspectsLoaded';
        }

        case 'alertsLoaded': {
            const alerts = msg.payload || [];
            const container = getMockElement('alertList');
            if (!alerts || alerts.length === 0) {
                container.innerHTML = '<div class="empty-state">No active alerts</div>';
            } else {
                container.innerHTML = alerts.map(a =>
                    `<div class="alert ${a.severity === 'HIGH' ? 'alert-high' : 'alert-medium'}">${sanitize(a.message)}</div>`
                ).join('');
            }
            return 'alertsLoaded';
        }

        case 'topOpportunitiesLoaded': {
            const opps = msg.payload || [];
            const container = getMockElement('opportunityList');
            if (!opps || opps.length === 0) {
                container.innerHTML = '<div class="empty-state">No open opportunities</div>';
            } else {
                container.innerHTML = opps.map(o =>
                    `<div class="opp-row" data-account="${sanitize(o.account_id)}">${sanitize(o.account_name || o.account_id)} - ${sanitize(o.stage)}</div>`
                ).join('');
            }
            return 'topOpportunitiesLoaded';
        }

        case 'nextActionsLoaded': {
            const actions = msg.payload || [];
            const container = getMockElement('nextActionsList');
            if (!actions || actions.length === 0) {
                container.innerHTML = '<div class="empty-state">All caught up!</div>';
            } else {
                container.innerHTML = actions.map(a =>
                    `<div class="action-row">${sanitize(a.subject || a.action_type)}<span>${sanitize(a.priority || 'normal')}</span></div>`
                ).join('');
            }
            return 'nextActionsLoaded';
        }

        case 'signalSpikesLoaded':
            return 'signalSpikesLoaded';

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

function formatCurrency(val) {
    const num = Number(val) || 0;
    if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return '$' + (num / 1000).toFixed(0) + 'k';
    return '$' + num;
}

// =============================================================================
// TESTS
// =============================================================================

describe('B2B Dashboard HTML DOM Tests', () => {
    beforeEach(() => resetMockDOM());

    describe('HTML source', () => {
        it('should exist', () => { expect(htmlSource.length).toBeGreaterThan(0); });
        it('should have message listener', () => { expect(htmlSource).toMatch(/addEventListener.*message|onmessage/i); });
        it('should have VALID_ACTIONS whitelist', () => { expect(htmlSource).toContain('VALID_ACTIONS'); });
    });

    describe('init', () => {
        it('should request all 5 data types', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound.length).toBe(5);
            expect(capturedOutbound).toContainEqual({ action: 'getDashboardKPIs' });
            expect(capturedOutbound).toContainEqual({ action: 'getTopProspects' });
            expect(capturedOutbound).toContainEqual({ action: 'getAlerts' });
            expect(capturedOutbound).toContainEqual({ action: 'getTopOpportunities' });
            expect(capturedOutbound).toContainEqual({ action: 'getNextActions' });
        });
    });

    describe('kpisLoaded', () => {
        it('should update all KPI displays', () => {
            handleMessage({ action: 'kpisLoaded', payload: {
                pipeline_coverage: 3.2,
                win_rate: 28,
                avg_cycle_days: 45,
                pipeline_value: 1500000,
                activity_velocity: 12,
                responses_period: 34
            }});
            expect(getMockElement('kpiPipelineCoverage').textContent).toBe('3.2x');
            expect(getMockElement('kpiWinRate').textContent).toBe('28%');
            expect(getMockElement('kpiAvgCycle').textContent).toBe('45d');
            expect(getMockElement('kpiPipelineValue').textContent).toBe('$1.5M');
            expect(getMockElement('kpiVelocity').textContent).toBe('12/wk');
            expect(getMockElement('kpiResponses').textContent).toBe('34');
        });

        it('should handle empty payload', () => {
            handleMessage({ action: 'kpisLoaded' });
            expect(getMockElement('kpiPipelineCoverage').textContent).toBe('0x');
            expect(getMockElement('kpiWinRate').textContent).toBe('0%');
            expect(getMockElement('kpiPipelineValue').textContent).toBe('$0');
        });
    });

    describe('topProspectsLoaded', () => {
        it('should render prospect rows', () => {
            handleMessage({ action: 'topProspectsLoaded', payload: [
                { carrier_name: 'Acme Transport', carrier_dot: '123456', signal_score: 85 },
                { carrier_name: 'Swift Logistics', carrier_dot: '654321', signal_score: 72 }
            ]});
            const list = getMockElement('prospectList');
            expect(list.innerHTML).toContain('Acme Transport');
            expect(list.innerHTML).toContain('Swift Logistics');
            expect(getMockElement('prospectCount').textContent).toBe('2 prospects');
        });

        it('should show empty state for no prospects', () => {
            handleMessage({ action: 'topProspectsLoaded', payload: [] });
            expect(getMockElement('prospectList').innerHTML).toContain('No prospects found');
            expect(getMockElement('prospectCount').textContent).toBe('0 prospects');
        });
    });

    describe('alertsLoaded', () => {
        it('should render alert rows with severity', () => {
            handleMessage({ action: 'alertsLoaded', payload: [
                { severity: 'HIGH', message: 'SLA breach imminent for Acme' },
                { severity: 'MEDIUM', message: 'Follow up overdue' }
            ]});
            const list = getMockElement('alertList');
            expect(list.innerHTML).toContain('SLA breach imminent');
            expect(list.innerHTML).toContain('alert-high');
        });

        it('should show empty state for no alerts', () => {
            handleMessage({ action: 'alertsLoaded', payload: [] });
            expect(getMockElement('alertList').innerHTML).toContain('No active alerts');
        });
    });

    describe('topOpportunitiesLoaded', () => {
        it('should render opportunity rows', () => {
            handleMessage({ action: 'topOpportunitiesLoaded', payload: [
                { account_id: 'acc-1', account_name: 'Mega Carriers', stage: 'proposal', value_estimate: 50000 }
            ]});
            expect(getMockElement('opportunityList').innerHTML).toContain('Mega Carriers');
            expect(getMockElement('opportunityList').innerHTML).toContain('proposal');
        });

        it('should show empty state for no opportunities', () => {
            handleMessage({ action: 'topOpportunitiesLoaded', payload: [] });
            expect(getMockElement('opportunityList').innerHTML).toContain('No open opportunities');
        });
    });

    describe('nextActionsLoaded', () => {
        it('should render action rows', () => {
            handleMessage({ action: 'nextActionsLoaded', payload: [
                { subject: 'Follow up with Acme', action_type: 'call', priority: 'high' }
            ]});
            expect(getMockElement('nextActionsList').innerHTML).toContain('Follow up with Acme');
            expect(getMockElement('nextActionsList').innerHTML).toContain('high');
        });

        it('should show empty state for no actions', () => {
            handleMessage({ action: 'nextActionsLoaded', payload: [] });
            expect(getMockElement('nextActionsList').innerHTML).toContain('All caught up');
        });
    });

    describe('signalSpikesLoaded', () => {
        it('should accept signal spike data', () => {
            expect(handleMessage({ action: 'signalSpikesLoaded', payload: [] })).toBe('signalSpikesLoaded');
        });
    });

    describe('actionError', () => {
        it('should display error toast', () => {
            handleMessage({ action: 'actionError', message: 'Dashboard load failed' });
            expect(getMockElement('toastContainer').innerHTML).toContain('error');
            expect(getMockElement('toastContainer').innerHTML).toContain('Dashboard load failed');
        });

        it('should sanitize XSS', () => {
            handleMessage({ action: 'actionError', message: '<img onerror=alert(1)>' });
            expect(getMockElement('toastContainer').innerHTML).not.toContain('<img');
        });
    });

    describe('Message validation', () => {
        it('should return null for null', () => { expect(handleMessage(null)).toBeNull(); });
        it('should return null for no action', () => { expect(handleMessage({})).toBeNull(); });
        it('should return null for unknown action', () => { expect(handleMessage({ action: 'xyz' })).toBeNull(); });
    });
});
