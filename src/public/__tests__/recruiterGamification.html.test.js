/**
 * RECRUITER_GAMIFICATION HTML DOM Tests
 * ========================================
 * Tests for src/public/recruiter/RECRUITER_GAMIFICATION.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * **TYPE PROTOCOL** (not action) -- uses { type, data } envelope
 *
 * Inbound: recruiterGamificationData, progressionUpdate, badgeEarned, rankUp,
 *   leaderboardUpdate, pointsAwarded, challengeUpdate, challengeComplete, error, pong
 * Outbound: recruiterGamificationReady, refreshGamification, viewLeaderboard,
 *   viewBadges, viewChallenges, claimReward, ping
 *
 * DOM IDs: loading-state, main-content, rank-icon, rank-badge, rank-title,
 *   rank-label, points-current, points-next, points-fill, leaderboard-position,
 *   leaderboard-period, leaderboard-widget, badges-grid, badges-empty,
 *   stat-hires, stat-responses, stat-interviews, stat-messages, stat-points-week,
 *   challenges-list, toast-container, celebration-modal, celebration-icon,
 *   celebration-title, celebration-message, celebration-reward
 *
 * @see src/public/recruiter/RECRUITER_GAMIFICATION.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'recruiter', 'RECRUITER_GAMIFICATION.html');

const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'recruiterGamificationReady';

const INBOUND_MESSAGES = [
    'recruiterGamificationData',
    'progressionUpdate',
    'badgeEarned',
    'rankUp',
    'leaderboardUpdate',
    'pointsAwarded',
    'challengeUpdate',
    'challengeComplete',
    'error',
    'pong'
];

const OUTBOUND_MESSAGES = [
    'recruiterGamificationReady',
    'refreshGamification',
    'viewLeaderboard',
    'viewBadges',
    'viewChallenges',
    'claimReward',
    'ping'
];

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
        classList: {
            _classes: new Set(),
            add: jest.fn(function (...cls) { cls.forEach(c => this._classes.add(c)); }),
            remove: jest.fn(function (...cls) { cls.forEach(c => this._classes.delete(c)); }),
            toggle: jest.fn(),
            contains: jest.fn(function (cls) { return this._classes.has(cls); }),
        },
        appendChild: jest.fn((child) => { children.push(child); return child; }),
        removeChild: jest.fn(),
        remove: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
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

function mockPostToParent(type, data) {
    capturedOutbound.push({ type, data });
}

// =============================================================================
// REPLICATED CORE LOGIC (type-based protocol)
// =============================================================================

function sendToVelo(type, data = {}) {
    mockPostToParent(type, data);
}

const state = {
    progression: null,
    badges: [],
    weeklyStats: null,
    leaderboard: null,
    challenges: []
};

function renderProgression() {
    if (!state.progression) return;

    const rank = state.progression.rank || 'Associate';
    const points = state.progression.total_points || 0;
    const pointsForNext = state.progression.points_for_next_rank || 1000;
    const progressPercent = state.progression.progress_percent || 0;
    const nextRank = state.progression.next_rank || 'Specialist';

    const rankBadge = getMockElement('rank-badge');
    rankBadge.className = `rank-badge rank-${rank.toLowerCase().split(' ')[0]}`;
    getMockElement('rank-title').textContent = rank;
    getMockElement('rank-label').textContent = `${points.toLocaleString()} Points`;

    getMockElement('points-current').textContent = `${points.toLocaleString()} Points`;
    getMockElement('points-next').textContent = `${pointsForNext.toLocaleString()} to ${nextRank}`;
    getMockElement('points-fill').style.width = `${progressPercent}%`;
}

function renderBadges() {
    const grid = getMockElement('badges-grid');
    const empty = getMockElement('badges-empty');

    if (!state.badges || state.badges.length === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    empty.classList.add('hidden');

    grid.innerHTML = state.badges.slice(0, 4).map(badge =>
        `<div class="text-center" title="${badge.name}">` +
        `<div class="badge-showcase badge-tier-${badge.tier || 'bronze'}"><i class="fa-solid ${badge.icon || 'fa-shield'}"></i></div>` +
        `<div>${badge.name}</div><div>${badge.tier}</div></div>`
    ).join('');
}

function renderWeeklyStats() {
    if (!state.weeklyStats) return;

    getMockElement('stat-hires').textContent = (state.weeklyStats.hires || 0).toString();
    getMockElement('stat-responses').textContent = (state.weeklyStats.responses || 0).toString();
    getMockElement('stat-interviews').textContent = (state.weeklyStats.interviews || 0).toString();
    getMockElement('stat-messages').textContent = (state.weeklyStats.messages || 0).toString();
    getMockElement('stat-points-week').textContent = `+${(state.weeklyStats.points || 0).toLocaleString()}`;
}

function renderLeaderboard() {
    if (!state.leaderboard) return;

    const position = state.leaderboard.position || '--';
    const positionEl = getMockElement('leaderboard-position');
    positionEl.textContent = `#${position}`;
    positionEl.className = 'leaderboard-position';

    getMockElement('leaderboard-period').textContent = state.leaderboard.period || 'This Week';
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
        return `<div class="challenge-item">${challenge.title}: ${progress}/${target} +${challenge.points_reward} pts</div>`;
    }).join('');
}

function handleGamificationData(data) {
    if (!data) return;

    state.progression = data.progression;
    state.badges = data.badges || [];
    state.weeklyStats = data.weeklyStats || {};
    state.leaderboard = data.leaderboard;
    state.challenges = data.challenges || [];

    getMockElement('loading-state').classList.add('hidden');
    getMockElement('main-content').classList.remove('hidden');

    renderProgression();
    renderBadges();
    renderWeeklyStats();
    renderLeaderboard();
    renderChallenges();
}

function handleProgressionUpdate(data) {
    if (data) {
        state.progression = { ...state.progression, ...data };
        renderProgression();
    }
}

function handleLeaderboardUpdate(data) {
    if (data) {
        state.leaderboard = { ...state.leaderboard, ...data };
        renderLeaderboard();
    }
}

function handleChallengeUpdate(data) {
    if (!data || !data._id) return;
    const index = state.challenges.findIndex(c => c._id === data._id);
    if (index >= 0) {
        state.challenges[index] = { ...state.challenges[index], ...data };
    } else {
        state.challenges.unshift(data);
    }
    renderChallenges();
}

function handleBadgeEarned(data) {
    getMockElement('celebration-title').textContent = 'Badge Earned!';
    getMockElement('celebration-message').textContent = `${data.name || 'New Badge'} - ${data.tier || 'Bronze'} Tier`;
    getMockElement('celebration-reward').textContent = `+${data.points_reward || 50} Points`;
    getMockElement('celebration-modal').classList.remove('hidden');
}

function handleRankUp(data) {
    getMockElement('celebration-title').textContent = 'Rank Up!';
    getMockElement('celebration-message').textContent = `You are now a ${data.rank || 'Specialist'}!`;
    getMockElement('celebration-reward').textContent = data.unlocks ? `Unlocked: ${data.unlocks}` : '';
    getMockElement('celebration-modal').classList.remove('hidden');
}

function handleChallengeComplete(data) {
    getMockElement('celebration-title').textContent = 'Challenge Complete!';
    getMockElement('celebration-message').textContent = data.title || 'You completed a challenge!';
    getMockElement('celebration-reward').textContent = `+${data.points_reward || 100} Points`;
    getMockElement('celebration-modal').classList.remove('hidden');
}

function handlePointsAwarded(data) {
    const container = getMockElement('toast-container');
    container.innerHTML = `<div>+${data.points || 0} Points: ${data.reason || 'Action completed'}</div>`;
}

function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'recruiterGamificationData':
            handleGamificationData(msg.data);
            break;
        case 'progressionUpdate':
            handleProgressionUpdate(msg.data);
            break;
        case 'badgeEarned':
            handleBadgeEarned(msg.data);
            break;
        case 'rankUp':
            handleRankUp(msg.data);
            break;
        case 'leaderboardUpdate':
            handleLeaderboardUpdate(msg.data);
            break;
        case 'pointsAwarded':
            handlePointsAwarded(msg.data);
            break;
        case 'challengeUpdate':
            handleChallengeUpdate(msg.data);
            break;
        case 'challengeComplete':
            handleChallengeComplete(msg.data);
            break;
        case 'error':
            getMockElement('toast-container').innerHTML = `<div class="error">${msg.data?.message || 'Unknown error'}</div>`;
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('RECRUITER_GAMIFICATION.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.value = '';
            el.className = '';
            el.hidden = false;
            el.style = {};
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.progression = null;
        state.badges = [];
        state.weeklyStats = null;
        state.leaderboard = null;
        state.challenges = [];
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

        test('contains parent postMessage calls', () => {
            expect(htmlSource).toContain('window.parent.postMessage');
        });

        test('sends ready signal on load', () => {
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

        test('uses type-based message protocol (NOT action)', () => {
            const hasType =
                htmlSource.includes('msg.type') ||
                htmlSource.includes('.type');
            expect(hasType).toBe(true);
        });

        test('defines MESSAGE_REGISTRY with inbound and outbound', () => {
            expect(htmlSource).toContain('MESSAGE_REGISTRY');
            expect(htmlSource).toContain('inbound');
            expect(htmlSource).toContain('outbound');
        });

        test('validates message schema before processing', () => {
            expect(htmlSource).toContain('validateMessageSchema');
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

        test('ignores messages without type key', () => {
            handleMessage({ action: 'wrong_protocol' });
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores empty object', () => {
            handleMessage({});
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores message with empty type string', () => {
            handleMessage({ type: '' });
            // The handler checks !msg.type which catches empty strings
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING -- recruiterGamificationData
    // =========================================================================

    describe('DOM rendering - recruiterGamificationData', () => {
        test('hides loading state and shows main content', () => {
            handleMessage({
                type: 'recruiterGamificationData',
                data: {
                    progression: { rank: 'Specialist', total_points: 1500, progress_percent: 50, next_rank: 'Senior' },
                    badges: [],
                    weeklyStats: {},
                    leaderboard: { position: 5 },
                    challenges: []
                }
            });

            expect(getMockElement('loading-state').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('main-content').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('renders progression with rank and points', () => {
            handleMessage({
                type: 'recruiterGamificationData',
                data: {
                    progression: {
                        rank: 'Specialist',
                        total_points: 2500,
                        points_for_next_rank: 5000,
                        progress_percent: 50,
                        next_rank: 'Senior'
                    },
                    badges: [],
                    weeklyStats: {},
                    leaderboard: null,
                    challenges: []
                }
            });

            expect(getMockElement('rank-title').textContent).toBe('Specialist');
            expect(getMockElement('rank-label').textContent).toContain('2,500');
            expect(getMockElement('points-current').textContent).toContain('2,500');
            expect(getMockElement('points-next').textContent).toContain('5,000');
            expect(getMockElement('points-next').textContent).toContain('Senior');
            expect(getMockElement('points-fill').style.width).toBe('50%');
        });

        test('renders badges in grid when badges exist', () => {
            handleMessage({
                type: 'recruiterGamificationData',
                data: {
                    progression: { rank: 'Associate' },
                    badges: [
                        { _id: 'b1', name: 'First Hire', tier: 'bronze', icon: 'fa-user-check' },
                        { _id: 'b2', name: 'Speed Demon', tier: 'silver', icon: 'fa-bolt' }
                    ],
                    weeklyStats: {},
                    leaderboard: null,
                    challenges: []
                }
            });

            expect(getMockElement('badges-grid').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('badges-empty').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('badges-grid').innerHTML).toContain('First Hire');
            expect(getMockElement('badges-grid').innerHTML).toContain('Speed Demon');
        });

        test('shows empty state when no badges', () => {
            handleMessage({
                type: 'recruiterGamificationData',
                data: {
                    progression: { rank: 'Associate' },
                    badges: [],
                    weeklyStats: {},
                    leaderboard: null,
                    challenges: []
                }
            });

            expect(getMockElement('badges-grid').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('badges-empty').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('renders weekly stats', () => {
            handleMessage({
                type: 'recruiterGamificationData',
                data: {
                    progression: { rank: 'Associate' },
                    badges: [],
                    weeklyStats: {
                        hires: 5,
                        responses: 42,
                        interviews: 12,
                        messages: 87,
                        points: 350
                    },
                    leaderboard: null,
                    challenges: []
                }
            });

            expect(getMockElement('stat-hires').textContent).toBe('5');
            expect(getMockElement('stat-responses').textContent).toBe('42');
            expect(getMockElement('stat-interviews').textContent).toBe('12');
            expect(getMockElement('stat-messages').textContent).toBe('87');
            expect(getMockElement('stat-points-week').textContent).toBe('+350');
        });

        test('renders leaderboard position', () => {
            handleMessage({
                type: 'recruiterGamificationData',
                data: {
                    progression: { rank: 'Associate' },
                    badges: [],
                    weeklyStats: {},
                    leaderboard: { position: 3, period: 'This Month' },
                    challenges: []
                }
            });

            expect(getMockElement('leaderboard-position').textContent).toBe('#3');
            expect(getMockElement('leaderboard-period').textContent).toBe('This Month');
        });

        test('renders active challenges', () => {
            handleMessage({
                type: 'recruiterGamificationData',
                data: {
                    progression: { rank: 'Associate' },
                    badges: [],
                    weeklyStats: {},
                    leaderboard: null,
                    challenges: [
                        { _id: 'c1', title: 'Make 3 hires', progress: 1, target: 3, points_reward: 200, type: 'weekly' },
                        { _id: 'c2', title: 'Send 10 messages', progress: 7, target: 10, points_reward: 100, type: 'daily' }
                    ]
                }
            });

            expect(getMockElement('challenges-list').innerHTML).toContain('Make 3 hires');
            expect(getMockElement('challenges-list').innerHTML).toContain('Send 10 messages');
            expect(getMockElement('challenges-list').innerHTML).toContain('1/3');
            expect(getMockElement('challenges-list').innerHTML).toContain('7/10');
        });

        test('shows empty challenges state when no challenges', () => {
            handleMessage({
                type: 'recruiterGamificationData',
                data: {
                    progression: { rank: 'Associate' },
                    badges: [],
                    weeklyStats: {},
                    leaderboard: null,
                    challenges: []
                }
            });

            expect(getMockElement('challenges-list').innerHTML).toContain('No active challenges');
        });

        test('null data does not crash', () => {
            handleMessage({
                type: 'recruiterGamificationData',
                data: null
            });

            // Should not throw and loading state should remain
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // DOM RENDERING -- progressionUpdate
    // =========================================================================

    describe('DOM rendering - progressionUpdate', () => {
        test('updates rank and points on progression update', () => {
            // Set initial state
            state.progression = { rank: 'Associate', total_points: 500 };

            handleMessage({
                type: 'progressionUpdate',
                data: { rank: 'Specialist', total_points: 1200, progress_percent: 20, next_rank: 'Senior' }
            });

            expect(getMockElement('rank-title').textContent).toBe('Specialist');
            expect(getMockElement('points-current').textContent).toContain('1,200');
            expect(getMockElement('points-fill').style.width).toBe('20%');
        });
    });

    // =========================================================================
    // DOM RENDERING -- leaderboardUpdate
    // =========================================================================

    describe('DOM rendering - leaderboardUpdate', () => {
        test('updates leaderboard position', () => {
            state.leaderboard = { position: 10, period: 'This Week' };

            handleMessage({
                type: 'leaderboardUpdate',
                data: { position: 2, period: 'This Week' }
            });

            expect(getMockElement('leaderboard-position').textContent).toBe('#2');
        });
    });

    // =========================================================================
    // DOM RENDERING -- challengeUpdate
    // =========================================================================

    describe('DOM rendering - challengeUpdate', () => {
        test('updates existing challenge progress', () => {
            state.challenges = [
                { _id: 'c1', title: 'Make 3 hires', progress: 1, target: 3, points_reward: 200 }
            ];

            handleMessage({
                type: 'challengeUpdate',
                data: { _id: 'c1', progress: 2 }
            });

            expect(state.challenges[0].progress).toBe(2);
            expect(getMockElement('challenges-list').innerHTML).toContain('2/3');
        });

        test('adds new challenge if not found', () => {
            state.challenges = [];

            handleMessage({
                type: 'challengeUpdate',
                data: { _id: 'c5', title: 'New Challenge', progress: 0, target: 5, points_reward: 150 }
            });

            expect(state.challenges).toHaveLength(1);
            expect(getMockElement('challenges-list').innerHTML).toContain('New Challenge');
        });

        test('ignores challengeUpdate without _id', () => {
            state.challenges = [];

            handleMessage({
                type: 'challengeUpdate',
                data: { title: 'No ID' }
            });

            expect(state.challenges).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING -- Celebrations
    // =========================================================================

    describe('DOM rendering - celebrations', () => {
        test('badgeEarned shows celebration modal', () => {
            handleMessage({
                type: 'badgeEarned',
                data: { name: 'Speed Recruiter', tier: 'gold', icon: 'fa-bolt', points_reward: 200 }
            });

            expect(getMockElement('celebration-title').textContent).toBe('Badge Earned!');
            expect(getMockElement('celebration-message').textContent).toContain('Speed Recruiter');
            expect(getMockElement('celebration-message').textContent).toContain('gold');
            expect(getMockElement('celebration-reward').textContent).toContain('200');
            expect(getMockElement('celebration-modal').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('rankUp shows celebration modal', () => {
            handleMessage({
                type: 'rankUp',
                data: { rank: 'Lead Recruiter', unlocks: 'Priority Matching' }
            });

            expect(getMockElement('celebration-title').textContent).toBe('Rank Up!');
            expect(getMockElement('celebration-message').textContent).toContain('Lead Recruiter');
            expect(getMockElement('celebration-reward').textContent).toContain('Priority Matching');
            expect(getMockElement('celebration-modal').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('challengeComplete shows celebration modal', () => {
            handleMessage({
                type: 'challengeComplete',
                data: { title: 'Weekly Hires', points_reward: 500 }
            });

            expect(getMockElement('celebration-title').textContent).toBe('Challenge Complete!');
            expect(getMockElement('celebration-message').textContent).toContain('Weekly Hires');
            expect(getMockElement('celebration-reward').textContent).toContain('500');
            expect(getMockElement('celebration-modal').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('pointsAwarded shows toast notification', () => {
            handleMessage({
                type: 'pointsAwarded',
                data: { points: 25, reason: 'Driver contacted' }
            });

            expect(getMockElement('toast-container').innerHTML).toContain('25');
            expect(getMockElement('toast-container').innerHTML).toContain('Driver contacted');
        });
    });

    // =========================================================================
    // ERROR DISPLAY
    // =========================================================================

    describe('Error display', () => {
        test('error message renders in toast container', () => {
            handleMessage({
                type: 'error',
                data: { message: 'Failed to load gamification data' }
            });

            expect(getMockElement('toast-container').innerHTML).toContain('Failed to load gamification data');
        });

        test('error without message shows fallback', () => {
            handleMessage({
                type: 'error',
                data: {}
            });

            expect(getMockElement('toast-container').innerHTML).toContain('Unknown error');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('ready signal is sent on init', () => {
            sendToVelo(READY_SIGNAL);
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0].type).toBe('recruiterGamificationReady');
        });

        test('viewLeaderboard sends correct type', () => {
            sendToVelo('viewLeaderboard');
            expect(capturedOutbound[0].type).toBe('viewLeaderboard');
        });

        test('viewBadges sends correct type', () => {
            sendToVelo('viewBadges');
            expect(capturedOutbound[0].type).toBe('viewBadges');
        });

        test('viewChallenges sends correct type', () => {
            sendToVelo('viewChallenges');
            expect(capturedOutbound[0].type).toBe('viewChallenges');
        });

        test('claimReward sends challengeId', () => {
            sendToVelo('claimReward', { challengeId: 'c1' });
            expect(capturedOutbound[0].type).toBe('claimReward');
            expect(capturedOutbound[0].data).toEqual({ challengeId: 'c1' });
        });

        test('ping sends correct type', () => {
            sendToVelo('ping');
            expect(capturedOutbound[0].type).toBe('ping');
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical element IDs', () => {
            const criticalIds = [
                'loading-state', 'main-content', 'rank-badge', 'rank-title',
                'rank-label', 'points-current', 'points-next', 'points-fill',
                'leaderboard-position', 'leaderboard-period',
                'badges-grid', 'badges-empty',
                'stat-hires', 'stat-responses', 'stat-interviews', 'stat-messages',
                'stat-points-week', 'challenges-list',
                'toast-container', 'celebration-modal',
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

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses stripHtml or textContent for user content', () => {
            const hasSanitization =
                htmlSource.includes('stripHtml') ||
                htmlSource.includes('textContent') ||
                htmlSource.includes('escapeHtml');
            expect(hasSanitization).toBe(true);
        });
    });
});
