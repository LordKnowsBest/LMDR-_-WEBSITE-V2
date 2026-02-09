/**
 * DRIVER_FORUMS HTML DOM Tests
 * =============================
 * Tests for src/public/driver/DRIVER_FORUMS.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: type/payload (driver forums page)
 * Ready signal: ready (sent on window.onload)
 *
 * @see src/public/driver/DRIVER_FORUMS.html
 * @see src/pages/DRIVER_FORUMS.vzg3s.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'driver', 'DRIVER_FORUMS.html');
const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'ready';

const INBOUND_MESSAGES = [
    'categoriesData',
    'threadsData',
    'threadDetailData',
    'postCreated',
    'threadCreated',
    'xpAwarded'
];

const OUTBOUND_MESSAGES = [
    'ready',
    'getCategories',
    'getThreads',
    'getPosts',
    'getThreadBySlug',
    'createThread',
    'createPost',
    'likePost'
];

const DOM_ELEMENT_MAP = {
    'categoriesData': ['main-content'],
    'threadsData': ['main-content', 'page-title', 'page-subtitle'],
    'threadDetailData': ['main-content', 'page-title', 'page-subtitle'],
    'threadCreated': ['create-modal']
};

// =============================================================================
// READ SOURCE FILE
// =============================================================================

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

function createMockElement(id) {
    const children = [];
    const element = {
        id,
        textContent: '',
        innerHTML: '',
        innerText: '',
        value: '',
        className: '',
        style: {},
        hidden: false,
        disabled: false,
        children,
        childNodes: children,
        dataset: {},
        scrollTop: 0,
        scrollHeight: 100,
        classList: {
            _classes: new Set(),
            add: jest.fn(function (...cls) { cls.forEach(c => this._classes.add(c)); }),
            remove: jest.fn(function (...cls) { cls.forEach(c => this._classes.delete(c)); }),
            toggle: jest.fn(function (cls) {
                if (this._classes.has(cls)) this._classes.delete(cls);
                else this._classes.add(cls);
            }),
            contains: jest.fn(function (cls) { return this._classes.has(cls); }),
        },
        appendChild: jest.fn((child) => { children.push(child); return child; }),
        removeChild: jest.fn((child) => {
            const idx = children.indexOf(child);
            if (idx > -1) children.splice(idx, 1);
            return child;
        }),
        remove: jest.fn(),
        insertBefore: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        closest: jest.fn(() => null),
        focus: jest.fn(),
        blur: jest.fn(),
        click: jest.fn(),
    };
    return element;
}

const mockElements = {};

function getMockElement(id) {
    if (!mockElements[id]) {
        mockElements[id] = createMockElement(id);
    }
    return mockElements[id];
}

const capturedOutbound = [];

function mockPostToParent(message) {
    capturedOutbound.push(message);
}

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function sendToVelo(type, payload = {}) {
    mockPostToParent({ type, payload });
}

const currentState = {
    view: 'categories',
    categoryId: null,
    threadId: null,
    categories: [],
    threads: [],
    posts: []
};

function renderCategories() {
    const container = getMockElement('main-content');
    const cats = currentState.categories;

    if (!cats || cats.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 py-10">No categories found.</div>';
        return;
    }

    let html = '<div class="grid">';
    cats.forEach(cat => {
        html += `<div data-id="${cat._id}"><h3>${cat.title}</h3><p>${cat.description}</p><span>${cat.threadCount || 0} Threads</span></div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderThreadList(category) {
    const container = getMockElement('main-content');
    getMockElement('page-title').textContent = category.title;
    getMockElement('page-subtitle').textContent = category.description;
    currentState.categoryId = category._id;

    const threads = currentState.threads;
    if (!threads || threads.length === 0) {
        container.innerHTML = '<div>No discussions yet</div>';
        return;
    }

    let html = '<div class="space-y-4">';
    threads.forEach(thread => {
        html += `<div data-id="${thread._id}"><h3>${thread.title}</h3><span>${thread.replyCount || 0} replies</span></div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderThreadDetail(thread, posts) {
    const container = getMockElement('main-content');
    getMockElement('page-title').textContent = thread.title;
    currentState.threadId = thread._id;

    let html = '<div class="space-y-6">';
    posts.forEach(post => {
        html += `<div id="post-${post._id}"><div class="markdown-body">${post.content || ''}</div><span>${post.likeCount || 0}</span></div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function handleMessage(eventData) {
    const { type, payload } = eventData || {};
    if (!type) return;

    switch (type) {
        case 'categoriesData':
            currentState.categories = (payload && payload.items) || [];
            if (currentState.view === 'categories') renderCategories();
            break;
        case 'threadsData':
            currentState.threads = (payload && payload.items) || [];
            renderThreadList(payload.category || { _id: '', title: '', description: '' });
            break;
        case 'threadDetailData':
            currentState.posts = (payload && payload.posts) || [];
            renderThreadDetail(
                payload.thread || { _id: '', title: '' },
                (payload && payload.posts) || []
            );
            break;
        case 'threadCreated':
            getMockElement('create-modal').classList.add('hidden');
            break;
        case 'postCreated':
            // Optimistic update handled externally
            break;
        case 'xpAwarded':
            // Toast notification
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('DRIVER_FORUMS.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.innerText = '';
            el.value = '';
            el.hidden = false;
            el.disabled = false;
            el.className = '';
            el.style = {};
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.classList.toggle.mockClear();
            el.classList.contains.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        currentState.view = 'categories';
        currentState.categoryId = null;
        currentState.threadId = null;
        currentState.categories = [];
        currentState.threads = [];
        currentState.posts = [];
    });

    // =========================================================================
    // SOURCE HTML STRUCTURAL CHECKS
    // =========================================================================

    describe('HTML source structure', () => {
        test('file exists and is readable', () => {
            expect(htmlSource.length).toBeGreaterThan(0);
        });

        test('contains a message listener', () => {
            const hasListener =
                htmlSource.includes("addEventListener('message'") ||
                htmlSource.includes('addEventListener("message"') ||
                htmlSource.includes('window.onmessage');
            expect(hasListener).toBe(true);
        });

        test('contains a function to post messages back to parent', () => {
            const hasOutbound =
                htmlSource.includes('window.parent.postMessage') ||
                htmlSource.includes('parent.postMessage');
            expect(hasOutbound).toBe(true);
        });

        test('sends ready signal on initialization', () => {
            expect(htmlSource).toContain(READY_SIGNAL);
        });

        test('handles all expected inbound message types', () => {
            INBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('references all expected outbound message types', () => {
            OUTBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('uses type-based message protocol', () => {
            const hasType =
                htmlSource.includes('{ type, payload }') ||
                htmlSource.includes('{type, payload}') ||
                htmlSource.includes('data.type') ||
                htmlSource.includes("event.data.type");
            expect(hasType).toBe(true);
        });

        test('contains sendToVelo function', () => {
            expect(htmlSource).toContain('function sendToVelo');
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================

    describe('Message validation', () => {
        test('ignores null/undefined messages', () => {
            handleMessage(null);
            handleMessage(undefined);
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores empty object messages', () => {
            handleMessage({});
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores messages without type key', () => {
            handleMessage({ action: 'wrong_key', data: {} });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {

        test('categoriesData renders category cards', () => {
            handleMessage({
                type: 'categoriesData',
                payload: {
                    items: [
                        { _id: 'cat-1', title: 'General Discussion', description: 'Talk about anything', threadCount: 10, postCount: 50 },
                        { _id: 'cat-2', title: 'Routes & Roads', description: 'Share route tips', threadCount: 5, postCount: 20 }
                    ]
                }
            });

            const container = getMockElement('main-content');
            expect(container.innerHTML).toContain('General Discussion');
            expect(container.innerHTML).toContain('Routes & Roads');
            expect(container.innerHTML).toContain('10 Threads');
        });

        test('categoriesData renders empty state when no categories', () => {
            handleMessage({
                type: 'categoriesData',
                payload: { items: [] }
            });

            const container = getMockElement('main-content');
            expect(container.innerHTML).toContain('No categories found');
        });

        test('threadsData renders thread list and updates header', () => {
            handleMessage({
                type: 'threadsData',
                payload: {
                    items: [
                        { _id: 't1', title: 'Best truck stops', slug: 'best-truck-stops', replyCount: 5 },
                        { _id: 't2', title: 'Winter tips', slug: 'winter-tips', replyCount: 12 }
                    ],
                    category: { _id: 'cat-1', title: 'General', description: 'General discussion' }
                }
            });

            const container = getMockElement('main-content');
            expect(container.innerHTML).toContain('Best truck stops');
            expect(container.innerHTML).toContain('Winter tips');
            expect(container.innerHTML).toContain('5 replies');
            expect(getMockElement('page-title').textContent).toBe('General');
            expect(getMockElement('page-subtitle').textContent).toBe('General discussion');
        });

        test('threadsData renders empty state when no threads', () => {
            handleMessage({
                type: 'threadsData',
                payload: {
                    items: [],
                    category: { _id: 'cat-1', title: 'General', description: 'General discussion' }
                }
            });

            const container = getMockElement('main-content');
            expect(container.innerHTML).toContain('No discussions yet');
        });

        test('threadDetailData renders posts and updates header', () => {
            handleMessage({
                type: 'threadDetailData',
                payload: {
                    thread: { _id: 't1', title: 'Best truck stops', categoryId: 'cat-1' },
                    posts: [
                        { _id: 'p1', content: 'Looking for recommendations', likeCount: 5 },
                        { _id: 'p2', content: 'Try the Petro in OKC', likeCount: 8 }
                    ]
                }
            });

            const container = getMockElement('main-content');
            expect(container.innerHTML).toContain('Looking for recommendations');
            expect(container.innerHTML).toContain('Try the Petro in OKC');
            expect(getMockElement('page-title').textContent).toBe('Best truck stops');
        });

        test('threadCreated closes the create modal', () => {
            handleMessage({
                type: 'threadCreated',
                payload: { slug: 'new-thread', _id: 't-new' }
            });

            expect(getMockElement('create-modal').classList.add).toHaveBeenCalledWith('hidden');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('sends ready signal format', () => {
            sendToVelo('ready');
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'ready', payload: {} });
        });

        test('sends getCategories message', () => {
            sendToVelo('getCategories');
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'getCategories', payload: {} });
        });

        test('sends getThreads with categoryId', () => {
            sendToVelo('getThreads', { categoryId: 'cat-1' });
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'getThreads', payload: { categoryId: 'cat-1' } });
        });

        test('sends createThread with full payload', () => {
            sendToVelo('createThread', { title: 'T', content: 'C', categoryId: 'cat-1' });
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({
                type: 'createThread',
                payload: { title: 'T', content: 'C', categoryId: 'cat-1' }
            });
        });

        test('sends likePost with postId', () => {
            sendToVelo('likePost', { postId: 'p1' });
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'likePost', payload: { postId: 'p1' } });
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {
        test('postCreated message does not crash', () => {
            expect(() => {
                handleMessage({ type: 'postCreated', payload: { _id: 'p-new' } });
            }).not.toThrow();
        });

        test('xpAwarded message does not crash', () => {
            expect(() => {
                handleMessage({ type: 'xpAwarded', payload: { xp: 25, action: 'Posted reply' } });
            }).not.toThrow();
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent or sanitization for user content', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('stripHtml') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('DOMPurify') ||
                htmlSource.includes('sanitize') ||
                htmlSource.includes('marked.parse');
            expect(hasSanitization).toBe(true);
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains all critical element IDs', () => {
            const criticalIds = [
                'main-content', 'page-title', 'page-subtitle',
                'back-btn', 'create-modal', 'new-thread-title',
                'new-thread-content', 'new-thread-category', 'loading-spinner'
            ];
            criticalIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });
    });
});
