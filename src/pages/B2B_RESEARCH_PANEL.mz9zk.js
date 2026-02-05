/**
 * B2B_RESEARCH_PANEL Page Code
 * Bridges B2B_RESEARCH_PANEL.html with b2bResearchAgentService.
 *
 * HTML sends (action key): generateBrief
 * HTML expects: init (with accountId), briefLoaded, briefGenerating, actionError
 */

import { generateBrief, getBrief } from 'backend/b2bResearchAgentService';
import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('B2B_RESEARCH_PANEL: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('B2B_RESEARCH_PANEL: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.action) return;
        await routeMessage(component, msg);
    });

    // Pass accountId from URL query params to the HTML
    const query = wixLocationFrontend.query;
    const accountId = query.accountId || '';

    safeSend(component, { action: 'init', accountId });
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
        case 'generateBrief':
            await handleGenerateBrief(component, msg);
            break;
        default:
            console.warn('B2B_RESEARCH_PANEL: Unknown action:', msg.action);
    }
}

async function handleGenerateBrief(component, msg) {
    try {
        if (!msg.accountId) {
            safeSend(component, { action: 'actionError', message: 'No account selected.' });
            return;
        }

        safeSend(component, { action: 'briefGenerating' });

        const result = await generateBrief(msg.accountId, !!msg.forceRefresh);

        safeSend(component, {
            action: 'briefLoaded',
            payload: {
                brief: result.brief || result,
                cached: !!result.cached
            }
        });
    } catch (error) {
        console.error('B2B_RESEARCH_PANEL: generateBrief error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to generate brief.' });
    }
}
