/**
 * DRIVER_FORUMS Page Code
 * Bridges DRIVER_FORUMS.html with forumService.
 *
 * HTML uses type key with PAYLOAD pattern: { type, payload }
 * HTML sends: ready, getCategories, getThreads, getPosts, getThreadBySlug, createThread, createPost, likePost
 * HTML expects: categoriesData, threadsData, threadDetailData, threadCreated, postCreated, xpAwarded
 */

import {
    getCategories,
    getThreadsByCategory,
    getThreadBySlug,
    getPostsByThread,
    createThread,
    createPost,
    likePost
} from 'backend/forumService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('DRIVER_FORUMS: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('DRIVER_FORUMS: No HTML component found');
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
    const payload = msg.payload || {};

    switch (msg.type) {
        case 'ready':
        case 'getCategories':
            await handleGetCategories(component);
            break;
        case 'getThreads':
            await handleGetThreads(component, payload);
            break;
        case 'getPosts':
            await handleGetPosts(component, payload);
            break;
        case 'getThreadBySlug':
            await handleGetThreadBySlug(component, payload);
            break;
        case 'createThread':
            await handleCreateThread(component, payload);
            break;
        case 'createPost':
            await handleCreatePost(component, payload);
            break;
        case 'likePost':
            await handleLikePost(component, payload);
            break;
        default:
            console.warn('DRIVER_FORUMS: Unknown type:', msg.type);
    }
}

async function handleGetCategories(component) {
    try {
        const categories = await getCategories();
        safeSend(component, { type: 'categoriesData', payload: { items: categories || [] } });
    } catch (error) {
        console.error('DRIVER_FORUMS: getCategories error:', error);
        safeSend(component, { type: 'categoriesData', payload: { items: [] } });
    }
}

async function handleGetThreads(component, payload) {
    try {
        const { categoryId } = payload;
        if (!categoryId) return;
        const result = await getThreadsByCategory(categoryId);
        const threads = result.threads || result || [];
        const category = result.category || { _id: categoryId, title: '', description: '' };
        safeSend(component, {
            type: 'threadsData',
            payload: { items: threads, category }
        });
    } catch (error) {
        console.error('DRIVER_FORUMS: getThreads error:', error);
        safeSend(component, {
            type: 'threadsData',
            payload: { items: [], category: { _id: payload.categoryId } }
        });
    }
}

async function handleGetPosts(component, payload) {
    try {
        const { threadId } = payload;
        if (!threadId) return;
        const result = await getPostsByThread(threadId);
        const posts = result.posts || result || [];
        const thread = result.thread || { _id: threadId };
        safeSend(component, {
            type: 'threadDetailData',
            payload: { thread, posts }
        });
    } catch (error) {
        console.error('DRIVER_FORUMS: getPosts error:', error);
        safeSend(component, {
            type: 'threadDetailData',
            payload: { thread: { _id: payload.threadId }, posts: [] }
        });
    }
}

async function handleGetThreadBySlug(component, payload) {
    try {
        const { slug } = payload;
        if (!slug) return;
        const thread = await getThreadBySlug(slug);
        if (thread && thread._id) {
            const result = await getPostsByThread(thread._id);
            const posts = result.posts || result || [];
            safeSend(component, {
                type: 'threadDetailData',
                payload: { thread, posts }
            });
        }
    } catch (error) {
        console.error('DRIVER_FORUMS: getThreadBySlug error:', error);
    }
}

async function handleCreateThread(component, payload) {
    try {
        const { title, content, categoryId } = payload;
        if (!title || !content || !categoryId) return;
        const thread = await createThread({ title, content, categoryId });
        safeSend(component, {
            type: 'threadCreated',
            payload: { slug: thread.slug || thread._id, _id: thread._id }
        });
    } catch (error) {
        console.error('DRIVER_FORUMS: createThread error:', error);
    }
}

async function handleCreatePost(component, payload) {
    try {
        const { threadId, content } = payload;
        if (!threadId || !content) return;
        const post = await createPost({ threadId, content });
        safeSend(component, { type: 'postCreated', payload: post });
    } catch (error) {
        console.error('DRIVER_FORUMS: createPost error:', error);
    }
}

async function handleLikePost(component, payload) {
    try {
        const { postId } = payload;
        if (!postId) return;
        await likePost(postId);
    } catch (error) {
        console.error('DRIVER_FORUMS: likePost error:', error);
    }
}
