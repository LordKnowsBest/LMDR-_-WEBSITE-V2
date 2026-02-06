/**
 * B2B Analytics HTML DOM Tests
 *
 * Tests the B2B_ANALYTICS.html message handling and DOM rendering.
 * Source: src/public/admin/B2B_ANALYTICS.html
 *
 * Inbound: init, kpisLoaded, conversionsLoaded, sourcesLoaded, cpaLoaded,
 *   intelLoaded, snapshotSaved, actionSuccess, actionError
 * Outbound: getDashboardKPIs, getStageConversions, getSourcePerformance,
 *   getCPA, getCompetitorIntel, saveSnapshot, addCompetitorIntel
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'B2B_ANALYTICS.html');
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id) {
    const el = {
        id, innerHTML: '', textContent: '', className: '', style: {},
        classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn(() => false) },
        setAttribute: jest.fn(), querySelector: jest.fn(() => null), querySelectorAll: jest.fn(() => []),
        appendChild: jest.fn(), dataset: {}
    };
    mockElements[id] = el;
    return el;
}

function getMockElement(id) { return mockElements[id] || createMockElement(id); }

function resetMockDOM() {
    Object.keys(mockElements).forEach(k => delete mockElements[k]);
    capturedOutbound = [];
    createMockElement('kpiRevenue');
    createMockElement('kpiDeals');
    createMockElement('kpiConversion');
    createMockElement('kpiAvgDeal');
    createMockElement('conversionsChart');
    createMockElement('sourcesChart');
    createMockElement('cpaValue');
    createMockElement('intelList');
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
            capturedOutbound.push({ action: 'getDashboardKPIs' });
            capturedOutbound.push({ action: 'getStageConversions' });
            capturedOutbound.push({ action: 'getSourcePerformance' });
            capturedOutbound.push({ action: 'getCPA' });
            capturedOutbound.push({ action: 'getCompetitorIntel' });
            return 'init';

        case 'kpisLoaded': {
            const data = msg.payload || {};
            getMockElement('kpiRevenue').textContent = data.revenue != null ? `$${Number(data.revenue).toLocaleString()}` : '$0';
            getMockElement('kpiDeals').textContent = String(data.deals || 0);
            getMockElement('kpiConversion').textContent = data.conversion != null ? `${Math.round(data.conversion * 100)}%` : '0%';
            getMockElement('kpiAvgDeal').textContent = data.avgDealSize != null ? `$${Number(data.avgDealSize).toLocaleString()}` : '$0';
            return 'kpisLoaded';
        }

        case 'conversionsLoaded': {
            const data = msg.payload || {};
            const chart = getMockElement('conversionsChart');
            if (data.stages && data.stages.length > 0) {
                chart.innerHTML = data.stages.map(s =>
                    `<div class="conversion-bar" data-from="${sanitize(s.from)}" data-to="${sanitize(s.to)}">${Math.round((s.rate || 0) * 100)}%</div>`
                ).join('');
            } else {
                chart.innerHTML = '<div class="empty-state">No conversion data</div>';
            }
            return 'conversionsLoaded';
        }

        case 'sourcesLoaded': {
            const data = msg.payload || {};
            const chart = getMockElement('sourcesChart');
            if (data.sources && data.sources.length > 0) {
                chart.innerHTML = data.sources.map(s =>
                    `<div class="source-row">${sanitize(s.name)}: ${s.leads || 0} leads</div>`
                ).join('');
            } else {
                chart.innerHTML = '<div class="empty-state">No source data</div>';
            }
            return 'sourcesLoaded';
        }

        case 'cpaLoaded': {
            const data = msg.payload || {};
            getMockElement('cpaValue').textContent = data.cpa != null ? `$${Number(data.cpa).toLocaleString()}` : '$0';
            return 'cpaLoaded';
        }

        case 'intelLoaded': {
            const data = msg.payload || {};
            const list = getMockElement('intelList');
            const intel = data.intel || (Array.isArray(data) ? data : []);
            if (intel.length > 0) {
                list.innerHTML = intel.map(i =>
                    `<div class="intel-item"><strong>${sanitize(i.competitor_name || i.name)}</strong>: ${sanitize(i.details || '')}</div>`
                ).join('');
            } else {
                list.innerHTML = '<div class="empty-state">No competitor intel</div>';
            }
            return 'intelLoaded';
        }

        case 'snapshotSaved': {
            const toast = getMockElement('toastContainer');
            toast.innerHTML = '<div class="toast success">Snapshot saved</div>';
            return 'snapshotSaved';
        }

        case 'actionSuccess': {
            getMockElement('toastContainer').innerHTML = `<div class="toast success">${sanitize(msg.message || 'Success')}</div>`;
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

describe('B2B Analytics HTML DOM Tests', () => {
    beforeEach(() => resetMockDOM());

    describe('HTML source', () => {
        it('should exist', () => { expect(htmlSource.length).toBeGreaterThan(0); });
        it('should have message listener', () => { expect(htmlSource).toMatch(/addEventListener.*message|onmessage/i); });
    });

    describe('init', () => {
        it('should request all 5 data types', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound.length).toBe(5);
            expect(capturedOutbound).toContainEqual({ action: 'getDashboardKPIs' });
            expect(capturedOutbound).toContainEqual({ action: 'getCompetitorIntel' });
        });
    });

    describe('kpisLoaded', () => {
        it('should update KPI displays', () => {
            handleMessage({ action: 'kpisLoaded', payload: { revenue: 500000, deals: 12, conversion: 0.15, avgDealSize: 42000 } });
            expect(getMockElement('kpiRevenue').textContent).toContain('500,000');
            expect(getMockElement('kpiDeals').textContent).toBe('12');
            expect(getMockElement('kpiConversion').textContent).toBe('15%');
            expect(getMockElement('kpiAvgDeal').textContent).toContain('42,000');
        });

        it('should handle empty payload', () => {
            handleMessage({ action: 'kpisLoaded' });
            expect(getMockElement('kpiRevenue').textContent).toBe('$0');
        });
    });

    describe('conversionsLoaded', () => {
        it('should render conversion bars', () => {
            handleMessage({ action: 'conversionsLoaded', payload: { stages: [{ from: 'discovery', to: 'proposal', rate: 0.4 }] } });
            expect(getMockElement('conversionsChart').innerHTML).toContain('40%');
        });

        it('should show empty state', () => {
            handleMessage({ action: 'conversionsLoaded', payload: { stages: [] } });
            expect(getMockElement('conversionsChart').innerHTML).toContain('empty-state');
        });
    });

    describe('sourcesLoaded', () => {
        it('should render source rows', () => {
            handleMessage({ action: 'sourcesLoaded', payload: { sources: [{ name: 'organic', leads: 20 }] } });
            expect(getMockElement('sourcesChart').innerHTML).toContain('organic');
        });
    });

    describe('cpaLoaded', () => {
        it('should display CPA value', () => {
            handleMessage({ action: 'cpaLoaded', payload: { cpa: 750 } });
            expect(getMockElement('cpaValue').textContent).toBe('$750');
        });
    });

    describe('intelLoaded', () => {
        it('should render intel items', () => {
            handleMessage({ action: 'intelLoaded', payload: { intel: [{ competitor_name: 'Rival Co', details: 'Raised prices' }] } });
            expect(getMockElement('intelList').innerHTML).toContain('Rival Co');
        });

        it('should show empty state', () => {
            handleMessage({ action: 'intelLoaded', payload: { intel: [] } });
            expect(getMockElement('intelList').innerHTML).toContain('empty-state');
        });
    });

    describe('snapshotSaved', () => {
        it('should show success toast', () => {
            handleMessage({ action: 'snapshotSaved' });
            expect(getMockElement('toastContainer').innerHTML).toContain('success');
        });
    });

    describe('actionError', () => {
        it('should display error toast', () => {
            handleMessage({ action: 'actionError', message: 'KPI load failed' });
            expect(getMockElement('toastContainer').innerHTML).toContain('error');
        });

        it('should sanitize XSS', () => {
            handleMessage({ action: 'actionError', message: '<img onerror=alert(1)>' });
            expect(getMockElement('toastContainer').innerHTML).not.toContain('<img');
        });
    });

    describe('Message validation', () => {
        it('should return null for null', () => { expect(handleMessage(null)).toBeNull(); });
        it('should return null for no action', () => { expect(handleMessage({})).toBeNull(); });
        it('should return null for unknown', () => { expect(handleMessage({ action: 'xyz' })).toBeNull(); });
    });
});
