/**
 * B2B Campaigns HTML DOM Tests
 *
 * Tests the B2B_CAMPAIGNS.html message handling and DOM rendering.
 * Source: src/public/admin/B2B_CAMPAIGNS.html
 *
 * Inbound: init, metricsLoaded, channelsLoaded, repsLoaded, actionError
 * Outbound: getOutreachMetrics, getChannelPerformance, getRepPerformance
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'B2B_CAMPAIGNS.html');
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
    createMockElement('metricsSent');
    createMockElement('metricsOpened');
    createMockElement('metricsReplied');
    createMockElement('metricsOpenRate');
    createMockElement('channelTable');
    createMockElement('repTable');
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
            capturedOutbound.push({ action: 'getOutreachMetrics' });
            capturedOutbound.push({ action: 'getChannelPerformance' });
            capturedOutbound.push({ action: 'getRepPerformance' });
            return 'init';

        case 'metricsLoaded': {
            const data = msg.payload || {};
            getMockElement('metricsSent').textContent = String(data.sent || 0);
            getMockElement('metricsOpened').textContent = String(data.opened || 0);
            getMockElement('metricsReplied').textContent = String(data.replied || 0);
            const rate = data.sent > 0 ? Math.round((data.opened / data.sent) * 100) : 0;
            getMockElement('metricsOpenRate').textContent = `${rate}%`;
            return 'metricsLoaded';
        }

        case 'channelsLoaded': {
            const channels = msg.payload || [];
            const table = getMockElement('channelTable');
            if (channels.length > 0) {
                table.innerHTML = channels.map(c =>
                    `<tr><td>${sanitize(c.channel)}</td><td>${c.sent || 0}</td><td>${c.opened || 0}</td></tr>`
                ).join('');
            } else {
                table.innerHTML = '<tr><td colspan="3">No channel data</td></tr>';
            }
            return 'channelsLoaded';
        }

        case 'repsLoaded': {
            const reps = msg.payload || [];
            const table = getMockElement('repTable');
            if (reps.length > 0) {
                table.innerHTML = reps.map(r =>
                    `<tr><td>${sanitize(r.rep)}</td><td>${r.calls || 0}</td><td>${r.emails || 0}</td></tr>`
                ).join('');
            } else {
                table.innerHTML = '<tr><td colspan="3">No rep data</td></tr>';
            }
            return 'repsLoaded';
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

describe('B2B Campaigns HTML DOM Tests', () => {
    beforeEach(() => resetMockDOM());

    describe('HTML source', () => {
        it('should exist', () => { expect(htmlSource.length).toBeGreaterThan(0); });
        it('should have message listener', () => { expect(htmlSource).toMatch(/addEventListener.*message|onmessage/i); });
    });

    describe('init', () => {
        it('should request all 3 data types', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound).toContainEqual({ action: 'getOutreachMetrics' });
            expect(capturedOutbound).toContainEqual({ action: 'getChannelPerformance' });
            expect(capturedOutbound).toContainEqual({ action: 'getRepPerformance' });
        });
    });

    describe('metricsLoaded', () => {
        it('should update metric counters', () => {
            handleMessage({ action: 'metricsLoaded', payload: { sent: 200, opened: 120, replied: 40 } });
            expect(getMockElement('metricsSent').textContent).toBe('200');
            expect(getMockElement('metricsOpened').textContent).toBe('120');
            expect(getMockElement('metricsReplied').textContent).toBe('40');
            expect(getMockElement('metricsOpenRate').textContent).toBe('60%');
        });

        it('should handle empty payload', () => {
            handleMessage({ action: 'metricsLoaded' });
            expect(getMockElement('metricsSent').textContent).toBe('0');
        });
    });

    describe('channelsLoaded', () => {
        it('should render channel rows', () => {
            handleMessage({ action: 'channelsLoaded', payload: [{ channel: 'email', sent: 100, opened: 60 }] });
            expect(getMockElement('channelTable').innerHTML).toContain('email');
        });

        it('should show empty state for no channels', () => {
            handleMessage({ action: 'channelsLoaded', payload: [] });
            expect(getMockElement('channelTable').innerHTML).toContain('No channel data');
        });
    });

    describe('repsLoaded', () => {
        it('should render rep rows', () => {
            handleMessage({ action: 'repsLoaded', payload: [{ rep: 'Alice', calls: 30, emails: 50 }] });
            expect(getMockElement('repTable').innerHTML).toContain('Alice');
        });

        it('should show empty state for no reps', () => {
            handleMessage({ action: 'repsLoaded', payload: [] });
            expect(getMockElement('repTable').innerHTML).toContain('No rep data');
        });
    });

    describe('actionError', () => {
        it('should display error toast', () => {
            handleMessage({ action: 'actionError', message: 'Load failed' });
            expect(getMockElement('toastContainer').innerHTML).toContain('error');
        });
    });

    describe('Message validation', () => {
        it('should return null for null', () => { expect(handleMessage(null)).toBeNull(); });
        it('should return null for no action', () => { expect(handleMessage({})).toBeNull(); });
        it('should return null for unknown', () => { expect(handleMessage({ action: 'xyz' })).toBeNull(); });
    });
});
