import {
    getRouterConfig,
    getProviders,
    getProviderModels,
    getUsageStats,
    updateFunctionConfig,
    resetFunctionConfig,
    testProvider,
    testAllProviders
} from 'backend/aiRouterService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();

    if (!components.length) {
        console.warn('No HTML component found for AI Router page');
        return;
    }

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send init to tell the HTML component to request its data
        component.postMessage({ action: 'init' });
    }
});

/**
 * Safely discover HTML components on the page.
 * Uses try-catch around each $w() call to satisfy the selector-safety hook.
 */
function getHtmlComponents() {
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
 * Route incoming postMessage from the HTML component to the correct backend call
 * and send the response back.
 */
async function routeMessage(component, message) {
    if (!message || !message.action) return;

    const { action } = message;

    try {
        switch (action) {
            case 'getProviders': {
                const providers = await getProviders();
                component.postMessage({ action: 'providersLoaded', payload: providers });
                break;
            }

            case 'getConfig': {
                const config = await getRouterConfig();
                component.postMessage({ action: 'configLoaded', payload: config });
                break;
            }

            case 'getModels': {
                const providerId = message.providerId;
                if (!providerId) {
                    component.postMessage({ action: 'actionError', message: 'Provider ID is required' });
                    return;
                }
                const models = await getProviderModels(providerId);
                component.postMessage({
                    action: 'modelsLoaded',
                    payload: { providerId, models }
                });
                break;
            }

            case 'getUsageStats': {
                const period = message.period || 'week';
                const stats = await getUsageStats(period);
                component.postMessage({ action: 'usageStatsLoaded', payload: stats });
                break;
            }

            case 'updateConfig': {
                const { functionId, config } = message;
                if (!functionId || !config) {
                    component.postMessage({ action: 'actionError', message: 'Function ID and config are required' });
                    return;
                }
                await updateFunctionConfig(functionId, config);
                component.postMessage({ action: 'configUpdated' });
                break;
            }

            case 'resetConfig': {
                const resetFuncId = message.functionId;
                if (!resetFuncId) {
                    component.postMessage({ action: 'actionError', message: 'Function ID is required' });
                    return;
                }
                await resetFunctionConfig(resetFuncId);
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
                const result = await testProvider(testProviderId);
                component.postMessage({ action: 'providerTestResult', payload: result });
                break;
            }

            case 'testAllProviders': {
                component.postMessage({ action: 'testingAllProviders' });
                const results = await testAllProviders();
                component.postMessage({ action: 'allProvidersTestResult', payload: results });
                break;
            }

            default:
                console.warn('AI Router: Unknown action received:', action);
                break;
        }
    } catch (error) {
        console.error('AI Router bridge error:', error);
        component.postMessage({
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}
