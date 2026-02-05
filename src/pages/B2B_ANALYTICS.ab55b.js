/**
 * B2B_ANALYTICS Page Code
 * Bridges B2B_ANALYTICS.html with b2bAnalyticsService and b2bPipelineService.
 *
 * HTML sends (action key): getDashboardKPIs, getStageConversions,
 *   getSourcePerformance, getCPA, getCompetitorIntel, saveSnapshot, addCompetitorIntel
 * HTML expects: kpisLoaded, conversionsLoaded, sourcesLoaded, cpaLoaded,
 *   intelLoaded, snapshotSaved, actionError
 */

import {
    getDashboardKPIs,
    getSourcePerformance,
    getCostPerAcquisition,
    getCompetitorIntel,
    addCompetitorIntel,
    saveSnapshot
} from 'backend/b2bAnalyticsService';

import { getStageConversions } from 'backend/b2bPipelineService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('B2B_ANALYTICS: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('B2B_ANALYTICS: No HTML component found');
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
        case 'getDashboardKPIs':
            await handleGetKPIs(component, msg);
            break;
        case 'getStageConversions':
            await handleGetConversions(component);
            break;
        case 'getSourcePerformance':
            await handleGetSources(component);
            break;
        case 'getCPA':
            await handleGetCPA(component, msg);
            break;
        case 'getCompetitorIntel':
            await handleGetIntel(component);
            break;
        case 'saveSnapshot':
            await handleSaveSnapshot(component, msg);
            break;
        case 'addCompetitorIntel':
            await handleAddIntel(component, msg);
            break;
        default:
            console.warn('B2B_ANALYTICS: Unknown action:', msg.action);
    }
}

async function handleGetKPIs(component, msg) {
    try {
        const kpis = await getDashboardKPIs({ days: msg.days || 30 });
        safeSend(component, { action: 'kpisLoaded', payload: kpis });
    } catch (error) {
        console.error('B2B_ANALYTICS: getDashboardKPIs error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load KPIs.' });
    }
}

async function handleGetConversions(component) {
    try {
        const conversions = await getStageConversions();
        safeSend(component, { action: 'conversionsLoaded', payload: conversions });
    } catch (error) {
        console.error('B2B_ANALYTICS: getStageConversions error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load conversions.' });
    }
}

async function handleGetSources(component) {
    try {
        const sources = await getSourcePerformance();
        safeSend(component, { action: 'sourcesLoaded', payload: sources });
    } catch (error) {
        console.error('B2B_ANALYTICS: getSourcePerformance error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load sources.' });
    }
}

async function handleGetCPA(component, msg) {
    try {
        const cpa = await getCostPerAcquisition(msg.days || 90);
        safeSend(component, { action: 'cpaLoaded', payload: cpa });
    } catch (error) {
        console.error('B2B_ANALYTICS: getCPA error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load CPA data.' });
    }
}

async function handleGetIntel(component) {
    try {
        const intel = await getCompetitorIntel();
        safeSend(component, { action: 'intelLoaded', payload: intel });
    } catch (error) {
        console.error('B2B_ANALYTICS: getCompetitorIntel error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load competitor intel.' });
    }
}

async function handleSaveSnapshot(component, msg) {
    try {
        await saveSnapshot({ days: msg.days || 30 });
        safeSend(component, { action: 'snapshotSaved' });
    } catch (error) {
        console.error('B2B_ANALYTICS: saveSnapshot error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to save snapshot.' });
    }
}

async function handleAddIntel(component, msg) {
    try {
        await addCompetitorIntel(msg.intel || {});
        safeSend(component, { action: 'actionSuccess', message: 'Intel added.' });
        // Refresh intel list
        const intel = await getCompetitorIntel();
        safeSend(component, { action: 'intelLoaded', payload: intel });
    } catch (error) {
        console.error('B2B_ANALYTICS: addCompetitorIntel error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to add intel.' });
    }
}
