import wixLocation from 'wix-location';
import {
    getArticle,
    createArticle,
    updateArticle,
    publishArticle,
    archiveArticle,
    getCategories
} from 'backend/knowledgeBaseService.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();

    if (!components.length) {
        console.warn('ADMIN_KB: No HTML component found');
        return;
    }

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send init signal
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
            // skip
        }
    }
    return found;
}

/**
 * Route incoming messages
 */
async function routeMessage(component, message) {
    if (!message?.action) return;

    const { action } = message;

    if (action === 'navigateTo') {
        if (message.destination) wixLocation.to(`/${message.destination}`);
        return;
    }

    try {
        switch (action) {
            case 'getArticle':
                await handleGetArticle(component, message.articleId);
                break;

            case 'createArticle':
                await handleCreateArticle(component, message.articleData);
                break;

            case 'updateArticle':
                await handleUpdateArticle(component, message.articleId, message.updates, message.changeSummary);
                break;

            case 'publishArticle':
                await handlePublishArticle(component, message.articleId);
                break;

            case 'archiveArticle':
                await handleArchiveArticle(component, message.articleId);
                break;

            case 'getCategories':
                await handleGetCategories(component);
                break;

            default:
                console.warn('ADMIN_KB: Unknown action:', action);
        }
    } catch (error) {
        console.error('ADMIN_KB: Error handling action', action, error);
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

async function handleGetArticle(component, articleId) {
    const result = await getArticle(articleId);
    safeSend(component, { action: 'articleLoaded', payload: result.article });
}

async function handleCreateArticle(component, articleData) {
    const result = await createArticle(articleData);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: 'Article created successfully' });
        safeSend(component, { action: 'articleCreated', payload: result.record });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleUpdateArticle(component, articleId, updates, changeSummary) {
    const result = await updateArticle(articleId, updates, changeSummary);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: 'Article updated successfully' });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handlePublishArticle(component, articleId) {
    const result = await publishArticle(articleId);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: 'Article published' });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleArchiveArticle(component, articleId) {
    const result = await archiveArticle(articleId);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: 'Article archived' });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleGetCategories(component) {
    const result = await getCategories();
    safeSend(component, { action: 'categoriesLoaded', payload: result.items });
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
        console.error('ADMIN_KB: Failed to postMessage:', error);
    }
}
