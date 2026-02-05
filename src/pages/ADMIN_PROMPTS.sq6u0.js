/**
 * ADMIN_PROMPTS Page Code
 * Bridges ADMIN_PROMPTS.html <-> promptLibraryService.jsw via postMessage
 *
 * Outbound (HTML -> Velo): getCategories, getPrompts, getPrompt, createPrompt,
 *   updatePrompt, deletePrompt, restorePrompt, rollbackPrompt, seedDefaults
 * Inbound (Velo -> HTML): categoriesLoaded, promptsLoaded, promptLoaded,
 *   promptCreated, promptUpdated, promptDeleted, promptRestored,
 *   promptRolledBack, seedComplete, actionError, init
 */

import {
    getPrompts,
    getPrompt,
    createPrompt,
    updatePrompt,
    deletePrompt,
    restorePrompt,
    rollbackPrompt,
    getCategories,
    seedDefaultPrompts
} from 'backend/promptLibraryService';

// ============================================
// CONSTANTS
// ============================================

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

// ============================================
// SAFE HELPERS
// ============================================

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('ADMIN_PROMPTS: safeSend failed:', err);
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
            // Element does not exist on this page, continue
        }
    }
    return null;
}

// ============================================
// PAGE READY
// ============================================

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('ADMIN_PROMPTS: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.action) return;
        await routeMessage(component, msg);
    });

    safeSend(component, { action: 'init' });
});

// ============================================
// MESSAGE ROUTER
// ============================================

async function routeMessage(component, msg) {
    switch (msg.action) {
        case 'getCategories':
            await handleGetCategories(component);
            break;
        case 'getPrompts':
            await handleGetPrompts(component);
            break;
        case 'getPrompt':
            await handleGetPrompt(component, msg.promptId);
            break;
        case 'createPrompt':
            await handleCreatePrompt(component, msg.promptData);
            break;
        case 'updatePrompt':
            await handleUpdatePrompt(component, msg.promptId, msg.updates, msg.changeNote);
            break;
        case 'deletePrompt':
            await handleDeletePrompt(component, msg.promptId);
            break;
        case 'restorePrompt':
            await handleRestorePrompt(component, msg.promptId);
            break;
        case 'rollbackPrompt':
            await handleRollbackPrompt(component, msg.promptId, msg.version);
            break;
        case 'seedDefaults':
            await handleSeedDefaults(component);
            break;
        default:
            console.warn('ADMIN_PROMPTS: Unknown action:', msg.action);
    }
}

// ============================================
// HANDLERS
// ============================================

async function handleGetCategories(component) {
    try {
        const categories = await getCategories();
        safeSend(component, { action: 'categoriesLoaded', payload: categories });
    } catch (err) {
        console.error('ADMIN_PROMPTS: getCategories failed:', err);
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to load categories' });
    }
}

async function handleGetPrompts(component) {
    try {
        const result = await getPrompts();
        safeSend(component, {
            action: 'promptsLoaded',
            payload: {
                items: result.items || [],
                categories: result.categories || []
            }
        });
    } catch (err) {
        console.error('ADMIN_PROMPTS: getPrompts failed:', err);
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to load prompts' });
    }
}

async function handleGetPrompt(component, promptId) {
    try {
        if (!promptId) {
            safeSend(component, { action: 'actionError', message: 'Missing prompt ID' });
            return;
        }
        const result = await getPrompt(promptId);
        safeSend(component, {
            action: 'promptLoaded',
            payload: {
                prompt: result.prompt,
                versions: result.versions || []
            }
        });
    } catch (err) {
        console.error('ADMIN_PROMPTS: getPrompt failed:', err);
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to load prompt' });
    }
}

async function handleCreatePrompt(component, promptData) {
    try {
        if (!promptData) {
            safeSend(component, { action: 'actionError', message: 'Missing prompt data' });
            return;
        }
        await createPrompt(promptData);
        safeSend(component, { action: 'promptCreated' });
    } catch (err) {
        console.error('ADMIN_PROMPTS: createPrompt failed:', err);
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to create prompt' });
    }
}

async function handleUpdatePrompt(component, promptId, updates, changeNote) {
    try {
        if (!promptId || !updates) {
            safeSend(component, { action: 'actionError', message: 'Missing prompt ID or updates' });
            return;
        }
        await updatePrompt(promptId, updates, changeNote || '');
        safeSend(component, { action: 'promptUpdated' });
    } catch (err) {
        console.error('ADMIN_PROMPTS: updatePrompt failed:', err);
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to update prompt' });
    }
}

async function handleDeletePrompt(component, promptId) {
    try {
        if (!promptId) {
            safeSend(component, { action: 'actionError', message: 'Missing prompt ID' });
            return;
        }
        await deletePrompt(promptId);
        safeSend(component, { action: 'promptDeleted' });
    } catch (err) {
        console.error('ADMIN_PROMPTS: deletePrompt failed:', err);
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to delete prompt' });
    }
}

async function handleRestorePrompt(component, promptId) {
    try {
        if (!promptId) {
            safeSend(component, { action: 'actionError', message: 'Missing prompt ID' });
            return;
        }
        await restorePrompt(promptId);
        safeSend(component, { action: 'promptRestored' });
    } catch (err) {
        console.error('ADMIN_PROMPTS: restorePrompt failed:', err);
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to restore prompt' });
    }
}

async function handleRollbackPrompt(component, promptId, version) {
    try {
        if (!promptId || version === undefined || version === null) {
            safeSend(component, { action: 'actionError', message: 'Missing prompt ID or version' });
            return;
        }
        await rollbackPrompt(promptId, version);
        safeSend(component, { action: 'promptRolledBack' });
    } catch (err) {
        console.error('ADMIN_PROMPTS: rollbackPrompt failed:', err);
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to rollback prompt' });
    }
}

async function handleSeedDefaults(component) {
    try {
        const result = await seedDefaultPrompts();
        safeSend(component, {
            action: 'seedComplete',
            payload: {
                created: result.created || 0,
                skipped: result.skipped || 0
            }
        });
    } catch (err) {
        console.error('ADMIN_PROMPTS: seedDefaults failed:', err);
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to seed defaults' });
    }
}
