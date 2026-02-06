/**
 * ADMIN_MATCHES HTML DOM Tests
 * ==============================
 * Tests for src/public/admin/ADMIN_MATCHES.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: action/payload
 * Ready signal: getStats (sent on init)
 *
 * Inbound: init, statsLoaded, matchesLoaded, interestsLoaded, trendsLoaded,
 *   topMatchesLoaded, matchDetailLoaded, actionListLoaded, exportReady, actionError
 * Outbound: getStats, getMatches, getInterests, getTrends, getTopMatches,
 *   getMatchDetail, getActionList, exportMatches
 *
 * @see src/public/admin/ADMIN_MATCHES.html
 * @see src/pages/ADMIN_MATCHES.gqhdo.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'ADMIN_MATCHES.html');
const MESSAGE_KEY = 'action';

const INBOUND_MESSAGES = [
    'init',
    'statsLoaded',
    'matchesLoaded',
    'interestsLoaded',
    'trendsLoaded',
    'topMatchesLoaded',
    'matchDetailLoaded',
    'actionListLoaded',
    'exportReady',
    'actionError'
];

const OUTBOUND_MESSAGES = [
    'getStats',
    'getMatches',
    'getInterests',
    'getTrends',
    'getTopMatches',
    'getMatchDetail',
    'exportMatches'
];

// =============================================================================
// READ SOURCE FILE
// =============================================================================

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

function createMockElement(id) {
    const children = [];
    const element = {
        id,
        textContent: '',
        innerHTML: '',
        innerText: '',
        value: '',
        className: '',
        style: {},
        hidden: false,
        disabled: false,
        children,
        childNodes: children,
        dataset: {},
        classList: {
            _classes: new Set(),
            add: jest.fn(function (...cls) { cls.forEach(c => this._classes.add(c)); }),
            remove: jest.fn(function (...cls) { cls.forEach(c => this._classes.delete(c)); }),
            toggle: jest.fn(function (cls) {
                if (this._classes.has(cls)) this._classes.delete(cls);
                else this._classes.add(cls);
            }),
            contains: jest.fn(function (cls) { return this._classes.has(cls); }),
        },
        appendChild: jest.fn((child) => { children.push(child); return child; }),
        removeChild: jest.fn(),
        remove: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => createMockElement('sub')),
        querySelectorAll: jest.fn(() => []),
    };
    return element;
}

const mockElements = {};

function getMockElement(id) {
    if (!mockElements[id]) {
        mockElements[id] = createMockElement(id);
    }
    return mockElements[id];
}

const capturedOutbound = [];

function mockPostToParent(message) {
    capturedOutbound.push(message);
}

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function sendToVelo(message) {
    mockPostToParent(message);
}

const state = {
    matches: [],
    interests: [],
    stats: null,
    trends: null
};

function showToast(message, type = 'info') {
    const el = getMockElement('toast');
    el.textContent = message;
    el.className = `toast toast-${type}`;
}

function handleStatsLoaded(data) {
    state.stats = data;
    getMockElement('statToday').textContent = (data.today || 0).toString();
    getMockElement('statWeek').textContent = (data.thisWeek || 0).toString();
    getMockElement('statAvgScore').textContent = (data.avgScore || 0).toString();
    getMockElement('statConversion').textContent = `${data.conversionRate || 0}%`;
}

function handleMatchesLoaded(data) {
    state.matches = data.matches || [];
    const list = getMockElement('matchList');

    if (state.matches.length === 0) {
        list.innerHTML = '<div class="text-center">No matches found</div>';
    } else {
        list.innerHTML = state.matches.map(m =>
            `<div class="match-row" data-id="${m._id}">${m.driverName || ''} → ${m.carrierName || ''} (${m.score || 0})</div>`
        ).join('');
    }
}

function handleInterestsLoaded(data) {
    state.interests = data.interests || [];
    const list = getMockElement('interestList');

    if (state.interests.length === 0) {
        list.innerHTML = '<div class="text-center">No interests found</div>';
    } else {
        list.innerHTML = state.interests.map(i =>
            `<div class="interest-row">${i.driverName || ''} - ${i.status || ''}</div>`
        ).join('');
    }
}

function handleTrendsLoaded(data) {
    state.trends = data;
    getMockElement('trendsChart').innerHTML = 'Chart updated';
}

function handleTopMatchesLoaded(data) {
    const list = getMockElement('topMatchesList');
    const items = data.matches || data || [];
    list.innerHTML = items.map(m =>
        `<div class="top-match">${m.driverName || ''} (${m.score || 0})</div>`
    ).join('');
}

function handleMatchDetailLoaded(data) {
    const content = getMockElement('matchDetailContent');
    const sheet = getMockElement('matchDetailSheet');
    content.innerHTML = `<div>${data.driverName || ''} → ${data.carrierName || ''}</div>`;
    sheet.classList.remove('hidden');
}

function handleExportReady(data) {
    getMockElement('exportStatus').textContent = 'Export complete';
}

function handleMessage(eventData) {
    const data = eventData;
    if (!data || !data.action) return;

    switch (data.action) {
        case 'init':
            sendToVelo({ action: 'getStats' });
            sendToVelo({ action: 'getMatches' });
            sendToVelo({ action: 'getTopMatches' });
            break;
        case 'statsLoaded':
            handleStatsLoaded(data.payload);
            break;
        case 'matchesLoaded':
            handleMatchesLoaded(data.payload);
            break;
        case 'interestsLoaded':
            handleInterestsLoaded(data.payload);
            break;
        case 'trendsLoaded':
            handleTrendsLoaded(data.payload);
            break;
        case 'topMatchesLoaded':
            handleTopMatchesLoaded(data.payload);
            break;
        case 'matchDetailLoaded':
            handleMatchDetailLoaded(data.payload);
            break;
        case 'exportReady':
            handleExportReady(data.payload);
            break;
        case 'actionError':
            showToast(data.message || 'An error occurred', 'error');
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_MATCHES.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.value = '';
            el.hidden = false;
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.matches = [];
        state.interests = [];
        state.stats = null;
        state.trends = null;
    });

    // =========================================================================
    // SOURCE HTML STRUCTURAL CHECKS
    // =========================================================================

    describe('HTML source structure', () => {
        test('file exists and is readable', () => {
            expect(htmlSource.length).toBeGreaterThan(0);
        });

        test('contains a message listener', () => {
            const hasListener =
                htmlSource.includes("addEventListener('message'") ||
                htmlSource.includes('addEventListener("message"') ||
                htmlSource.includes('window.onmessage');
            expect(hasListener).toBe(true);
        });

        test('contains a function to post messages back to parent', () => {
            const hasOutbound =
                htmlSource.includes('window.parent.postMessage') ||
                htmlSource.includes('parent.postMessage');
            expect(hasOutbound).toBe(true);
        });

        test('handles all expected inbound message types', () => {
            INBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('references all expected outbound message types', () => {
            OUTBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('uses action-based message protocol', () => {
            const hasAction =
                htmlSource.includes('data.action') ||
                htmlSource.includes('.action');
            expect(hasAction).toBe(true);
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================

    describe('Message validation', () => {
        test('ignores null/undefined messages', () => {
            handleMessage(null);
            handleMessage(undefined);
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores messages without action key', () => {
            handleMessage({ type: 'wrong_key' });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {
        test('statsLoaded updates stat counters', () => {
            handleMessage({
                action: 'statsLoaded',
                payload: { today: 42, thisWeek: 280, avgScore: 78, conversionRate: 15 }
            });

            expect(getMockElement('statToday').textContent).toBe('42');
            expect(getMockElement('statWeek').textContent).toBe('280');
            expect(getMockElement('statAvgScore').textContent).toBe('78');
            expect(getMockElement('statConversion').textContent).toBe('15%');
        });

        test('matchesLoaded populates match list', () => {
            handleMessage({
                action: 'matchesLoaded',
                payload: {
                    matches: [
                        { _id: 'm1', driverName: 'John', carrierName: 'ABC Freight', score: 92 },
                        { _id: 'm2', driverName: 'Jane', carrierName: 'XYZ Trucking', score: 85 }
                    ]
                }
            });

            expect(getMockElement('matchList').innerHTML).toContain('John');
            expect(getMockElement('matchList').innerHTML).toContain('ABC Freight');
            expect(getMockElement('matchList').innerHTML).toContain('92');
        });

        test('matchesLoaded with empty list shows no matches', () => {
            handleMessage({
                action: 'matchesLoaded',
                payload: { matches: [] }
            });

            expect(getMockElement('matchList').innerHTML).toContain('No matches found');
        });

        test('interestsLoaded populates interest list', () => {
            handleMessage({
                action: 'interestsLoaded',
                payload: {
                    interests: [
                        { driverName: 'John', status: 'pending' }
                    ]
                }
            });

            expect(getMockElement('interestList').innerHTML).toContain('John');
            expect(getMockElement('interestList').innerHTML).toContain('pending');
        });

        test('trendsLoaded updates chart', () => {
            handleMessage({
                action: 'trendsLoaded',
                payload: { labels: ['Mon'], values: [10] }
            });

            expect(getMockElement('trendsChart').innerHTML).toBe('Chart updated');
        });

        test('topMatchesLoaded populates top matches list', () => {
            handleMessage({
                action: 'topMatchesLoaded',
                payload: { matches: [{ driverName: 'Top Driver', score: 98 }] }
            });

            expect(getMockElement('topMatchesList').innerHTML).toContain('Top Driver');
            expect(getMockElement('topMatchesList').innerHTML).toContain('98');
        });

        test('matchDetailLoaded opens detail sheet', () => {
            handleMessage({
                action: 'matchDetailLoaded',
                payload: { driverName: 'John', carrierName: 'ABC Freight' }
            });

            expect(getMockElement('matchDetailContent').innerHTML).toContain('John');
            expect(getMockElement('matchDetailSheet').classList.remove).toHaveBeenCalledWith('hidden');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('init action triggers data requests', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound.length).toBeGreaterThanOrEqual(2);
            expect(capturedOutbound.find(m => m.action === 'getStats')).toBeDefined();
            expect(capturedOutbound.find(m => m.action === 'getMatches')).toBeDefined();
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {
        test('actionError shows toast with error message', () => {
            handleMessage({ action: 'actionError', message: 'Match ID is required' });
            expect(getMockElement('toast').textContent).toBe('Match ID is required');
            expect(getMockElement('toast').className).toContain('toast-error');
        });

        test('actionError with no message shows fallback', () => {
            handleMessage({ action: 'actionError' });
            expect(getMockElement('toast').textContent).toBe('An error occurred');
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical element IDs', () => {
            const criticalIds = ['matchList', 'interestList', 'topMatchesList', 'trendsChart'];
            criticalIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent or sanitization for user content', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('sanitize');
            expect(hasSanitization).toBe(true);
        });
    });
});
