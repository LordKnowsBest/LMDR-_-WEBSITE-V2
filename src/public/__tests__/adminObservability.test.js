/**
 * ADMIN_OBSERVABILITY Page Code Tests
 *
 * Tests for src/pages/ADMIN_OBSERVABILITY.c8pf9.js
 *
 * Covers:
 *   - HTML component discovery (mock $w with onMessage/postMessage)
 *   - Message routing (each action dispatches to correct handler)
 *   - Error handling (backend failures send actionError back)
 *   - Safety checks (no bare $w calls - all wrapped in try-catch)
 *   - Backend service mock verification
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_CODE_PATH = path.resolve(
    __dirname, '..', '..', 'pages', 'ADMIN_OBSERVABILITY.c8pf9.js'
);

// =============================================================================
// MOCKS - Backend Services
// =============================================================================

const MOCK_METADATA = { services: ['auth', 'matching'], logLevels: ['info', 'warn', 'error'] };
const MOCK_HEALTH = { status: 'healthy', uptime: 99.9, checks: [] };
const MOCK_ERRORS = { items: [{ id: 'e1', message: 'timeout' }], total: 1 };
const MOCK_AI_ANALYTICS = { requests: 150, avgLatency: 320, tokenUsage: 50000 };
const MOCK_LOGS = { items: [{ id: 'l1', level: 'info', message: 'test log' }], total: 1 };
const MOCK_TRACE = { traceId: 'trace-abc', spans: [{ name: 'request', duration: 120 }] };

const mockBackend = {
    getLogs: jest.fn().mockResolvedValue(MOCK_LOGS),
    getErrors: jest.fn().mockResolvedValue(MOCK_ERRORS),
    getTrace: jest.fn().mockResolvedValue(MOCK_TRACE),
    getHealthMetrics: jest.fn().mockResolvedValue(MOCK_HEALTH),
    getAIAnalytics: jest.fn().mockResolvedValue(MOCK_AI_ANALYTICS),
    getLogMetadata: jest.fn().mockResolvedValue(MOCK_METADATA)
};

// =============================================================================
// MOCK - HTML Component
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn(),
        rendered: true
    };
}

// =============================================================================
// REPLICATED LOGIC (mirrors the actual page code for testability)
// =============================================================================

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

/**
 * Replicates findHtmlComponent from the page code.
 * Uses try-catch per CLAUDE.md UI Safety Pattern.
 */
function findHtmlComponent($w) {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element not present
        }
    }
    return null;
}

/**
 * Replicates postToComponent from the page code.
 */
function postToComponent(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (e) {
        // postMessage failed
    }
}

/**
 * Replicates sendInitialData from the page code.
 */
async function sendInitialData(component, backend = mockBackend) {
    try {
        const [metadata, health, errors, aiAnalytics] = await Promise.all([
            backend.getLogMetadata(),
            backend.getHealthMetrics('hour'),
            backend.getErrors({ period: 'day' }),
            backend.getAIAnalytics('day')
        ]);

        postToComponent(component, {
            action: 'initialized',
            payload: { metadata, health, errors, aiAnalytics }
        });
    } catch (error) {
        postToComponent(component, {
            action: 'actionError',
            message: 'Failed to load initial data: ' + (error.message || 'Unknown error')
        });
    }
}

/**
 * Replicates handleMessage from the page code.
 */
async function handleMessage(component, message, backend = mockBackend) {
    if (!message || !message.action) return;

    try {
        switch (message.action) {
            case 'init':
                await sendInitialData(component, backend);
                break;

            case 'getLogs': {
                const logs = await backend.getLogs(message.options || {});
                postToComponent(component, { action: 'logsLoaded', payload: logs });
                break;
            }

            case 'getErrors': {
                const errors = await backend.getErrors(message.options || {});
                postToComponent(component, { action: 'errorsLoaded', payload: errors });
                break;
            }

            case 'getTrace': {
                if (!message.traceId) {
                    postToComponent(component, {
                        action: 'actionError',
                        message: 'Trace ID is required'
                    });
                    return;
                }
                const trace = await backend.getTrace(message.traceId);
                postToComponent(component, { action: 'traceLoaded', payload: trace });
                break;
            }

            case 'getHealthMetrics': {
                const health = await backend.getHealthMetrics(message.period || 'hour');
                postToComponent(component, { action: 'healthLoaded', payload: health });
                break;
            }

            case 'getAIAnalytics': {
                const ai = await backend.getAIAnalytics(message.period || 'day');
                postToComponent(component, { action: 'aiAnalyticsLoaded', payload: ai });
                break;
            }

            default:
                break;
        }
    } catch (error) {
        postToComponent(component, {
            action: 'actionError',
            message: 'Error processing ' + message.action + ': ' + (error.message || 'Unknown error')
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_OBSERVABILITY Page Code', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SAFETY CHECKS (source file analysis)
    // =========================================================================

    describe('Safety checks - source file analysis', () => {
        let sourceCode;

        beforeAll(() => {
            sourceCode = fs.readFileSync(PAGE_CODE_PATH, 'utf8');
        });

        test('should not have bare $w calls outside of try-catch or safety checks', () => {
            // The file uses $w only inside findHtmlComponent (wrapped in try-catch)
            // and inside $w.onReady. Verify no bare $w('#elementId').property patterns.
            const lines = sourceCode.split('\n');
            const bareCallPattern = /\$w\(['"]#\w+['"]\)\.\w+\s*[=(]/;
            const insideTryCatch = [];
            let inTryCatch = false;
            let inOnReady = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.includes('try {')) inTryCatch = true;
                if (line.includes('$w.onReady')) inOnReady = true;
                if (inTryCatch && line === '}') inTryCatch = false;

                if (bareCallPattern.test(line) && !inTryCatch && !inOnReady) {
                    insideTryCatch.push({ line: i + 1, content: line });
                }
            }

            expect(insideTryCatch).toEqual([]);
        });

        test('findHtmlComponent should use try-catch for each $w probe', () => {
            // Extract the findHtmlComponent function body
            const fnMatch = sourceCode.match(
                /function findHtmlComponent\(\)[\s\S]*?^}/m
            );
            expect(fnMatch).not.toBeNull();
            expect(fnMatch[0]).toContain('try {');
            expect(fnMatch[0]).toContain('catch');
        });

        test('postToComponent should guard with try-catch and typeof check', () => {
            const fnMatch = sourceCode.match(
                /function postToComponent[\s\S]*?^}/m
            );
            expect(fnMatch).not.toBeNull();
            expect(fnMatch[0]).toContain('try {');
            expect(fnMatch[0]).toContain("typeof component.postMessage === 'function'");
        });

        test('should import all required backend functions', () => {
            expect(sourceCode).toContain("from 'backend/observabilityService'");
            expect(sourceCode).toContain('getLogs');
            expect(sourceCode).toContain('getErrors');
            expect(sourceCode).toContain('getTrace');
            expect(sourceCode).toContain('getHealthMetrics');
            expect(sourceCode).toContain('getAIAnalytics');
            expect(sourceCode).toContain('getLogMetadata');
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('should return first component with onMessage function', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') throw new Error('not found');
                if (id === '#html2') return { onMessage: jest.fn(), postMessage: jest.fn() };
                return {};
            });

            const result = findHtmlComponent(mock$w);
            expect(result).not.toBeNull();
            expect(typeof result.onMessage).toBe('function');
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
        });

        test('should return null if no HTML components exist', () => {
            const mock$w = jest.fn(() => { throw new Error('not found'); });
            const result = findHtmlComponent(mock$w);
            expect(result).toBeNull();
        });

        test('should skip components without onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return { rendered: true }; // no onMessage
                if (id === '#html2') return null;
                if (id === '#html3') return { onMessage: jest.fn(), postMessage: jest.fn() };
                return {};
            });

            const result = findHtmlComponent(mock$w);
            expect(result).not.toBeNull();
            // Should have probed #html1 and #html2 before finding #html3
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
            expect(mock$w).toHaveBeenCalledWith('#html3');
        });

        test('should probe all known component IDs', () => {
            const mock$w = jest.fn(() => ({}));
            findHtmlComponent(mock$w);
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
            expect(mock$w).toHaveBeenCalledWith('#html3');
            expect(mock$w).toHaveBeenCalledWith('#html4');
            expect(mock$w).toHaveBeenCalledWith('#html5');
            expect(mock$w).toHaveBeenCalledWith('#htmlEmbed1');
        });
    });

    // =========================================================================
    // INITIAL DATA LOADING
    // =========================================================================

    describe('sendInitialData', () => {
        test('should fetch metadata, health, errors, and AI analytics in parallel', async () => {
            await sendInitialData(component);

            expect(mockBackend.getLogMetadata).toHaveBeenCalledTimes(1);
            expect(mockBackend.getHealthMetrics).toHaveBeenCalledWith('hour');
            expect(mockBackend.getErrors).toHaveBeenCalledWith({ period: 'day' });
            expect(mockBackend.getAIAnalytics).toHaveBeenCalledWith('day');
        });

        test('should post initialized action with bundled payload', async () => {
            await sendInitialData(component);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'initialized',
                payload: {
                    metadata: MOCK_METADATA,
                    health: MOCK_HEALTH,
                    errors: MOCK_ERRORS,
                    aiAnalytics: MOCK_AI_ANALYTICS
                }
            });
        });

        test('should post actionError when initial data loading fails', async () => {
            const failingBackend = {
                ...mockBackend,
                getLogMetadata: jest.fn().mockRejectedValue(new Error('DB connection lost'))
            };

            await sendInitialData(component, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to load initial data: DB connection lost'
            });
        });

        test('should handle unknown error (no message property)', async () => {
            const failingBackend = {
                ...mockBackend,
                getHealthMetrics: jest.fn().mockRejectedValue({})
            };

            await sendInitialData(component, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: expect.stringContaining('Unknown error')
                })
            );
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing - handleMessage', () => {
        test('should ignore null message', async () => {
            await handleMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('should ignore message without action', async () => {
            await handleMessage(component, { foo: 'bar' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('should ignore undefined message', async () => {
            await handleMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        // --- init action ---
        test('action "init" should trigger sendInitialData', async () => {
            await handleMessage(component, { action: 'init' });

            expect(mockBackend.getLogMetadata).toHaveBeenCalled();
            expect(mockBackend.getHealthMetrics).toHaveBeenCalledWith('hour');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'initialized' })
            );
        });

        // --- getLogs action ---
        test('action "getLogs" should call getLogs with provided options', async () => {
            const options = { level: 'error', limit: 50 };
            await handleMessage(component, { action: 'getLogs', options });

            expect(mockBackend.getLogs).toHaveBeenCalledWith(options);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'logsLoaded',
                payload: MOCK_LOGS
            });
        });

        test('action "getLogs" should default to empty options', async () => {
            await handleMessage(component, { action: 'getLogs' });

            expect(mockBackend.getLogs).toHaveBeenCalledWith({});
        });

        // --- getErrors action ---
        test('action "getErrors" should call getErrors with provided options', async () => {
            const options = { period: 'week' };
            await handleMessage(component, { action: 'getErrors', options });

            expect(mockBackend.getErrors).toHaveBeenCalledWith(options);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'errorsLoaded',
                payload: MOCK_ERRORS
            });
        });

        test('action "getErrors" should default to empty options', async () => {
            await handleMessage(component, { action: 'getErrors' });

            expect(mockBackend.getErrors).toHaveBeenCalledWith({});
        });

        // --- getTrace action ---
        test('action "getTrace" should call getTrace with traceId', async () => {
            await handleMessage(component, { action: 'getTrace', traceId: 'trace-abc' });

            expect(mockBackend.getTrace).toHaveBeenCalledWith('trace-abc');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'traceLoaded',
                payload: MOCK_TRACE
            });
        });

        test('action "getTrace" without traceId should send actionError', async () => {
            await handleMessage(component, { action: 'getTrace' });

            expect(mockBackend.getTrace).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Trace ID is required'
            });
        });

        // --- getHealthMetrics action ---
        test('action "getHealthMetrics" should call getHealthMetrics with period', async () => {
            await handleMessage(component, { action: 'getHealthMetrics', period: 'day' });

            expect(mockBackend.getHealthMetrics).toHaveBeenCalledWith('day');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'healthLoaded',
                payload: MOCK_HEALTH
            });
        });

        test('action "getHealthMetrics" should default to "hour" period', async () => {
            await handleMessage(component, { action: 'getHealthMetrics' });

            expect(mockBackend.getHealthMetrics).toHaveBeenCalledWith('hour');
        });

        // --- getAIAnalytics action ---
        test('action "getAIAnalytics" should call getAIAnalytics with period', async () => {
            await handleMessage(component, { action: 'getAIAnalytics', period: 'week' });

            expect(mockBackend.getAIAnalytics).toHaveBeenCalledWith('week');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'aiAnalyticsLoaded',
                payload: MOCK_AI_ANALYTICS
            });
        });

        test('action "getAIAnalytics" should default to "day" period', async () => {
            await handleMessage(component, { action: 'getAIAnalytics' });

            expect(mockBackend.getAIAnalytics).toHaveBeenCalledWith('day');
        });

        // --- unknown action ---
        test('unknown action should not post any response', async () => {
            await handleMessage(component, { action: 'unknownAction' });

            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('backend failure on getLogs should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getLogs: jest.fn().mockRejectedValue(new Error('Query timeout'))
            };

            await handleMessage(component, { action: 'getLogs', options: {} }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Error processing getLogs: Query timeout'
            });
        });

        test('backend failure on getErrors should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getErrors: jest.fn().mockRejectedValue(new Error('Service unavailable'))
            };

            await handleMessage(component, { action: 'getErrors', options: {} }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Error processing getErrors: Service unavailable'
            });
        });

        test('backend failure on getTrace should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getTrace: jest.fn().mockRejectedValue(new Error('Trace not found'))
            };

            await handleMessage(component, { action: 'getTrace', traceId: 'bad-id' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Error processing getTrace: Trace not found'
            });
        });

        test('backend failure on getHealthMetrics should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getHealthMetrics: jest.fn().mockRejectedValue(new Error('Metrics DB down'))
            };

            await handleMessage(component, { action: 'getHealthMetrics', period: 'hour' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Error processing getHealthMetrics: Metrics DB down'
            });
        });

        test('backend failure on getAIAnalytics should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getAIAnalytics: jest.fn().mockRejectedValue(new Error('Analytics unavailable'))
            };

            await handleMessage(component, { action: 'getAIAnalytics', period: 'day' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Error processing getAIAnalytics: Analytics unavailable'
            });
        });

        test('error without message property should use "Unknown error"', async () => {
            const failingBackend = {
                ...mockBackend,
                getLogs: jest.fn().mockRejectedValue({ code: 500 })
            };

            await handleMessage(component, { action: 'getLogs' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Error processing getLogs: Unknown error'
            });
        });
    });

    // =========================================================================
    // SAFE SEND (postToComponent)
    // =========================================================================

    describe('postToComponent safety', () => {
        test('should not throw when component is null', () => {
            expect(() => postToComponent(null, { action: 'test' })).not.toThrow();
        });

        test('should not throw when component.postMessage is not a function', () => {
            expect(() => postToComponent({ postMessage: 'not-a-fn' }, { action: 'test' })).not.toThrow();
        });

        test('should call postMessage when component is valid', () => {
            const data = { action: 'logsLoaded', payload: [] };
            postToComponent(component, data);
            expect(component.postMessage).toHaveBeenCalledWith(data);
        });

        test('should not throw when postMessage itself throws', () => {
            const badComponent = {
                postMessage: jest.fn(() => { throw new Error('iframe disconnected'); })
            };
            expect(() => postToComponent(badComponent, { action: 'test' })).not.toThrow();
        });
    });

    // =========================================================================
    // BACKEND SERVICE MOCK VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('sendInitialData calls exactly 4 services in parallel', async () => {
            await sendInitialData(component);

            expect(mockBackend.getLogMetadata).toHaveBeenCalledTimes(1);
            expect(mockBackend.getHealthMetrics).toHaveBeenCalledTimes(1);
            expect(mockBackend.getErrors).toHaveBeenCalledTimes(1);
            expect(mockBackend.getAIAnalytics).toHaveBeenCalledTimes(1);
            // getLogs and getTrace should NOT be called during init
            expect(mockBackend.getLogs).not.toHaveBeenCalled();
            expect(mockBackend.getTrace).not.toHaveBeenCalled();
        });

        test('each action calls only its corresponding backend service', async () => {
            // getLogs
            await handleMessage(component, { action: 'getLogs', options: {} });
            expect(mockBackend.getLogs).toHaveBeenCalledTimes(1);
            expect(mockBackend.getTrace).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // getTrace
            await handleMessage(component, { action: 'getTrace', traceId: 'abc' });
            expect(mockBackend.getTrace).toHaveBeenCalledTimes(1);
            expect(mockBackend.getLogs).not.toHaveBeenCalled();
            expect(mockBackend.getErrors).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // getHealthMetrics
            await handleMessage(component, { action: 'getHealthMetrics', period: 'day' });
            expect(mockBackend.getHealthMetrics).toHaveBeenCalledTimes(1);
            expect(mockBackend.getLogs).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // getAIAnalytics
            await handleMessage(component, { action: 'getAIAnalytics', period: 'week' });
            expect(mockBackend.getAIAnalytics).toHaveBeenCalledTimes(1);
            expect(mockBackend.getLogs).not.toHaveBeenCalled();
        });

        test('getLogs passes options object through to backend', async () => {
            const options = { level: 'warn', service: 'auth', from: '2026-01-01', limit: 100 };
            await handleMessage(component, { action: 'getLogs', options });

            expect(mockBackend.getLogs).toHaveBeenCalledWith(options);
        });

        test('getErrors passes options object through to backend', async () => {
            const options = { period: 'month', service: 'matching' };
            await handleMessage(component, { action: 'getErrors', options });

            expect(mockBackend.getErrors).toHaveBeenCalledWith(options);
        });
    });
});
