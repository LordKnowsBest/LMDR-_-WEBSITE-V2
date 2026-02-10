/* eslint-disable */
/**
 * DRIVER_GAMIFICATION HTML DOM Tests
 * ====================================
 * Tests for src/public/driver/DRIVER_GAMIFICATION.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: type/data (driver gamification pages)
 * Ready signal: gamificationReady (sent on load)
 *
 * @see src/public/driver/DRIVER_GAMIFICATION.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'driver', 'DRIVER_GAMIFICATION.html');
const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'gamificationReady';

const INBOUND_MESSAGES = [
    'gamificationData',
    'progressionUpdate',
    'challengeUpdate',
    'achievementUnlocked',
    'levelUp',
    'streakUpdate',
    'xpAwarded',
    'challengeComplete',
    'error',
    'pong'
];

const OUTBOUND_MESSAGES = [
    'gamificationReady',
    'refreshGamification',
    'startChallenge',
    'claimReward',
    'viewChallenges',
    'viewAchievements',
    'navigateTo',
    'ping'
];

const DOM_ELEMENT_MAP = {
    'gamificationData': [
        'loading-state', 'main-content', 'level-icon', 'level-badge',
        'level-title', 'level-label', 'xp-current', 'xp-next', 'xp-fill',
        'streak-count', 'streak-icon', 'streak-container', 'streak-freezes',
        'multiplier-banner', 'multiplier-text', 'challenges-list',
        'achievements-grid', 'achievements-empty', 'recommendations-list'
    ],
    'progressionUpdate': ['level-icon', 'level-title', 'xp-current', 'xp-fill'],
    'challengeUpdate': ['challenges-list'],
    'challengeComplete': ['celebration-modal', 'celebration-title', 'celebration-message', 'celebration-reward'],
    'achievementUnlocked': ['celebration-modal'],
    'levelUp': ['celebration-modal'],
    'xpAwarded': ['toast-container'],
    'streakUpdate': ['streak-count', 'streak-freezes']
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
    progression: null,
    challenges: [],
    achievements: [],
    recommendations: []
};

const LEVEL_STYLES = {
    'Rookie': 'level-rookie',
    'Apprentice': 'level-apprentice',
    'Road Runner': 'level-apprentice',
    'Professional': 'level-professional',
    'Highway Pro': 'level-professional',
    'Expert': 'level-expert',
    'Expert Hauler': 'level-expert',
    'Master': 'level-master',
    'Master Driver': 'level-master',
    'Legend': 'level-legend',
    'Road Legend': 'level-legend'
};

const CHALLENGE_STYLES = {
    'daily': 'challenge-daily',
    'weekly': 'challenge-weekly',
    'monthly': 'challenge-monthly',
    'event': 'challenge-event',
    'one_time': 'challenge-monthly'
};

function stripHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderProgression() {
    if (!state.progression) return;

    const p = state.progression;
    const level = p.level || 1;
    const title = p.level_title || 'Rookie';
    const currentXP = p.current_xp || 0;
    const xpForNextLevel = p.xp_for_next_level || 500;
    const xpProgress = p.xp_progress_percent || 0;
    const streak = p.current_streak || 0;
    const freezes = p.streak_freezes || 0;
    const multiplier = p.streak_multiplier || 1;

    getMockElement('level-icon').textContent = level;
    const badge = getMockElement('level-badge');
    badge.className = `level-badge ${LEVEL_STYLES[title] || 'level-rookie'}`;
    getMockElement('level-title').textContent = title;
    getMockElement('level-label').textContent = `Level ${level}`;

    getMockElement('xp-current').textContent = `${currentXP.toLocaleString()} XP`;
    getMockElement('xp-next').textContent = `${xpForNextLevel.toLocaleString()} XP to Level ${level + 1}`;
    getMockElement('xp-fill').style.width = `${xpProgress}%`;

    getMockElement('streak-count').textContent = streak;
    const streakIcon = getMockElement('streak-icon');
    const streakContainer = getMockElement('streak-container');

    if (streak >= 7) {
        streakIcon.classList.add('streak-fire');
        streakContainer.classList.add('streak-active');
    } else {
        streakIcon.classList.remove('streak-fire');
        streakContainer.classList.remove('streak-active');
    }

    const freezesContainer = getMockElement('streak-freezes');
    freezesContainer.innerHTML = Array(3).fill(0).map((_, i) =>
        `<i class="fa-solid fa-snowflake text-xs ${i < freezes ? 'text-cyan-400' : 'text-slate-300'}"></i>`
    ).join('');

    const multiplierBanner = getMockElement('multiplier-banner');
    if (multiplier > 1) {
        multiplierBanner.classList.remove('hidden');
        getMockElement('multiplier-text').textContent = `${multiplier}x XP Multiplier Active!`;
    } else {
        multiplierBanner.classList.add('hidden');
    }
}

function renderChallenges() {
    const container = getMockElement('challenges-list');

    if (!state.challenges || state.challenges.length === 0) {
        container.innerHTML = '<div class="text-center">No active challenges</div>';
        return;
    }

    container.innerHTML = state.challenges.slice(0, 3).map(challenge => {
        const progress = challenge.progress || 0;
        const target = challenge.target || 1;
        const percent = Math.min((progress / target) * 100, 100);
        return `<div class="challenge-card" data-id="${challenge._id}">${stripHtml(challenge.title)} ${progress}/${target}</div>`;
    }).join('');
}

function renderAchievements() {
    const grid = getMockElement('achievements-grid');
    const empty = getMockElement('achievements-empty');

    if (!state.achievements || state.achievements.length === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    empty.classList.add('hidden');

    grid.innerHTML = state.achievements.slice(0, 8).map(a =>
        `<div class="achievement ${a.unlocked ? 'unlocked' : 'locked'}">${stripHtml(a.name)}</div>`
    ).join('');
}

function renderRecommendations() {
    const container = getMockElement('recommendations-list');
    const items = state.recommendations.length > 0 ? state.recommendations : [
        { icon: 'fa-user-pen', title: 'Complete your profile', description: 'Add your experience', action: 'profile', xp: 100 }
    ];
    container.innerHTML = items.slice(0, 3).map(item =>
        `<button data-action="${item.action}">${stripHtml(item.title)} +${item.xp} XP</button>`
    ).join('');
}

function handleGamificationData(data) {
    if (!data) return;

    state.progression = data.progression;
    state.challenges = data.challenges || [];
    state.achievements = data.achievements || [];
    state.recommendations = data.recommendations || [];

    getMockElement('loading-state').classList.add('hidden');
    getMockElement('main-content').classList.remove('hidden');

    renderProgression();
    renderChallenges();
    renderAchievements();
    renderRecommendations();
}

function updateProgression(data) {
    if (data) {
        state.progression = { ...state.progression, ...data };
        renderProgression();
    }
}

function updateChallenge(data) {
    if (!data || !data._id) return;
    const index = state.challenges.findIndex(c => c._id === data._id);
    if (index >= 0) {
        state.challenges[index] = { ...state.challenges[index], ...data };
    } else {
        state.challenges.unshift(data);
    }
    renderChallenges();
}

function updateStreak(data) {
    if (data) {
        state.progression = {
            ...state.progression,
            current_streak: data.streak,
            streak_freezes: data.freezes,
            streak_multiplier: data.multiplier
        };
        renderProgression();
    }
}

function showCelebration({ icon, iconBg, title, message, reward }) {
    const modal = getMockElement('celebration-modal');
    getMockElement('celebration-icon').innerHTML = icon;
    getMockElement('celebration-icon').className = `w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl ${iconBg}`;
    getMockElement('celebration-title').textContent = title;
    getMockElement('celebration-message').textContent = message;
    getMockElement('celebration-reward').textContent = reward;
    modal.classList.remove('hidden');
}

function showXPToast(data) {
    const container = getMockElement('toast-container');
    const toast = createMockElement('toast');
    toast.innerHTML = `<div>+${data.xp || 0} XP - ${stripHtml(data.reason || 'Action completed')}</div>`;
    container.appendChild(toast);
}

function handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (typeof msg.type !== 'string' || msg.type.length === 0) return;

    switch (msg.type) {
        case 'gamificationData':
            handleGamificationData(msg.data);
            break;
        case 'progressionUpdate':
            updateProgression(msg.data);
            break;
        case 'challengeUpdate':
            updateChallenge(msg.data);
            break;
        case 'achievementUnlocked':
            showCelebration({
                icon: `<i class="fa-solid ${msg.data?.icon || 'fa-trophy'} text-amber-500"></i>`,
                iconBg: 'bg-amber-100',
                title: 'Achievement Unlocked!',
                message: msg.data?.name || 'You earned a new achievement!',
                reward: `+${msg.data?.xp_reward || 50} XP`
            });
            break;
        case 'levelUp':
            showCelebration({
                icon: '<i class="fa-solid fa-arrow-up text-lmdr-blue"></i>',
                iconBg: 'bg-blue-100',
                title: `Level ${msg.data?.level}!`,
                message: `You are now a ${msg.data?.title || 'Road Runner'}!`,
                reward: msg.data?.unlocks ? `Unlocked: ${msg.data.unlocks}` : ''
            });
            break;
        case 'streakUpdate':
            updateStreak(msg.data);
            break;
        case 'xpAwarded':
            showXPToast(msg.data);
            break;
        case 'challengeComplete':
            showCelebration({
                icon: '<i class="fa-solid fa-check-circle text-green-500"></i>',
                iconBg: 'bg-green-100',
                title: 'Challenge Complete!',
                message: msg.data?.title || 'You completed a challenge!',
                reward: `+${msg.data?.xp_reward || 100} XP`
            });
            break;
        case 'error':
            // Logged, no DOM update
            break;
        case 'pong':
            // Connection verified, no DOM update
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('DRIVER_GAMIFICATION.html DOM Tests', () => {

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
        state.progression = null;
        state.challenges = [];
        state.achievements = [];
        state.recommendations = [];
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

        test('sends gamificationReady signal on initialization', () => {
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

        test('contains MESSAGE_REGISTRY with inbound and outbound arrays', () => {
            expect(htmlSource).toContain('MESSAGE_REGISTRY');
            expect(htmlSource).toContain('inbound');
            expect(htmlSource).toContain('outbound');
        });

        test('contains validateMessageSchema function', () => {
            expect(htmlSource).toContain('validateMessageSchema');
        });

        test('contains isValidOrigin function', () => {
            expect(htmlSource).toContain('isValidOrigin');
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
            handleMessage({ type: 123, data: {} });
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

        test('gamificationData hides loading and shows main content', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: { level: 5, level_title: 'Expert', current_xp: 2500, xp_for_next_level: 5000, xp_progress_percent: 50 },
                    challenges: [],
                    achievements: [],
                    recommendations: []
                }
            });

            expect(getMockElement('loading-state').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('main-content').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('gamificationData renders level and XP progression', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: {
                        level: 3,
                        level_title: 'Professional',
                        current_xp: 1500,
                        xp_for_next_level: 3000,
                        xp_progress_percent: 50,
                        current_streak: 5,
                        streak_freezes: 2,
                        streak_multiplier: 1.5
                    },
                    challenges: [],
                    achievements: [],
                    recommendations: []
                }
            });

            expect(getMockElement('level-icon').textContent).toBe(3);
            expect(getMockElement('level-title').textContent).toBe('Professional');
            expect(getMockElement('level-label').textContent).toBe('Level 3');
            expect(getMockElement('xp-current').textContent).toBe('1,500 XP');
            expect(getMockElement('xp-next').textContent).toBe('3,000 XP to Level 4');
            expect(getMockElement('xp-fill').style.width).toBe('50%');
        });

        test('gamificationData renders streak counter', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: {
                        level: 1,
                        current_streak: 10,
                        streak_freezes: 2,
                        streak_multiplier: 1.5
                    },
                    challenges: [],
                    achievements: [],
                    recommendations: []
                }
            });

            expect(getMockElement('streak-count').textContent).toBe(10);
            // Streak >= 7 should add fire effects
            expect(getMockElement('streak-icon').classList.add).toHaveBeenCalledWith('streak-fire');
            expect(getMockElement('streak-container').classList.add).toHaveBeenCalledWith('streak-active');
        });

        test('gamificationData does not add fire effects for low streak', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: {
                        level: 1,
                        current_streak: 3,
                        streak_freezes: 0,
                        streak_multiplier: 1
                    },
                    challenges: [],
                    achievements: [],
                    recommendations: []
                }
            });

            expect(getMockElement('streak-count').textContent).toBe(3);
            expect(getMockElement('streak-icon').classList.remove).toHaveBeenCalledWith('streak-fire');
            expect(getMockElement('streak-container').classList.remove).toHaveBeenCalledWith('streak-active');
        });

        test('gamificationData shows multiplier banner when multiplier > 1', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: {
                        level: 1,
                        streak_multiplier: 2
                    },
                    challenges: [],
                    achievements: [],
                    recommendations: []
                }
            });

            expect(getMockElement('multiplier-banner').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('multiplier-text').textContent).toBe('2x XP Multiplier Active!');
        });

        test('gamificationData hides multiplier banner when multiplier is 1', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: {
                        level: 1,
                        streak_multiplier: 1
                    },
                    challenges: [],
                    achievements: [],
                    recommendations: []
                }
            });

            expect(getMockElement('multiplier-banner').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('gamificationData renders challenges list', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: { level: 1 },
                    challenges: [
                        { _id: 'c1', title: 'Apply to 3 jobs', progress: 1, target: 3, type: 'daily', xp_reward: 50 },
                        { _id: 'c2', title: 'Complete profile', progress: 0, target: 1, type: 'weekly', xp_reward: 100 }
                    ],
                    achievements: [],
                    recommendations: []
                }
            });

            const list = getMockElement('challenges-list');
            expect(list.innerHTML).toContain('Apply to 3 jobs');
            expect(list.innerHTML).toContain('Complete profile');
            expect(list.innerHTML).toContain('1/3');
        });

        test('gamificationData shows empty state for no challenges', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: { level: 1 },
                    challenges: [],
                    achievements: [],
                    recommendations: []
                }
            });

            const list = getMockElement('challenges-list');
            expect(list.innerHTML).toContain('No active challenges');
        });

        test('gamificationData renders achievements grid', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: { level: 1 },
                    challenges: [],
                    achievements: [
                        { _id: 'a1', name: 'First Login', icon: 'fa-star', unlocked: true },
                        { _id: 'a2', name: 'Profile Master', icon: 'fa-user', unlocked: false }
                    ],
                    recommendations: []
                }
            });

            const grid = getMockElement('achievements-grid');
            expect(grid.classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('achievements-empty').classList.add).toHaveBeenCalledWith('hidden');
            expect(grid.innerHTML).toContain('First Login');
            expect(grid.innerHTML).toContain('Profile Master');
            expect(grid.innerHTML).toContain('unlocked');
            expect(grid.innerHTML).toContain('locked');
        });

        test('gamificationData shows empty achievements state', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: { level: 1 },
                    challenges: [],
                    achievements: [],
                    recommendations: []
                }
            });

            expect(getMockElement('achievements-grid').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('achievements-empty').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('gamificationData renders recommendations', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: { level: 1 },
                    challenges: [],
                    achievements: [],
                    recommendations: [
                        { icon: 'fa-briefcase', title: 'Apply to a job', description: 'Browse carriers', action: 'jobs', xp: 50 }
                    ]
                }
            });

            const container = getMockElement('recommendations-list');
            expect(container.innerHTML).toContain('Apply to a job');
            expect(container.innerHTML).toContain('+50 XP');
        });

        test('gamificationData renders default recommendations when none provided', () => {
            handleMessage({
                type: 'gamificationData',
                data: {
                    progression: { level: 1 },
                    challenges: [],
                    achievements: [],
                    recommendations: []
                }
            });

            const container = getMockElement('recommendations-list');
            expect(container.innerHTML).toContain('Complete your profile');
        });

        test('gamificationData gracefully handles null data', () => {
            handleMessage({ type: 'gamificationData', data: null });
            // Should not crash; loading state untouched
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });

        test('progressionUpdate updates progression without full reload', () => {
            // Set initial state
            state.progression = { level: 1, level_title: 'Rookie', current_xp: 100, xp_for_next_level: 500 };

            handleMessage({
                type: 'progressionUpdate',
                data: { level: 2, level_title: 'Apprentice', current_xp: 550, xp_for_next_level: 1000, xp_progress_percent: 55 }
            });

            expect(getMockElement('level-icon').textContent).toBe(2);
            expect(getMockElement('level-title').textContent).toBe('Apprentice');
            expect(getMockElement('xp-current').textContent).toBe('550 XP');
        });

        test('challengeUpdate adds new challenge to list', () => {
            state.challenges = [
                { _id: 'c1', title: 'Existing challenge', progress: 1, target: 5 }
            ];

            handleMessage({
                type: 'challengeUpdate',
                data: { _id: 'c2', title: 'New challenge', progress: 0, target: 3, type: 'daily', xp_reward: 50 }
            });

            expect(state.challenges).toHaveLength(2);
            const list = getMockElement('challenges-list');
            expect(list.innerHTML).toContain('New challenge');
        });

        test('challengeUpdate updates existing challenge', () => {
            state.challenges = [
                { _id: 'c1', title: 'Test challenge', progress: 1, target: 5 }
            ];

            handleMessage({
                type: 'challengeUpdate',
                data: { _id: 'c1', progress: 3 }
            });

            expect(state.challenges[0].progress).toBe(3);
            expect(state.challenges).toHaveLength(1);
        });

        test('streakUpdate updates streak display', () => {
            state.progression = { level: 1, current_streak: 3, streak_freezes: 0, streak_multiplier: 1 };

            handleMessage({
                type: 'streakUpdate',
                data: { streak: 8, freezes: 1, multiplier: 1.5 }
            });

            expect(getMockElement('streak-count').textContent).toBe(8);
            expect(getMockElement('streak-icon').classList.add).toHaveBeenCalledWith('streak-fire');
        });

        test('achievementUnlocked shows celebration modal', () => {
            handleMessage({
                type: 'achievementUnlocked',
                data: { name: 'First Match', icon: 'fa-handshake', xp_reward: 100 }
            });

            expect(getMockElement('celebration-modal').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('celebration-title').textContent).toBe('Achievement Unlocked!');
            expect(getMockElement('celebration-message').textContent).toBe('First Match');
            expect(getMockElement('celebration-reward').textContent).toBe('+100 XP');
        });

        test('levelUp shows celebration modal with level info', () => {
            handleMessage({
                type: 'levelUp',
                data: { level: 5, title: 'Expert', unlocks: 'Priority Matching' }
            });

            expect(getMockElement('celebration-modal').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('celebration-title').textContent).toBe('Level 5!');
            expect(getMockElement('celebration-message').textContent).toBe('You are now a Expert!');
            expect(getMockElement('celebration-reward').textContent).toBe('Unlocked: Priority Matching');
        });

        test('challengeComplete shows celebration modal', () => {
            handleMessage({
                type: 'challengeComplete',
                data: { title: 'Apply to 3 jobs', xp_reward: 75 }
            });

            expect(getMockElement('celebration-modal').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('celebration-title').textContent).toBe('Challenge Complete!');
            expect(getMockElement('celebration-message').textContent).toBe('Apply to 3 jobs');
            expect(getMockElement('celebration-reward').textContent).toBe('+75 XP');
        });

        test('xpAwarded shows toast notification', () => {
            handleMessage({
                type: 'xpAwarded',
                data: { xp: 25, reason: 'Daily login' }
            });

            const container = getMockElement('toast-container');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('+25 XP');
            expect(toast.innerHTML).toContain('Daily login');
        });

        test('xpAwarded uses default reason when none provided', () => {
            handleMessage({
                type: 'xpAwarded',
                data: { xp: 10 }
            });

            const container = getMockElement('toast-container');
            expect(container.appendChild).toHaveBeenCalled();
            const toast = container.appendChild.mock.calls[0][0];
            expect(toast.innerHTML).toContain('Action completed');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {

        test('sendToVelo sends gamificationReady format', () => {
            sendToVelo('gamificationReady');

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'gamificationReady', data: {} });
        });

        test('sendToVelo sends claimReward with challengeId', () => {
            sendToVelo('claimReward', { challengeId: 'c123' });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'claimReward', data: { challengeId: 'c123' } });
        });

        test('sendToVelo sends viewChallenges', () => {
            sendToVelo('viewChallenges');

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'viewChallenges', data: {} });
        });

        test('sendToVelo sends viewAchievements', () => {
            sendToVelo('viewAchievements');

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'viewAchievements', data: {} });
        });

        test('sendToVelo sends navigateTo with action', () => {
            sendToVelo('navigateTo', { action: 'profile' });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'navigateTo', data: { action: 'profile' } });
        });

        test('sendToVelo sends ping', () => {
            sendToVelo('ping');

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'ping', data: {} });
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {

        test('error message type does not crash', () => {
            expect(() => {
                handleMessage({ type: 'error', data: { message: 'Something went wrong' } });
            }).not.toThrow();
        });

        test('pong message type does not crash', () => {
            expect(() => {
                handleMessage({ type: 'pong', data: {} });
            }).not.toThrow();
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
                'loading-state', 'main-content', 'level-icon', 'level-badge',
                'level-title', 'level-label', 'xp-current', 'xp-next', 'xp-fill',
                'streak-count', 'streak-icon', 'streak-container', 'streak-freezes',
                'multiplier-banner', 'multiplier-text', 'challenges-list',
                'achievements-grid', 'achievements-empty', 'recommendations-list',
                'toast-container', 'celebration-modal', 'celebration-icon',
                'celebration-title', 'celebration-message', 'celebration-reward'
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
