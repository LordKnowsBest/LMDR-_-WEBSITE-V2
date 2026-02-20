import wixLocation from 'wix-location';
import {
    getArticle,
    createArticle,
    updateArticle,
    publishArticle,
    archiveArticle,
    getCategories,
    searchArticles,
    reorderCategories,
    getPopularArticles,
    getRelatedArticles,
    getArticleAnalytics,
    getArticleVersions,
    revertToVersion
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
            case 'searchArticles':
                await handleSearchArticles(component, message.query || '', message.filters || {});
                break;
            case 'reorderCategories':
                await handleReorderCategories(component, message.orderedIds || []);
                break;
            case 'getPopularArticles':
                await handleGetPopularArticles(component, message.limit || 10);
                break;
            case 'getRelatedArticles':
                await handleGetRelatedArticles(component, message.articleId, message.limit || 5);
                break;
            case 'getArticleAnalytics':
                await handleGetArticleAnalytics(component, message.articleId);
                break;
            case 'getArticleVersions':
                await handleGetArticleVersions(component, message.articleId);
                break;
            case 'revertToVersion':
                await handleRevertToVersion(component, message.articleId, message.versionNumber);
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

async function handleSearchArticles(component, query, filters) {
    const result = await searchArticles(query, filters);
    safeSend(component, { action: 'articlesSearched', payload: result.items || [] });
}

async function handleReorderCategories(component, orderedIds) {
    const result = await reorderCategories(orderedIds);
    if (result.success) {
        safeSend(component, { action: 'categoriesReordered', payload: result });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleGetPopularArticles(component, limit) {
    const result = await getPopularArticles(limit);
    safeSend(component, { action: 'popularArticlesLoaded', payload: result.items || [] });
}

async function handleGetRelatedArticles(component, articleId, limit) {
    const result = await getRelatedArticles(articleId, limit);
    safeSend(component, { action: 'relatedArticlesLoaded', payload: result.items || [] });
}

async function handleGetArticleAnalytics(component, articleId) {
    const result = await getArticleAnalytics(articleId);
    safeSend(component, { action: 'articleAnalyticsLoaded', payload: result });
}

async function handleGetArticleVersions(component, articleId) {
    const result = await getArticleVersions(articleId);
    safeSend(component, { action: 'articleVersionsLoaded', payload: result.items || [] });
}

async function handleRevertToVersion(component, articleId, versionNumber) {
    const result = await revertToVersion(articleId, versionNumber);
    if (result.success) {
        safeSend(component, { action: 'articleReverted', payload: result.record || result });
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
        console.error('ADMIN_KB: Failed to postMessage:', error);
    }
}
