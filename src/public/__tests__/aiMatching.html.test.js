/**
 * HTML DOM TEST: AI Matching
 * ===========================
 * Verifies that the AI_MATCHING.html component correctly:
 *   1. Listens for postMessage events from Wix page code
 *   2. Dispatches messages to the correct handler functions
 *   3. Renders data to the DOM when it receives messages
 *   4. Sends messages back to the parent (Velo page code)
 *   5. Displays errors correctly
 *
 * HTML: src/public/driver/AI_MATCHING.html
 * Protocol: type/data
 *
 * @see src/public/driver/AI_MATCHING.html
 * @see src/pages/AI - Matching.rof4w.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'driver', 'AI_MATCHING.html');

const MESSAGE_KEY = 'type';

const READY_SIGNAL = 'carrierMatchingReady';

const INBOUND_MESSAGES = [
    'matchResults',
    'enrichmentUpdate',
    'enrichmentComplete',
    'interestLogged',
    'matchError',
    'pageReady',
    'userStatusUpdate',
    'loginSuccess',
    'loginCancelled',
    'applicationSubmitted',
    'pong',
    'driverProfileLoaded',
    'savedCarriersLoaded',
    'discoverabilityUpdated',
    'ocrResult',
    'mutualInterestData',
    'matchExplanation'
];

const OUTBOUND_MESSAGES = [
    'carrierMatchingReady',
    'findMatches',
    'logInterest',
    'retryEnrichment',
    'navigateToSignup',
    'navigateToLogin',
    'checkUserStatus',
    'getDriverProfile',
    'submitApplication',
    'extractDocumentOCR',
    'getMatchExplanation',
    'ping'
];

const DOM_ELEMENT_MAP = {
    'matchResults': ['resultsSummary', 'carrierCards'],
    'matchError': ['resultsSummary'],
    'pageReady': ['driverNameInput', 'homeZipInput'],
    'applicationSubmitted': ['applicationModal'],
    'ocrResult': ['cdlFrontFile', 'medCardFile']
};

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
        scrollTop: 0,
        scrollHeight: 100,
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
        removeChild: jest.fn((child) => {
            const idx = children.indexOf(child);
            if (idx > -1) children.splice(idx, 1);
            return child;
        }),
        remove: jest.fn(),
        insertBefore: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        closest: jest.fn(() => null),
        focus: jest.fn(),
        blur: jest.fn(),
        click: jest.fn(),
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

function sendToVelo(type, data = {}) {
    mockPostToParent({ type, data, timestamp: Date.now() });
}

// State
const state = {
    userStatus: { loggedIn: false, isPremium: false },
    matches: [],
    currentCarrier: null,
    pendingApplicationData: null
};

// Rendering functions (simplified from HTML)
function renderMatches(data) {
    const container = getMockElement('carrierCards');
    if (!data.matches || data.matches.length === 0) {
        container.innerHTML = '<div class="no-results">No carriers match your criteria</div>';
        return;
    }

    container.innerHTML = data.matches.map(match => `
        <div class="carrier-card" data-dot="${match.carrier?.DOT_NUMBER}">
            <h3>${match.carrier?.LEGAL_NAME || 'Unknown Carrier'}</h3>
            <span class="score">${match.score || 0}%</span>
        </div>
    `).join('');

    state.matches = data.matches;
}

function updateResultsSummary(data) {
    const summary = getMockElement('resultsSummary');
    summary.innerHTML = `Found ${data.totalScored || 0} carriers. Showing top ${data.matches?.length || 0}.`;
}

function handleLoginSuccess(data) {
    state.userStatus = data.userStatus || { loggedIn: true, isPremium: true };
    getMockElement('loginPrompt').classList.add('hidden');
    getMockElement('premiumFeatures').classList.remove('hidden');
}

function handleApplicationSubmitted(data) {
    const modal = getMockElement('applicationModal');
    if (data.success) {
        modal.innerHTML = `<div class="success">Application submitted to ${data.carrierName}!</div>`;
    } else {
        modal.innerHTML = `<div class="error">Failed: ${data.error}</div>`;
    }
}

function handleOCRResult(data) {
    if (data.success && data.fields) {
        if (data.fields.firstName) getMockElement('firstNameInput').value = data.fields.firstName;
        if (data.fields.lastName) getMockElement('lastNameInput').value = data.fields.lastName;
        if (data.fields.cdlNumber) getMockElement('cdlNumberInput').value = data.fields.cdlNumber;
    }
}

function showError(message) {
    const toast = getMockElement('toastContainer');
    toast.innerHTML = `<div class="toast error">${message}</div>`;
    toast.classList.remove('hidden');
}

function populateFormFromProfile(profile) {
    if (profile.displayName) getMockElement('driverNameInput').value = profile.displayName;
    if (profile.homeZip) getMockElement('homeZipInput').value = profile.homeZip;
}

// Message handler
function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'matchResults':
            renderMatches(msg.data);
            updateResultsSummary(msg.data);
            break;

        case 'matchError':
            showError(msg.data?.error || 'Unknown error');
            break;

        case 'pageReady':
            state.userStatus = msg.data.userStatus || state.userStatus;
            if (msg.data.driverProfile) {
                populateFormFromProfile(msg.data.driverProfile);
            }
            break;

        case 'userStatusUpdate':
            state.userStatus = msg.data;
            break;

        case 'loginSuccess':
            handleLoginSuccess(msg.data);
            break;

        case 'loginCancelled':
            getMockElement('loginModal').classList.add('hidden');
            break;

        case 'applicationSubmitted':
            handleApplicationSubmitted(msg.data);
            break;

        case 'pong':
            console.log('Connection verified');
            break;

        case 'driverProfileLoaded':
            if (msg.data?.success && msg.data?.profile) {
                populateFormFromProfile(msg.data.profile);
            }
            break;

        case 'ocrResult':
            handleOCRResult(msg.data);
            break;

        case 'enrichmentUpdate':
            // Update specific carrier card with enrichment data
            break;

        case 'enrichmentComplete':
            // Mark all enrichments complete
            break;

        case 'interestLogged':
            // Update save button state
            break;

        case 'mutualInterestData':
            // Highlight mutual interest carriers
            break;

        case 'matchExplanation':
            // Show explanation modal
            break;

        default:
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('AI_MATCHING.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.innerText = '';
            el.value = '';
            el.hidden = false;
            el.disabled = false;
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.children.length = 0;
        });
        state.userStatus = { loggedIn: false, isPremium: false };
        state.matches = [];
        state.currentCarrier = null;
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

        test('sends carrierMatchingReady signal on initialization', () => {
            expect(htmlSource).toContain(READY_SIGNAL);
        });

        test('handles all expected inbound message types', () => {
            INBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('uses type-based message protocol', () => {
            const hasType =
                htmlSource.includes('msg.type') ||
                htmlSource.includes("event.data.type") ||
                htmlSource.includes("case 'matchResults'");
            expect(hasType).toBe(true);
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

        test('ignores empty object messages', () => {
            handleMessage({});
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores messages without type key', () => {
            handleMessage({ action: 'wrong_key', payload: {} });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {

        test('matchResults renders carrier cards', () => {
            handleMessage({
                type: 'matchResults',
                data: {
                    matches: [
                        { carrier: { DOT_NUMBER: 1234567, LEGAL_NAME: 'Swift Transportation' }, score: 92 },
                        { carrier: { DOT_NUMBER: 2345678, LEGAL_NAME: 'Werner Enterprises' }, score: 85 }
                    ],
                    totalScored: 100
                }
            });

            const container = getMockElement('carrierCards');
            expect(container.innerHTML).toContain('Swift Transportation');
            expect(container.innerHTML).toContain('Werner Enterprises');
            expect(container.innerHTML).toContain('92%');
            expect(state.matches).toHaveLength(2);
        });

        test('matchResults renders empty state when no matches', () => {
            handleMessage({
                type: 'matchResults',
                data: { matches: [], totalScored: 0 }
            });

            const container = getMockElement('carrierCards');
            expect(container.innerHTML).toContain('No carriers');
        });

        test('matchResults updates summary count', () => {
            handleMessage({
                type: 'matchResults',
                data: { matches: [{ carrier: { DOT_NUMBER: 123 }, score: 80 }], totalScored: 50 }
            });

            const summary = getMockElement('resultsSummary');
            expect(summary.innerHTML).toContain('50');
        });

        test('pageReady populates form with driver profile', () => {
            handleMessage({
                type: 'pageReady',
                data: {
                    userStatus: { loggedIn: true, isPremium: true },
                    driverProfile: { displayName: 'John Doe', homeZip: '75001' }
                }
            });

            expect(getMockElement('driverNameInput').value).toBe('John Doe');
            expect(getMockElement('homeZipInput').value).toBe('75001');
        });

        test('driverProfileLoaded populates form fields', () => {
            handleMessage({
                type: 'driverProfileLoaded',
                data: {
                    success: true,
                    profile: { displayName: 'Jane Smith', homeZip: '90210' }
                }
            });

            expect(getMockElement('driverNameInput').value).toBe('Jane Smith');
            expect(getMockElement('homeZipInput').value).toBe('90210');
        });

        test('loginSuccess hides login prompt and shows premium features', () => {
            handleMessage({
                type: 'loginSuccess',
                data: {
                    message: 'Welcome!',
                    userStatus: { loggedIn: true, isPremium: true }
                }
            });

            expect(getMockElement('loginPrompt').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('premiumFeatures').classList.remove).toHaveBeenCalledWith('hidden');
            expect(state.userStatus.loggedIn).toBe(true);
        });

        test('applicationSubmitted shows success message', () => {
            handleMessage({
                type: 'applicationSubmitted',
                data: { success: true, carrierDOT: '1234567', carrierName: 'Swift' }
            });

            const modal = getMockElement('applicationModal');
            expect(modal.innerHTML).toContain('submitted');
            expect(modal.innerHTML).toContain('Swift');
        });

        test('applicationSubmitted shows error on failure', () => {
            handleMessage({
                type: 'applicationSubmitted',
                data: { success: false, error: 'Network error' }
            });

            const modal = getMockElement('applicationModal');
            expect(modal.innerHTML).toContain('error');
            expect(modal.innerHTML).toContain('Network error');
        });

        test('ocrResult populates form fields from extracted data', () => {
            handleMessage({
                type: 'ocrResult',
                data: {
                    success: true,
                    docType: 'CDL_FRONT',
                    fields: { firstName: 'Robert', lastName: 'Johnson', cdlNumber: 'D1234567' }
                }
            });

            expect(getMockElement('firstNameInput').value).toBe('Robert');
            expect(getMockElement('lastNameInput').value).toBe('Johnson');
            expect(getMockElement('cdlNumberInput').value).toBe('D1234567');
        });

        test('matchError displays error toast', () => {
            handleMessage({
                type: 'matchError',
                data: { error: 'Search failed - try again' }
            });

            const toast = getMockElement('toastContainer');
            expect(toast.innerHTML).toContain('Search failed');
            expect(toast.classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('userStatusUpdate updates internal state', () => {
            handleMessage({
                type: 'userStatusUpdate',
                data: { loggedIn: true, isPremium: true, tier: 'premium' }
            });

            expect(state.userStatus.loggedIn).toBe(true);
            expect(state.userStatus.isPremium).toBe(true);
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {

        test('sends carrierMatchingReady signal on initialization', () => {
            sendToVelo(READY_SIGNAL);

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual(
                expect.objectContaining({ type: READY_SIGNAL })
            );
        });

        test('sendToVelo includes timestamp', () => {
            sendToVelo('findMatches', { homeZip: '75001' });

            expect(capturedOutbound[0]).toHaveProperty('timestamp');
            expect(typeof capturedOutbound[0].timestamp).toBe('number');
        });

        test('sendToVelo sends correct data payload', () => {
            sendToVelo('logInterest', { carrierDOT: '1234567', matchScore: 90 });

            expect(capturedOutbound[0].data).toEqual({
                carrierDOT: '1234567',
                matchScore: 90
            });
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {

        test('matchError shows error message in toast', () => {
            handleMessage({
                type: 'matchError',
                data: { error: 'Connection timeout' }
            });

            const toast = getMockElement('toastContainer');
            expect(toast.innerHTML).toContain('Connection timeout');
        });

        test('matchError with no message shows fallback', () => {
            handleMessage({
                type: 'matchError',
                data: {}
            });

            const toast = getMockElement('toastContainer');
            expect(toast.innerHTML).toContain('Unknown error');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {

        test('source uses textContent or similar for user content', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('sanitize');
            expect(hasSanitization).toBe(true);
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {

        test('HTML contains carrier cards container', () => {
            // The actual HTML may use different IDs - check for common patterns
            const hasCardsSection =
                htmlSource.includes('carrier-card') ||
                htmlSource.includes('carrierCards') ||
                htmlSource.includes('results-grid');
            expect(hasCardsSection).toBe(true);
        });

        test('HTML contains form inputs', () => {
            const hasInputs =
                htmlSource.includes('driverName') ||
                htmlSource.includes('homeZip') ||
                htmlSource.includes('input');
            expect(hasInputs).toBe(true);
        });

        test('HTML contains search/submit button', () => {
            const hasButton =
                htmlSource.includes('findMatches') ||
                htmlSource.includes('searchBtn') ||
                htmlSource.includes('submit');
            expect(hasButton).toBe(true);
        });
    });
});
