import {
    getLogs,
    getErrors,
    getTrace,
    getHealthMetrics,
    getAIAnalytics,
    getLogMetadata
} from 'backend/observabilityService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('[ADMIN_OBSERVABILITY] No HTML component found on page');
        return;
    }

    component.onMessage(async (event) => {
        await handleMessage(component, event?.data);
    });

    // Send initial data bundle to HTML component
    await sendInitialData(component);
});

/**
 * Safely discover the first available HTML component on the page
 * Uses try-catch per CLAUDE.md UI Safety Pattern
 */
function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element not present on this page layout
        }
    }
    return null;
}

/**
 * Load initial data (metadata, health, errors, AI analytics)
 * and send it all to the HTML component as the 'initialized' action
 */
async function sendInitialData(component) {
    try {
        const [metadata, health, errors, aiAnalytics] = await Promise.all([
            getLogMetadata(),
            getHealthMetrics('hour'),
            getErrors({ period: 'day' }),
            getAIAnalytics('day')
        ]);

        postToComponent(component, {
            action: 'initialized',
            payload: { metadata, health, errors, aiAnalytics }
        });
    } catch (error) {
        console.error('[ADMIN_OBSERVABILITY] Failed to load initial data:', error);
        postToComponent(component, {
            action: 'actionError',
            message: 'Failed to load initial data: ' + (error.message || 'Unknown error')
        });
    }
}

/**
 * Route incoming messages from the HTML component to the
 * appropriate backend service call and send results back
 */
async function handleMessage(component, message) {
    if (!message || !message.action) return;

    try {
        switch (message.action) {
            case 'init':
                // HTML component requesting re-initialization
                await sendInitialData(component);
                break;

            case 'getLogs':
                await handleGetLogs(component, message.options);
                break;

            case 'getErrors':
                await handleGetErrors(component, message.options);
                break;

            case 'getTrace':
                await handleGetTrace(component, message.traceId);
                break;

            case 'getHealthMetrics':
                await handleGetHealthMetrics(component, message.period);
                break;

            case 'getAIAnalytics':
                await handleGetAIAnalytics(component, message.period);
                break;

            default:
                console.warn('[ADMIN_OBSERVABILITY] Unknown action:', message.action);
                break;
        }
    } catch (error) {
        console.error('[ADMIN_OBSERVABILITY] Error handling action "' + message.action + '":', error);
        postToComponent(component, {
            action: 'actionError',
            message: 'Error processing ' + message.action + ': ' + (error.message || 'Unknown error')
        });
    }
}

// ============================================
// ACTION HANDLERS
// ============================================

async function handleGetLogs(component, options) {
    const data = await getLogs(options || {});
    postToComponent(component, { action: 'logsLoaded', payload: data });
}

async function handleGetErrors(component, options) {
    const data = await getErrors(options || {});
    postToComponent(component, { action: 'errorsLoaded', payload: data });
}

async function handleGetTrace(component, traceId) {
    if (!traceId) {
        postToComponent(component, {
            action: 'actionError',
            message: 'Trace ID is required'
        });
        return;
    }
    const data = await getTrace(traceId);
    postToComponent(component, { action: 'traceLoaded', payload: data });
}

async function handleGetHealthMetrics(component, period) {
    const data = await getHealthMetrics(period || 'hour');
    postToComponent(component, { action: 'healthLoaded', payload: data });
}

async function handleGetAIAnalytics(component, period) {
    const data = await getAIAnalytics(period || 'day');
    postToComponent(component, { action: 'aiAnalyticsLoaded', payload: data });
}

// ============================================
// UTILITY
// ============================================

/**
 * Safely post a message to the HTML component
 */
function postToComponent(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (e) {
        console.error('[ADMIN_OBSERVABILITY] postMessage failed:', e);
    }
}
