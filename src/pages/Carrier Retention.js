// ============================================================================
// CARRIER RETENTION DASHBOARD - Page Code
// Protected Page: Requires login and carrier ownership
// ============================================================================

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { getCarrierRetentionDashboardForCarrier } from 'backend/retentionService.jsw';
import { getOrCreateRecruiterProfile } from 'backend/recruiter_service';
import {
    getTemplates as getInterventionTemplates,
    sendIntervention
} from 'backend/interventionService';

// ============================================================================
// STATE
// ============================================================================

let currentCarrierDOT = null;
let currentUser = null;

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
    console.log('Carrier Retention Page Ready');

    const htmlComponent = $w('#htmlRetentionDashboard');

    if (!htmlComponent) {
        console.error('HTML component #htmlRetentionDashboard not found');
        return;
    }

    // 1. Check Authentication
    currentUser = wixUsers.currentUser;
    if (!currentUser.loggedIn) {
        console.log('User not logged in, redirecting...');
        wixLocation.to('/account/my-account');
        return;
    }

    // 2. Initialize Data
    await initializePage(htmlComponent);

    // 3. Set up Message Listener
    htmlComponent.onMessage(async (event) => {
        await handleHtmlMessage(event.data, htmlComponent);
    });
});

async function initializePage(component) {
    try {
        // Get Recruiter/Carrier Profile to find the DOT number
        // Assuming the logged-in user is a recruiter/carrier admin
        const profileResult = await getOrCreateRecruiterProfile();

        if (!profileResult.success) {
            console.error('Failed to load profile:', profileResult.error);
            component.postMessage({ type: 'error', data: { message: 'Failed to load profile' } });
            return;
        }

        // Use the default carrier
        // Note: For multi-carrier agencies, we might need a selector, 
        // but for now we default to the primary one.
        currentCarrierDOT = profileResult.defaultCarrierDOT;

        if (!currentCarrierDOT) {
            component.postMessage({ type: 'error', data: { message: 'No carrier associated with this account' } });
            return;
        }

        console.log('Initialized for Carrier:', currentCarrierDOT);

        // Load Dashboard Data
        await loadRetentionData(component);

    } catch (error) {
        console.error('Page initialization error:', error);
        component.postMessage({ type: 'error', data: { message: error.message } });
    }
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadRetentionData(component) {
    if (!currentCarrierDOT) return;

    try {
        console.log('Fetching retention dashboard data...');
        const data = await getCarrierRetentionDashboardForCarrier(currentCarrierDOT);

        // Send to HTML
        component.postMessage({
            type: 'dashboardData',
            data: data
        });

    } catch (error) {
        console.error('Load data error:', error);
        component.postMessage({
            type: 'error',
            data: { message: 'Failed to load retention data' }
        });
    }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

async function handleHtmlMessage(msg, component) {
    if (!msg || !msg.type) return;
    console.log('[Velo] Received:', msg.type);

    switch (msg.type) {
        case 'refresh':
            await loadRetentionData(component);
            break;

        case 'getInterventionTemplates':
            await handleGetTemplates(msg.data, component);
            break;

        case 'sendIntervention':
            await handleSendIntervention(msg.data, component);
            break;

        case 'navigateTo': // From Sidebar (if sidebar is embedded here too)
            if (msg.data.page) {
                const pageRoutes = {
                    'dashboard': '/recruiter-console',
                    'pipeline': '/recruiter-console', // Pipeline view
                    'driver-search': '/recruiter-driver-search',
                    'retention': '/carrier-retention',
                    'settings': '/account/my-account'
                };
                const route = pageRoutes[msg.data.page] || msg.data.page;
                wixLocation.to(route);
            }
            break;
    }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleGetTemplates(data, component) {
    if (!currentCarrierDOT) return;

    try {
        const result = await getInterventionTemplates(currentCarrierDOT, data?.riskType);

        // Transform the result to match what HTML expects if needed, 
        // but getTemplates already returns { templatesByRiskType: ... } if no riskType,
        // or array if riskType provided. The HTML expects `templatesByRiskType` or list.
        // Let's rely on the service returning standard format.

        component.postMessage({
            type: 'interventionTemplatesLoaded',
            data: result
        });
    } catch (error) {
        component.postMessage({
            type: 'error',
            data: { message: error.message }
        });
    }
}

async function handleSendIntervention(data, component) {
    if (!currentCarrierDOT) return;

    try {
        const result = await sendIntervention(
            data.templateId,
            data.driverId,
            data.overrides || {}
        );

        component.postMessage({
            type: 'interventionSent',
            data: result
        });
    } catch (error) {
        component.postMessage({
            type: 'error',
            data: { message: error.message }
        });
    }
}
