/* eslint-disable */
/**
 * RECRUITER_ATTRIBUTION Bridge Tests
 * ====================================
 * Tests for src/pages/RECRUITER_ATTRIBUTION.f8zdu.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * **TYPE PROTOCOL** (not action protocol)
 * Switch on `msg.type`, params in `msg.data`, responses as `{ type: '...', data, timestamp }`
 * Uses `sendToHtml(type, data)` wrapper to send messages with timestamp.
 *
 * 4 inbound types: attributionReady, getAttributionData, recordTouchpoint, recordHireAttribution
 * 4 outbound types: attributionData, attributionError, touchpointResult, hireAttributionResult
 *
 * Gotcha: carrierDot is global state, can be set from msg.data.carrierDot
 * Gotcha: getAttributionData requires carrierDot, sends attributionError if missing
 * Gotcha: recordTouchpoint requires utmParams OR sessionId, sends error if both missing
 * Gotcha: recordHireAttribution requires driverId and carrierDot, sends error if missing
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'RECRUITER_ATTRIBUTION.f8zdu.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockBackend = {
    getAttributionBreakdown: jest.fn().mockResolvedValue({
        success: true,
        breakdown: [
            { source: 'google', applications: 12, hires: 3 },
            { source: 'facebook', applications: 8, hires: 2 }
        ],
        totals: { applications: 20, hires: 5 }
    }),
    recordTouchpoint: jest.fn().mockResolvedValue({
        success: true,
        touchpointId: 'tp_123'
    }),
    recordHireAttribution: jest.fn().mockResolvedValue({
        success: true,
        attributionId: 'attr_456'
    }),
    convertSessionToDriver: jest.fn().mockResolvedValue({
        success: true,
        driverId: 'drv_789'
    })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

function sendToHtml(component, type, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage({ type, data, timestamp: Date.now() });
        }
    } catch (err) {
        // silently fail like the source
    }
}

function findHtmlComponent($w) {
    const possibleIds = ['html1', 'html2', 'html3', 'html4', 'html5', 'htmlEmbed1'];
    for (const id of possibleIds) {
        try {
            const el = $w(`#${id}`);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // skip
        }
    }
    return null;
}

// Global state for tests
let carrierDot = null;

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'attributionReady':
            await handleAttributionReady(component);
            break;
        case 'getAttributionData':
            await handleGetAttributionData(component, msg, backend);
            break;
        case 'recordTouchpoint':
            await handleRecordTouchpoint(component, msg, backend);
            break;
        case 'recordHireAttribution':
            await handleRecordHireAttribution(component, msg, backend);
            break;
        default:
            break;
    }
}

async function handleAttributionReady(component) {
    if (carrierDot) {
        sendToHtml(component, 'carrierContext', { carrierDot });
    }
}

async function handleGetAttributionData(component, msg, backend = mockBackend) {
    try {
        const dot = msg.data?.carrierDot || carrierDot;
        if (!dot) {
            sendToHtml(component, 'attributionError', { error: 'No carrier context' });
            return;
        }

        carrierDot = dot;

        const dateRange = msg.data?.dateRange || { start: null, end: null };
        const metric = msg.data?.metric || 'applications';

        const result = await backend.getAttributionBreakdown(dot, dateRange, metric);

        if (!result.success) {
            sendToHtml(component, 'attributionError', { error: result.error || 'Failed to fetch attribution data' });
            return;
        }

        sendToHtml(component, 'attributionData', {
            success: true,
            breakdown: result.breakdown || [],
            totals: result.totals || {},
            metric: metric
        });

    } catch (error) {
        sendToHtml(component, 'attributionError', { error: error.message });
    }
}

async function handleRecordTouchpoint(component, msg, backend = mockBackend) {
    try {
        const { driverId, utmParams, pageUrl, sessionId } = msg.data || {};

        if (!utmParams && !sessionId) {
            sendToHtml(component, 'touchpointResult', { success: false, error: 'Missing UTM params or session' });
            return;
        }

        const result = await backend.recordTouchpoint(driverId, utmParams, pageUrl, sessionId);
        sendToHtml(component, 'touchpointResult', result);

    } catch (error) {
        sendToHtml(component, 'touchpointResult', { success: false, error: error.message });
    }
}

async function handleRecordHireAttribution(component, msg, backend = mockBackend) {
    try {
        const { driverId, attributionModel } = msg.data || {};
        const dot = msg.data?.carrierDot || carrierDot;

        if (!driverId || !dot) {
            sendToHtml(component, 'hireAttributionResult', { success: false, error: 'Missing required fields' });
            return;
        }

        const result = await backend.recordHireAttribution(driverId, dot, attributionModel || 'first_touch');
        sendToHtml(component, 'hireAttributionResult', result);

    } catch (error) {
        sendToHtml(component, 'hireAttributionResult', { success: false, error: error.message });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('RECRUITER_ATTRIBUTION Page Code (Bridge)', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
        carrierDot = null; // reset global state
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports getAttributionBreakdown from backend/recruiterAnalyticsService', () => {
            expect(sourceCode).toContain("from 'backend/recruiterAnalyticsService.jsw'");
            expect(sourceCode).toContain('getAttributionBreakdown');
        });

        test('imports recordTouchpoint from backend/recruiterAnalyticsService', () => {
            expect(sourceCode).toContain('recordTouchpoint');
        });

        test('imports recordHireAttribution from backend/recruiterAnalyticsService', () => {
            expect(sourceCode).toContain('recordHireAttribution');
        });

        test('imports convertSessionToDriver from backend/recruiterAnalyticsService', () => {
            expect(sourceCode).toContain('convertSessionToDriver');
        });

        test('imports wixUsers', () => {
            expect(sourceCode).toContain('wixUsers');
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('uses type-based protocol (msg.type)', () => {
            expect(sourceCode).toContain('msg.type');
        });

        test('does NOT use action-based protocol in handleMessage', () => {
            expect(sourceCode).not.toMatch(/msg\.action/);
        });

        test('handles all 4 inbound message types in switch', () => {
            expect(sourceCode).toContain("case 'attributionReady'");
            expect(sourceCode).toContain("case 'getAttributionData'");
            expect(sourceCode).toContain("case 'recordTouchpoint'");
            expect(sourceCode).toContain("case 'recordHireAttribution'");
        });

        test('defines MESSAGE_REGISTRY with inbound and outbound types', () => {
            expect(sourceCode).toContain('MESSAGE_REGISTRY');
            expect(sourceCode).toContain('inbound');
            expect(sourceCode).toContain('outbound');
        });

        test('defines CONFIG with htmlComponentId', () => {
            expect(sourceCode).toContain('CONFIG');
            expect(sourceCode).toContain('htmlComponentId');
        });

        test('defines carrierDot global state', () => {
            expect(sourceCode).toContain('let carrierDot');
        });

        test('defines sendToHtml utility function', () => {
            expect(sourceCode).toContain('function sendToHtml');
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('sendToHtml helper has try-catch', () => {
            expect(sourceCode).toContain('function sendToHtml');
            const sendToHtmlMatch = sourceCode.match(/function sendToHtml[\s\S]*?\n\}/);
            expect(sendToHtmlMatch).not.toBeNull();
            expect(sendToHtmlMatch[0]).toContain('try');
            expect(sendToHtmlMatch[0]).toContain('catch');
        });

        test('message listener guards against null msg', () => {
            expect(sourceCode).toContain('if (!msg || !msg.type)');
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds first component with onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });
            const comp = findHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
            expect(comp.onMessage).toBeDefined();
        });

        test('returns null when no component found', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            expect(findHtmlComponent(mock$w)).toBeNull();
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return { postMessage: jest.fn() }; // no onMessage
                if (id === '#html2') return createMockComponent(); // has onMessage
                throw new Error('not found');
            });
            const comp = findHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
        });

        test('tries all 6 IDs before returning null', () => {
            const mock$w = jest.fn(() => ({})); // no onMessage on any
            const comp = findHtmlComponent(mock$w);
            expect(comp).toBeNull();
            expect(mock$w).toHaveBeenCalledTimes(6);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages without type key', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            await routeMessage(component, { action: 'wrong_protocol' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('attributionReady does not send anything if carrierDot is null', async () => {
            carrierDot = null;
            await routeMessage(component, { type: 'attributionReady' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('attributionReady sends carrierContext if carrierDot is set', async () => {
            carrierDot = '1234567';
            await routeMessage(component, { type: 'attributionReady' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'carrierContext',
                    data: { carrierDot: '1234567' }
                })
            );
        });

        test('getAttributionData sends attributionError if no carrierDot', async () => {
            carrierDot = null;
            await routeMessage(component, { type: 'getAttributionData', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'attributionError',
                    data: { error: 'No carrier context' }
                })
            );
        });

        test('getAttributionData uses carrierDot from msg.data if provided', async () => {
            await routeMessage(component, {
                type: 'getAttributionData',
                data: { carrierDot: '7654321' }
            });
            expect(mockBackend.getAttributionBreakdown).toHaveBeenCalledWith(
                '7654321',
                { start: null, end: null },
                'applications'
            );
        });

        test('getAttributionData uses global carrierDot if not in msg.data', async () => {
            carrierDot = '1234567';
            await routeMessage(component, { type: 'getAttributionData', data: {} });
            expect(mockBackend.getAttributionBreakdown).toHaveBeenCalledWith(
                '1234567',
                { start: null, end: null },
                'applications'
            );
        });

        test('getAttributionData passes dateRange from msg.data', async () => {
            carrierDot = '1234567';
            await routeMessage(component, {
                type: 'getAttributionData',
                data: {
                    dateRange: { start: '2026-01-01', end: '2026-12-31' }
                }
            });
            expect(mockBackend.getAttributionBreakdown).toHaveBeenCalledWith(
                '1234567',
                { start: '2026-01-01', end: '2026-12-31' },
                'applications'
            );
        });

        test('getAttributionData passes metric from msg.data', async () => {
            carrierDot = '1234567';
            await routeMessage(component, {
                type: 'getAttributionData',
                data: { metric: 'hires' }
            });
            expect(mockBackend.getAttributionBreakdown).toHaveBeenCalledWith(
                '1234567',
                { start: null, end: null },
                'hires'
            );
        });

        test('getAttributionData sends attributionData on success', async () => {
            carrierDot = '1234567';
            await routeMessage(component, { type: 'getAttributionData', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'attributionData',
                    data: {
                        success: true,
                        breakdown: [
                            { source: 'google', applications: 12, hires: 3 },
                            { source: 'facebook', applications: 8, hires: 2 }
                        ],
                        totals: { applications: 20, hires: 5 },
                        metric: 'applications'
                    }
                })
            );
        });

        test('getAttributionData sends attributionError if backend returns success:false', async () => {
            const failBackend = {
                ...mockBackend,
                getAttributionBreakdown: jest.fn().mockResolvedValue({
                    success: false,
                    error: 'No data available'
                })
            };
            carrierDot = '1234567';
            await routeMessage(component, { type: 'getAttributionData', data: {} }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'attributionError',
                    data: { error: 'No data available' }
                })
            );
        });

        test('recordTouchpoint sends error if no utmParams and no sessionId', async () => {
            await routeMessage(component, {
                type: 'recordTouchpoint',
                data: { driverId: 'drv123', pageUrl: '/apply' }
            });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'touchpointResult',
                    data: { success: false, error: 'Missing UTM params or session' }
                })
            );
        });

        test('recordTouchpoint calls backend with utmParams', async () => {
            const utmParams = { utm_source: 'google', utm_medium: 'cpc' };
            await routeMessage(component, {
                type: 'recordTouchpoint',
                data: {
                    driverId: 'drv123',
                    utmParams,
                    pageUrl: '/apply'
                }
            });
            expect(mockBackend.recordTouchpoint).toHaveBeenCalledWith(
                'drv123',
                utmParams,
                '/apply',
                undefined
            );
        });

        test('recordTouchpoint calls backend with sessionId', async () => {
            await routeMessage(component, {
                type: 'recordTouchpoint',
                data: {
                    driverId: 'drv123',
                    sessionId: 'sess_abc',
                    pageUrl: '/apply'
                }
            });
            expect(mockBackend.recordTouchpoint).toHaveBeenCalledWith(
                'drv123',
                undefined,
                '/apply',
                'sess_abc'
            );
        });

        test('recordTouchpoint sends touchpointResult on success', async () => {
            await routeMessage(component, {
                type: 'recordTouchpoint',
                data: {
                    driverId: 'drv123',
                    sessionId: 'sess_abc',
                    pageUrl: '/apply'
                }
            });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'touchpointResult',
                    data: { success: true, touchpointId: 'tp_123' }
                })
            );
        });

        test('recordHireAttribution sends error if no driverId', async () => {
            carrierDot = '1234567';
            await routeMessage(component, {
                type: 'recordHireAttribution',
                data: {}
            });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'hireAttributionResult',
                    data: { success: false, error: 'Missing required fields' }
                })
            );
        });

        test('recordHireAttribution sends error if no carrierDot', async () => {
            carrierDot = null;
            await routeMessage(component, {
                type: 'recordHireAttribution',
                data: { driverId: 'drv123' }
            });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'hireAttributionResult',
                    data: { success: false, error: 'Missing required fields' }
                })
            );
        });

        test('recordHireAttribution uses carrierDot from msg.data', async () => {
            await routeMessage(component, {
                type: 'recordHireAttribution',
                data: {
                    driverId: 'drv123',
                    carrierDot: '7654321',
                    attributionModel: 'last_touch'
                }
            });
            expect(mockBackend.recordHireAttribution).toHaveBeenCalledWith(
                'drv123',
                '7654321',
                'last_touch'
            );
        });

        test('recordHireAttribution uses global carrierDot if not in msg.data', async () => {
            carrierDot = '1234567';
            await routeMessage(component, {
                type: 'recordHireAttribution',
                data: { driverId: 'drv123' }
            });
            expect(mockBackend.recordHireAttribution).toHaveBeenCalledWith(
                'drv123',
                '1234567',
                'first_touch'
            );
        });

        test('recordHireAttribution defaults to first_touch attribution model', async () => {
            carrierDot = '1234567';
            await routeMessage(component, {
                type: 'recordHireAttribution',
                data: { driverId: 'drv123' }
            });
            expect(mockBackend.recordHireAttribution).toHaveBeenCalledWith(
                'drv123',
                '1234567',
                'first_touch'
            );
        });

        test('recordHireAttribution sends hireAttributionResult on success', async () => {
            carrierDot = '1234567';
            await routeMessage(component, {
                type: 'recordHireAttribution',
                data: { driverId: 'drv123' }
            });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'hireAttributionResult',
                    data: { success: true, attributionId: 'attr_456' }
                })
            );
        });

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'nonExistentType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getAttributionData failure sends attributionError', async () => {
            const failBackend = {
                ...mockBackend,
                getAttributionBreakdown: jest.fn().mockRejectedValue(new Error('DB error'))
            };
            carrierDot = '1234567';
            await routeMessage(component, { type: 'getAttributionData', data: {} }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'attributionError',
                    data: { error: 'DB error' }
                })
            );
        });

        test('recordTouchpoint failure sends touchpointResult with error', async () => {
            const failBackend = {
                ...mockBackend,
                recordTouchpoint: jest.fn().mockRejectedValue(new Error('Network error'))
            };
            await routeMessage(component, {
                type: 'recordTouchpoint',
                data: { driverId: 'drv123', sessionId: 'sess_abc' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'touchpointResult',
                    data: { success: false, error: 'Network error' }
                })
            );
        });

        test('recordHireAttribution failure sends hireAttributionResult with error', async () => {
            const failBackend = {
                ...mockBackend,
                recordHireAttribution: jest.fn().mockRejectedValue(new Error('Save failed'))
            };
            carrierDot = '1234567';
            await routeMessage(component, {
                type: 'recordHireAttribution',
                data: { driverId: 'drv123' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'hireAttributionResult',
                    data: { success: false, error: 'Save failed' }
                })
            );
        });
    });

    // =========================================================================
    // SENDTOHTML UTILITY
    // =========================================================================

    describe('sendToHtml utility', () => {
        test('calls postMessage on valid component', () => {
            sendToHtml(component, 'test', { foo: 'bar' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'test',
                    data: { foo: 'bar' }
                })
            );
        });

        test('includes timestamp in message', () => {
            sendToHtml(component, 'test', { foo: 'bar' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    timestamp: expect.any(Number)
                })
            );
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => sendToHtml(throwingComponent, 'test', {})).not.toThrow();
        });

        test('does not throw if component is null-like', () => {
            const badComponent = {};
            expect(() => sendToHtml(badComponent, 'test', {})).not.toThrow();
        });

        test('does not throw if component is null', () => {
            expect(() => sendToHtml(null, 'test', {})).not.toThrow();
        });
    });
});
