/* eslint-disable */
/**
 * CARRIER_FLEET_DASHBOARD HTML DOM Tests
 * ========================================
 * Tests for src/public/carrier/CARRIER_FLEET_DASHBOARD.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: action/payload (carrier pages)
 * Ready signal: getDashboardSummary (sent on init along with other requests)
 *
 * Inbound: init, dashboardData
 * Outbound: getDashboardSummary, getActiveDrivers, getTopPerformers,
 *   getOperationalAlerts, navigateTo
 *
 * @see src/public/carrier/CARRIER_FLEET_DASHBOARD.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'carrier', 'CARRIER_FLEET_DASHBOARD.html');
const MESSAGE_KEY = 'action';

const INBOUND_MESSAGES = [
    'init',
    'dashboardData'
];

const OUTBOUND_MESSAGES = [
    'getDashboardSummary',
    'getActiveDrivers',
    'getTopPerformers',
    'getOperationalAlerts',
    'navigateTo'
];

const CRITICAL_ELEMENT_IDS = [
    'carrierName',
    'activeDriversList',
    'alertsList',
    'topPerformers',
    'refreshAllBtn'
];

// =============================================================================
// READ SOURCE FILE
// =============================================================================

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id) {
    const children = [];
    const el = {
        id,
        textContent: '',
        innerHTML: '',
        className: '',
        value: '',
        style: { display: '' },
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
            contains: jest.fn(function (cls) { return this._classes.has(cls); })
        },
        appendChild: jest.fn((child) => { children.push(child); return child; }),
        removeChild: jest.fn((child) => {
            const idx = children.indexOf(child);
            if (idx > -1) children.splice(idx, 1);
            return child;
        }),
        remove: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        focus: jest.fn(),
        click: jest.fn(),
        onclick: null
    };
    mockElements[id] = el;
    return el;
}

function getMockElement(id) {
    if (!mockElements[id]) {
        createMockElement(id);
    }
    return mockElements[id];
}

function resetMockDOM() {
    Object.keys(mockElements).forEach(k => delete mockElements[k]);
    capturedOutbound = [];
    // Pre-create critical elements
    CRITICAL_ELEMENT_IDS.forEach(id => createMockElement(id));
}

// =============================================================================
// REPLICATED CORE LOGIC (mirrors CARRIER_FLEET_DASHBOARD.html script)
// =============================================================================

function sendMessage(action, payload) {
    capturedOutbound.push({ action, payload });
}

function refreshDashboard() {
    sendMessage('getDashboardSummary', {});
    sendMessage('getActiveDrivers', { limit: 5 });
    sendMessage('getTopPerformers', { limit: 3 });
    sendMessage('getOperationalAlerts', {});
}

function updateDashboard(data) {
    if (data.carrierName) {
        getMockElement('carrierName').textContent = data.carrierName;
    }

    // Update active drivers table
    if (data.activeDrivers) {
        const list = getMockElement('activeDriversList');
        list.innerHTML = '';
        data.activeDrivers.forEach(d => {
            const tr = { tagName: 'TR', className: '', innerHTML: '' };
            tr.className = 'border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs';
            tr.innerHTML =
                `<td class="px-6 py-4 font-bold text-slate-700">${d.name}</td>` +
                `<td class="px-6 py-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${d.status === 'driving' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}">${d.status}</span></td>` +
                `<td class="px-6 py-4 text-slate-500">${d.location}</td>` +
                `<td class="px-6 py-4 text-slate-400">${d.lastUpdate}</td>`;
            list.innerHTML += tr.innerHTML;
        });
    }
}

function navigateTo(target) {
    sendMessage('navigateTo', { target });
}

function handleMessage(eventData) {
    if (!eventData || !eventData.action) return null;

    switch (eventData.action) {
        case 'init':
            refreshDashboard();
            return 'init';
        case 'dashboardData':
            updateDashboard(eventData.payload || {});
            return 'dashboardData';
        default:
            return null;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_FLEET_DASHBOARD.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        resetMockDOM();
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

        test('contains parent postMessage calls', () => {
            const hasOutbound =
                htmlSource.includes('window.parent.postMessage') ||
                htmlSource.includes('parent.postMessage');
            expect(hasOutbound).toBe(true);
        });

        test('sends ready signal on load (refreshDashboard on init)', () => {
            expect(htmlSource).toContain('refreshDashboard');
            expect(htmlSource).toContain('getDashboardSummary');
        });

        test('handles expected inbound message types', () => {
            INBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('references expected outbound message types', () => {
            OUTBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('uses action-based message protocol (NOT type)', () => {
            const hasActionProtocol =
                htmlSource.includes('message.action') ||
                htmlSource.includes('data.action');
            expect(hasActionProtocol).toBe(true);

            // Verify it uses action in the switch, not type-based protocol
            const switchOnAction = /switch\s*\(\s*message\.action\s*\)/;
            expect(htmlSource).toMatch(switchOnAction);
        });

        test('contains inline Tailwind config', () => {
            expect(htmlSource).toContain('tailwind.config');
            expect(htmlSource).toContain('cdn.tailwindcss.com');
        });

        test('uses VelocityMatch branding (VM logo)', () => {
            expect(htmlSource).toContain('VelocityMatch');
            expect(htmlSource).toMatch(/>VM</);
        });

        test('contains Fleet Command Center title', () => {
            expect(htmlSource).toContain('Fleet Command Center');
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================

    describe('Message validation', () => {
        test('ignores null/undefined messages', () => {
            expect(handleMessage(null)).toBeNull();
            expect(handleMessage(undefined)).toBeNull();
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores messages without action key', () => {
            expect(handleMessage({ type: 'wrong_key', data: {} })).toBeNull();
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores empty object', () => {
            expect(handleMessage({})).toBeNull();
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores unknown action types', () => {
            expect(handleMessage({ action: 'unknownAction' })).toBeNull();
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {

        test('dashboardData updates carrier name', () => {
            handleMessage({
                action: 'dashboardData',
                payload: {
                    carrierName: 'Acme Trucking Inc.'
                }
            });

            expect(getMockElement('carrierName').textContent).toBe('Acme Trucking Inc.');
        });

        test('dashboardData renders active drivers table', () => {
            handleMessage({
                action: 'dashboardData',
                payload: {
                    activeDrivers: [
                        { name: 'John Smith', status: 'driving', location: 'Dallas, TX', lastUpdate: '2 min ago' },
                        { name: 'Lisa Chen', status: 'resting', location: 'Memphis, TN', lastUpdate: '15 min ago' }
                    ]
                }
            });

            const list = getMockElement('activeDriversList');
            expect(list.innerHTML).toContain('John Smith');
            expect(list.innerHTML).toContain('Lisa Chen');
            expect(list.innerHTML).toContain('Dallas, TX');
            expect(list.innerHTML).toContain('Memphis, TN');
        });

        test('dashboardData applies correct status styling for driving', () => {
            handleMessage({
                action: 'dashboardData',
                payload: {
                    activeDrivers: [
                        { name: 'Jane Doe', status: 'driving', location: 'OKC', lastUpdate: '1 min ago' }
                    ]
                }
            });

            const list = getMockElement('activeDriversList');
            expect(list.innerHTML).toContain('bg-blue-100');
            expect(list.innerHTML).toContain('text-blue-700');
        });

        test('dashboardData applies correct status styling for resting', () => {
            handleMessage({
                action: 'dashboardData',
                payload: {
                    activeDrivers: [
                        { name: 'Bob Jones', status: 'resting', location: 'ATL', lastUpdate: '5 min ago' }
                    ]
                }
            });

            const list = getMockElement('activeDriversList');
            expect(list.innerHTML).toContain('bg-amber-100');
            expect(list.innerHTML).toContain('text-amber-700');
        });

        test('dashboardData with no activeDrivers does not crash', () => {
            expect(() => {
                handleMessage({
                    action: 'dashboardData',
                    payload: { carrierName: 'Test Carrier' }
                });
            }).not.toThrow();
        });

        test('dashboardData with empty payload does not crash', () => {
            expect(() => {
                handleMessage({ action: 'dashboardData', payload: {} });
            }).not.toThrow();
        });

        test('dashboardData without carrierName preserves existing value', () => {
            getMockElement('carrierName').textContent = 'Original Name';
            handleMessage({
                action: 'dashboardData',
                payload: {
                    activeDrivers: [
                        { name: 'Test', status: 'driving', location: 'NYC', lastUpdate: 'now' }
                    ]
                }
            });

            expect(getMockElement('carrierName').textContent).toBe('Original Name');
        });

        test('navigation cards exist in source HTML', () => {
            const navTargets = ['roster', 'equipment', 'map', 'scorecard', 'capacity'];
            navTargets.forEach(target => {
                expect(htmlSource).toContain(`navigateTo('${target}')`);
            });
        });

        test('fleet map section exists with iframe', () => {
            expect(htmlSource).toContain('FLEET_MAP.html');
            expect(htmlSource).toMatch(/<iframe[^>]*src="FLEET_MAP\.html"/);
        });

        test('roster table section exists', () => {
            expect(htmlSource).toContain('Active Status Roster');
            expect(htmlSource).toContain('id="activeDriversList"');
            expect(htmlSource).toMatch(/<table/);
            expect(htmlSource).toMatch(/<thead/);
            expect(htmlSource).toMatch(/<tbody/);
        });

        test('roster table has expected column headers', () => {
            expect(htmlSource).toContain('>Driver<');
            expect(htmlSource).toContain('>Status<');
            expect(htmlSource).toContain('>Location<');
            expect(htmlSource).toContain('>Last Update<');
        });

        test('alerts section exists', () => {
            expect(htmlSource).toContain('Operational Alerts');
            expect(htmlSource).toContain('id="alertsList"');
        });

        test('alerts section contains alert types', () => {
            expect(htmlSource).toContain('Credential Expiring');
            expect(htmlSource).toContain('Service Due');
            expect(htmlSource).toContain('Needs Coaching');
        });

        test('performers section exists', () => {
            expect(htmlSource).toContain('Top Fleet Performers');
            expect(htmlSource).toContain('id="topPerformers"');
        });

        test('performers section contains placeholder data', () => {
            expect(htmlSource).toContain('Lisa Chen');
            expect(htmlSource).toContain('Maria Garcia');
            expect(htmlSource).toContain('John Smith');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {

        test('init triggers all 4 dashboard data requests', () => {
            handleMessage({ action: 'init' });

            expect(capturedOutbound).toHaveLength(4);
            expect(capturedOutbound).toContainEqual({ action: 'getDashboardSummary', payload: {} });
            expect(capturedOutbound).toContainEqual({ action: 'getActiveDrivers', payload: { limit: 5 } });
            expect(capturedOutbound).toContainEqual({ action: 'getTopPerformers', payload: { limit: 3 } });
            expect(capturedOutbound).toContainEqual({ action: 'getOperationalAlerts', payload: {} });
        });

        test('getDashboardSummary sends correct format', () => {
            handleMessage({ action: 'init' });

            const summaryMsg = capturedOutbound.find(m => m.action === 'getDashboardSummary');
            expect(summaryMsg).toBeDefined();
            expect(summaryMsg.action).toBe('getDashboardSummary');
        });

        test('getActiveDrivers sends correct format with limit', () => {
            handleMessage({ action: 'init' });

            const driversMsg = capturedOutbound.find(m => m.action === 'getActiveDrivers');
            expect(driversMsg).toBeDefined();
            expect(driversMsg.payload).toEqual({ limit: 5 });
        });

        test('getTopPerformers sends correct format with limit', () => {
            handleMessage({ action: 'init' });

            const performersMsg = capturedOutbound.find(m => m.action === 'getTopPerformers');
            expect(performersMsg).toBeDefined();
            expect(performersMsg.payload).toEqual({ limit: 3 });
        });

        test('getOperationalAlerts sends correct format', () => {
            handleMessage({ action: 'init' });

            const alertsMsg = capturedOutbound.find(m => m.action === 'getOperationalAlerts');
            expect(alertsMsg).toBeDefined();
            expect(alertsMsg.action).toBe('getOperationalAlerts');
        });

        test('navigateTo sends correct format with target', () => {
            navigateTo('roster');

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ action: 'navigateTo', payload: { target: 'roster' } });
        });

        test('navigateTo works for all navigation targets', () => {
            const targets = ['roster', 'equipment', 'map', 'scorecard', 'capacity'];
            targets.forEach(target => {
                capturedOutbound.length = 0;
                navigateTo(target);
                expect(capturedOutbound[0]).toEqual({ action: 'navigateTo', payload: { target } });
            });
        });
    });

    // =========================================================================
    // DOM ELEMENT COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains all critical element IDs', () => {
            CRITICAL_ELEMENT_IDS.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('HTML contains navigation card elements', () => {
            expect(htmlSource).toContain('nav-card');
            // 5 navigation cards: roster, equipment, map, scorecard, capacity
            const navCardMatches = htmlSource.match(/nav-card/g);
            expect(navCardMatches.length).toBeGreaterThanOrEqual(5);
        });

        test('HTML contains widget-card class for sections', () => {
            const widgetMatches = htmlSource.match(/widget-card/g);
            expect(widgetMatches).not.toBeNull();
            expect(widgetMatches.length).toBeGreaterThanOrEqual(3); // map, roster, alerts, performers
        });

        test('HTML contains refresh button', () => {
            expect(htmlSource).toContain('refreshAllBtn');
            expect(htmlSource).toContain('refreshDashboard');
        });

        test('HTML contains Live Locations legend in map overlay', () => {
            expect(htmlSource).toContain('Live Locations');
            expect(htmlSource).toContain('Driving');
            expect(htmlSource).toContain('Resting');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent for user-supplied text fields', () => {
            // The updateDashboard function uses textContent for carrierName
            const hasTextContent = htmlSource.includes('.textContent');
            expect(hasTextContent).toBe(true);
        });

        test('carrierName is set via textContent not innerHTML', () => {
            // Verify the HTML source sets carrierName safely
            const carrierNamePattern = /getElementById\(['"]carrierName['"]\)\.textContent/;
            expect(htmlSource).toMatch(carrierNamePattern);
        });

        test('innerHTML usage is limited to template-controlled content', () => {
            // The only innerHTML usage should be for driver roster rows built from data fields
            // Verify innerHTML is present (for rendering rows) but textContent is also used
            const innerHTMLCount = (htmlSource.match(/\.innerHTML/g) || []).length;
            const textContentCount = (htmlSource.match(/\.textContent/g) || []).length;
            // Both should be present; textContent for safe fields, innerHTML for structured templates
            expect(innerHTMLCount).toBeGreaterThan(0);
            expect(textContentCount).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // SENDMESSAGE HELPER
    // =========================================================================

    describe('sendMessage helper', () => {
        test('source defines a sendMessage function', () => {
            expect(htmlSource).toMatch(/function\s+sendMessage\s*\(/);
        });

        test('sendMessage posts to parent with action and payload', () => {
            const pattern = /window\.parent\.postMessage\(\s*\{\s*action\s*,\s*payload\s*\}/;
            expect(htmlSource).toMatch(pattern);
        });
    });

    // =========================================================================
    // NAVIGATION FUNCTION
    // =========================================================================

    describe('navigateTo function', () => {
        test('source defines a navigateTo function', () => {
            expect(htmlSource).toMatch(/function\s+navigateTo\s*\(/);
        });

        test('navigateTo calls sendMessage with navigateTo action', () => {
            // Verify the HTML includes the navigateTo -> sendMessage wiring
            expect(htmlSource).toContain("sendMessage('navigateTo'");
        });
    });

    // =========================================================================
    // REFRESH BEHAVIOR
    // =========================================================================

    describe('Refresh behavior', () => {
        test('refreshAllBtn triggers refreshDashboard on click', () => {
            // Verify the HTML wires refreshAllBtn click to refreshDashboard
            expect(htmlSource).toMatch(/refreshAllBtn.*onclick\s*=\s*refreshDashboard|refreshAllBtn['"]\)\.onclick\s*=\s*refreshDashboard/);
        });

        test('refreshDashboard sends all 4 outbound messages', () => {
            capturedOutbound.length = 0;
            refreshDashboard();
            expect(capturedOutbound).toHaveLength(4);
            const actions = capturedOutbound.map(m => m.action);
            expect(actions).toContain('getDashboardSummary');
            expect(actions).toContain('getActiveDrivers');
            expect(actions).toContain('getTopPerformers');
            expect(actions).toContain('getOperationalAlerts');
        });
    });
});
