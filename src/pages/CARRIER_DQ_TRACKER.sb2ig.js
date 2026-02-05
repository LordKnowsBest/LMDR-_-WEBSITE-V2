/**
 * CARRIER_DQ_TRACKER Page Code
 * Bridges CARRIER_DQ_TRACKER.html with dqFileService.
 *
 * HTML uses dual-key pattern: { type, action, data }
 * HTML sends: dqTrackerReady, getDQFiles, generateAuditReport, navigateTo
 * HTML expects: setDQFiles
 */

import {
    getDQFiles,
    generateAuditReport
} from 'backend/dqFileService';

import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('CARRIER_DQ_TRACKER: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('CARRIER_DQ_TRACKER: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.type) return;
        await routeMessage(component, msg);
    });

    safeSend(component, { type: 'init' });
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
    switch (msg.type) {
        case 'dqTrackerReady':
        case 'getDQFiles':
            await handleGetDQFiles(component);
            break;
        case 'generateAuditReport':
            await handleGenerateReport(component, msg);
            break;
        case 'navigateTo':
            handleNavigateTo(msg);
            break;
        default:
            console.warn('CARRIER_DQ_TRACKER: Unknown type:', msg.type);
    }
}

async function handleGetDQFiles(component) {
    try {
        const files = await getDQFiles();
        safeSend(component, { type: 'setDQFiles', data: files });
    } catch (error) {
        console.error('CARRIER_DQ_TRACKER: getDQFiles error:', error);
        safeSend(component, { type: 'setDQFiles', data: [] });
    }
}

async function handleGenerateReport(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.dqFileId) return;
        await generateAuditReport(data.dqFileId);
    } catch (error) {
        console.error('CARRIER_DQ_TRACKER: generateAuditReport error:', error);
    }
}

function handleNavigateTo(msg) {
    const page = msg.data && msg.data.page;
    if (!page) return;
    const routes = {
        'dashboard': '/carrier-dashboard',
        'compliance': '/carrier-compliance-calendar',
        'dq-tracker': '/carrier-dq-tracker',
        'incidents': '/carrier-incident-reporting',
        'documents': '/carrier-document-vault'
    };
    wixLocationFrontend.to(routes[page] || `/${page}`);
}
