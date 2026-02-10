/* eslint-disable */
/**
 * DRIVER_BADGES HTML DOM Tests
 * ==============================
 * Tests for src/public/driver/DRIVER_BADGES.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: type/data (driver badges page)
 * Ready signal: badgesReady (sent on load)
 *
 * @see src/public/driver/DRIVER_BADGES.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'driver', 'DRIVER_BADGES.html');
const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'badgesReady';

const INBOUND_MESSAGES = [
    'achievementsData',
    'featuredUpdated',
    'error'
];

const OUTBOUND_MESSAGES = [
    'badgesReady',
    'updateFeatured'
];

const DOM_ELEMENT_MAP = {
    'achievementsData': [
        'loading-state', 'unlocked-count', 'total-count',
        'featured-badges', 'achievements-grid', 'empty-state'
    ],
    'featuredUpdated': ['featured-badges']
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
        querySelector: jest.fn(() => createMockElement('sub')),
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
// REPLICATED CORE LOGIC (mirrors HTML script logic for type/data protocol)
// =============================================================================

function sendToVelo(type, data = {}) {
    mockPostToParent({ type, data });
}

const state = {
    achievements: [],
    featuredIds: [],
    currentCategory: 'all',
    selectedAchievement: null
};

const CATEGORY_STYLES = {
    'profile': 'cat-profile',
    'activity': 'cat-activity',
    'milestone': 'cat-milestone',
    'community': 'cat-community',
    'streak': 'cat-streak'
};

function stripHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderFeatured() {
    const container = getMockElement('featured-badges');
    const featuredAchievements = state.achievements.filter(
        a => state.featuredIds.includes(a._id) && a.unlocked
    );

    let html = '';
    for (let i = 0; i < 3; i++) {
        const achievement = featuredAchievements[i];
        if (achievement) {
            html += `<div class="featured-badge" data-id="${achievement._id}"><i class="fa-solid ${achievement.icon || 'fa-trophy'}"></i></div>`;
        } else {
            html += '<div class="featured-slot-empty"><i class="fa-solid fa-plus"></i></div>';
        }
    }

    container.innerHTML = html;
}

function renderAchievements() {
    const grid = getMockElement('achievements-grid');
    const empty = getMockElement('empty-state');

    let filtered = state.achievements;
    if (state.currentCategory !== 'all') {
        filtered = state.achievements.filter(a => a.category === state.currentCategory);
    }

    // Sort: unlocked first, then by name
    filtered.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return (a.name || '').localeCompare(b.name || '');
    });

    if (filtered.length === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    empty.classList.add('hidden');

    grid.innerHTML = filtered.map(achievement => {
        const isUnlocked = achievement.unlocked;
        const isFeatured = state.featuredIds.includes(achievement._id);
        const catStyle = CATEGORY_STYLES[achievement.category] || 'cat-profile';

        let progressHtml = '';
        if (!isUnlocked && achievement.progress !== undefined && achievement.target) {
            const percent = Math.min((achievement.progress / achievement.target) * 100, 100);
            progressHtml = `<div class="progress">${achievement.progress}/${achievement.target}</div>`;
        }

        return `<div class="badge-card ${isUnlocked ? '' : 'locked'} ${isFeatured ? 'featured' : ''}">${stripHtml(achievement.name)}${progressHtml}</div>`;
    }).join('');
}

function handleAchievementsData(data) {
    if (!data) return;

    state.achievements = data.achievements || [];
    state.featuredIds = data.featured || [];

    const unlocked = state.achievements.filter(a => a.unlocked).length;
    getMockElement('unlocked-count').textContent = unlocked;
    getMockElement('total-count').textContent = state.achievements.length;

    getMockElement('loading-state').classList.add('hidden');

    renderFeatured();
    renderAchievements();
}

function handleFeaturedUpdated(data) {
    if (data && data.featured) {
        state.featuredIds = data.featured;
        renderFeatured();
    }
    getMockElement('edit-featured-modal').classList.add('hidden');
}

function handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (typeof msg.type !== 'string' || msg.type.length === 0) return;

    switch (msg.type) {
        case 'achievementsData':
            handleAchievementsData(msg.data);
            break;
        case 'featuredUpdated':
            handleFeaturedUpdated(msg.data);
            break;
        case 'error':
            // Logged, no DOM update
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('DRIVER_BADGES.html DOM Tests', () => {

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
        state.achievements = [];
        state.featuredIds = [];
        state.currentCategory = 'all';
        state.selectedAchievement = null;
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

        test('sends badgesReady signal on initialization', () => {
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
                htmlSource.includes('.type') ||
                htmlSource.includes("msg.type");
            expect(hasType).toBe(true);
        });

        test('contains validateMessageSchema function', () => {
            expect(htmlSource).toContain('validateMessageSchema');
        });

        test('contains isValidOrigin function', () => {
            expect(htmlSource).toContain('isValidOrigin');
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
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });

        test('ignores empty object messages', () => {
            handleMessage({});
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });

        test('ignores messages without type key', () => {
            handleMessage({ action: 'wrong_key', data: {} });
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });

        test('ignores messages with non-string type', () => {
            handleMessage({ type: 42, data: {} });
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });

        test('ignores messages with empty type string', () => {
            handleMessage({ type: '', data: {} });
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // DOM RENDERING
    // =========================================================================

    describe('DOM rendering', () => {

        test('achievementsData hides loading state', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [
                        { _id: 'a1', name: 'First Login', icon: 'fa-star', unlocked: true, category: 'activity' }
                    ],
                    featured: []
                }
            });

            expect(getMockElement('loading-state').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('achievementsData updates unlocked and total counts', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [
                        { _id: 'a1', name: 'First Login', unlocked: true, category: 'activity' },
                        { _id: 'a2', name: 'Profile Complete', unlocked: true, category: 'profile' },
                        { _id: 'a3', name: 'Speed Demon', unlocked: false, category: 'milestone' }
                    ],
                    featured: []
                }
            });

            expect(getMockElement('unlocked-count').textContent).toBe(2);
            expect(getMockElement('total-count').textContent).toBe(3);
        });

        test('achievementsData renders badges grid', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [
                        { _id: 'a1', name: 'First Login', icon: 'fa-star', unlocked: true, category: 'activity' },
                        { _id: 'a2', name: 'Road Warrior', icon: 'fa-road', unlocked: false, category: 'milestone', progress: 5, target: 10 }
                    ],
                    featured: []
                }
            });

            const grid = getMockElement('achievements-grid');
            expect(grid.classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('empty-state').classList.add).toHaveBeenCalledWith('hidden');
            expect(grid.innerHTML).toContain('First Login');
            expect(grid.innerHTML).toContain('Road Warrior');
        });

        test('achievementsData shows empty state when no achievements', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [],
                    featured: []
                }
            });

            expect(getMockElement('achievements-grid').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('empty-state').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('achievementsData renders featured badges', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [
                        { _id: 'a1', name: 'First Login', icon: 'fa-star', unlocked: true, category: 'activity' },
                        { _id: 'a2', name: 'Profile Master', icon: 'fa-user', unlocked: true, category: 'profile' },
                        { _id: 'a3', name: 'Locked Badge', icon: 'fa-lock', unlocked: false, category: 'streak' }
                    ],
                    featured: ['a1', 'a2']
                }
            });

            const container = getMockElement('featured-badges');
            expect(container.innerHTML).toContain('featured-badge');
            expect(container.innerHTML).toContain('fa-star');
            expect(container.innerHTML).toContain('fa-user');
        });

        test('achievementsData renders 3 featured slots (empty slots for missing)', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [
                        { _id: 'a1', name: 'First Login', icon: 'fa-star', unlocked: true, category: 'activity' }
                    ],
                    featured: ['a1']
                }
            });

            const container = getMockElement('featured-badges');
            // Should have 1 featured badge + 2 empty slots
            expect(container.innerHTML).toContain('featured-badge');
            expect(container.innerHTML).toContain('featured-slot-empty');
        });

        test('achievementsData does not feature locked achievements', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [
                        { _id: 'a1', name: 'Locked Badge', icon: 'fa-lock', unlocked: false, category: 'activity' }
                    ],
                    featured: ['a1']
                }
            });

            const container = getMockElement('featured-badges');
            // Locked badge should not render as featured, only empty slots
            expect(container.innerHTML).not.toContain('featured-badge');
        });

        test('achievementsData marks featured badges in grid', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [
                        { _id: 'a1', name: 'Featured One', icon: 'fa-star', unlocked: true, category: 'activity' },
                        { _id: 'a2', name: 'Not Featured', icon: 'fa-user', unlocked: true, category: 'profile' }
                    ],
                    featured: ['a1']
                }
            });

            const grid = getMockElement('achievements-grid');
            expect(grid.innerHTML).toContain('featured');
        });

        test('achievementsData shows progress for locked badges', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [
                        { _id: 'a1', name: 'Road Warrior', icon: 'fa-road', unlocked: false, category: 'milestone', progress: 3, target: 10 }
                    ],
                    featured: []
                }
            });

            const grid = getMockElement('achievements-grid');
            expect(grid.innerHTML).toContain('3/10');
        });

        test('achievementsData sorts unlocked before locked', () => {
            handleMessage({
                type: 'achievementsData',
                data: {
                    achievements: [
                        { _id: 'a1', name: 'Zebra Badge', unlocked: false, category: 'activity' },
                        { _id: 'a2', name: 'Alpha Badge', unlocked: true, category: 'activity' }
                    ],
                    featured: []
                }
            });

            const grid = getMockElement('achievements-grid');
            const alphaIndex = grid.innerHTML.indexOf('Alpha Badge');
            const zebraIndex = grid.innerHTML.indexOf('Zebra Badge');
            expect(alphaIndex).toBeLessThan(zebraIndex);
        });

        test('achievementsData gracefully handles null data', () => {
            handleMessage({ type: 'achievementsData', data: null });
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });

        test('featuredUpdated updates featured badges display', () => {
            state.achievements = [
                { _id: 'a1', name: 'Badge A', icon: 'fa-star', unlocked: true, category: 'activity' },
                { _id: 'a2', name: 'Badge B', icon: 'fa-bolt', unlocked: true, category: 'streak' }
            ];
            state.featuredIds = ['a1'];

            handleMessage({
                type: 'featuredUpdated',
                data: { featured: ['a1', 'a2'] }
            });

            expect(state.featuredIds).toEqual(['a1', 'a2']);
            const container = getMockElement('featured-badges');
            expect(container.innerHTML).toContain('fa-star');
            expect(container.innerHTML).toContain('fa-bolt');
        });

        test('featuredUpdated closes edit modal', () => {
            handleMessage({
                type: 'featuredUpdated',
                data: { featured: ['a1'] }
            });

            expect(getMockElement('edit-featured-modal').classList.add).toHaveBeenCalledWith('hidden');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {

        test('sendToVelo sends badgesReady format', () => {
            sendToVelo('badgesReady');

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'badgesReady', data: {} });
        });

        test('sendToVelo sends updateFeatured with featured IDs', () => {
            sendToVelo('updateFeatured', { featured: ['a1', 'a2', 'a3'] });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({
                type: 'updateFeatured',
                data: { featured: ['a1', 'a2', 'a3'] }
            });
        });

        test('sendToVelo sends correct type/data envelope', () => {
            sendToVelo('updateFeatured', { featured: ['a1'] });

            const msg = capturedOutbound[0];
            expect(msg).toHaveProperty('type');
            expect(msg).toHaveProperty('data');
            expect(typeof msg.type).toBe('string');
            expect(typeof msg.data).toBe('object');
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {

        test('error message type does not crash', () => {
            expect(() => {
                handleMessage({ type: 'error', data: { message: 'Failed to load badges' } });
            }).not.toThrow();
        });

        test('error does not modify DOM elements', () => {
            handleMessage({ type: 'error', data: { message: 'Server error' } });
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
            expect(getMockElement('achievements-grid').innerHTML).toBe('');
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent or stripHtml for user content', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('stripHtml') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('DOMPurify') ||
                htmlSource.includes('sanitize');
            expect(hasSanitization).toBe(true);
        });

        test('source contains stripHtml function', () => {
            expect(htmlSource).toContain('function stripHtml');
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains all critical element IDs', () => {
            const criticalIds = [
                'loading-state', 'unlocked-count', 'total-count',
                'featured-badges', 'achievements-grid', 'empty-state',
                'detail-modal', 'detail-icon', 'detail-title', 'detail-description',
                'detail-category', 'detail-reward', 'detail-feature-btn',
                'detail-progress-section', 'detail-progress-text', 'detail-progress-bar',
                'detail-unlock-section', 'detail-unlock-date',
                'edit-featured-modal', 'edit-featured-grid', 'selected-count',
                'edit-featured-btn'
            ];
            criticalIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });
    });

    // =========================================================================
    // CATEGORY FILTERING
    // =========================================================================

    describe('Category filtering', () => {
        test('category tabs exist in HTML source', () => {
            expect(htmlSource).toContain('setCategory');
            expect(htmlSource).toContain("data-cat=");
        });

        test('filtering by category hides non-matching achievements', () => {
            state.achievements = [
                { _id: 'a1', name: 'Profile Badge', unlocked: true, category: 'profile' },
                { _id: 'a2', name: 'Activity Badge', unlocked: true, category: 'activity' }
            ];
            state.currentCategory = 'profile';

            renderAchievements();

            const grid = getMockElement('achievements-grid');
            expect(grid.innerHTML).toContain('Profile Badge');
            expect(grid.innerHTML).not.toContain('Activity Badge');
        });

        test('filtering with all category shows everything', () => {
            state.achievements = [
                { _id: 'a1', name: 'Profile Badge', unlocked: true, category: 'profile' },
                { _id: 'a2', name: 'Activity Badge', unlocked: true, category: 'activity' }
            ];
            state.currentCategory = 'all';

            renderAchievements();

            const grid = getMockElement('achievements-grid');
            expect(grid.innerHTML).toContain('Profile Badge');
            expect(grid.innerHTML).toContain('Activity Badge');
        });
    });
});
