/**
 * B2B_CAMPAIGNS Page Code
 * Bridges B2B_CAMPAIGNS.html with b2bSequenceService and b2bAnalyticsService.
 *
 * HTML sends (action key): getOutreachMetrics, getChannelPerformance, getRepPerformance
 * HTML expects: metricsLoaded, channelsLoaded, repsLoaded, actionError
 */

import { getOutreachMetrics } from 'backend/b2bSequenceService';
import { getChannelPerformance, getRepPerformance } from 'backend/b2bAnalyticsService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('B2B_CAMPAIGNS: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('B2B_CAMPAIGNS: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.action) return;
        await routeMessage(component, msg);
    });

    safeSend(component, { action: 'init' });
});

function findHtmlComponent() {
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

async function routeMessage(component, msg) {
    switch (msg.action) {
        case 'getOutreachMetrics':
            await handleGetMetrics(component, msg);
            break;
        case 'getChannelPerformance':
            await handleGetChannels(component, msg);
            break;
        case 'getRepPerformance':
            await handleGetReps(component, msg);
            break;
        default:
            console.warn('B2B_CAMPAIGNS: Unknown action:', msg.action);
    }
}

async function handleGetMetrics(component, msg) {
    try {
        const metrics = await getOutreachMetrics({ days: msg.days || 30 });
        safeSend(component, { action: 'metricsLoaded', payload: metrics });
    } catch (error) {
        console.error('B2B_CAMPAIGNS: getOutreachMetrics error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load metrics.' });
    }
}

async function handleGetChannels(component, msg) {
    try {
        const channels = await getChannelPerformance(msg.days || 30);
        safeSend(component, { action: 'channelsLoaded', payload: channels });
    } catch (error) {
        console.error('B2B_CAMPAIGNS: getChannelPerformance error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load channel data.' });
    }
}

async function handleGetReps(component, msg) {
    try {
        const reps = await getRepPerformance(msg.days || 30);
        safeSend(component, { action: 'repsLoaded', payload: reps });
    } catch (error) {
        console.error('B2B_CAMPAIGNS: getRepPerformance error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load rep data.' });
    }
}
