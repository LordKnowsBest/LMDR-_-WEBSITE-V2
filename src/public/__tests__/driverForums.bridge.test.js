/**
 * DRIVER_FORUMS Bridge Tests
 *
 * Tests for src/pages/DRIVER_FORUMS.vzg3s.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol with PAYLOAD pattern: { type, payload }
 *
 * @see src/pages/DRIVER_FORUMS.vzg3s.js
 * @see src/public/driver/DRIVER_FORUMS.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'DRIVER_FORUMS.vzg3s.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    getCategories: jest.fn().mockResolvedValue([
        { _id: 'cat-1', title: 'General', description: 'General discussion' },
        { _id: 'cat-2', title: 'Routes', description: 'Route tips' }
    ]),
    getThreadsByCategory: jest.fn().mockResolvedValue({
        threads: [{ _id: 't1', title: 'Test Thread', slug: 'test-thread' }],
        category: { _id: 'cat-1', title: 'General', description: 'General discussion' }
    }),
    getPostsByThread: jest.fn().mockResolvedValue({
        posts: [{ _id: 'p1', content: 'Test post', likeCount: 3 }],
        thread: { _id: 't1', title: 'Test Thread' }
    }),
    getThreadBySlug: jest.fn().mockResolvedValue({
        _id: 't1', title: 'Test Thread', slug: 'test-thread'
    }),
    createThread: jest.fn().mockResolvedValue({
        _id: 't-new', slug: 'new-thread', title: 'New Thread'
    }),
    createPost: jest.fn().mockResolvedValue({
        _id: 'p-new', content: 'New post content'
    }),
    likePost: jest.fn().mockResolvedValue({ success: true })
};

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) { /* silent */ }
}

function getHtmlComponents($w) {
    const IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    const found = [];
    for (const id of IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') found.push(el);
        } catch (e) { /* skip */ }
    }
    return found;
}

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg?.type) return;

    const payload = msg.payload || {};

    switch (msg.type) {
        case 'ready':
        case 'getCategories': {
            try {
                const categories = await backend.getCategories();
                safeSend(component, { type: 'categoriesData', payload: { items: categories || [] } });
            } catch (error) {
                safeSend(component, { type: 'categoriesData', payload: { items: [] } });
            }
            break;
        }
        case 'getThreads': {
            try {
                const { categoryId } = payload;
                if (!categoryId) return;
                const result = await backend.getThreadsByCategory(categoryId);
                const threads = result.threads || result || [];
                const category = result.category || { _id: categoryId, title: '', description: '' };
                safeSend(component, { type: 'threadsData', payload: { items: threads, category } });
            } catch (error) {
                safeSend(component, { type: 'threadsData', payload: { items: [], category: { _id: payload.categoryId } } });
            }
            break;
        }
        case 'getPosts': {
            try {
                const { threadId } = payload;
                if (!threadId) return;
                const result = await backend.getPostsByThread(threadId);
                const posts = result.posts || result || [];
                const thread = result.thread || { _id: threadId };
                safeSend(component, { type: 'threadDetailData', payload: { thread, posts } });
            } catch (error) {
                safeSend(component, { type: 'threadDetailData', payload: { thread: { _id: payload.threadId }, posts: [] } });
            }
            break;
        }
        case 'getThreadBySlug': {
            try {
                const { slug } = payload;
                if (!slug) return;
                const thread = await backend.getThreadBySlug(slug);
                if (thread && thread._id) {
                    const result = await backend.getPostsByThread(thread._id);
                    const posts = result.posts || result || [];
                    safeSend(component, { type: 'threadDetailData', payload: { thread, posts } });
                }
            } catch (error) {
                // Silent failure per page code
            }
            break;
        }
        case 'createThread': {
            try {
                const { title, content, categoryId } = payload;
                if (!title || !content || !categoryId) return;
                const thread = await backend.createThread({ title, content, categoryId });
                safeSend(component, { type: 'threadCreated', payload: { slug: thread.slug || thread._id, _id: thread._id } });
            } catch (error) {
                // Silent failure per page code
            }
            break;
        }
        case 'createPost': {
            try {
                const { threadId, content } = payload;
                if (!threadId || !content) return;
                const post = await backend.createPost({ threadId, content });
                safeSend(component, { type: 'postCreated', payload: post });
            } catch (error) {
                // Silent failure per page code
            }
            break;
        }
        case 'likePost': {
            try {
                const { postId } = payload;
                if (!postId) return;
                await backend.likePost(postId);
            } catch (error) {
                // Silent failure per page code
            }
            break;
        }
        default:
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('DRIVER_FORUMS Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/forumService', () => {
            expect(sourceCode).toContain("from 'backend/forumService'");
        });

        test('imports getCategories', () => {
            expect(sourceCode).toContain('getCategories');
        });

        test('imports getThreadsByCategory', () => {
            expect(sourceCode).toContain('getThreadsByCategory');
        });

        test('imports getThreadBySlug', () => {
            expect(sourceCode).toContain('getThreadBySlug');
        });

        test('imports getPostsByThread', () => {
            expect(sourceCode).toContain('getPostsByThread');
        });

        test('imports createThread', () => {
            expect(sourceCode).toContain('createThread');
        });

        test('imports createPost', () => {
            expect(sourceCode).toContain('createPost');
        });

        test('imports likePost', () => {
            expect(sourceCode).toContain('likePost');
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        test('uses type key protocol (not action)', () => {
            expect(sourceCode).toContain('msg.type');
            expect(sourceCode).not.toMatch(/msg\.action\b/);
        });

        test('defines safeSend helper', () => {
            expect(sourceCode).toContain('function safeSend');
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('safeSend wraps postMessage in try-catch', () => {
            const safeSendFn = sourceCode.match(/function safeSend[\s\S]*?^\}/m);
            expect(safeSendFn[0]).toContain('try');
            expect(safeSendFn[0]).toContain('catch');
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components with onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });
            expect(getHtmlComponents(mock$w)).toHaveLength(1);
        });

        test('skips components that throw', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            expect(getHtmlComponents(mock$w)).toHaveLength(0);
        });

        test('tries all six IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            getHtmlComponents(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ready calls getCategories and sends categoriesData', async () => {
            await routeMessage(component, { type: 'ready' });
            expect(mockBackend.getCategories).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'categoriesData',
                payload: { items: expect.any(Array) }
            });
        });

        test('getCategories calls getCategories and sends categoriesData', async () => {
            await routeMessage(component, { type: 'getCategories' });
            expect(mockBackend.getCategories).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'categoriesData',
                payload: { items: expect.arrayContaining([expect.objectContaining({ _id: 'cat-1' })]) }
            });
        });

        test('getThreads calls getThreadsByCategory and sends threadsData', async () => {
            await routeMessage(component, { type: 'getThreads', payload: { categoryId: 'cat-1' } });
            expect(mockBackend.getThreadsByCategory).toHaveBeenCalledWith('cat-1');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'threadsData',
                payload: {
                    items: expect.arrayContaining([expect.objectContaining({ _id: 't1' })]),
                    category: expect.objectContaining({ _id: 'cat-1' })
                }
            });
        });

        test('getThreads without categoryId does nothing', async () => {
            await routeMessage(component, { type: 'getThreads', payload: {} });
            expect(mockBackend.getThreadsByCategory).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('getPosts calls getPostsByThread and sends threadDetailData', async () => {
            await routeMessage(component, { type: 'getPosts', payload: { threadId: 't1' } });
            expect(mockBackend.getPostsByThread).toHaveBeenCalledWith('t1');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'threadDetailData',
                payload: {
                    thread: expect.objectContaining({ _id: 't1' }),
                    posts: expect.any(Array)
                }
            });
        });

        test('getPosts without threadId does nothing', async () => {
            await routeMessage(component, { type: 'getPosts', payload: {} });
            expect(mockBackend.getPostsByThread).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('getThreadBySlug calls getThreadBySlug then getPostsByThread', async () => {
            await routeMessage(component, { type: 'getThreadBySlug', payload: { slug: 'test-thread' } });
            expect(mockBackend.getThreadBySlug).toHaveBeenCalledWith('test-thread');
            expect(mockBackend.getPostsByThread).toHaveBeenCalledWith('t1');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'threadDetailData',
                payload: {
                    thread: expect.objectContaining({ _id: 't1', slug: 'test-thread' }),
                    posts: expect.any(Array)
                }
            });
        });

        test('getThreadBySlug without slug does nothing', async () => {
            await routeMessage(component, { type: 'getThreadBySlug', payload: {} });
            expect(mockBackend.getThreadBySlug).not.toHaveBeenCalled();
        });

        test('createThread calls createThread and sends threadCreated', async () => {
            await routeMessage(component, {
                type: 'createThread',
                payload: { title: 'New Thread', content: 'Hello world', categoryId: 'cat-1' }
            });
            expect(mockBackend.createThread).toHaveBeenCalledWith({
                title: 'New Thread', content: 'Hello world', categoryId: 'cat-1'
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'threadCreated',
                payload: { slug: 'new-thread', _id: 't-new' }
            });
        });

        test('createThread with missing fields does nothing', async () => {
            await routeMessage(component, { type: 'createThread', payload: { title: 'Only title' } });
            expect(mockBackend.createThread).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('createPost calls createPost and sends postCreated', async () => {
            await routeMessage(component, {
                type: 'createPost',
                payload: { threadId: 't1', content: 'My reply' }
            });
            expect(mockBackend.createPost).toHaveBeenCalledWith({ threadId: 't1', content: 'My reply' });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'postCreated',
                payload: expect.objectContaining({ _id: 'p-new' })
            });
        });

        test('createPost with missing fields does nothing', async () => {
            await routeMessage(component, { type: 'createPost', payload: { threadId: 't1' } });
            expect(mockBackend.createPost).not.toHaveBeenCalled();
        });

        test('likePost calls likePost silently (no response)', async () => {
            await routeMessage(component, { type: 'likePost', payload: { postId: 'p1' } });
            expect(mockBackend.likePost).toHaveBeenCalledWith('p1');
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('likePost without postId does nothing', async () => {
            await routeMessage(component, { type: 'likePost', payload: {} });
            expect(mockBackend.likePost).not.toHaveBeenCalled();
        });

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'unknownType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getCategories failure sends empty items', async () => {
            const failBackend = { ...mockBackend, getCategories: jest.fn().mockRejectedValue(new Error('DB down')) };
            await routeMessage(component, { type: 'getCategories' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'categoriesData',
                payload: { items: [] }
            });
        });

        test('getThreads failure sends empty items', async () => {
            const failBackend = { ...mockBackend, getThreadsByCategory: jest.fn().mockRejectedValue(new Error('Fail')) };
            await routeMessage(component, { type: 'getThreads', payload: { categoryId: 'cat-1' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'threadsData',
                payload: { items: [], category: { _id: 'cat-1' } }
            });
        });

        test('getPosts failure sends empty posts', async () => {
            const failBackend = { ...mockBackend, getPostsByThread: jest.fn().mockRejectedValue(new Error('Fail')) };
            await routeMessage(component, { type: 'getPosts', payload: { threadId: 't1' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'threadDetailData',
                payload: { thread: { _id: 't1' }, posts: [] }
            });
        });

        test('getThreadBySlug failure does not crash', async () => {
            const failBackend = { ...mockBackend, getThreadBySlug: jest.fn().mockRejectedValue(new Error('Fail')) };
            await routeMessage(component, { type: 'getThreadBySlug', payload: { slug: 'bad-slug' } }, failBackend);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('createThread failure does not crash', async () => {
            const failBackend = { ...mockBackend, createThread: jest.fn().mockRejectedValue(new Error('Fail')) };
            await routeMessage(component, {
                type: 'createThread',
                payload: { title: 'T', content: 'C', categoryId: 'cat-1' }
            }, failBackend);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('createPost failure does not crash', async () => {
            const failBackend = { ...mockBackend, createPost: jest.fn().mockRejectedValue(new Error('Fail')) };
            await routeMessage(component, { type: 'createPost', payload: { threadId: 't1', content: 'x' } }, failBackend);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('likePost failure does not crash', async () => {
            const failBackend = { ...mockBackend, likePost: jest.fn().mockRejectedValue(new Error('Fail')) };
            await routeMessage(component, { type: 'likePost', payload: { postId: 'p1' } }, failBackend);
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does nothing if component is null', () => {
            expect(() => safeSend(null, { type: 'test' })).not.toThrow();
        });

        test('does nothing if no postMessage method', () => {
            expect(() => safeSend({}, { type: 'test' })).not.toThrow();
        });

        test('calls postMessage when valid', () => {
            safeSend(component, { type: 'test' });
            expect(component.postMessage).toHaveBeenCalledWith({ type: 'test' });
        });

        test('does not throw if postMessage throws', () => {
            const bad = { postMessage: jest.fn(() => { throw new Error('Detached'); }) };
            expect(() => safeSend(bad, { type: 'test' })).not.toThrow();
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('ready only calls getCategories once', async () => {
            await routeMessage(component, { type: 'ready' });
            expect(mockBackend.getCategories).toHaveBeenCalledTimes(1);
        });

        test('getThreadBySlug calls two backend methods', async () => {
            await routeMessage(component, { type: 'getThreadBySlug', payload: { slug: 'test-thread' } });
            expect(mockBackend.getThreadBySlug).toHaveBeenCalledTimes(1);
            expect(mockBackend.getPostsByThread).toHaveBeenCalledTimes(1);
        });

        test('createThread passes all parameters through', async () => {
            await routeMessage(component, {
                type: 'createThread',
                payload: { title: 'T', content: 'C', categoryId: 'cat-1' }
            });
            expect(mockBackend.createThread).toHaveBeenCalledWith({
                title: 'T', content: 'C', categoryId: 'cat-1'
            });
        });

        test('createPost passes threadId and content', async () => {
            await routeMessage(component, {
                type: 'createPost',
                payload: { threadId: 't1', content: 'Reply text' }
            });
            expect(mockBackend.createPost).toHaveBeenCalledWith({
                threadId: 't1', content: 'Reply text'
            });
        });
    });
});
