/**
 * B2B_PIPELINE Page Code
 * Bridges B2B_PIPELINE.html with b2bPipelineService.
 *
 * HTML sends (action key): getPipeline, getForecast, viewAccount
 * HTML expects: pipelineLoaded, forecastLoaded, stageUpdated, actionSuccess, actionError
 */

import { getPipelineView, getForecast } from 'backend/b2bPipelineService';
import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('B2B_PIPELINE: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('B2B_PIPELINE: No HTML component found');
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
        case 'getPipeline':
            await handleGetPipeline(component, msg);
            break;
        case 'getForecast':
            await handleGetForecast(component, msg);
            break;
        case 'viewAccount':
            handleViewAccount(msg);
            break;
        default:
            console.warn('B2B_PIPELINE: Unknown action:', msg.action);
    }
}

async function handleGetPipeline(component, msg) {
    try {
        const filters = {};
        if (msg.ownerId) filters.owner_id = msg.ownerId;
        const pipeline = await getPipelineView(filters);
        safeSend(component, { action: 'pipelineLoaded', payload: pipeline });
    } catch (error) {
        console.error('B2B_PIPELINE: getPipeline error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load pipeline.' });
    }
}

async function handleGetForecast(component, msg) {
    try {
        const options = {};
        if (msg.ownerId) options.owner_id = msg.ownerId;
        if (typeof msg.useAI === 'boolean') options.useAI = msg.useAI;
        const forecast = await getForecast(options);
        safeSend(component, { action: 'forecastLoaded', payload: forecast.forecast || forecast });
    } catch (error) {
        console.error('B2B_PIPELINE: getForecast error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load forecast.' });
    }
}

function handleViewAccount(msg) {
    if (!msg.accountId) return;
    wixLocationFrontend.to(`/b2b-account-detail?accountId=${msg.accountId}`);
}
