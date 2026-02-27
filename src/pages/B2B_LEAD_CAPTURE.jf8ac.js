/**
 * B2B_LEAD_CAPTURE Page Code
 * Bridges B2B_LEAD_CAPTURE.html with b2bAccountService.
 *
 * HTML sends (action key): captureLead
 * HTML expects: leadCaptured, actionSuccess, actionError
 */

import {
    createAccount,
    createContact,
    trackLeadSource
} from 'backend/b2bAccountService';
import { scoreAndRouteLead } from 'backend/b2bAIService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('B2B_LEAD_CAPTURE: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('B2B_LEAD_CAPTURE: No HTML component found');
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
        case 'captureLead':
            await handleCaptureLead(component, msg);
            break;
        default:
            console.warn('B2B_LEAD_CAPTURE: Unknown action:', msg.action);
    }
}

async function handleCaptureLead(component, msg) {
    try {
        const lead = msg.lead || {};

        if (!lead.companyName) {
            safeSend(component, { action: 'actionError', message: 'Company name is required.' });
            return;
        }

        // Create the account
        const account = await createAccount({
            company_name: lead.companyName,
            carrier_dot: lead.dotNumber || '',
            region: lead.region || '',
            fleet_size_bucket: lead.fleetSize ? String(lead.fleetSize) : '',
            tags: lead.tags || '',
            notes: lead.notes || '',
            source: lead.captureSource || 'event_booth',
            event_name: lead.eventName || ''
        });

        const accountId = account._id || account.id;

        // Create the contact
        if (lead.contactName) {
            await createContact({
                account_id: accountId,
                name: lead.contactName,
                role: lead.contactRole || '',
                email: lead.email || '',
                phone: lead.phone || ''
            });
        }

        // Track lead source
        if (lead.captureSource) {
            await trackLeadSource(accountId, lead.captureSource, '', lead.eventName || '');
        }

        const routeResult = await scoreAndRouteLead({ ...lead, accountId }).catch(() => ({ success: false }));
        const qualification = routeResult.success ? routeResult.result : null;

        safeSend(component, {
            action: 'leadCaptured',
            payload: {
                accountId,
                companyName: lead.companyName,
                leadScore: qualification?.score || 0,
                leadClassification: qualification?.classification || 'cold',
                assignedOwnerId: qualification?.assignedOwnerId || '',
                opportunityCreated: qualification?.opportunityCreated || false
            }
        });
    } catch (error) {
        console.error('B2B_LEAD_CAPTURE: captureLead error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to capture lead.' });
    }
}
