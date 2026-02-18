import wixLocation from 'wix-location';
import {
    getArticle,
    createArticle,
    updateArticle,
    publishArticle,
    getCategories
} from 'backend/knowledgeBaseService.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();
    const query = wixLocation.query;
    const articleId = query.id;

    const [categories, articleResult] = await Promise.all([
        getCategories(),
        articleId ? getArticle(articleId) : Promise.resolve({ article: null })
    ]);

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        safeSend(component, { 
            action: 'init', 
            payload: { 
                article: articleResult.article,
                categories: categories.items
            } 
        });
    }
});

function getHtmlComponents() {
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') found.push(component);
        } catch (error) {}
    }
    return found;
}

async function routeMessage(component, message) {
    if (!message?.action) return;
    const { action } = message;

    try {
        switch (action) {
            case 'saveArticle':
                if (message.articleId) {
                    await updateArticle(message.articleId, message.articleData, message.summary);
                    safeSend(component, { action: 'actionSuccess', message: 'Article saved' });
                } else {
                    const res = await createArticle(message.articleData);
                    safeSend(component, { action: 'articleCreated', payload: res.record });
                }
                break;
            case 'publishArticle':
                await publishArticle(message.articleId);
                safeSend(component, { action: 'actionSuccess', message: 'Article published' });
                break;
        }
    } catch (error) {
        safeSend(component, { action: 'actionError', message: error.message });
    }
}

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {}
}
