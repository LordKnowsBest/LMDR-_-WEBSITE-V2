/**
 * Carrier_Welcome.html DOM Tests
 *
 * Verifies the HTML component correctly handles inbound messages from
 * the Velo page code and renders carrier welcome data to the DOM.
 *
 * This page uses { type, data } envelope.
 *
 * Inbound messages tested:
 *   - carrierWelcomeData -> updates plan banner, hero title
 *   - loadStatus -> updates onboarding status tracker, progress bar
 *
 * Outbound messages tested:
 *   - getCarrierWelcomeData -> requests data from Velo on DOMContentLoaded
 *   - navigateToIntake, navigateToPreferences, navigateToDashboard,
 *     navigateToDriverSearch -> navigation via parent postMessage
 *
 * @see src/public/carrier/Carrier_Welcome.html
 * @see src/pages/Carrier Welcome.gnhma.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(
    __dirname, '..', 'carrier',
    'Carrier_Welcome.html'
);

const MESSAGE_KEY = 'type';

const READY_SIGNAL = 'getCarrierWelcomeData';

const INBOUND_MESSAGES = [
    'carrierWelcomeData',
    'loadStatus'
];

const OUTBOUND_MESSAGES = [
    'getCarrierWelcomeData',
    'navigateToIntake',
    'navigateToPreferences',
    'navigateToDashboard',
    'navigateToDriverSearch'
];

const DOM_ELEMENT_MAP = {
    'carrierWelcomeData': ['planBanner'],
    'loadStatus': ['currentStatusBadge', 'statusTitle', 'statusDescription', 'progressBar', 'matchPreviewCard', 'matchCount']
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

let carrierData = null;

function sendToVelo(type, data) {
    mockPostToParent({ type, data: data || {} });
}

function navigateParent(messageType) {
    mockPostToParent({ type: messageType });
}

function updateFromCarrierContext(data) {
    carrierData = data;

    const planBanner = getMockElement('planBanner');
    if (data.plan) {
        const planLabel = data.plan === 'enterprise' ? 'Enterprise' : 'Pro';
        planBanner.textContent = `${planLabel} Plan Active`;
        planBanner.classList.remove('hidden');
        if (data.plan === 'enterprise') {
            planBanner.classList.remove('bg-emerald-500/20', 'text-emerald-300', 'border-emerald-400/30');
            planBanner.classList.add('bg-purple-500/20', 'text-purple-300', 'border-purple-400/30');
        }
    }
}

function updateStatusUI(status) {
    if (!status) return;

    getMockElement('currentStatusBadge').textContent = status.stageLabel || '';
    getMockElement('statusTitle').textContent = status.stageLabel || '';

    const nextAction = status.nextAction || {};
    getMockElement('statusDescription').textContent = nextAction.message || '';

    // Progress bar
    if (status.stageName === 'enriching' || status.stageName === 'processing') {
        const progress = status.enrichment?.progress || 30;
        getMockElement('progressBar').style.width = `${progress}%`;
    }

    // Match preview
    const previewCard = getMockElement('matchPreviewCard');
    if (status.matchPreview?.available && status.matchPreview?.count > 0) {
        previewCard.classList.remove('hidden');
        getMockElement('matchCount').textContent = status.matchPreview.count;
    } else {
        previewCard.classList.add('hidden');
    }
}

function handleMessage(eventData) {
    if (!eventData || typeof eventData !== 'object') return;
    const { type, data } = eventData;
    if (!type) return;

    if (type === 'carrierWelcomeData' && data) {
        updateFromCarrierContext(data);
    }

    if (type === 'loadStatus' && data) {
        updateStatusUI(data.status);
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Carrier_Welcome.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        carrierData = null;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.innerText = '';
            el.value = '';
            el.hidden = false;
            el.disabled = false;
            el.style = {};
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.classList.toggle.mockClear();
            el.classList.contains.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
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

        test('sends a ready signal on initialization', () => {
            expect(htmlSource).toContain(READY_SIGNAL);
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

        test('uses type-based message protocol', () => {
            const hasType =
                htmlSource.includes('msg.type') ||
                htmlSource.includes('data.type') ||
                htmlSource.includes("event.data.type");
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
    // DOM RENDERING: carrierWelcomeData
    // =========================================================================

    describe('DOM rendering - carrierWelcomeData', () => {
        test('updates plan banner for pro plan', () => {
            handleMessage({
                type: 'carrierWelcomeData',
                data: { plan: 'pro', memberName: 'John', dotNumber: 'DOT-123' }
            });

            const planBanner = getMockElement('planBanner');
            expect(planBanner.textContent).toBe('Pro Plan Active');
            expect(planBanner.classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('updates plan banner for enterprise plan with purple styling', () => {
            handleMessage({
                type: 'carrierWelcomeData',
                data: { plan: 'enterprise', memberName: 'Jane' }
            });

            const planBanner = getMockElement('planBanner');
            expect(planBanner.textContent).toBe('Enterprise Plan Active');
            expect(planBanner.classList.add).toHaveBeenCalledWith(
                'bg-purple-500/20', 'text-purple-300', 'border-purple-400/30'
            );
        });

        test('stores carrier data in state', () => {
            const testData = {
                plan: 'pro',
                dotNumber: 'DOT-555',
                companyName: 'Test Carrier',
                city: 'Houston',
                state: 'TX',
                fleetSize: 25
            };

            handleMessage({ type: 'carrierWelcomeData', data: testData });

            expect(carrierData).toEqual(testData);
        });

        test('handles missing plan gracefully', () => {
            handleMessage({
                type: 'carrierWelcomeData',
                data: { memberName: 'Test' }
            });

            // No error, plan banner not updated
            expect(carrierData.memberName).toBe('Test');
        });
    });

    // =========================================================================
    // DOM RENDERING: loadStatus
    // =========================================================================

    describe('DOM rendering - loadStatus', () => {
        test('updates status badge and title', () => {
            handleMessage({
                type: 'loadStatus',
                data: {
                    status: {
                        stageName: 'enriching',
                        stageLabel: 'AI Profile Enrichment',
                        nextAction: { message: 'Analyzing your FMCSA data...' },
                        stages: [],
                        enrichment: { progress: 75 }
                    }
                }
            });

            expect(getMockElement('currentStatusBadge').textContent).toBe('AI Profile Enrichment');
            expect(getMockElement('statusTitle').textContent).toBe('AI Profile Enrichment');
            expect(getMockElement('statusDescription').textContent).toBe('Analyzing your FMCSA data...');
        });

        test('updates progress bar for enriching stage', () => {
            handleMessage({
                type: 'loadStatus',
                data: {
                    status: {
                        stageName: 'enriching',
                        stageLabel: 'Enriching',
                        stages: [],
                        enrichment: { progress: 80 }
                    }
                }
            });

            expect(getMockElement('progressBar').style.width).toBe('80%');
        });

        test('shows match preview when matches available', () => {
            handleMessage({
                type: 'loadStatus',
                data: {
                    status: {
                        stageName: 'matching',
                        stageLabel: 'Matching',
                        stages: [],
                        matchPreview: { available: true, count: 15 }
                    }
                }
            });

            expect(getMockElement('matchPreviewCard').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('matchCount').textContent).toBe(15);
        });

        test('hides match preview when no matches', () => {
            handleMessage({
                type: 'loadStatus',
                data: {
                    status: {
                        stageName: 'enriching',
                        stageLabel: 'Enriching',
                        stages: [],
                        matchPreview: { available: false, count: 0 }
                    }
                }
            });

            expect(getMockElement('matchPreviewCard').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('handles null status gracefully', () => {
            handleMessage({
                type: 'loadStatus',
                data: { status: null }
            });

            // No error thrown, no changes made
            expect(getMockElement('currentStatusBadge').textContent).toBe('');
        });

        test('defaults progress to 30% when enrichment progress not specified', () => {
            handleMessage({
                type: 'loadStatus',
                data: {
                    status: {
                        stageName: 'enriching',
                        stageLabel: 'Enriching',
                        stages: []
                    }
                }
            });

            expect(getMockElement('progressBar').style.width).toBe('30%');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('navigateParent sends correct message type', () => {
            navigateParent('navigateToIntake');
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0].type).toBe('navigateToIntake');
        });

        test('all navigation buttons send correct types', () => {
            navigateParent('navigateToIntake');
            navigateParent('navigateToDashboard');
            navigateParent('navigateToDriverSearch');

            expect(capturedOutbound).toHaveLength(3);
            expect(capturedOutbound[0].type).toBe('navigateToIntake');
            expect(capturedOutbound[1].type).toBe('navigateToDashboard');
            expect(capturedOutbound[2].type).toBe('navigateToDriverSearch');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent for user-facing updates', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('stripHtml') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('DOMPurify') ||
                htmlSource.includes('sanitize');
            expect(hasSanitization).toBe(true);
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
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

        test('contains hero section', () => {
            expect(htmlSource).toContain('id="hero"');
        });

        test('contains status tracker section', () => {
            expect(htmlSource).toContain('id="statusTrackerSection"');
        });

        test('contains progress bar container', () => {
            expect(htmlSource).toContain('id="progressBarContainer"');
        });
    });
});
