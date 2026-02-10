/* eslint-disable */
/**
 * CHALLENGES HTML DOM Tests
 * ===========================
 * Tests for src/public/driver/CHALLENGES.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * Message protocol: type/data (driver challenges page)
 * Ready signal: challengesReady (sent on load)
 *
 * @see src/public/driver/CHALLENGES.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'driver', 'CHALLENGES.html');
const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'challengesReady';

const INBOUND_MESSAGES = [
    'challengesData',
    'challengeStarted',
    'challengeProgress',
    'challengeComplete',
    'rewardClaimed',
    'error'
];

const OUTBOUND_MESSAGES = [
    'challengesReady',
    'startChallenge',
    'claimReward'
];

const DOM_ELEMENT_MAP = {
    'challengesData': [
        'loading-state', 'total-completed', 'active-count',
        'active-section', 'active-list', 'active-empty', 'active-subtitle',
        'available-section', 'available-list', 'available-empty',
        'completed-section', 'completed-list', 'completed-empty', 'completed-subtitle'
    ],
    'challengeStarted': ['active-list', 'available-list'],
    'challengeComplete': ['claim-modal', 'claim-challenge-title', 'claim-reward'],
    'rewardClaimed': ['active-list', 'completed-list', 'total-completed']
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
    currentTab: 'active',
    currentFilter: 'all',
    activeChallenges: [],
    availableChallenges: [],
    completedChallenges: [],
    selectedChallenge: null,
    pendingClaimId: null,
    userType: 'driver'
};

function stripHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderCurrentTab() {
    getMockElement('active-section').classList.add('hidden');
    getMockElement('available-section').classList.add('hidden');
    getMockElement('completed-section').classList.add('hidden');

    getMockElement(`${state.currentTab}-section`).classList.remove('hidden');

    switch (state.currentTab) {
        case 'active':
            renderActiveChallenges();
            break;
        case 'available':
            renderAvailableChallenges();
            break;
        case 'completed':
            renderCompletedChallenges();
            break;
    }
}

function renderActiveChallenges() {
    const list = getMockElement('active-list');
    const empty = getMockElement('active-empty');
    const subtitle = getMockElement('active-subtitle');

    subtitle.textContent = `${state.activeChallenges.length} in progress`;

    if (state.activeChallenges.length === 0) {
        list.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }

    list.classList.remove('hidden');
    empty.classList.add('hidden');

    list.innerHTML = state.activeChallenges.map(c => {
        const progress = c.progress || 0;
        const target = c.target || 1;
        const percent = Math.min((progress / target) * 100, 100);
        const isComplete = progress >= target;
        return `<div class="challenge-card" data-id="${c._id}">
            <span class="type">${c.type}</span>
            <h3>${stripHtml(c.title)}</h3>
            <div class="progress-bar"><div class="progress-fill ${isComplete ? 'complete' : 'active'}" style="width:${percent}%"></div></div>
            <span>${progress}/${target}</span>
            ${isComplete && !c.claimed ? '<button class="claim-btn">Claim!</button>' : ''}
        </div>`;
    }).join('');
}

function renderAvailableChallenges() {
    const list = getMockElement('available-list');
    const empty = getMockElement('available-empty');

    let filtered = state.availableChallenges;
    if (state.currentFilter !== 'all') {
        filtered = state.availableChallenges.filter(c => c.type === state.currentFilter);
    }

    if (filtered.length === 0) {
        list.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }

    list.classList.remove('hidden');
    empty.classList.add('hidden');

    list.innerHTML = filtered.map(c =>
        `<div class="challenge-card" data-id="${c._id}">
            <span class="type">${c.type}</span>
            <h3>${stripHtml(c.title)}</h3>
            <button class="start-btn">Start</button>
        </div>`
    ).join('');
}

function renderCompletedChallenges() {
    const list = getMockElement('completed-list');
    const empty = getMockElement('completed-empty');
    const subtitle = getMockElement('completed-subtitle');

    subtitle.textContent = `${state.completedChallenges.length} total`;

    if (state.completedChallenges.length === 0) {
        list.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }

    list.classList.remove('hidden');
    empty.classList.add('hidden');

    list.innerHTML = state.completedChallenges.slice(0, 20).map(c =>
        `<div class="challenge-card complete" data-id="${c._id}">
            <h3>${stripHtml(c.title)}</h3>
        </div>`
    ).join('');
}

function handleChallengesData(data) {
    if (!data) return;

    state.userType = data.userType || 'driver';
    state.activeChallenges = data.active || [];
    state.availableChallenges = data.available || [];
    state.completedChallenges = data.completed || [];

    getMockElement('loading-state').classList.add('hidden');
    getMockElement('total-completed').textContent = state.completedChallenges.length;

    const activeCountBadge = getMockElement('active-count');
    if (state.activeChallenges.length > 0) {
        activeCountBadge.textContent = state.activeChallenges.length;
        activeCountBadge.classList.remove('hidden');
    } else {
        activeCountBadge.classList.add('hidden');
    }

    renderCurrentTab();
}

function handleChallengeStarted(data) {
    if (!data) return;

    const index = state.availableChallenges.findIndex(c => c._id === data._id);
    if (index >= 0) {
        const challenge = { ...state.availableChallenges[index], ...data, progress: 0 };
        state.availableChallenges.splice(index, 1);
        state.activeChallenges.unshift(challenge);
    }

    state.currentTab = 'active';
    renderCurrentTab();
}

function handleChallengeProgress(data) {
    if (!data) return;

    const challenge = state.activeChallenges.find(c => c._id === data._id);
    if (challenge) {
        challenge.progress = data.progress;
    }
    renderCurrentTab();
}

function handleChallengeComplete(data) {
    if (!data) return;

    state.pendingClaimId = data._id;
    const rewardLabel = state.userType === 'driver' ? 'XP' : 'pts';
    const reward = data.xp_reward || data.points_reward || 0;

    getMockElement('claim-challenge-title').textContent = data.title || 'Challenge complete';
    getMockElement('claim-reward').textContent = `+${reward} ${rewardLabel}`;
    getMockElement('claim-modal').classList.remove('hidden');
}

function handleRewardClaimed(data) {
    if (!data) return;

    const index = state.activeChallenges.findIndex(c => c._id === data._id);
    if (index >= 0) {
        const challenge = { ...state.activeChallenges[index], completed_at: new Date().toISOString() };
        state.activeChallenges.splice(index, 1);
        state.completedChallenges.unshift(challenge);
    }

    getMockElement('claim-modal').classList.add('hidden');
    state.pendingClaimId = null;
    getMockElement('total-completed').textContent = state.completedChallenges.length;
    renderCurrentTab();
}

function handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (typeof msg.type !== 'string' || msg.type.length === 0) return;

    switch (msg.type) {
        case 'challengesData':
            handleChallengesData(msg.data);
            break;
        case 'challengeStarted':
            handleChallengeStarted(msg.data);
            break;
        case 'challengeProgress':
            handleChallengeProgress(msg.data);
            break;
        case 'challengeComplete':
            handleChallengeComplete(msg.data);
            break;
        case 'rewardClaimed':
            handleRewardClaimed(msg.data);
            break;
        case 'error':
            // Logged, no DOM update
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CHALLENGES.html DOM Tests', () => {

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
        state.currentTab = 'active';
        state.currentFilter = 'all';
        state.activeChallenges = [];
        state.availableChallenges = [];
        state.completedChallenges = [];
        state.selectedChallenge = null;
        state.pendingClaimId = null;
        state.userType = 'driver';
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

        test('sends challengesReady signal on initialization', () => {
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

        test('contains tab navigation for active/available/completed', () => {
            expect(htmlSource).toContain('setTab');
            expect(htmlSource).toContain("data-tab=");
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

        test('challengesData hides loading state', () => {
            handleMessage({
                type: 'challengesData',
                data: {
                    active: [],
                    available: [],
                    completed: []
                }
            });

            expect(getMockElement('loading-state').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('challengesData updates total completed count', () => {
            handleMessage({
                type: 'challengesData',
                data: {
                    active: [],
                    available: [],
                    completed: [
                        { _id: 'c1', title: 'Done 1' },
                        { _id: 'c2', title: 'Done 2' },
                        { _id: 'c3', title: 'Done 3' }
                    ]
                }
            });

            expect(getMockElement('total-completed').textContent).toBe(3);
        });

        test('challengesData shows active count badge when challenges exist', () => {
            handleMessage({
                type: 'challengesData',
                data: {
                    active: [
                        { _id: 'c1', title: 'Active 1', progress: 1, target: 5, type: 'daily' },
                        { _id: 'c2', title: 'Active 2', progress: 0, target: 3, type: 'weekly' }
                    ],
                    available: [],
                    completed: []
                }
            });

            const badge = getMockElement('active-count');
            expect(badge.textContent).toBe(2);
            expect(badge.classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('challengesData hides active count badge when no active challenges', () => {
            handleMessage({
                type: 'challengesData',
                data: {
                    active: [],
                    available: [],
                    completed: []
                }
            });

            expect(getMockElement('active-count').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('challengesData renders active challenges list', () => {
            handleMessage({
                type: 'challengesData',
                data: {
                    active: [
                        { _id: 'c1', title: 'Apply to 3 jobs', progress: 1, target: 3, type: 'daily', xp_reward: 50 },
                        { _id: 'c2', title: 'Complete profile', progress: 0, target: 1, type: 'weekly', xp_reward: 100 }
                    ],
                    available: [],
                    completed: []
                }
            });

            const list = getMockElement('active-list');
            expect(list.classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('active-empty').classList.add).toHaveBeenCalledWith('hidden');
            expect(list.innerHTML).toContain('Apply to 3 jobs');
            expect(list.innerHTML).toContain('Complete profile');
            expect(list.innerHTML).toContain('1/3');
        });

        test('challengesData shows active empty state when none active', () => {
            handleMessage({
                type: 'challengesData',
                data: {
                    active: [],
                    available: [{ _id: 'av1', title: 'Available One' }],
                    completed: []
                }
            });

            expect(getMockElement('active-list').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('active-empty').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('challengesData renders progress bars for active challenges', () => {
            handleMessage({
                type: 'challengesData',
                data: {
                    active: [
                        { _id: 'c1', title: 'Test', progress: 3, target: 10, type: 'daily' }
                    ],
                    available: [],
                    completed: []
                }
            });

            const list = getMockElement('active-list');
            expect(list.innerHTML).toContain('progress-bar');
            expect(list.innerHTML).toContain('3/10');
            expect(list.innerHTML).toContain('30%');
        });

        test('challengesData renders claim button for completed active challenges', () => {
            handleMessage({
                type: 'challengesData',
                data: {
                    active: [
                        { _id: 'c1', title: 'Done!', progress: 5, target: 5, type: 'daily', xp_reward: 100 }
                    ],
                    available: [],
                    completed: []
                }
            });

            const list = getMockElement('active-list');
            expect(list.innerHTML).toContain('claim-btn');
        });

        test('challengesData updates active subtitle', () => {
            handleMessage({
                type: 'challengesData',
                data: {
                    active: [
                        { _id: 'c1', title: 'One', progress: 0, target: 1, type: 'daily' },
                        { _id: 'c2', title: 'Two', progress: 0, target: 1, type: 'weekly' }
                    ],
                    available: [],
                    completed: []
                }
            });

            expect(getMockElement('active-subtitle').textContent).toBe('2 in progress');
        });

        test('challengesData gracefully handles null data', () => {
            handleMessage({ type: 'challengesData', data: null });
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });

        test('challengeStarted moves challenge from available to active', () => {
            state.availableChallenges = [
                { _id: 'c1', title: 'New Challenge', type: 'daily', target: 5, xp_reward: 50 }
            ];
            state.activeChallenges = [];

            handleMessage({
                type: 'challengeStarted',
                data: { _id: 'c1' }
            });

            expect(state.activeChallenges).toHaveLength(1);
            expect(state.availableChallenges).toHaveLength(0);
            expect(state.activeChallenges[0].title).toBe('New Challenge');
            expect(state.activeChallenges[0].progress).toBe(0);
        });

        test('challengeStarted switches to active tab', () => {
            state.currentTab = 'available';
            state.availableChallenges = [
                { _id: 'c1', title: 'Start Me', type: 'daily', target: 3 }
            ];

            handleMessage({
                type: 'challengeStarted',
                data: { _id: 'c1' }
            });

            expect(state.currentTab).toBe('active');
        });

        test('challengeProgress updates challenge progress', () => {
            state.activeChallenges = [
                { _id: 'c1', title: 'In Progress', progress: 2, target: 10, type: 'daily' }
            ];

            handleMessage({
                type: 'challengeProgress',
                data: { _id: 'c1', progress: 7 }
            });

            expect(state.activeChallenges[0].progress).toBe(7);
        });

        test('challengeComplete shows claim modal', () => {
            handleMessage({
                type: 'challengeComplete',
                data: { _id: 'c1', title: 'All Done!', xp_reward: 200 }
            });

            expect(getMockElement('claim-modal').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('claim-challenge-title').textContent).toBe('All Done!');
            expect(getMockElement('claim-reward').textContent).toBe('+200 XP');
            expect(state.pendingClaimId).toBe('c1');
        });

        test('challengeComplete uses points label for non-driver user', () => {
            state.userType = 'recruiter';

            handleMessage({
                type: 'challengeComplete',
                data: { _id: 'c1', title: 'Done!', points_reward: 150 }
            });

            expect(getMockElement('claim-reward').textContent).toBe('+150 pts');
        });

        test('rewardClaimed moves challenge from active to completed', () => {
            state.activeChallenges = [
                { _id: 'c1', title: 'Claimed', progress: 5, target: 5, type: 'daily' }
            ];
            state.completedChallenges = [];

            handleMessage({
                type: 'rewardClaimed',
                data: { _id: 'c1' }
            });

            expect(state.activeChallenges).toHaveLength(0);
            expect(state.completedChallenges).toHaveLength(1);
            expect(state.completedChallenges[0].title).toBe('Claimed');
            expect(state.completedChallenges[0].completed_at).toBeDefined();
        });

        test('rewardClaimed closes claim modal', () => {
            state.pendingClaimId = 'c1';
            state.activeChallenges = [
                { _id: 'c1', title: 'Test', progress: 5, target: 5 }
            ];

            handleMessage({
                type: 'rewardClaimed',
                data: { _id: 'c1' }
            });

            expect(getMockElement('claim-modal').classList.add).toHaveBeenCalledWith('hidden');
            expect(state.pendingClaimId).toBeNull();
        });

        test('rewardClaimed updates total completed count', () => {
            state.activeChallenges = [
                { _id: 'c1', title: 'Test', progress: 5, target: 5 }
            ];
            state.completedChallenges = [
                { _id: 'c0', title: 'Already Done' }
            ];

            handleMessage({
                type: 'rewardClaimed',
                data: { _id: 'c1' }
            });

            expect(getMockElement('total-completed').textContent).toBe(2);
        });
    });

    // =========================================================================
    // TAB NAVIGATION
    // =========================================================================

    describe('Tab navigation', () => {

        test('active tab shows active section and hides others', () => {
            state.currentTab = 'active';
            renderCurrentTab();

            expect(getMockElement('active-section').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('available-section').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('completed-section').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('available tab shows available section and hides others', () => {
            state.currentTab = 'available';
            renderCurrentTab();

            expect(getMockElement('available-section').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('active-section').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('completed-section').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('completed tab shows completed section and hides others', () => {
            state.currentTab = 'completed';
            renderCurrentTab();

            expect(getMockElement('completed-section').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('active-section').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('available-section').classList.add).toHaveBeenCalledWith('hidden');
        });
    });

    // =========================================================================
    // TYPE FILTERING (AVAILABLE TAB)
    // =========================================================================

    describe('Type filtering', () => {

        test('filter by type shows only matching challenges', () => {
            state.availableChallenges = [
                { _id: 'c1', title: 'Daily One', type: 'daily' },
                { _id: 'c2', title: 'Weekly One', type: 'weekly' },
                { _id: 'c3', title: 'Daily Two', type: 'daily' }
            ];
            state.currentFilter = 'daily';

            renderAvailableChallenges();

            const list = getMockElement('available-list');
            expect(list.innerHTML).toContain('Daily One');
            expect(list.innerHTML).toContain('Daily Two');
            expect(list.innerHTML).not.toContain('Weekly One');
        });

        test('filter all shows all available challenges', () => {
            state.availableChallenges = [
                { _id: 'c1', title: 'Daily One', type: 'daily' },
                { _id: 'c2', title: 'Weekly One', type: 'weekly' }
            ];
            state.currentFilter = 'all';

            renderAvailableChallenges();

            const list = getMockElement('available-list');
            expect(list.innerHTML).toContain('Daily One');
            expect(list.innerHTML).toContain('Weekly One');
        });

        test('filter with no results shows empty state', () => {
            state.availableChallenges = [
                { _id: 'c1', title: 'Daily One', type: 'daily' }
            ];
            state.currentFilter = 'monthly';

            renderAvailableChallenges();

            expect(getMockElement('available-list').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('available-empty').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('filter buttons exist in HTML source', () => {
            expect(htmlSource).toContain('filterType');
            expect(htmlSource).toContain("data-filter=");
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {

        test('sendToVelo sends challengesReady format', () => {
            sendToVelo('challengesReady');

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({ type: 'challengesReady', data: {} });
        });

        test('sendToVelo sends startChallenge with challengeId', () => {
            sendToVelo('startChallenge', { challengeId: 'c123' });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({
                type: 'startChallenge',
                data: { challengeId: 'c123' }
            });
        });

        test('sendToVelo sends claimReward with challengeId', () => {
            sendToVelo('claimReward', { challengeId: 'c456' });

            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0]).toEqual({
                type: 'claimReward',
                data: { challengeId: 'c456' }
            });
        });

        test('sendToVelo sends correct type/data envelope', () => {
            sendToVelo('startChallenge', { challengeId: 'c1' });

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
                handleMessage({ type: 'error', data: { message: 'Challenge load failed' } });
            }).not.toThrow();
        });

        test('error does not modify challenge DOM elements', () => {
            handleMessage({ type: 'error', data: { message: 'Server error' } });
            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
            expect(getMockElement('active-list').innerHTML).toBe('');
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
                'loading-state', 'total-completed', 'active-count',
                'active-section', 'active-list', 'active-empty', 'active-subtitle',
                'available-section', 'available-list', 'available-empty',
                'completed-section', 'completed-list', 'completed-empty', 'completed-subtitle',
                'claim-modal', 'claim-challenge-title', 'claim-reward',
                'detail-modal', 'detail-title', 'detail-description',
                'detail-type', 'detail-reward', 'detail-time',
                'detail-progress-section', 'detail-progress-text', 'detail-progress-bar',
                'detail-action-btn'
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
    // COMPLETED CHALLENGES RENDERING
    // =========================================================================

    describe('Completed challenges rendering', () => {

        test('renders completed challenges with complete class', () => {
            state.currentTab = 'completed';
            state.completedChallenges = [
                { _id: 'c1', title: 'Finished Challenge', type: 'daily' }
            ];

            renderCurrentTab();

            const list = getMockElement('completed-list');
            expect(list.innerHTML).toContain('Finished Challenge');
            expect(list.innerHTML).toContain('complete');
        });

        test('shows completed empty state when no completed challenges', () => {
            state.currentTab = 'completed';
            state.completedChallenges = [];

            renderCurrentTab();

            expect(getMockElement('completed-list').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('completed-empty').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('updates completed subtitle count', () => {
            state.currentTab = 'completed';
            state.completedChallenges = [
                { _id: 'c1', title: 'One' },
                { _id: 'c2', title: 'Two' },
                { _id: 'c3', title: 'Three' }
            ];

            renderCurrentTab();

            expect(getMockElement('completed-subtitle').textContent).toBe('3 total');
        });

        test('limits rendered completed challenges to 20', () => {
            state.currentTab = 'completed';
            state.completedChallenges = Array.from({ length: 25 }, (_, i) => ({
                _id: `c${i}`,
                title: `Challenge ${i}`,
                type: 'daily'
            }));

            renderCurrentTab();

            const list = getMockElement('completed-list');
            // Should contain challenge 19 but not challenge 20
            expect(list.innerHTML).toContain('Challenge 19');
            expect(list.innerHTML).not.toContain('Challenge 20');
        });
    });
});
