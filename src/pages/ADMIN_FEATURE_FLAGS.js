import wixLocation from 'wix-location';
import {
    getAllFlags,
    getFlag,
    createFlag,
    updateFlag,
    deleteFlag,
    toggleFlag
} from 'backend/flagService.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();

    if (!components.length) {
        console.warn('ADMIN_FEATURE_FLAGS: No HTML component found');
        return;
    }

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send init signal so HTML requests its data
        safeSend(component, { action: 'init' });
    }
});

/**
 * Safely discover HTML components on the page.
 */
function getHtmlComponents() {
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {
            // Element does not exist on this page variant - skip
        }
    }
    return found;
}

/**
 * Route incoming messages from the HTML component to appropriate backend handlers.
 */
async function routeMessage(component, message) {
    if (!message?.action) return;

    const { action } = message;

    // Handle navigation
    if (action === 'navigateTo') {
        const destination = message.destination;
        if (destination) {
            wixLocation.to(`/${destination}`);
        }
        return;
    }

    try {
        switch (action) {
            case 'getAllFlags':
                await handleGetAllFlags(component, message.environment);
                break;

            case 'getFlag':
                await handleGetFlag(component, message.flagKey);
                break;

            case 'createFlag':
                await handleCreateFlag(component, message.flagData);
                break;

            case 'updateFlag':
                await handleUpdateFlag(component, message.flagKey, message.updates);
                break;

            case 'deleteFlag':
                await handleDeleteFlag(component, message.flagKey);
                break;

            case 'toggleFlag':
                await handleToggleFlag(component, message.flagKey, message.enabled);
                break;

            default:
                console.warn('ADMIN_FEATURE_FLAGS: Unknown action:', action);
        }
    } catch (error) {
        console.error('ADMIN_FEATURE_FLAGS: Error handling action', action, error);
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

async function handleGetAllFlags(component, environment) {
    const flags = await getAllFlags(environment || 'production');
    safeSend(component, { action: 'flagsLoaded', payload: flags });
}

async function handleGetFlag(component, flagKey) {
    const flag = await getFlag(flagKey);
    safeSend(component, { action: 'flagLoaded', payload: flag });
}

async function handleCreateFlag(component, flagData) {
    const result = await createFlag(flagData);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: `Flag '${flagData.key}' created` });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleUpdateFlag(component, flagKey, updates) {
    const result = await updateFlag(flagKey, updates);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: `Flag '${flagKey}' updated` });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleDeleteFlag(component, flagKey) {
    const result = await deleteFlag(flagKey);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: `Flag '${flagKey}' deleted` });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleToggleFlag(component, flagKey, enabled) {
    const result = await toggleFlag(flagKey, enabled);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: `Flag '${flagKey}' ${enabled ? 'enabled' : 'disabled'}` });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

// ============================================
// UTILITY
// ============================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        console.error('ADMIN_FEATURE_FLAGS: Failed to postMessage:', error);
    }
}
