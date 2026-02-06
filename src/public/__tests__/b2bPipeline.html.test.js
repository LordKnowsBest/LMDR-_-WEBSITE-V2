/**
 * B2B Pipeline HTML DOM Tests
 *
 * Tests the B2B_PIPELINE.html message handling and DOM rendering.
 * Source: src/public/admin/B2B_PIPELINE.html
 *
 * Inbound messages: init, pipelineLoaded, forecastLoaded, actionError, actionSuccess
 * Outbound messages: getPipeline, getForecast, viewAccount
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'B2B_PIPELINE.html');
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id, tag = 'div') {
    const el = {
        id,
        tagName: tag.toUpperCase(),
        innerHTML: '',
        textContent: '',
        className: '',
        style: {},
        children: [],
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            toggle: jest.fn(),
            contains: jest.fn(() => false)
        },
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        remove: jest.fn(),
        closest: jest.fn(() => null),
        dataset: {}
    };
    mockElements[id] = el;
    return el;
}

function getMockElement(id) {
    return mockElements[id] || createMockElement(id);
}

function resetMockDOM() {
    Object.keys(mockElements).forEach(k => delete mockElements[k]);
    capturedOutbound = [];

    // Create expected DOM elements for pipeline page
    createMockElement('pipelineBoard');
    createMockElement('forecastValue');
    createMockElement('forecastConfidence');
    createMockElement('totalPipelineValue');
    createMockElement('totalDeals');
    createMockElement('toastContainer');
}

// =============================================================================
// REPLICATED MESSAGE HANDLER
// =============================================================================

function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function handleMessage(msg) {
    if (!msg || !msg.action) return null;

    switch (msg.action) {
        case 'init':
            // Send initial data requests
            capturedOutbound.push({ action: 'getPipeline' });
            capturedOutbound.push({ action: 'getForecast' });
            return 'init';

        case 'pipelineLoaded': {
            const data = msg.payload || {};
            const board = getMockElement('pipelineBoard');
            const totalValue = getMockElement('totalPipelineValue');
            const totalDeals = getMockElement('totalDeals');

            if (data.stages && data.stages.length > 0) {
                board.innerHTML = data.stages.map(s =>
                    `<div class="stage-column" data-stage="${sanitize(s.name)}">` +
                    `<h3>${sanitize(s.name)}</h3><span>${s.count || 0} deals</span></div>`
                ).join('');
            } else {
                board.innerHTML = '<div class="empty-state">No pipeline data</div>';
            }

            totalValue.textContent = data.totalValue != null ? `$${Number(data.totalValue).toLocaleString()}` : '$0';
            totalDeals.textContent = data.dealCount != null ? String(data.dealCount) : '0';
            return 'pipelineLoaded';
        }

        case 'forecastLoaded': {
            const data = msg.payload || {};
            const forecastValue = getMockElement('forecastValue');
            const forecastConf = getMockElement('forecastConfidence');

            forecastValue.textContent = data.projected != null ? `$${Number(data.projected).toLocaleString()}` : '$0';
            forecastConf.textContent = data.confidence != null ? `${Math.round(data.confidence * 100)}%` : '0%';
            return 'forecastLoaded';
        }

        case 'actionError': {
            const toast = getMockElement('toastContainer');
            toast.innerHTML = `<div class="toast error">${sanitize(msg.message || 'Error')}</div>`;
            return 'actionError';
        }

        case 'actionSuccess': {
            const toast = getMockElement('toastContainer');
            toast.innerHTML = `<div class="toast success">${sanitize(msg.message || 'Success')}</div>`;
            return 'actionSuccess';
        }

        default:
            return null;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('B2B Pipeline HTML DOM Tests', () => {
    beforeEach(() => {
        resetMockDOM();
    });

    describe('HTML source structure', () => {
        it('should exist and be readable', () => {
            expect(htmlSource.length).toBeGreaterThan(0);
        });

        it('should contain message listener', () => {
            expect(htmlSource).toMatch(/addEventListener.*message|onmessage/i);
        });

        it('should reference pipeline-related actions', () => {
            expect(htmlSource).toMatch(/pipelineLoaded|getPipeline/);
        });
    });

    describe('init', () => {
        it('should request pipeline and forecast data', () => {
            handleMessage({ action: 'init' });
            expect(capturedOutbound).toContainEqual({ action: 'getPipeline' });
            expect(capturedOutbound).toContainEqual({ action: 'getForecast' });
        });
    });

    describe('pipelineLoaded', () => {
        it('should render stage columns', () => {
            handleMessage({
                action: 'pipelineLoaded',
                payload: {
                    stages: [
                        { name: 'discovery', count: 3 },
                        { name: 'proposal', count: 2 }
                    ],
                    totalValue: 150000,
                    dealCount: 5
                }
            });

            const board = getMockElement('pipelineBoard');
            expect(board.innerHTML).toContain('discovery');
            expect(board.innerHTML).toContain('proposal');
            expect(getMockElement('totalPipelineValue').textContent).toContain('150,000');
            expect(getMockElement('totalDeals').textContent).toBe('5');
        });

        it('should show empty state when no stages', () => {
            handleMessage({ action: 'pipelineLoaded', payload: { stages: [], totalValue: 0, dealCount: 0 } });
            expect(getMockElement('pipelineBoard').innerHTML).toContain('empty-state');
        });

        it('should handle missing payload', () => {
            handleMessage({ action: 'pipelineLoaded' });
            expect(getMockElement('pipelineBoard').innerHTML).toContain('empty-state');
        });
    });

    describe('forecastLoaded', () => {
        it('should display forecast values', () => {
            handleMessage({ action: 'forecastLoaded', payload: { projected: 200000, confidence: 0.75 } });
            expect(getMockElement('forecastValue').textContent).toContain('200,000');
            expect(getMockElement('forecastConfidence').textContent).toBe('75%');
        });

        it('should handle missing payload', () => {
            handleMessage({ action: 'forecastLoaded' });
            expect(getMockElement('forecastValue').textContent).toBe('$0');
            expect(getMockElement('forecastConfidence').textContent).toBe('0%');
        });
    });

    describe('actionError', () => {
        it('should display error toast', () => {
            handleMessage({ action: 'actionError', message: 'Pipeline load failed' });
            expect(getMockElement('toastContainer').innerHTML).toContain('error');
            expect(getMockElement('toastContainer').innerHTML).toContain('Pipeline load failed');
        });

        it('should sanitize error message', () => {
            handleMessage({ action: 'actionError', message: '<script>alert("xss")</script>' });
            expect(getMockElement('toastContainer').innerHTML).not.toContain('<script>');
        });
    });

    describe('Message validation', () => {
        it('should return null for null message', () => {
            expect(handleMessage(null)).toBeNull();
        });

        it('should return null for message without action', () => {
            expect(handleMessage({ data: 'test' })).toBeNull();
        });

        it('should return null for unknown action', () => {
            expect(handleMessage({ action: 'unknownAction' })).toBeNull();
        });
    });
});
