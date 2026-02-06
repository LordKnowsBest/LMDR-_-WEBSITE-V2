/**
 * B2B Research Panel HTML DOM Tests
 *
 * Tests the B2B_RESEARCH_PANEL.html message handling and DOM rendering.
 * Source: src/public/admin/B2B_RESEARCH_PANEL.html
 *
 * Inbound: init, briefGenerating, briefLoaded, actionError
 * Outbound: generateBrief
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'B2B_RESEARCH_PANEL.html');
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id) {
    const el = {
        id, innerHTML: '', textContent: '', className: '',
        style: { display: '' }, disabled: false,
        classList: {
            add: jest.fn(cls => { if (cls === 'hidden') el.style.display = 'none'; }),
            remove: jest.fn(cls => { if (cls === 'hidden') el.style.display = 'block'; }),
            toggle: jest.fn((cls, force) => {
                if (cls === 'hidden') el.style.display = force ? 'none' : 'block';
            }),
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
    createMockElement('loadingState');
    createMockElement('emptyState');
    createMockElement('briefContent');
    createMockElement('refreshBtn');
    createMockElement('refreshBtnText');
    createMockElement('briefTitle');
    createMockElement('briefMeta');
    createMockElement('cacheIndicator');
    createMockElement('confidenceBadge');
    createMockElement('confidenceIcon');
    createMockElement('confidenceText');
    createMockElement('generatedByBadge');
    createMockElement('generatedByIcon');
    createMockElement('generatedByText');
    createMockElement('sigScore');
    createMockElement('sigDrivers');
    createMockElement('sigFleet');
    createMockElement('sigSafety');
    createMockElement('highlightsList');
    createMockElement('talkTrack');
    createMockElement('copyBtnText');
    createMockElement('nextStepsList');
    createMockElement('sourcesList');
    createMockElement('sourceCountBadge');
    createMockElement('toastContainer');
}

function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// =============================================================================
// REPLICATED MESSAGE HANDLER
// =============================================================================

let currentAccountId = null;

const VALID_ACTIONS = ['init', 'briefLoaded', 'briefGenerating', 'actionError'];

function handleMessage(msg) {
    if (!msg || typeof msg.action !== 'string' || !VALID_ACTIONS.includes(msg.action)) return null;

    switch (msg.action) {
        case 'init':
            if (msg.accountId) {
                currentAccountId = msg.accountId;
                capturedOutbound.push({ action: 'generateBrief', accountId: msg.accountId, forceRefresh: false });
            }
            return 'init';

        case 'briefGenerating': {
            getMockElement('loadingState').style.display = 'block';
            getMockElement('emptyState').style.display = 'none';
            getMockElement('briefContent').style.display = 'none';
            getMockElement('refreshBtn').disabled = true;
            getMockElement('refreshBtnText').textContent = 'Generating...';
            return 'briefGenerating';
        }

        case 'briefLoaded': {
            const data = msg.payload || {};
            getMockElement('loadingState').style.display = 'none';
            getMockElement('refreshBtn').disabled = false;
            getMockElement('refreshBtnText').textContent = 'Refresh Brief';

            if (!data || !data.brief) {
                getMockElement('emptyState').style.display = 'block';
                return 'briefLoaded';
            }

            const brief = data.brief;
            getMockElement('emptyState').style.display = 'none';
            getMockElement('briefContent').style.display = 'block';

            // Header
            getMockElement('briefTitle').textContent = 'Research: ' + (brief.carrier_name || 'Unknown');
            getMockElement('briefMeta').textContent = brief.carrier_dot ? 'DOT ' + brief.carrier_dot : '';

            // Cache indicator
            if (data.cached) getMockElement('cacheIndicator').style.display = 'block';
            else getMockElement('cacheIndicator').style.display = 'none';

            // Confidence badge
            const confidence = brief.confidence || 'medium';
            getMockElement('confidenceText').textContent =
                confidence === 'high' ? 'High Confidence' :
                confidence === 'low' ? 'Low Confidence' : 'Medium Confidence';

            // Generated-by badge
            const genBy = brief.generated_by || 'research_agent';
            getMockElement('generatedByText').textContent =
                genBy === 'llm_claude' ? 'AI-Powered' :
                genBy === 'template_fallback' ? 'Template' : 'Agent';

            // Signals
            const sig = typeof brief.signals === 'object' ? brief.signals : {};
            getMockElement('sigScore').textContent = sig.match_score || '—';
            getMockElement('sigDrivers').textContent = sig.driver_count || '—';
            getMockElement('sigFleet').textContent = sig.fleet_size || '—';
            getMockElement('sigSafety').textContent = sig.safety_rating || '—';

            // Highlights
            const highlights = Array.isArray(brief.highlights) ? brief.highlights : [];
            getMockElement('highlightsList').innerHTML = highlights.length > 0
                ? highlights.map(h => `<li>${sanitize(h)}</li>`).join('')
                : '<li>No highlights available</li>';

            // Talk track
            getMockElement('talkTrack').textContent = brief.talk_track || 'No talk track generated';

            // Next steps
            const steps = Array.isArray(brief.next_steps) ? brief.next_steps : [];
            getMockElement('nextStepsList').innerHTML = steps.length > 0
                ? steps.map(s => `<div>${sanitize(s.text || s)}</div>`).join('')
                : '<p>No recommendations</p>';

            // Sources
            const sources = Array.isArray(brief.sources) ? brief.sources : [];
            getMockElement('sourcesList').innerHTML = sources.length > 0
                ? sources.map(s => `<span>${sanitize(s)}</span>`).join('')
                : '<span>No sources</span>';
            getMockElement('sourceCountBadge').textContent = sources.length > 0 ? String(sources.length) : '';

            return 'briefLoaded';
        }

        case 'actionError': {
            getMockElement('loadingState').style.display = 'none';
            getMockElement('refreshBtn').disabled = false;
            getMockElement('refreshBtnText').textContent = 'Refresh Brief';
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

describe('B2B Research Panel HTML DOM Tests', () => {
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
        it('should request brief generation when accountId provided', () => {
            handleMessage({ action: 'init', accountId: 'acc-123' });
            expect(capturedOutbound).toContainEqual({ action: 'generateBrief', accountId: 'acc-123', forceRefresh: false });
            expect(currentAccountId).toBe('acc-123');
        });

        it('should not request brief when no accountId', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    describe('briefGenerating', () => {
        it('should show loading state', () => {
            handleMessage({ action: 'briefGenerating' });
            expect(getMockElement('loadingState').style.display).toBe('block');
            expect(getMockElement('refreshBtn').disabled).toBe(true);
            expect(getMockElement('refreshBtnText').textContent).toBe('Generating...');
        });
    });

    describe('briefLoaded', () => {
        it('should render full brief data', () => {
            handleMessage({ action: 'briefLoaded', payload: {
                brief: {
                    carrier_name: 'Acme Trucking',
                    carrier_dot: '1234567',
                    confidence: 'high',
                    generated_by: 'llm_claude',
                    signals: { match_score: 85, driver_count: 12, fleet_size: 50, safety_rating: 'A' },
                    highlights: ['Large fleet', 'Growing region'],
                    talk_track: 'Start with fleet size discussion',
                    next_steps: [{ text: 'Schedule call', type: 'call' }],
                    sources: ['FMCSA', 'LinkedIn']
                },
                cached: false
            }});

            expect(getMockElement('briefTitle').textContent).toContain('Acme Trucking');
            expect(getMockElement('briefMeta').textContent).toContain('1234567');
            expect(getMockElement('confidenceText').textContent).toBe('High Confidence');
            expect(getMockElement('generatedByText').textContent).toBe('AI-Powered');
            expect(getMockElement('sigScore').textContent).toBe(85);
            expect(getMockElement('sigDrivers').textContent).toBe(12);
            expect(getMockElement('highlightsList').innerHTML).toContain('Large fleet');
            expect(getMockElement('talkTrack').textContent).toBe('Start with fleet size discussion');
            expect(getMockElement('nextStepsList').innerHTML).toContain('Schedule call');
            expect(getMockElement('sourcesList').innerHTML).toContain('FMCSA');
            expect(getMockElement('sourceCountBadge').textContent).toBe('2');
        });

        it('should show empty state when no brief data', () => {
            handleMessage({ action: 'briefLoaded', payload: {} });
            expect(getMockElement('emptyState').style.display).toBe('block');
        });

        it('should show cache indicator when cached', () => {
            handleMessage({ action: 'briefLoaded', payload: {
                brief: { carrier_name: 'Test' }, cached: true
            }});
            expect(getMockElement('cacheIndicator').style.display).toBe('block');
        });

        it('should handle template_fallback generated_by', () => {
            handleMessage({ action: 'briefLoaded', payload: {
                brief: { carrier_name: 'Test', generated_by: 'template_fallback' }, cached: false
            }});
            expect(getMockElement('generatedByText').textContent).toBe('Template');
        });

        it('should handle low confidence', () => {
            handleMessage({ action: 'briefLoaded', payload: {
                brief: { carrier_name: 'Test', confidence: 'low' }, cached: false
            }});
            expect(getMockElement('confidenceText').textContent).toBe('Low Confidence');
        });

        it('should re-enable refresh button', () => {
            handleMessage({ action: 'briefLoaded', payload: { brief: { carrier_name: 'Test' } } });
            expect(getMockElement('refreshBtn').disabled).toBe(false);
            expect(getMockElement('refreshBtnText').textContent).toBe('Refresh Brief');
        });

        it('should handle empty highlights and sources', () => {
            handleMessage({ action: 'briefLoaded', payload: {
                brief: { carrier_name: 'Test', highlights: [], sources: [], next_steps: [] }, cached: false
            }});
            expect(getMockElement('highlightsList').innerHTML).toContain('No highlights');
            expect(getMockElement('sourcesList').innerHTML).toContain('No sources');
            expect(getMockElement('nextStepsList').innerHTML).toContain('No recommendations');
        });
    });

    describe('actionError', () => {
        it('should hide loading and show error toast', () => {
            handleMessage({ action: 'actionError', message: 'AI service unavailable' });
            expect(getMockElement('loadingState').style.display).toBe('none');
            expect(getMockElement('refreshBtn').disabled).toBe(false);
            expect(getMockElement('toastContainer').innerHTML).toContain('AI service unavailable');
        });

        it('should sanitize error message', () => {
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
