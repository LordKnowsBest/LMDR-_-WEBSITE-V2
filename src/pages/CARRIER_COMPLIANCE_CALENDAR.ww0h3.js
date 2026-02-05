/**
 * CARRIER_COMPLIANCE_CALENDAR Page Code
 * Bridges CARRIER_COMPLIANCE_CALENDAR.html with complianceCalendarService.
 *
 * HTML uses dual-key pattern: { type, action, data }
 * HTML sends: calendarReady, getComplianceData, createComplianceEvent, navigateTo
 * HTML expects: setComplianceData, eventCreated
 */

import {
    getComplianceEvents,
    createComplianceEvent
} from 'backend/complianceCalendarService';

import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('CARRIER_COMPLIANCE_CALENDAR: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('CARRIER_COMPLIANCE_CALENDAR: No HTML component found');
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
        case 'calendarReady':
        case 'getComplianceData':
            await handleGetComplianceData(component, msg);
            break;
        case 'createComplianceEvent':
            await handleCreateEvent(component, msg);
            break;
        case 'navigateTo':
            handleNavigateTo(msg);
            break;
        default:
            console.warn('CARRIER_COMPLIANCE_CALENDAR: Unknown type:', msg.type);
    }
}

async function handleGetComplianceData(component, msg) {
    try {
        const data = msg.data || {};
        const events = await getComplianceEvents({
            start: data.start,
            end: data.end
        });
        safeSend(component, { type: 'setComplianceData', data: events });
    } catch (error) {
        console.error('CARRIER_COMPLIANCE_CALENDAR: getComplianceData error:', error);
        safeSend(component, { type: 'setComplianceData', data: [] });
    }
}

async function handleCreateEvent(component, msg) {
    try {
        const data = msg.data || {};
        const result = await createComplianceEvent(data);
        safeSend(component, { type: 'eventCreated', data: result });
    } catch (error) {
        console.error('CARRIER_COMPLIANCE_CALENDAR: createComplianceEvent error:', error);
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
