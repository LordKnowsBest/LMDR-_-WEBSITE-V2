/**
 * CARRIER_INCIDENT_REPORTING Page Code
 * Bridges CARRIER_INCIDENT_REPORTING.html with incidentService.
 *
 * HTML uses dual-key pattern: { type, action, data }
 * HTML sends: incidentsReady, getIncidents, createIncidentReport, navigateTo
 * HTML expects: setIncidents
 */

import {
    getIncidents,
    createIncident
} from 'backend/incidentService';

import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('CARRIER_INCIDENT_REPORTING: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('CARRIER_INCIDENT_REPORTING: No HTML component found');
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
        case 'incidentsReady':
        case 'getIncidents':
            await handleGetIncidents(component);
            break;
        case 'createIncidentReport':
            await handleCreateIncident(component, msg);
            break;
        case 'navigateTo':
            handleNavigateTo(msg);
            break;
        default:
            console.warn('CARRIER_INCIDENT_REPORTING: Unknown type:', msg.type);
    }
}

async function handleGetIncidents(component) {
    try {
        const incidents = await getIncidents();
        safeSend(component, { type: 'setIncidents', data: incidents });
    } catch (error) {
        console.error('CARRIER_INCIDENT_REPORTING: getIncidents error:', error);
        safeSend(component, { type: 'setIncidents', data: [] });
    }
}

async function handleCreateIncident(component, msg) {
    try {
        const data = msg.data || {};
        await createIncident(data);
        // Refresh the list
        const incidents = await getIncidents();
        safeSend(component, { type: 'setIncidents', data: incidents });
    } catch (error) {
        console.error('CARRIER_INCIDENT_REPORTING: createIncident error:', error);
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
