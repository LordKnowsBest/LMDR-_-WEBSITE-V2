import wixLocation from 'wix-location';
import {
    getNPSScore,
    getNPSTrend,
    getSurveyConfig,
    updateSurveyConfig,
    getSegmentBreakdown,
    getRecentFeedback
} from 'backend/npsService.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();

    if (!components.length) {
        console.warn('ADMIN_NPS: No HTML component found');
        return;
    }

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send init signal
        safeSend(component, { action: 'init' });
    }
});

/**
 * Safely discover HTML components on the page.
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
            // skip
        }
    }
    return found;
}

/**
 * Route incoming messages
 */
async function routeMessage(component, message) {
    if (!message?.action) return;

    const { action } = message;

    if (action === 'navigateTo') {
        if (message.destination) wixLocation.to(`/${message.destination}`);
        return;
    }

    try {
        switch (action) {
            case 'getNPSStats':
                await handleGetNPSStats(component, message.dateRange, message.segment);
                break;

            case 'getSurveyConfig':
                await handleGetSurveyConfig(component);
                break;

            case 'updateSurveyConfig':
                await handleUpdateSurveyConfig(component, message.configId, message.updates);
                break;
            case 'getSegmentBreakdown':
                await handleGetSegmentBreakdown(component, message.dateRange || {});
                break;
            case 'getRecentFeedback':
                await handleGetRecentFeedback(component, message.limit || 20, message.category || null);
                break;

            default:
                console.warn('ADMIN_NPS: Unknown action:', action);
        }
    } catch (error) {
        console.error('ADMIN_NPS: Error handling action', action, error);
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

async function handleGetNPSStats(component, dateRange, segment) {
    const [scoreResult, trendResult] = await Promise.all([
        getNPSScore(dateRange, segment),
        getNPSTrend(dateRange)
    ]);

    safeSend(component, { 
        action: 'npsStatsLoaded', 
        payload: { 
            score: scoreResult,
            trend: trendResult.trend
        } 
    });
}

async function handleGetSurveyConfig(component) {
    const result = await getSurveyConfig();
    safeSend(component, { action: 'surveyConfigLoaded', payload: result.items });
}

async function handleUpdateSurveyConfig(component, configId, updates) {
    const result = await updateSurveyConfig(configId, updates);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: 'Survey configuration updated' });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleGetSegmentBreakdown(component, dateRange) {
    const result = await getSegmentBreakdown(dateRange);
    safeSend(component, { action: 'segmentBreakdownLoaded', payload: result });
}

async function handleGetRecentFeedback(component, limit, category) {
    const result = await getRecentFeedback(limit, category);
    safeSend(component, { action: 'recentFeedbackLoaded', payload: result.items || [] });
}

// ============================================
// UTILITY
// ============================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        console.error('ADMIN_NPS: Failed to postMessage:', error);
    }
}
