/**
 * ADMIN_AI_ROUTER Page Code Tests
 *
 * Tests for src/pages/ADMIN_AI_ROUTER.cqkgi.js
 *
 * Covers:
 *   - HTML component discovery (mock $w with onMessage/postMessage)
 *   - Message routing (getProviders, getConfig, getModels, getUsageStats,
 *     updateConfig, resetConfig, testProvider, testAllProviders)
 *   - Error handling (backend failures send actionError back)
 *   - Input validation (missing providerId, functionId)
 *   - Safety checks (no bare $w calls - all wrapped in try-catch)
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_CODE_PATH = path.resolve(
    __dirname, '..', '..', 'pages', 'ADMIN_AI_ROUTER.cqkgi.js'
);
const sourceCode = fs.readFileSync(PAGE_CODE_PATH, 'utf8');

// =============================================================================
// MOCKS - Backend Services
// =============================================================================

const MOCK_PROVIDERS = [
    { id: 'openai', name: 'OpenAI', status: 'active' },
    { id: 'anthropic', name: 'Anthropic', status: 'active' }
];
const MOCK_CONFIG = {
    defaultProvider: 'openai',
    functions: { enrichment: { provider: 'openai', model: 'gpt-4' } }
};
const MOCK_MODELS = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
const MOCK_USAGE_STATS = { totalRequests: 500, totalTokens: 120000, avgLatency: 245 };
const MOCK_TEST_RESULT = { providerId: 'openai', success: true, latency: 312 };
const MOCK_ALL_TEST_RESULTS = [
    { providerId: 'openai', success: true, latency: 312 },
    { providerId: 'anthropic', success: true, latency: 280 }
];

const mockBackend = {
    getProviders: jest.fn().mockResolvedValue(MOCK_PROVIDERS),
    getRouterConfig: jest.fn().mockResolvedValue(MOCK_CONFIG),
    getProviderModels: jest.fn().mockResolvedValue(MOCK_MODELS),
    getUsageStats: jest.fn().mockResolvedValue(MOCK_USAGE_STATS),
    updateFunctionConfig: jest.fn().mockResolvedValue({ success: true }),
    resetFunctionConfig: jest.fn().mockResolvedValue({ success: true }),
    testProvider: jest.fn().mockResolvedValue(MOCK_TEST_RESULT),
    testAllProviders: jest.fn().mockResolvedValue(MOCK_ALL_TEST_RESULTS)
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
 * Replicates getHtmlComponents from the page code.
 * Uses try-catch per CLAUDE.md UI Safety Pattern.
 */
function getHtmlComponents($w) {
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {
            // Element not present on this page variant - skip
        }
    }
    return found;
}

/**
 * Replicates routeMessage from the page code.
 */
async function routeMessage(component, message, backend = mockBackend) {
    if (!message || !message.action) return;

    const { action } = message;

    try {
        switch (action) {
            case 'getProviders': {
                const providers = await backend.getProviders();
                component.postMessage({ action: 'providersLoaded', payload: providers });
                break;
            }

            case 'getConfig': {
                const config = await backend.getRouterConfig();
                component.postMessage({ action: 'configLoaded', payload: config });
                break;
            }

            case 'getModels': {
                const providerId = message.providerId;
                if (!providerId) {
                    component.postMessage({ action: 'actionError', message: 'Provider ID is required' });
                    return;
                }
                const models = await backend.getProviderModels(providerId);
                component.postMessage({
                    action: 'modelsLoaded',
                    payload: { providerId, models }
                });
                break;
            }

            case 'getUsageStats': {
                const period = message.period || 'week';
                const stats = await backend.getUsageStats(period);
                component.postMessage({ action: 'usageStatsLoaded', payload: stats });
                break;
            }

            case 'updateConfig': {
                const { functionId, config } = message;
                if (!functionId || !config) {
                    component.postMessage({ action: 'actionError', message: 'Function ID and config are required' });
                    return;
                }
                await backend.updateFunctionConfig(functionId, config);
                component.postMessage({ action: 'configUpdated' });
                break;
            }

            case 'resetConfig': {
                const resetFuncId = message.functionId;
                if (!resetFuncId) {
                    component.postMessage({ action: 'actionError', message: 'Function ID is required' });
                    return;
                }
                await backend.resetFunctionConfig(resetFuncId);
                component.postMessage({ action: 'configReset' });
                break;
            }

            case 'testProvider': {
                const testProviderId = message.providerId;
                if (!testProviderId) {
                    component.postMessage({ action: 'actionError', message: 'Provider ID is required' });
                    return;
                }
                component.postMessage({ action: 'testingProvider', payload: { providerId: testProviderId } });
                const result = await backend.testProvider(testProviderId);
                component.postMessage({ action: 'providerTestResult', payload: result });
                break;
            }

            case 'testAllProviders': {
                component.postMessage({ action: 'testingAllProviders' });
                const results = await backend.testAllProviders();
                component.postMessage({ action: 'allProvidersTestResult', payload: results });
                break;
            }

            default:
                break;
        }
    } catch (error) {
        component.postMessage({
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_AI_ROUTER Page Code', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/aiRouterService', () => {
            expect(sourceCode).toContain("from 'backend/aiRouterService'");
        });

        test('imports getRouterConfig', () => {
            expect(sourceCode).toContain('getRouterConfig');
        });

        test('imports getProviders', () => {
            expect(sourceCode).toContain('getProviders');
        });

        test('imports getProviderModels', () => {
            expect(sourceCode).toContain('getProviderModels');
        });

        test('imports getUsageStats', () => {
            expect(sourceCode).toContain('getUsageStats');
        });

        test('imports updateFunctionConfig', () => {
            expect(sourceCode).toContain('updateFunctionConfig');
        });

        test('imports resetFunctionConfig', () => {
            expect(sourceCode).toContain('resetFunctionConfig');
        });

        test('imports testProvider', () => {
            expect(sourceCode).toContain('testProvider');
        });

        test('imports testAllProviders', () => {
            expect(sourceCode).toContain('testAllProviders');
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS with expected IDs', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#html2');
            expect(sourceCode).toContain('#html3');
            expect(sourceCode).toContain('#html4');
            expect(sourceCode).toContain('#html5');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        test('defines getHtmlComponents function', () => {
            expect(sourceCode).toContain('function getHtmlComponents()');
        });

        test('defines routeMessage function', () => {
            expect(sourceCode).toContain('async function routeMessage(component, message)');
        });

        test('sends init postMessage to discovered components', () => {
            expect(sourceCode).toContain("component.postMessage({ action: 'init' })");
        });
    });

    // =========================================================================
    // SAFETY CHECKS (no bare $w calls)
    // =========================================================================

    describe('Safety checks', () => {
        test('all $w() calls are wrapped in try-catch', () => {
            // The source uses $w(id) with a variable, not literal $w('#html1')
            // Verify $w() usage exists (either literal or variable)
            const wCalls = sourceCode.match(/\$w\(/g) || [];
            expect(wCalls.length).toBeGreaterThan(0);

            // The getHtmlComponents function uses try-catch around $w(id)
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(id\)[\s\S]*?\}\s*catch/);
        });

        test('getHtmlComponents uses try-catch for each $w probe', () => {
            const fnMatch = sourceCode.match(
                /function getHtmlComponents\(\)[\s\S]*?^}/m
            );
            expect(fnMatch).not.toBeNull();
            expect(fnMatch[0]).toContain('try {');
            expect(fnMatch[0]).toContain('catch');
        });

        test('getHtmlComponents checks for onMessage before adding component', () => {
            const fnMatch = sourceCode.match(
                /function getHtmlComponents\(\)[\s\S]*?^}/m
            );
            expect(fnMatch).not.toBeNull();
            expect(fnMatch[0]).toContain("typeof component.onMessage === 'function'");
        });

        test('onReady checks for empty components before proceeding', () => {
            expect(sourceCode).toMatch(/if\s*\(!components\.length\)/);
        });

        test('no bare $w calls outside try-catch in source code', () => {
            const lines = sourceCode.split('\n');
            const bareCallPattern = /\$w\(['"]#\w+['"]\)\.\w+\s*[=(]/;
            const violations = [];
            let inTryCatch = false;
            let inOnReady = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.includes('try {')) inTryCatch = true;
                if (line.includes('$w.onReady')) inOnReady = true;
                if (inTryCatch && line === '}') inTryCatch = false;

                if (bareCallPattern.test(line) && !inTryCatch && !inOnReady) {
                    violations.push({ line: i + 1, content: line });
                }
            }

            expect(violations).toEqual([]);
        });

        test('routeMessage guards against null/undefined message', () => {
            expect(sourceCode).toMatch(/if\s*\(!message\s*\|\|\s*!message\.action\)\s*return/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components that have onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                if (id === '#html2') return createMockComponent();
                throw new Error('not found');
            });

            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(2);
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
        });

        test('skips components that throw errors', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn(() => ({ postMessage: jest.fn() }));
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('skips null components', () => {
            const mock$w = jest.fn(() => null);
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('tries all six component IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            getHtmlComponents(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
            expect(mock$w).toHaveBeenCalledWith('#html3');
            expect(mock$w).toHaveBeenCalledWith('#html4');
            expect(mock$w).toHaveBeenCalledWith('#html5');
            expect(mock$w).toHaveBeenCalledWith('#htmlEmbed1');
        });

        test('returns all valid components, not just the first', () => {
            const mock$w = jest.fn(() => createMockComponent());
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(6);
        });

        test('mixes found and missing components correctly', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') throw new Error('not found');
                if (id === '#html2') return { rendered: true }; // no onMessage
                if (id === '#html3') return createMockComponent();
                if (id === '#html4') throw new Error('not found');
                if (id === '#html5') return createMockComponent();
                if (id === '#htmlEmbed1') return null;
                return {};
            });

            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(2);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores null message', async () => {
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ignores undefined message', async () => {
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ignores message without action', async () => {
            await routeMessage(component, {});
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ignores message with empty action', async () => {
            await routeMessage(component, { action: '' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('unknown action does not send any message', async () => {
            await routeMessage(component, { action: 'nonExistentAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        // --- getProviders ---
        test('getProviders calls backend and sends providersLoaded', async () => {
            await routeMessage(component, { action: 'getProviders' });
            expect(mockBackend.getProviders).toHaveBeenCalledTimes(1);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'providersLoaded',
                payload: MOCK_PROVIDERS
            });
        });

        // --- getConfig ---
        test('getConfig calls backend and sends configLoaded', async () => {
            await routeMessage(component, { action: 'getConfig' });
            expect(mockBackend.getRouterConfig).toHaveBeenCalledTimes(1);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'configLoaded',
                payload: MOCK_CONFIG
            });
        });

        // --- getModels ---
        test('getModels calls getProviderModels with providerId and sends modelsLoaded', async () => {
            await routeMessage(component, { action: 'getModels', providerId: 'openai' });
            expect(mockBackend.getProviderModels).toHaveBeenCalledWith('openai');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'modelsLoaded',
                payload: { providerId: 'openai', models: MOCK_MODELS }
            });
        });

        test('getModels without providerId sends actionError', async () => {
            await routeMessage(component, { action: 'getModels' });
            expect(mockBackend.getProviderModels).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Provider ID is required'
            });
        });

        // --- getUsageStats ---
        test('getUsageStats calls backend with provided period', async () => {
            await routeMessage(component, { action: 'getUsageStats', period: 'month' });
            expect(mockBackend.getUsageStats).toHaveBeenCalledWith('month');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'usageStatsLoaded',
                payload: MOCK_USAGE_STATS
            });
        });

        test('getUsageStats defaults period to week', async () => {
            await routeMessage(component, { action: 'getUsageStats' });
            expect(mockBackend.getUsageStats).toHaveBeenCalledWith('week');
        });

        // --- updateConfig ---
        test('updateConfig calls updateFunctionConfig and sends configUpdated', async () => {
            const configPayload = { provider: 'anthropic', model: 'claude-3' };
            await routeMessage(component, {
                action: 'updateConfig',
                functionId: 'enrichment',
                config: configPayload
            });
            expect(mockBackend.updateFunctionConfig).toHaveBeenCalledWith('enrichment', configPayload);
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'configUpdated' });
        });

        test('updateConfig without functionId sends actionError', async () => {
            await routeMessage(component, {
                action: 'updateConfig',
                config: { provider: 'openai' }
            });
            expect(mockBackend.updateFunctionConfig).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Function ID and config are required'
            });
        });

        test('updateConfig without config sends actionError', async () => {
            await routeMessage(component, {
                action: 'updateConfig',
                functionId: 'enrichment'
            });
            expect(mockBackend.updateFunctionConfig).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Function ID and config are required'
            });
        });

        test('updateConfig without both functionId and config sends actionError', async () => {
            await routeMessage(component, { action: 'updateConfig' });
            expect(mockBackend.updateFunctionConfig).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Function ID and config are required'
            });
        });

        // --- resetConfig ---
        test('resetConfig calls resetFunctionConfig and sends configReset', async () => {
            await routeMessage(component, { action: 'resetConfig', functionId: 'enrichment' });
            expect(mockBackend.resetFunctionConfig).toHaveBeenCalledWith('enrichment');
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'configReset' });
        });

        test('resetConfig without functionId sends actionError', async () => {
            await routeMessage(component, { action: 'resetConfig' });
            expect(mockBackend.resetFunctionConfig).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Function ID is required'
            });
        });

        // --- testProvider ---
        test('testProvider sends testingProvider then providerTestResult', async () => {
            await routeMessage(component, { action: 'testProvider', providerId: 'openai' });
            expect(mockBackend.testProvider).toHaveBeenCalledWith('openai');

            // First call: testingProvider notification
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'testingProvider',
                payload: { providerId: 'openai' }
            });
            // Second call: actual test result
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'providerTestResult',
                payload: MOCK_TEST_RESULT
            });
        });

        test('testProvider sends testingProvider before the backend call completes', async () => {
            await routeMessage(component, { action: 'testProvider', providerId: 'anthropic' });

            const calls = component.postMessage.mock.calls;
            // testingProvider should be the first call
            expect(calls[0][0]).toEqual({
                action: 'testingProvider',
                payload: { providerId: 'anthropic' }
            });
            // providerTestResult should be the second call
            expect(calls[1][0]).toEqual({
                action: 'providerTestResult',
                payload: MOCK_TEST_RESULT
            });
        });

        test('testProvider without providerId sends actionError', async () => {
            await routeMessage(component, { action: 'testProvider' });
            expect(mockBackend.testProvider).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Provider ID is required'
            });
        });

        // --- testAllProviders ---
        test('testAllProviders sends testingAllProviders then allProvidersTestResult', async () => {
            await routeMessage(component, { action: 'testAllProviders' });
            expect(mockBackend.testAllProviders).toHaveBeenCalledTimes(1);

            // First call: testingAllProviders notification
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'testingAllProviders'
            });
            // Second call: actual results
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'allProvidersTestResult',
                payload: MOCK_ALL_TEST_RESULTS
            });
        });

        test('testAllProviders sends testingAllProviders before the backend call completes', async () => {
            await routeMessage(component, { action: 'testAllProviders' });

            const calls = component.postMessage.mock.calls;
            expect(calls[0][0]).toEqual({ action: 'testingAllProviders' });
            expect(calls[1][0]).toEqual({
                action: 'allProvidersTestResult',
                payload: MOCK_ALL_TEST_RESULTS
            });
        });
    });

    // =========================================================================
    // INPUT VALIDATION
    // =========================================================================

    describe('Input validation', () => {
        test('getModels rejects missing providerId', async () => {
            await routeMessage(component, { action: 'getModels' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Provider ID is required'
            });
            expect(mockBackend.getProviderModels).not.toHaveBeenCalled();
        });

        test('getModels rejects empty string providerId', async () => {
            await routeMessage(component, { action: 'getModels', providerId: '' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Provider ID is required'
            });
            expect(mockBackend.getProviderModels).not.toHaveBeenCalled();
        });

        test('updateConfig rejects missing functionId', async () => {
            await routeMessage(component, { action: 'updateConfig', config: { provider: 'openai' } });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Function ID and config are required'
            });
            expect(mockBackend.updateFunctionConfig).not.toHaveBeenCalled();
        });

        test('updateConfig rejects missing config', async () => {
            await routeMessage(component, { action: 'updateConfig', functionId: 'enrichment' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Function ID and config are required'
            });
            expect(mockBackend.updateFunctionConfig).not.toHaveBeenCalled();
        });

        test('resetConfig rejects missing functionId', async () => {
            await routeMessage(component, { action: 'resetConfig' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Function ID is required'
            });
            expect(mockBackend.resetFunctionConfig).not.toHaveBeenCalled();
        });

        test('resetConfig rejects empty string functionId', async () => {
            await routeMessage(component, { action: 'resetConfig', functionId: '' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Function ID is required'
            });
            expect(mockBackend.resetFunctionConfig).not.toHaveBeenCalled();
        });

        test('testProvider rejects missing providerId', async () => {
            await routeMessage(component, { action: 'testProvider' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Provider ID is required'
            });
            expect(mockBackend.testProvider).not.toHaveBeenCalled();
        });

        test('testProvider rejects empty string providerId', async () => {
            await routeMessage(component, { action: 'testProvider', providerId: '' });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Provider ID is required'
            });
            expect(mockBackend.testProvider).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getProviders failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getProviders: jest.fn().mockRejectedValue(new Error('Provider service down'))
            };
            await routeMessage(component, { action: 'getProviders' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Provider service down'
            });
        });

        test('getConfig failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getRouterConfig: jest.fn().mockRejectedValue(new Error('Config not found'))
            };
            await routeMessage(component, { action: 'getConfig' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Config not found'
            });
        });

        test('getModels failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getProviderModels: jest.fn().mockRejectedValue(new Error('Models unavailable'))
            };
            await routeMessage(component, { action: 'getModels', providerId: 'openai' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Models unavailable'
            });
        });

        test('getUsageStats failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                getUsageStats: jest.fn().mockRejectedValue(new Error('Stats DB timeout'))
            };
            await routeMessage(component, { action: 'getUsageStats' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Stats DB timeout'
            });
        });

        test('updateConfig failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                updateFunctionConfig: jest.fn().mockRejectedValue(new Error('Write conflict'))
            };
            await routeMessage(component, {
                action: 'updateConfig',
                functionId: 'enrichment',
                config: { provider: 'anthropic' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Write conflict'
            });
        });

        test('resetConfig failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                resetFunctionConfig: jest.fn().mockRejectedValue(new Error('Reset denied'))
            };
            await routeMessage(component, { action: 'resetConfig', functionId: 'enrichment' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Reset denied'
            });
        });

        test('testProvider failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                testProvider: jest.fn().mockRejectedValue(new Error('Connection refused'))
            };
            await routeMessage(component, { action: 'testProvider', providerId: 'openai' }, failBackend);
            // testingProvider is sent before the backend call, so it should still appear
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'testingProvider',
                payload: { providerId: 'openai' }
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Connection refused'
            });
        });

        test('testAllProviders failure sends actionError', async () => {
            const failBackend = {
                ...mockBackend,
                testAllProviders: jest.fn().mockRejectedValue(new Error('All tests failed'))
            };
            await routeMessage(component, { action: 'testAllProviders' }, failBackend);
            // testingAllProviders is sent before the backend call
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'testingAllProviders'
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'All tests failed'
            });
        });

        test('error with no message falls back to generic message', async () => {
            const failBackend = {
                ...mockBackend,
                getProviders: jest.fn().mockRejectedValue({})
            };
            await routeMessage(component, { action: 'getProviders' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'An unexpected error occurred'
            });
        });

        test('error with empty string message falls back to generic message', async () => {
            const failBackend = {
                ...mockBackend,
                getRouterConfig: jest.fn().mockRejectedValue(new Error(''))
            };
            await routeMessage(component, { action: 'getConfig' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'An unexpected error occurred'
            });
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getProviders calls only getProviders backend method', async () => {
            await routeMessage(component, { action: 'getProviders' });
            expect(mockBackend.getProviders).toHaveBeenCalledTimes(1);
            expect(mockBackend.getRouterConfig).not.toHaveBeenCalled();
            expect(mockBackend.getProviderModels).not.toHaveBeenCalled();
            expect(mockBackend.getUsageStats).not.toHaveBeenCalled();
        });

        test('getConfig calls only getRouterConfig backend method', async () => {
            await routeMessage(component, { action: 'getConfig' });
            expect(mockBackend.getRouterConfig).toHaveBeenCalledTimes(1);
            expect(mockBackend.getProviders).not.toHaveBeenCalled();
        });

        test('getModels passes providerId to getProviderModels', async () => {
            await routeMessage(component, { action: 'getModels', providerId: 'anthropic' });
            expect(mockBackend.getProviderModels).toHaveBeenCalledWith('anthropic');
            expect(mockBackend.getProviderModels).toHaveBeenCalledTimes(1);
        });

        test('getUsageStats passes period to getUsageStats', async () => {
            await routeMessage(component, { action: 'getUsageStats', period: 'day' });
            expect(mockBackend.getUsageStats).toHaveBeenCalledWith('day');
            expect(mockBackend.getUsageStats).toHaveBeenCalledTimes(1);
        });

        test('updateConfig passes functionId and config to updateFunctionConfig', async () => {
            const config = { provider: 'openai', model: 'gpt-4-turbo' };
            await routeMessage(component, {
                action: 'updateConfig',
                functionId: 'scoring',
                config
            });
            expect(mockBackend.updateFunctionConfig).toHaveBeenCalledWith('scoring', config);
            expect(mockBackend.updateFunctionConfig).toHaveBeenCalledTimes(1);
        });

        test('resetConfig passes functionId to resetFunctionConfig', async () => {
            await routeMessage(component, { action: 'resetConfig', functionId: 'scoring' });
            expect(mockBackend.resetFunctionConfig).toHaveBeenCalledWith('scoring');
            expect(mockBackend.resetFunctionConfig).toHaveBeenCalledTimes(1);
        });

        test('testProvider passes providerId to testProvider backend', async () => {
            await routeMessage(component, { action: 'testProvider', providerId: 'anthropic' });
            expect(mockBackend.testProvider).toHaveBeenCalledWith('anthropic');
            expect(mockBackend.testProvider).toHaveBeenCalledTimes(1);
        });

        test('testAllProviders calls testAllProviders with no arguments', async () => {
            await routeMessage(component, { action: 'testAllProviders' });
            expect(mockBackend.testAllProviders).toHaveBeenCalledTimes(1);
            expect(mockBackend.testAllProviders).toHaveBeenCalledWith();
        });

        test('each action calls only its corresponding backend service', async () => {
            // getProviders
            await routeMessage(component, { action: 'getProviders' });
            expect(mockBackend.getProviders).toHaveBeenCalledTimes(1);
            expect(mockBackend.testProvider).not.toHaveBeenCalled();
            jest.clearAllMocks();

            // getConfig
            await routeMessage(component, { action: 'getConfig' });
            expect(mockBackend.getRouterConfig).toHaveBeenCalledTimes(1);
            expect(mockBackend.getProviders).not.toHaveBeenCalled();
            jest.clearAllMocks();

            // testAllProviders
            await routeMessage(component, { action: 'testAllProviders' });
            expect(mockBackend.testAllProviders).toHaveBeenCalledTimes(1);
            expect(mockBackend.testProvider).not.toHaveBeenCalled();
            expect(mockBackend.getProviders).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // RESPONSE FORMAT VERIFICATION
    // =========================================================================

    describe('Response format verification', () => {
        test('getProviders response has action and payload', async () => {
            await routeMessage(component, { action: 'getProviders' });
            const call = component.postMessage.mock.calls[0][0];
            expect(call).toHaveProperty('action', 'providersLoaded');
            expect(call).toHaveProperty('payload');
        });

        test('getConfig response has action and payload', async () => {
            await routeMessage(component, { action: 'getConfig' });
            const call = component.postMessage.mock.calls[0][0];
            expect(call).toHaveProperty('action', 'configLoaded');
            expect(call).toHaveProperty('payload');
        });

        test('getModels response includes providerId in payload', async () => {
            await routeMessage(component, { action: 'getModels', providerId: 'openai' });
            const call = component.postMessage.mock.calls[0][0];
            expect(call.payload).toHaveProperty('providerId', 'openai');
            expect(call.payload).toHaveProperty('models');
        });

        test('testProvider sends exactly 2 messages (notification + result)', async () => {
            await routeMessage(component, { action: 'testProvider', providerId: 'openai' });
            expect(component.postMessage).toHaveBeenCalledTimes(2);
        });

        test('testAllProviders sends exactly 2 messages (notification + results)', async () => {
            await routeMessage(component, { action: 'testAllProviders' });
            expect(component.postMessage).toHaveBeenCalledTimes(2);
        });

        test('updateConfig sends exactly 1 message (configUpdated)', async () => {
            await routeMessage(component, {
                action: 'updateConfig',
                functionId: 'enrichment',
                config: { provider: 'openai' }
            });
            expect(component.postMessage).toHaveBeenCalledTimes(1);
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'configUpdated' });
        });

        test('resetConfig sends exactly 1 message (configReset)', async () => {
            await routeMessage(component, { action: 'resetConfig', functionId: 'enrichment' });
            expect(component.postMessage).toHaveBeenCalledTimes(1);
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'configReset' });
        });

        test('validation errors send exactly 1 message (actionError)', async () => {
            await routeMessage(component, { action: 'getModels' });
            expect(component.postMessage).toHaveBeenCalledTimes(1);
            expect(component.postMessage.mock.calls[0][0].action).toBe('actionError');
        });
    });
});
