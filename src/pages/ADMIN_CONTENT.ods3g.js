/**
 * ADMIN_CONTENT Page Code
 *
 * Bridges ADMIN_CONTENT.html (content moderation UI) with backend
 * admin_content_service.jsw via postMessage protocol.
 *
 * Outbound (HTML -> Velo):
 *   { action: 'navigate', target: 'dashboard' }
 *   { action: 'getModerationQueue' }
 *   { action: 'performModeration', payload: { id, type, subtype, status, reason } }
 *
 * Inbound (Velo -> HTML):
 *   { action: 'moderationQueueLoaded', payload: { items, total } }
 *   { action: 'actionSuccess', payload: { id } }
 */

import { getModerationQueue, updateReviewStatus, updateJobStatus, updateDocumentStatus } from 'backend/admin_content_service';
import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

// ============================================================================
// SAFE HELPERS
// ============================================================================

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('ADMIN_CONTENT: safeSend failed:', err);
    }
}

function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element does not exist on this page, skip
        }
    }
    return null;
}

// ============================================================================
// MESSAGE ROUTING
// ============================================================================

async function routeMessage(component, msg) {
    const { action, payload, target } = msg;

    switch (action) {
        case 'navigate':
            handleNavigate(target);
            break;

        case 'getModerationQueue':
            await handleGetModerationQueue(component);
            break;

        case 'performModeration':
            await handlePerformModeration(component, payload);
            break;

        default:
            console.warn('ADMIN_CONTENT: Unknown action:', action);
    }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

function handleNavigate(target) {
    try {
        if (target === 'dashboard') {
            wixLocationFrontend.to('/admin-dashboard');
        } else {
            wixLocationFrontend.to('/' + (target || ''));
        }
    } catch (err) {
        console.error('ADMIN_CONTENT: Navigate failed:', err);
    }
}

async function handleGetModerationQueue(component) {
    try {
        const result = await getModerationQueue();
        safeSend(component, {
            action: 'moderationQueueLoaded',
            payload: {
                items: result.items || [],
                total: result.total || 0
            }
        });
    } catch (err) {
        console.error('ADMIN_CONTENT: getModerationQueue failed:', err);
        safeSend(component, {
            action: 'moderationQueueLoaded',
            payload: { items: [], total: 0 }
        });
    }
}

async function handlePerformModeration(component, payload) {
    if (!payload || !payload.id || !payload.type || !payload.status) {
        console.error('ADMIN_CONTENT: performModeration missing required fields:', payload);
        return;
    }

    const { id, type, subtype, status, reason } = payload;

    try {
        let result;

        switch (type) {
            case 'review':
                result = await updateReviewStatus(id, status, reason || '');
                break;

            case 'job':
                result = await updateJobStatus(id, status);
                break;

            case 'document':
                result = await updateDocumentStatus(id, subtype, status, reason || '');
                break;

            default:
                console.error('ADMIN_CONTENT: Unknown moderation type:', type);
                return;
        }

        if (result && result.success) {
            safeSend(component, {
                action: 'actionSuccess',
                payload: { id }
            });
        } else {
            console.error('ADMIN_CONTENT: Moderation action returned failure for', id);
        }
    } catch (err) {
        console.error('ADMIN_CONTENT: performModeration failed:', err);
    }
}

// ============================================================================
// PAGE INIT
// ============================================================================

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('ADMIN_CONTENT: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.action) return;
        await routeMessage(component, msg);
    });

    safeSend(component, { action: 'init' });
});
