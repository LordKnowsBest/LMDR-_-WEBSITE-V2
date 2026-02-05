/**
 * DRIVER_POLICIES Page Code
 * Bridges DRIVER_POLICIES.html with carrierPolicyService.
 *
 * HTML uses type key pattern.
 * HTML sends: driverPoliciesReady, getDriverPolicies, getPolicyContent, acknowledgePolicy
 * HTML expects: driverPoliciesData, policyContentData, policyAcknowledgeResult, driverContext
 */

import {
    getPoliciesForDriver,
    getPolicyContent,
    acknowledgePolicy
} from 'backend/carrierPolicyService';

import wixUsers from 'wix-users';
import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('DRIVER_POLICIES: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('DRIVER_POLICIES: No HTML component found');
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
        case 'driverPoliciesReady':
            await handlePoliciesReady(component);
            break;
        case 'getDriverPolicies':
            await handleGetPolicies(component, msg);
            break;
        case 'getPolicyContent':
            await handleGetPolicyContent(component, msg);
            break;
        case 'acknowledgePolicy':
            await handleAcknowledgePolicy(component, msg);
            break;
        default:
            console.warn('DRIVER_POLICIES: Unknown type:', msg.type);
    }
}

async function handlePoliciesReady(component) {
    try {
        const userId = wixUsers.currentUser.id;
        const query = wixLocationFrontend.query;
        const carrierId = query.carrierId || '';

        safeSend(component, {
            type: 'driverContext',
            data: { driverId: userId, carrierId }
        });
    } catch (error) {
        console.error('DRIVER_POLICIES: policiesReady error:', error);
    }
}

async function handleGetPolicies(component, msg) {
    try {
        const data = msg.data || {};
        const driverId = data.driverId || wixUsers.currentUser.id;
        const carrierId = data.carrierId || '';
        if (!carrierId) {
            safeSend(component, {
                type: 'driverPoliciesData',
                data: { success: true, policies: [] }
            });
            return;
        }
        const policies = await getPoliciesForDriver(driverId, carrierId);
        safeSend(component, {
            type: 'driverPoliciesData',
            data: { success: true, policies: policies || [] }
        });
    } catch (error) {
        console.error('DRIVER_POLICIES: getPolicies error:', error);
        safeSend(component, {
            type: 'driverPoliciesData',
            data: { success: false, policies: [], error: error.message }
        });
    }
}

async function handleGetPolicyContent(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.policyId) return;
        const policy = await getPolicyContent(data.policyId);
        safeSend(component, {
            type: 'policyContentData',
            data: { success: true, policy: policy || {} }
        });
    } catch (error) {
        console.error('DRIVER_POLICIES: getPolicyContent error:', error);
        safeSend(component, {
            type: 'policyContentData',
            data: { success: false, error: error.message }
        });
    }
}

async function handleAcknowledgePolicy(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.policyId || !data.driverId) return;
        const result = await acknowledgePolicy(
            data.policyId,
            data.driverId,
            data.signatureType || 'checkbox',
            data.ipAddress || '',
            data.deviceInfo || ''
        );
        safeSend(component, {
            type: 'policyAcknowledgeResult',
            data: { success: true, acknowledgment: result }
        });
    } catch (error) {
        console.error('DRIVER_POLICIES: acknowledgePolicy error:', error);
        safeSend(component, {
            type: 'policyAcknowledgeResult',
            data: { success: false, error: error.message }
        });
    }
}
