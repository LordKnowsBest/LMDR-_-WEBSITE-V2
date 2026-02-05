import { getModQueue, moderatePost } from 'backend/moderationService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('ADMIN_MODERATION: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('ADMIN_MODERATION: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.type) return;
        await routeMessage(component, msg);
    });
});

function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element not found, try next
        }
    }
    return null;
}

// =============================================================================
// MESSAGE ROUTER
// =============================================================================

async function routeMessage(component, msg) {
    switch (msg.type) {
        case 'ready':
            await handleReady(component);
            break;
        case 'getQueue':
            await handleGetQueue(component, msg.payload);
            break;
        case 'moderateReport':
            await handleModerateReport(component, msg.payload);
            break;
        default:
            console.warn('ADMIN_MODERATION: Unknown message type:', msg.type);
    }
}

// =============================================================================
// HANDLERS
// =============================================================================

/**
 * HTML has loaded and is ready to receive data.
 * Fetch the initial pending queue and send it over.
 */
async function handleReady(component) {
    try {
        const result = await getModQueue({ status: 'pending' });
        safeSend(component, {
            type: 'queueData',
            payload: { items: result.items || [] }
        });
    } catch (err) {
        console.error('ADMIN_MODERATION: handleReady error:', err);
        safeSend(component, {
            type: 'queueData',
            payload: { items: [] }
        });
    }
}

/**
 * HTML requests the queue for a specific status filter.
 * payload: { status: 'pending' | 'resolved' }
 */
async function handleGetQueue(component, payload) {
    try {
        const status = (payload && payload.status) || 'pending';
        const result = await getModQueue({ status });
        safeSend(component, {
            type: 'queueData',
            payload: { items: result.items || [] }
        });
    } catch (err) {
        console.error('ADMIN_MODERATION: handleGetQueue error:', err);
        safeSend(component, {
            type: 'queueData',
            payload: { items: [] }
        });
    }
}

/**
 * HTML requests a moderation action on a report.
 * payload: { reportId, action: 'dismiss'|'warn'|'hide'|'ban', notes }
 */
async function handleModerateReport(component, payload) {
    try {
        if (!payload || !payload.reportId || !payload.action) {
            console.error('ADMIN_MODERATION: Invalid moderateReport payload');
            return;
        }

        // Map HTML action names to backend action names
        // 'dismiss' in HTML maps to 'approve' in moderatePost (closes without action)
        const actionMap = {
            dismiss: 'approve',
            warn: 'warn',
            hide: 'hide',
            ban: 'ban'
        };
        const backendAction = actionMap[payload.action] || payload.action;

        await moderatePost(payload.reportId, backendAction, payload.notes || '');

        safeSend(component, {
            type: 'actionSuccess',
            payload: { reportId: payload.reportId }
        });
    } catch (err) {
        console.error('ADMIN_MODERATION: handleModerateReport error:', err);
        safeSend(component, {
            type: 'actionError',
            payload: {
                reportId: payload && payload.reportId,
                error: err.message || 'Moderation action failed'
            }
        });
    }
}
