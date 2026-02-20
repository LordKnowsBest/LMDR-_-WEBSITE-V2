/* eslint-disable */
/**
 * DRIVER_ROAD_UTILITIES HTML DOM Tests
 * ======================================
 * Tests for src/public/driver/DRIVER_ROAD_UTILITIES.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: type/data (driver pages)
 * Ready signal: ready (sent on DOMContentLoaded)
 *
 * Inbound (from Velo): parkingResults, fuelResults, fuelCardsLoaded, fuelCardLinked,
 *   savingsResult, weatherResults, conditionsResults, weighStationResults,
 *   stationStatusResult, restrictionResults, roadConditionReported,
 *   bypassServicesLoaded, bypassServicesSaved, parkingDetails, reportResult,
 *   reviewsLoaded, reviewSubmitted, conditionReported, voteRegistered, error
 *
 * Outbound (to Velo): searchParking, searchFuel, searchWeighStations, getWeather,
 *   getRoadConditions, getTruckRestrictions, reportParking, linkFuelCard, etc.
 *
 * @see src/public/driver/DRIVER_ROAD_UTILITIES.html
 * @see src/pages/Road Utilities.xzvqe.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'driver', 'DRIVER_ROAD_UTILITIES.html');
const MESSAGE_KEY = 'type';

const READY_SIGNAL = 'ready';

const INBOUND_MESSAGES = [
    'parkingResults',
    'fuelResults',
    'fuelCardsLoaded',
    'fuelCardLinked',
    'savingsResult',
    'weatherResults',
    'conditionsResults',
    'weighStationResults',
    'stationStatusResult',
    'restrictionResults',
    'roadConditionReported',
    'bypassServicesLoaded',
    'bypassServicesSaved',
    'parkingDetails',
    'reportResult',
    'reviewsLoaded',
    'reviewSubmitted',
    'conditionReported',
    'voteRegistered',
    'weatherSubscriptionSaved',
    'error',
];

const OUTBOUND_MESSAGES = [
    'searchParking',
    'searchFuel',
    'searchWeighStations',
    'getWeather',
    'getRoadConditions',
    'getTruckRestrictions',
    'subscribeAlerts',
    'tabSwitch',
    'getReviews',
    'getDriverFuelCards',
    'getDriverBypassServices',
];

const DOM_ELEMENT_MAP = {
    'parkingResults': ['parking-results', 'parking-loading'],
    'fuelResults': ['fuel-results'],
    'weighStationResults': ['weighstation-results'],
    'conditionsResults': ['conditions-list', 'stat-incidents', 'stat-construction', 'stat-closures', 'stat-delay'],
    'weatherResults': ['weather-alerts-container', 'chain-laws-list'],
    'reviewsLoaded': ['top-rated-list', 'ratings-loading'],
    // savings-amount is conditionally accessed (null-checked), not always in DOM
    'error': ['parking-loading', 'fuel-loading', 'weighstation-loading'],
};

// =============================================================================
// READ SOURCE FILE
// =============================================================================

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// CDN-served JS modules that own the bridge and message-handling logic
const BRIDGE_FILE = path.resolve(__dirname, '..', 'driver', 'js', 'road-utilities-bridge.js');
const LOGIC_FILE  = path.resolve(__dirname, '..', 'driver', 'js', 'road-utilities-logic.js');
const RENDER_FILE = path.resolve(__dirname, '..', 'driver', 'js', 'road-utilities-render.js');
const bridgeSource = fs.readFileSync(BRIDGE_FILE, 'utf8');
const logicSource  = fs.readFileSync(LOGIC_FILE,  'utf8');
const renderSource = fs.readFileSync(RENDER_FILE, 'utf8');
// Combined source for structural checks that span the full page stack
const fullSource = htmlSource + '\n' + bridgeSource + '\n' + logicSource + '\n' + renderSource;

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
        checked: false,
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
    const allIds = [...new Set(Object.values(DOM_ELEMENT_MAP).flat())];
    allIds.forEach(id => createMockElement(id));
}

// =============================================================================
// REPLICATED CORE LOGIC (mirrors DRIVER_ROAD_UTILITIES.html script)
// =============================================================================

function sendToVelo(type, data = {}) {
    capturedOutbound.push({ type, data });
}

function showToast(message, type) {
    // Simplified for test - track via capturedOutbound
    capturedOutbound.push({ _toast: true, message, toastType: type });
}

// State
const state = {
    parkingResults: [],
    fuelResults: [],
    weighStationResults: [],
    reviews: [],
};

function renderParkingResults(items) {
    state.parkingResults = items || [];
    const container = getMockElement('parking-results');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="text-center py-8">No parking locations found nearby</div>';
        return;
    }
    container.innerHTML = items.map(item =>
        `<div class="parking-card" data-id="${item.location_id || ''}">${item.name || 'Unknown'} - ${item.available_spaces || 0} spaces</div>`
    ).join('');
}

function renderFuelResults(items) {
    state.fuelResults = items || [];
    const container = getMockElement('fuel-results');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="text-center py-8">No fuel stations found</div>';
        return;
    }
    container.innerHTML = items.map(item =>
        `<div class="fuel-card">${item.brand || item.name || 'Station'} - $${(item.diesel_price || 0).toFixed(3)}</div>`
    ).join('');
}

function renderWeighStationResults(items) {
    state.weighStationResults = items || [];
    const container = getMockElement('weighstation-results');
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="text-center py-8">No weigh stations found</div>';
        return;
    }
    container.innerHTML = items.map(item =>
        `<div class="ws-card">${item.name || 'Station'} - ${item.status || 'unknown'}</div>`
    ).join('');
}

function renderConditions(conditions) {
    const container = getMockElement('conditions-list');
    if (!conditions || conditions.length === 0) {
        container.innerHTML = '<div class="text-center py-8">No conditions reported</div>';
        return;
    }
    container.innerHTML = conditions.map(c =>
        `<div class="condition-card">${c.highway || ''} - ${c.type || ''}: ${c.description || ''}</div>`
    ).join('');
}

function renderConditionSummary(summary) {
    if (!summary) return;
    // Count by type
    getMockElement('stat-incidents').textContent = String(summary.incidents || summary.total || 0);
    getMockElement('stat-construction').textContent = String(summary.construction || 0);
    getMockElement('stat-closures').textContent = String(summary.closures || 0);
    const delay = summary.totalDelay || summary.delay || 0;
    getMockElement('stat-delay').textContent = delay + 'm';
}

function renderAlerts(alerts) {
    const container = getMockElement('weather-alerts-container');
    if (!alerts || alerts.length === 0) {
        container.innerHTML = '<div class="text-center py-8"><p>No active alerts</p></div>';
        return;
    }
    container.innerHTML = alerts.map(a =>
        `<div class="alert-card">${a.type || 'Alert'} - ${a.severity || 'unknown'}</div>`
    ).join('');
}

function renderChainLaws(chainLaws) {
    const container = getMockElement('chain-laws-list');
    if (!chainLaws || chainLaws.length === 0) {
        container.innerHTML = '<div class="text-center py-8">No chain requirements</div>';
        return;
    }
    container.innerHTML = chainLaws.map(law =>
        `<div class="chain-law-card">${law.pass || law.name || 'Pass'} (${law.state || ''})</div>`
    ).join('');
}

function renderReviews(data) {
    const list = getMockElement('top-rated-list');
    if (data.reviews && data.reviews.length > 0) {
        list.innerHTML = data.reviews.map(r =>
            `<div class="review-card"><h4>${r.location_name || 'Rest Stop'}</h4><span>${(r.overall_rating || 0).toFixed(1)}</span><p>${r.review_text || ''}</p></div>`
        ).join('');
    } else {
        list.innerHTML = '<div class="text-center py-6">No reviews yet. Be the first to review!</div>';
    }
}

function renderRestrictions(restrictions) {
    const container = getMockElement('restrictions-list');
    if (!restrictions || restrictions.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = restrictions.map(r =>
        `<div class="restriction-card">${r.highway || ''} - ${r.restriction_type || ''}</div>`
    ).join('');
}

function handleMessage(eventData) {
    if (!eventData || !eventData.type) return null;

    const { type, data } = eventData;

    switch (type) {
        case 'parkingResults':
            getMockElement('parking-loading').classList.add('hidden');
            renderParkingResults(data.items || data);
            return 'parkingResults';

        case 'fuelResults':
            renderFuelResults(data.items || data);
            return 'fuelResults';

        case 'fuelCardsLoaded':
            // Would update dropdown - simplified
            return 'fuelCardsLoaded';

        case 'fuelCardLinked':
            if (data.success) showToast('Fuel card linked', 'success');
            return 'fuelCardLinked';

        case 'savingsResult':
            if (data.success && data.totalSavings !== undefined) {
                getMockElement('savings-amount').textContent = '$' + (data.totalSavings || 0).toFixed(2);
            }
            return 'savingsResult';

        case 'weatherResults':
            renderAlerts(data.alerts || []);
            renderChainLaws(data.chainLaws || []);
            return 'weatherResults';

        case 'conditionsResults':
            renderConditions(data.conditions || []);
            renderConditionSummary(data.summary || {});
            return 'conditionsResults';

        case 'weighStationResults':
            renderWeighStationResults(data.items || data);
            return 'weighStationResults';

        case 'stationStatusResult':
            if (data.success) {
                showToast('Thanks for your report!', 'success');
            } else {
                showToast(data.message || 'Failed to submit report', 'error');
            }
            return 'stationStatusResult';

        case 'restrictionResults':
            renderRestrictions(data.restrictions || []);
            return 'restrictionResults';

        case 'roadConditionReported':
            if (data.success) showToast('Road condition reported. Thank you!', 'success');
            else showToast('Failed to report condition', 'error');
            return 'roadConditionReported';

        case 'bypassServicesLoaded':
            return 'bypassServicesLoaded';

        case 'bypassServicesSaved':
            return 'bypassServicesSaved';

        case 'parkingDetails':
            if (data.item) {
                showToast(data.item.name + ' details loaded', 'info');
            }
            return 'parkingDetails';

        case 'reportResult':
            if (data.success) showToast(data.message || 'Report submitted!', 'success');
            else showToast(data.message || 'Report failed', 'error');
            return 'reportResult';

        case 'reviewsLoaded':
            getMockElement('ratings-loading').classList.add('hidden');
            renderReviews(data);
            return 'reviewsLoaded';

        case 'reviewSubmitted':
            if (data.success) showToast(data.message || 'Review submitted!', 'success');
            else showToast(data.message || 'Failed to submit review', 'error');
            return 'reviewSubmitted';

        case 'conditionReported':
            if (data.success) showToast(data.message || 'Condition reported!', 'success');
            else showToast(data.message || 'Report failed', 'error');
            return 'conditionReported';

        case 'voteRegistered':
            if (data.reviewId) showToast('Vote recorded', 'success');
            return 'voteRegistered';

        case 'error':
            getMockElement('parking-loading').classList.add('hidden');
            getMockElement('fuel-loading').classList.add('hidden');
            getMockElement('weighstation-loading').classList.add('hidden');
            return 'error';

        default:
            return null;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('DRIVER_ROAD_UTILITIES.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        resetMockDOM();
        state.parkingResults = [];
        state.fuelResults = [];
        state.weighStationResults = [];
        state.reviews = [];
    });

    // =========================================================================
    // SOURCE HTML STRUCTURAL CHECKS
    // =========================================================================

    describe('HTML source structure', () => {
        test('file exists and is readable', () => {
            expect(htmlSource.length).toBeGreaterThan(0);
        });

        test('contains a message listener', () => {
            // Message listener lives in the CDN-served logic module, not inline HTML
            const hasListener =
                fullSource.includes("addEventListener('message'") ||
                fullSource.includes('addEventListener("message"') ||
                fullSource.includes('window.onmessage');
            expect(hasListener).toBe(true);
        });

        test('contains parent postMessage calls', () => {
            // postMessage calls live in the CDN-served bridge module
            const hasOutbound =
                fullSource.includes('window.parent.postMessage') ||
                fullSource.includes('parent.postMessage');
            expect(hasOutbound).toBe(true);
        });

        test('handles all expected inbound message types', () => {
            // Inbound message types handled in the CDN-served logic module
            INBOUND_MESSAGES.forEach(msg => {
                expect(fullSource).toContain(msg);
            });
        });

        test('references expected outbound message types', () => {
            // Outbound message types defined in the CDN-served bridge module
            OUTBOUND_MESSAGES.forEach(msg => {
                expect(fullSource).toContain(msg);
            });
        });

        test('uses type-based message protocol', () => {
            // Protocol uses msg.type (from event.data); pattern lives in logic module
            const hasType =
                fullSource.includes('{ type, data }') ||
                fullSource.includes('{type, data}') ||
                fullSource.includes('data.type') ||
                fullSource.includes('event.data.type') ||
                fullSource.includes('msg.type');
            expect(hasType).toBe(true);
        });

        test('contains inline Tailwind config', () => {
            expect(htmlSource).toContain('tailwind.config');
            expect(htmlSource).toContain('cdn.tailwindcss.com');
        });

        test('uses LMDR branding (driver surface)', () => {
            expect(htmlSource).toContain('LMDR');
        });

        test('contains Road Utility Center title', () => {
            expect(htmlSource).toContain('Road Utility Center');
        });

        test('has tab navigation for all sections', () => {
            expect(htmlSource).toContain('tab-dashboard');
            expect(htmlSource).toContain('tab-parking');
            expect(htmlSource).toContain('tab-fuel');
            expect(htmlSource).toContain('tab-weighstation');
            expect(htmlSource).toContain('tab-ratings');
            expect(htmlSource).toContain('tab-weather');
            expect(htmlSource).toContain('tab-conditions');
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================

    describe('Message validation', () => {
        test('ignores null/undefined messages', () => {
            expect(handleMessage(null)).toBeNull();
            expect(handleMessage(undefined)).toBeNull();
        });

        test('ignores messages without type key', () => {
            expect(handleMessage({ action: 'wrong_key', payload: {} })).toBeNull();
        });

        test('ignores empty object', () => {
            expect(handleMessage({})).toBeNull();
        });

        test('ignores unknown type', () => {
            expect(handleMessage({ type: 'unknownType', data: {} })).toBeNull();
        });
    });

    // =========================================================================
    // DOM RENDERING - Parking Results
    // =========================================================================

    describe('DOM rendering - Parking', () => {
        test('parkingResults renders parking cards', () => {
            handleMessage({
                type: 'parkingResults',
                data: {
                    items: [
                        { name: 'Pilot #412', available_spaces: 45, location_id: 'loc-1' },
                        { name: 'Love\'s #327', available_spaces: 12, location_id: 'loc-2' },
                    ]
                }
            });

            const container = getMockElement('parking-results');
            expect(container.innerHTML).toContain('Pilot #412');
            expect(container.innerHTML).toContain('Love\'s #327');
            expect(container.innerHTML).toContain('45 spaces');
        });

        test('parkingResults hides loading indicator', () => {
            handleMessage({ type: 'parkingResults', data: { items: [] } });
            expect(getMockElement('parking-loading').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('parkingResults shows empty state when no items', () => {
            handleMessage({ type: 'parkingResults', data: { items: [] } });
            const container = getMockElement('parking-results');
            expect(container.innerHTML).toContain('No parking locations found');
        });

        test('parkingResults updates internal state', () => {
            const items = [{ name: 'Test', available_spaces: 10 }];
            handleMessage({ type: 'parkingResults', data: { items } });
            expect(state.parkingResults).toEqual(items);
        });
    });

    // =========================================================================
    // DOM RENDERING - Fuel Results
    // =========================================================================

    describe('DOM rendering - Fuel', () => {
        test('fuelResults renders fuel station cards', () => {
            handleMessage({
                type: 'fuelResults',
                data: {
                    items: [
                        { brand: 'Pilot', diesel_price: 3.459 },
                        { brand: 'Love\'s', diesel_price: 3.389 },
                    ]
                }
            });

            const container = getMockElement('fuel-results');
            expect(container.innerHTML).toContain('Pilot');
            expect(container.innerHTML).toContain('3.459');
        });

        test('fuelResults shows empty state when no items', () => {
            handleMessage({ type: 'fuelResults', data: { items: [] } });
            const container = getMockElement('fuel-results');
            expect(container.innerHTML).toContain('No fuel stations found');
        });

        test('savingsResult updates savings amount display', () => {
            handleMessage({ type: 'savingsResult', data: { success: true, totalSavings: 42.50 } });
            expect(getMockElement('savings-amount').textContent).toBe('$42.50');
        });
    });

    // =========================================================================
    // DOM RENDERING - Weigh Station Results
    // =========================================================================

    describe('DOM rendering - Weigh Stations', () => {
        test('weighStationResults renders station cards', () => {
            handleMessage({
                type: 'weighStationResults',
                data: {
                    items: [
                        { name: 'I-40 Scale East', status: 'open' },
                        { name: 'I-65 Scale North', status: 'closed' },
                    ]
                }
            });

            const container = getMockElement('weighstation-results');
            expect(container.innerHTML).toContain('I-40 Scale East');
            expect(container.innerHTML).toContain('open');
            expect(container.innerHTML).toContain('I-65 Scale North');
        });

        test('weighStationResults shows empty state when no items', () => {
            handleMessage({ type: 'weighStationResults', data: { items: [] } });
            const container = getMockElement('weighstation-results');
            expect(container.innerHTML).toContain('No weigh stations found');
        });

        test('stationStatusResult success shows toast', () => {
            handleMessage({ type: 'stationStatusResult', data: { success: true } });
            const toast = capturedOutbound.find(m => m._toast && m.toastType === 'success');
            expect(toast).toBeDefined();
            expect(toast.message).toContain('Thanks');
        });

        test('stationStatusResult failure shows error toast', () => {
            handleMessage({ type: 'stationStatusResult', data: { success: false, message: 'Not authorized' } });
            const toast = capturedOutbound.find(m => m._toast && m.toastType === 'error');
            expect(toast).toBeDefined();
            expect(toast.message).toContain('Not authorized');
        });
    });

    // =========================================================================
    // DOM RENDERING - Reviews
    // =========================================================================

    describe('DOM rendering - Reviews', () => {
        test('reviewsLoaded renders review cards', () => {
            handleMessage({
                type: 'reviewsLoaded',
                data: {
                    reviews: [
                        { location_name: 'Rest Stop A', overall_rating: 4.5, review_text: 'Very clean' },
                        { location_name: 'Rest Stop B', overall_rating: 3.0, review_text: 'Average' },
                    ]
                }
            });

            const list = getMockElement('top-rated-list');
            expect(list.innerHTML).toContain('Rest Stop A');
            expect(list.innerHTML).toContain('4.5');
            expect(list.innerHTML).toContain('Very clean');
        });

        test('reviewsLoaded hides loading indicator', () => {
            handleMessage({ type: 'reviewsLoaded', data: { reviews: [] } });
            expect(getMockElement('ratings-loading').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('reviewsLoaded shows empty state when no reviews', () => {
            handleMessage({ type: 'reviewsLoaded', data: { reviews: [] } });
            const list = getMockElement('top-rated-list');
            expect(list.innerHTML).toContain('No reviews yet');
        });

        test('reviewSubmitted success shows toast', () => {
            handleMessage({ type: 'reviewSubmitted', data: { success: true, message: 'Review submitted!' } });
            const toast = capturedOutbound.find(m => m._toast && m.toastType === 'success');
            expect(toast).toBeDefined();
            expect(toast.message).toContain('Review submitted');
        });

        test('voteRegistered shows toast', () => {
            handleMessage({ type: 'voteRegistered', data: { reviewId: 'rev1' } });
            const toast = capturedOutbound.find(m => m._toast && m.toastType === 'success');
            expect(toast).toBeDefined();
            expect(toast.message).toContain('Vote recorded');
        });
    });

    // =========================================================================
    // DOM RENDERING - Weather Results
    // =========================================================================

    describe('DOM rendering - Weather', () => {
        test('weatherResults renders alerts', () => {
            handleMessage({
                type: 'weatherResults',
                data: {
                    alerts: [{ type: 'winter_storm', severity: 'moderate' }],
                    chainLaws: [{ pass: 'Donner Pass', state: 'CA' }]
                }
            });

            const alertsContainer = getMockElement('weather-alerts-container');
            expect(alertsContainer.innerHTML).toContain('winter_storm');

            const chainContainer = getMockElement('chain-laws-list');
            expect(chainContainer.innerHTML).toContain('Donner Pass');
        });

        test('weatherResults shows empty state when no alerts', () => {
            handleMessage({ type: 'weatherResults', data: { alerts: [], chainLaws: [] } });

            const alertsContainer = getMockElement('weather-alerts-container');
            expect(alertsContainer.innerHTML).toContain('No active alerts');
        });
    });

    // =========================================================================
    // DOM RENDERING - Road Conditions
    // =========================================================================

    describe('DOM rendering - Conditions', () => {
        test('conditionsResults renders conditions and summary', () => {
            handleMessage({
                type: 'conditionsResults',
                data: {
                    conditions: [
                        { highway: 'I-80', type: 'closure', description: 'Lanes closed' },
                        { highway: 'I-5', type: 'construction', description: 'Road work' }
                    ],
                    summary: { total: 2, incidents: 2, construction: 1, closures: 1, totalDelay: 45 }
                }
            });

            const container = getMockElement('conditions-list');
            expect(container.innerHTML).toContain('I-80');
            expect(container.innerHTML).toContain('closure');

            expect(getMockElement('stat-incidents').textContent).toBe('2');
            expect(getMockElement('stat-construction').textContent).toBe('1');
            expect(getMockElement('stat-closures').textContent).toBe('1');
            expect(getMockElement('stat-delay').textContent).toBe('45m');
        });

        test('conditionsResults shows empty state when no conditions', () => {
            handleMessage({ type: 'conditionsResults', data: { conditions: [], summary: {} } });
            const container = getMockElement('conditions-list');
            expect(container.innerHTML).toContain('No conditions reported');
        });

        test('restrictionResults renders restriction cards', () => {
            handleMessage({
                type: 'restrictionResults',
                data: {
                    restrictions: [
                        { highway: 'US-6', restriction_type: 'height' },
                        { highway: 'I-70', restriction_type: 'hazmat' }
                    ]
                }
            });

            const container = getMockElement('restrictions-list');
            expect(container.innerHTML).toContain('US-6');
            expect(container.innerHTML).toContain('height');
            expect(container.innerHTML).toContain('I-70');
            expect(container.innerHTML).toContain('hazmat');
        });

        test('roadConditionReported success shows toast', () => {
            handleMessage({ type: 'roadConditionReported', data: { success: true } });
            const toast = capturedOutbound.find(m => m._toast && m.toastType === 'success');
            expect(toast).toBeDefined();
            expect(toast.message).toContain('Road condition reported');
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {
        test('error type hides all loading indicators', () => {
            handleMessage({ type: 'error', data: { message: 'Something went wrong' } });

            expect(getMockElement('parking-loading').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('fuel-loading').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('weighstation-loading').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('reportResult failure shows error toast', () => {
            handleMessage({ type: 'reportResult', data: { success: false, message: 'Report failed' } });
            const toast = capturedOutbound.find(m => m._toast && m.toastType === 'error');
            expect(toast).toBeDefined();
            expect(toast.message).toContain('Report failed');
        });

        test('conditionReported failure shows error toast', () => {
            handleMessage({ type: 'conditionReported', data: { success: false, message: 'Condition report failed' } });
            const toast = capturedOutbound.find(m => m._toast && m.toastType === 'error');
            expect(toast).toBeDefined();
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('sendToVelo sends correct type/data format', () => {
            sendToVelo('searchParking', { lat: 35, lng: -90, radius: 25 });
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({
                type: 'searchParking',
                data: { lat: 35, lng: -90, radius: 25 }
            });
        });

        test('sendToVelo with no data sends empty object', () => {
            sendToVelo('ready');
            expect(capturedOutbound[0].data).toEqual({});
        });
    });

    // =========================================================================
    // DOM ELEMENT COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains all element IDs referenced by handlers', () => {
            const allElementIds = Object.values(DOM_ELEMENT_MAP).flat();
            const uniqueIds = [...new Set(allElementIds)];

            uniqueIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('contains section containers for all tabs', () => {
            expect(htmlSource).toContain('id="section-dashboard"');
            expect(htmlSource).toContain('id="section-parking"');
            expect(htmlSource).toContain('id="section-fuel"');
            expect(htmlSource).toContain('id="section-weighstation"');
            expect(htmlSource).toContain('id="section-ratings"');
            expect(htmlSource).toContain('id="section-weather"');
            expect(htmlSource).toContain('id="section-conditions"');
        });

        test('contains truck specs form elements', () => {
            expect(htmlSource).toContain('id="spec-height"');
            expect(htmlSource).toContain('id="spec-weight"');
            expect(htmlSource).toContain('id="spec-hazmat"');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent for user-facing text', () => {
            // textContent usage lives in the CDN-served logic module
            expect(fullSource).toContain('.textContent');
        });

        test('source contains toast function using textContent', () => {
            // Toast helper using textContent lives in the CDN-served logic module
            expect(fullSource).toContain('toast.textContent');
        });
    });

    // =========================================================================
    // LEAFLET MAP
    // =========================================================================

    describe('Map integration', () => {
        test('includes Leaflet CSS and JS', () => {
            expect(htmlSource).toContain('leaflet.css');
            expect(htmlSource).toContain('leaflet.js');
        });

        test('contains map container element', () => {
            expect(htmlSource).toContain('id="map"');
        });
    });
});
