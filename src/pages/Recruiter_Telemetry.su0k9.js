/**
 * Recruiter_Telemetry Page Code
 * Bridges Recruiter_Telemetry.html with callOutcomeService and recruiter_service.
 *
 * HTML uses type key pattern.
 * HTML sends: telemetryPageReady, navigateTo, logCallOutcome, getCallAnalytics, getRecentCalls
 * HTML expects: recruiterProfile, callOutcomeLogged, callAnalyticsLoaded, recentCallsLoaded
 */

import {
    getCarrierIdentity
} from 'backend/recruiter_service';

import {
    logCallOutcome,
    getCarrierOutcomes,
    getOutcomeAnalytics
} from 'backend/callOutcomeService';

import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('Recruiter_Telemetry: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('Recruiter_Telemetry: No HTML component found');
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
        case 'telemetryPageReady':
            await handleTelemetryReady(component);
            break;
        case 'navigateTo':
            handleNavigateTo(msg);
            break;
        case 'logCallOutcome':
            await handleLogCallOutcome(component, msg);
            break;
        case 'getCallAnalytics':
            await handleGetCallAnalytics(component, msg);
            break;
        case 'getRecentCalls':
            await handleGetRecentCalls(component, msg);
            break;
        default:
            console.warn('Recruiter_Telemetry: Unknown type:', msg.type);
    }
}

async function handleTelemetryReady(component) {
    try {
        const identity = await getCarrierIdentity();
        safeSend(component, {
            type: 'recruiterProfile',
            data: {
                success: identity.success,
                dotNumber: identity.dotNumber || '',
                companyName: identity.companyName || '',
                recruiterProfile: identity.recruiterProfile || {}
            }
        });
    } catch (error) {
        console.error('Recruiter_Telemetry: telemetryReady error:', error);
        safeSend(component, {
            type: 'recruiterProfile',
            data: { success: false, dotNumber: '', companyName: '', recruiterProfile: {} }
        });
    }
}

function handleNavigateTo(msg) {
    const data = msg.data || {};
    const page = data.page || data.action;
    if (!page) return;
    const routes = {
        'dashboard': '/carrier-dashboard',
        'search': '/search-cdl-drivers',
        'compliance': '/carrier-compliance-calendar',
        'leaderboard': '/recruiter-leaderboard',
        'gamification': '/recruiter-gamification'
    };
    wixLocationFrontend.to(routes[page] || `/${page}`);
}

async function handleLogCallOutcome(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.carrierDot) return;
        const result = await logCallOutcome(data.carrierDot, {
            driverId: data.driverId || '',
            outcome: data.outcome || '',
            notes: data.notes || '',
            duration: data.duration || 0,
            callType: data.callType || 'outbound'
        });
        safeSend(component, {
            type: 'callOutcomeLogged',
            data: { success: true, result: result || {} }
        });
    } catch (error) {
        console.error('Recruiter_Telemetry: logCallOutcome error:', error);
        safeSend(component, {
            type: 'callOutcomeLogged',
            data: { success: false, error: error.message }
        });
    }
}

async function handleGetCallAnalytics(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.carrierDot) return;
        const analytics = await getOutcomeAnalytics(data.carrierDot, {
            startDate: data.startDate || '',
            endDate: data.endDate || ''
        });
        safeSend(component, {
            type: 'callAnalyticsLoaded',
            data: { success: true, analytics: analytics || {} }
        });
    } catch (error) {
        console.error('Recruiter_Telemetry: getCallAnalytics error:', error);
        safeSend(component, {
            type: 'callAnalyticsLoaded',
            data: { success: false, analytics: {} }
        });
    }
}

async function handleGetRecentCalls(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.carrierDot) return;
        const outcomes = await getCarrierOutcomes(data.carrierDot, {
            limit: data.limit || 20,
            offset: data.offset || 0
        });
        safeSend(component, {
            type: 'recentCallsLoaded',
            data: { success: true, calls: outcomes || [] }
        });
    } catch (error) {
        console.error('Recruiter_Telemetry: getRecentCalls error:', error);
        safeSend(component, {
            type: 'recentCallsLoaded',
            data: { success: false, calls: [] }
        });
    }
}
