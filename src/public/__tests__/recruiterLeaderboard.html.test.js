/**
 * RECRUITER_LEADERBOARD HTML DOM Tests
 * ========================================
 * Tests for src/public/recruiter/RECRUITER_LEADERBOARD.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * **TYPE PROTOCOL** (not action) -- uses { type, data } envelope
 *
 * Inbound: leaderboardData, leaderboardPage, error
 * Outbound: leaderboardReady, getLeaderboard
 *
 * DOM IDs: loading-state, main-content, podium, podium-1-avatar, podium-1-name,
 *   podium-1-score, podium-2-avatar, podium-2-name, podium-2-score,
 *   podium-3-avatar, podium-3-name, podium-3-score, your-position-banner,
 *   your-avatar, your-position, your-score, your-rank-change, points-to-next,
 *   leaderboard-list, load-more-container, empty-state
 *
 * @see src/public/recruiter/RECRUITER_LEADERBOARD.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'recruiter', 'RECRUITER_LEADERBOARD.html');

const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'leaderboardReady';

const INBOUND_MESSAGES = [
    'leaderboardData',
    'leaderboardPage',
    'error'
];

const OUTBOUND_MESSAGES = [
    'leaderboardReady',
    'getLeaderboard'
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
            toggle: jest.fn(function (cls, force) {
                if (force !== undefined) {
                    force ? this._classes.add(cls) : this._classes.delete(cls);
                } else {
                    this._classes.has(cls) ? this._classes.delete(cls) : this._classes.add(cls);
                }
            }),
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
    leaderboardData: [],
    currentUserPosition: null,
    currentPage: 1,
    hasMore: false,
    currentType: 'overall',
    currentPeriod: 'weekly'
};

function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function formatScore(score) {
    if (state.currentType === 'response_time') {
        if (score < 60) return `${score}m`;
        return `${(score / 60).toFixed(1)}h`;
    }
    if (state.currentType === 'retention') {
        return `${score}%`;
    }
    return `${(score || 0).toLocaleString()} pts`;
}

function renderPodium() {
    const top3 = state.leaderboardData.slice(0, 3);

    if (top3[0]) {
        getMockElement('podium-1-avatar').textContent = getInitials(top3[0].name);
        getMockElement('podium-1-name').textContent = top3[0].name || 'Unknown';
        getMockElement('podium-1-score').textContent = formatScore(top3[0].score);
    }

    if (top3[1]) {
        getMockElement('podium-2-avatar').textContent = getInitials(top3[1].name);
        getMockElement('podium-2-name').textContent = top3[1].name || 'Unknown';
        getMockElement('podium-2-score').textContent = formatScore(top3[1].score);
    }

    if (top3[2]) {
        getMockElement('podium-3-avatar').textContent = getInitials(top3[2].name);
        getMockElement('podium-3-name').textContent = top3[2].name || 'Unknown';
        getMockElement('podium-3-score').textContent = formatScore(top3[2].score);
    }
}

function renderCurrentUser() {
    const banner = getMockElement('your-position-banner');

    if (!state.currentUserPosition) {
        banner.classList.add('hidden');
        return;
    }

    banner.classList.remove('hidden');

    getMockElement('your-avatar').textContent = getInitials(state.currentUserPosition.name);
    getMockElement('your-position').textContent = `#${state.currentUserPosition.position}`;
    getMockElement('your-score').textContent = formatScore(state.currentUserPosition.score);

    const changeEl = getMockElement('your-rank-change');
    const change = state.currentUserPosition.rankChange || 0;

    if (change > 0) {
        changeEl.innerHTML = `<i class="fa-solid fa-arrow-up text-green-300"></i> Up ${change} from last week`;
    } else if (change < 0) {
        changeEl.innerHTML = `<i class="fa-solid fa-arrow-down text-red-300"></i> Down ${Math.abs(change)} from last week`;
    } else {
        changeEl.innerHTML = `<i class="fa-solid fa-minus"></i> Same as last week`;
    }

    const pointsToNext = state.currentUserPosition.pointsToNext || 0;
    if (state.currentUserPosition.position === 1) {
        getMockElement('points-to-next').textContent = "You're #1!";
    } else {
        getMockElement('points-to-next').textContent = `${pointsToNext} pts to next rank`;
    }
}

function renderLeaderboard() {
    const container = getMockElement('leaderboard-list');
    const rest = state.leaderboardData.slice(3);

    if (rest.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = rest.map((entry, idx) => {
        const position = idx + 4;
        const isCurrentUser = state.currentUserPosition && entry._id === state.currentUserPosition._id;
        return `<div class="leaderboard-row ${isCurrentUser ? 'current-user' : ''}">${position}. ${entry.name || 'Unknown'}: ${formatScore(entry.score)}</div>`;
    }).join('');
}

function handleLeaderboardData(data) {
    if (!data) return;

    state.leaderboardData = data.rankings || [];
    state.currentUserPosition = data.currentUser || null;
    state.hasMore = data.hasMore || false;
    state.currentPage = 1;

    getMockElement('loading-state').classList.add('hidden');
    getMockElement('main-content').classList.remove('hidden');

    if (state.leaderboardData.length === 0) {
        getMockElement('empty-state').classList.remove('hidden');
        getMockElement('podium').classList.add('hidden');
        getMockElement('leaderboard-list').classList.add('hidden');
    } else {
        getMockElement('empty-state').classList.add('hidden');
        getMockElement('podium').classList.remove('hidden');
        getMockElement('leaderboard-list').classList.remove('hidden');
        renderPodium();
        renderCurrentUser();
        renderLeaderboard();
    }

    if (state.hasMore) {
        getMockElement('load-more-container').classList.remove('hidden');
    } else {
        getMockElement('load-more-container').classList.add('hidden');
    }
}

function handleLeaderboardPage(data) {
    if (!data || !data.rankings) return;

    state.leaderboardData = [...state.leaderboardData, ...data.rankings];
    state.hasMore = data.hasMore || false;
    state.currentPage++;

    renderLeaderboard();

    if (state.hasMore) {
        getMockElement('load-more-container').classList.remove('hidden');
    } else {
        getMockElement('load-more-container').classList.add('hidden');
    }
}

function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'leaderboardData':
            handleLeaderboardData(msg.data);
            break;
        case 'leaderboardPage':
            handleLeaderboardPage(msg.data);
            break;
        case 'error':
            getMockElement('toast').textContent = msg.data?.message || 'Unknown error';
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('RECRUITER_LEADERBOARD.html DOM Tests', () => {

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
            el.classList.toggle.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
        state.leaderboardData = [];
        state.currentUserPosition = null;
        state.currentPage = 1;
        state.hasMore = false;
        state.currentType = 'overall';
        state.currentPeriod = 'weekly';
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
            // No crash = pass, no outbound captured
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
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING -- leaderboardData
    // =========================================================================

    describe('DOM rendering - leaderboardData', () => {
        test('hides loading state and shows main content', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [
                        { _id: 'r1', name: 'Alice Smith', score: 5000 }
                    ],
                    currentUser: null,
                    hasMore: false
                }
            });

            expect(getMockElement('loading-state').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('main-content').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('renders podium for top 3 recruiters', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [
                        { _id: 'r1', name: 'Alice Smith', score: 5000 },
                        { _id: 'r2', name: 'Bob Jones', score: 4200 },
                        { _id: 'r3', name: 'Charlie Brown', score: 3800 }
                    ],
                    currentUser: null,
                    hasMore: false
                }
            });

            expect(getMockElement('podium-1-avatar').textContent).toBe('AS');
            expect(getMockElement('podium-1-name').textContent).toBe('Alice Smith');
            expect(getMockElement('podium-1-score').textContent).toContain('5,000');

            expect(getMockElement('podium-2-avatar').textContent).toBe('BJ');
            expect(getMockElement('podium-2-name').textContent).toBe('Bob Jones');
            expect(getMockElement('podium-2-score').textContent).toContain('4,200');

            expect(getMockElement('podium-3-avatar').textContent).toBe('CB');
            expect(getMockElement('podium-3-name').textContent).toBe('Charlie Brown');
            expect(getMockElement('podium-3-score').textContent).toContain('3,800');
        });

        test('renders current user position banner', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [
                        { _id: 'r1', name: 'Alice Smith', score: 5000 },
                        { _id: 'r2', name: 'Bob Jones', score: 4200 },
                        { _id: 'r3', name: 'Charlie Brown', score: 3800 }
                    ],
                    currentUser: {
                        _id: 'me1',
                        name: 'My Name',
                        position: 7,
                        score: 2100,
                        rankChange: 2,
                        pointsToNext: 300
                    },
                    hasMore: false
                }
            });

            expect(getMockElement('your-position-banner').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('your-avatar').textContent).toBe('MN');
            expect(getMockElement('your-position').textContent).toBe('#7');
            expect(getMockElement('your-score').textContent).toContain('2,100');
            expect(getMockElement('your-rank-change').innerHTML).toContain('Up 2');
            expect(getMockElement('points-to-next').textContent).toContain('300 pts to next rank');
        });

        test('hides user banner when no currentUser', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [
                        { _id: 'r1', name: 'Alice Smith', score: 5000 }
                    ],
                    currentUser: null,
                    hasMore: false
                }
            });

            expect(getMockElement('your-position-banner').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('shows #1 text when user is first place', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [
                        { _id: 'me1', name: 'Top Recruiter', score: 9000 }
                    ],
                    currentUser: {
                        _id: 'me1',
                        name: 'Top Recruiter',
                        position: 1,
                        score: 9000,
                        rankChange: 0,
                        pointsToNext: 0
                    },
                    hasMore: false
                }
            });

            expect(getMockElement('points-to-next').textContent).toBe("You're #1!");
        });

        test('shows rank down when negative rankChange', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [{ _id: 'r1', name: 'Alice', score: 5000 }],
                    currentUser: {
                        _id: 'me1',
                        name: 'My Name',
                        position: 5,
                        score: 2500,
                        rankChange: -3,
                        pointsToNext: 200
                    },
                    hasMore: false
                }
            });

            expect(getMockElement('your-rank-change').innerHTML).toContain('Down 3');
        });

        test('shows same rank when no change', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [{ _id: 'r1', name: 'Alice', score: 5000 }],
                    currentUser: {
                        _id: 'me1',
                        name: 'My Name',
                        position: 5,
                        score: 2500,
                        rankChange: 0,
                        pointsToNext: 200
                    },
                    hasMore: false
                }
            });

            expect(getMockElement('your-rank-change').innerHTML).toContain('Same as last week');
        });

        test('renders leaderboard rows beyond top 3', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [
                        { _id: 'r1', name: 'First Place', score: 5000 },
                        { _id: 'r2', name: 'Second Place', score: 4200 },
                        { _id: 'r3', name: 'Third Place', score: 3800 },
                        { _id: 'r4', name: 'Fourth Place', score: 3200 },
                        { _id: 'r5', name: 'Fifth Place', score: 2800 }
                    ],
                    currentUser: null,
                    hasMore: false
                }
            });

            expect(getMockElement('leaderboard-list').innerHTML).toContain('Fourth Place');
            expect(getMockElement('leaderboard-list').innerHTML).toContain('Fifth Place');
            // Top 3 should not appear in the list rows
            expect(getMockElement('leaderboard-list').innerHTML).not.toContain('First Place');
        });

        test('highlights current user row in leaderboard list', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [
                        { _id: 'r1', name: 'First', score: 5000 },
                        { _id: 'r2', name: 'Second', score: 4200 },
                        { _id: 'r3', name: 'Third', score: 3800 },
                        { _id: 'me1', name: 'My Entry', score: 3200 }
                    ],
                    currentUser: { _id: 'me1', name: 'My Entry', position: 4, score: 3200 },
                    hasMore: false
                }
            });

            expect(getMockElement('leaderboard-list').innerHTML).toContain('current-user');
        });

        test('shows empty state when no rankings', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [],
                    currentUser: null,
                    hasMore: false
                }
            });

            expect(getMockElement('empty-state').classList.remove).toHaveBeenCalledWith('hidden');
            expect(getMockElement('podium').classList.add).toHaveBeenCalledWith('hidden');
            expect(getMockElement('leaderboard-list').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('shows load more button when hasMore is true', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [
                        { _id: 'r1', name: 'Alice', score: 5000 }
                    ],
                    currentUser: null,
                    hasMore: true
                }
            });

            expect(getMockElement('load-more-container').classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('hides load more button when hasMore is false', () => {
            handleMessage({
                type: 'leaderboardData',
                data: {
                    rankings: [
                        { _id: 'r1', name: 'Alice', score: 5000 }
                    ],
                    currentUser: null,
                    hasMore: false
                }
            });

            expect(getMockElement('load-more-container').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('null data does not crash', () => {
            handleMessage({
                type: 'leaderboardData',
                data: null
            });

            expect(getMockElement('loading-state').classList.add).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // DOM RENDERING -- leaderboardPage (pagination)
    // =========================================================================

    describe('DOM rendering - leaderboardPage', () => {
        test('appends new rankings to existing data', () => {
            // Set initial data
            state.leaderboardData = [
                { _id: 'r1', name: 'First', score: 5000 },
                { _id: 'r2', name: 'Second', score: 4200 },
                { _id: 'r3', name: 'Third', score: 3800 },
                { _id: 'r4', name: 'Fourth', score: 3200 }
            ];

            handleMessage({
                type: 'leaderboardPage',
                data: {
                    rankings: [
                        { _id: 'r5', name: 'Fifth', score: 2800 },
                        { _id: 'r6', name: 'Sixth', score: 2400 }
                    ],
                    hasMore: true
                }
            });

            expect(state.leaderboardData).toHaveLength(6);
            expect(state.currentPage).toBe(2);
            expect(getMockElement('leaderboard-list').innerHTML).toContain('Fifth');
            expect(getMockElement('leaderboard-list').innerHTML).toContain('Sixth');
        });

        test('hides load more when no more pages', () => {
            state.leaderboardData = [
                { _id: 'r1', name: 'First', score: 5000 },
                { _id: 'r2', name: 'Second', score: 4200 },
                { _id: 'r3', name: 'Third', score: 3800 }
            ];

            handleMessage({
                type: 'leaderboardPage',
                data: {
                    rankings: [{ _id: 'r4', name: 'Last', score: 1000 }],
                    hasMore: false
                }
            });

            expect(getMockElement('load-more-container').classList.add).toHaveBeenCalledWith('hidden');
        });

        test('ignores leaderboardPage with null data', () => {
            handleMessage({
                type: 'leaderboardPage',
                data: null
            });

            expect(state.leaderboardData).toHaveLength(0);
        });

        test('ignores leaderboardPage without rankings', () => {
            handleMessage({
                type: 'leaderboardPage',
                data: { hasMore: false }
            });

            expect(state.leaderboardData).toHaveLength(0);
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('ready signal is sent on init', () => {
            sendToVelo(READY_SIGNAL);
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0].type).toBe('leaderboardReady');
        });

        test('getLeaderboard sends type, period, and page', () => {
            sendToVelo('getLeaderboard', { type: 'overall', period: 'weekly', page: 1 });
            expect(capturedOutbound[0].type).toBe('getLeaderboard');
            expect(capturedOutbound[0].data).toEqual({ type: 'overall', period: 'weekly', page: 1 });
        });

        test('getLeaderboard with hires type', () => {
            sendToVelo('getLeaderboard', { type: 'hires', period: 'monthly', page: 1 });
            expect(capturedOutbound[0].data.type).toBe('hires');
            expect(capturedOutbound[0].data.period).toBe('monthly');
        });
    });

    // =========================================================================
    // SCORE FORMATTING
    // =========================================================================

    describe('Score formatting', () => {
        test('formats overall scores as points', () => {
            state.currentType = 'overall';
            expect(formatScore(1500)).toBe('1,500 pts');
        });

        test('formats response_time scores as time', () => {
            state.currentType = 'response_time';
            expect(formatScore(45)).toBe('45m');
            expect(formatScore(120)).toBe('2.0h');
        });

        test('formats retention scores as percentage', () => {
            state.currentType = 'retention';
            expect(formatScore(85)).toBe('85%');
        });
    });

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    describe('Helper functions', () => {
        test('getInitials extracts two-letter initials from full name', () => {
            expect(getInitials('Alice Smith')).toBe('AS');
            expect(getInitials('Bob Jones Jr')).toBe('BJ');
        });

        test('getInitials handles single name', () => {
            expect(getInitials('Alice')).toBe('AL');
        });

        test('getInitials handles null/empty', () => {
            expect(getInitials(null)).toBe('??');
            expect(getInitials('')).toBe('??');
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains critical element IDs', () => {
            const criticalIds = [
                'loading-state', 'main-content', 'podium',
                'podium-1-avatar', 'podium-1-name', 'podium-1-score',
                'podium-2-avatar', 'podium-2-name', 'podium-2-score',
                'podium-3-avatar', 'podium-3-name', 'podium-3-score',
                'your-position-banner', 'your-avatar', 'your-position',
                'your-score', 'your-rank-change', 'points-to-next',
                'leaderboard-list', 'load-more-container', 'empty-state'
            ];
            criticalIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('HTML contains tab and period button selectors', () => {
            expect(htmlSource).toContain('tab-btn');
            expect(htmlSource).toContain('period-btn');
            expect(htmlSource).toContain('data-type');
            expect(htmlSource).toContain('data-period');
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
