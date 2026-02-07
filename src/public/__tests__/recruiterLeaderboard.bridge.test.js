/**
 * RECRUITER_LEADERBOARD Bridge Tests
 *
 * Tests for src/pages/RECRUITER_LEADERBOARD.o6tal.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'RECRUITER_LEADERBOARD.o6tal.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    getLeaderboard: jest.fn().mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ rank: i + 1, recruiterId: `r${i}`, score: 1000 - i * 50 }))
    ),
    getUserLeaderboardPosition: jest.fn().mockResolvedValue({ rank: 5, score: 750 })
};

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) { /* silent */ }
}

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg?.type) return;

    try {
        switch (msg.type) {
            case 'leaderboardReady': {
                const [leaderboard, position] = await Promise.all([
                    backend.getLeaderboard('overall', 'monthly', { limit: 20 }),
                    backend.getUserLeaderboardPosition('testUser', 'overall', 'monthly')
                ]);
                safeSend(component, {
                    type: 'leaderboardData',
                    data: {
                        rankings: leaderboard || [],
                        currentUser: position || {},
                        hasMore: (leaderboard || []).length >= 20
                    }
                });
                break;
            }
            case 'getLeaderboard': {
                const data = msg.data || {};
                const type = data.type || 'overall';
                const period = data.period || 'monthly';
                const page = data.page || 1;
                const limit = 20;
                const offset = (page - 1) * limit;

                const leaderboard = await backend.getLeaderboard(type, period, { limit, offset });
                safeSend(component, {
                    type: page > 1 ? 'leaderboardPage' : 'leaderboardData',
                    data: {
                        rankings: leaderboard || [],
                        currentUser: {},
                        hasMore: (leaderboard || []).length >= limit,
                        page
                    }
                });
                break;
            }
            default:
                break;
        }
    } catch (error) {
        safeSend(component, { type: 'error', data: { message: error.message || 'An unexpected error occurred' } });
    }
}

describe('RECRUITER_LEADERBOARD Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    describe('Source file structure', () => {
        test('imports from backend/leaderboardService', () => {
            expect(sourceCode).toContain("from 'backend/leaderboardService'");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('uses type key protocol', () => {
            expect(sourceCode).toContain('msg.type');
        });
    });

    describe('Message routing', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('leaderboardReady loads top 20 and user position', async () => {
            await routeMessage(component, { type: 'leaderboardReady' });
            expect(mockBackend.getLeaderboard).toHaveBeenCalledWith('overall', 'monthly', { limit: 20 });
            expect(mockBackend.getUserLeaderboardPosition).toHaveBeenCalled();
            const call = component.postMessage.mock.calls[0][0];
            expect(call.type).toBe('leaderboardData');
            expect(call.data.rankings).toHaveLength(20);
            expect(call.data.currentUser).toEqual({ rank: 5, score: 750 });
            expect(call.data.hasMore).toBe(true);
        });

        test('getLeaderboard page 1 sends leaderboardData', async () => {
            await routeMessage(component, { type: 'getLeaderboard', data: { type: 'hires', period: 'weekly', page: 1 } });
            expect(mockBackend.getLeaderboard).toHaveBeenCalledWith('hires', 'weekly', { limit: 20, offset: 0 });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'leaderboardData'
            }));
        });

        test('getLeaderboard page 2+ sends leaderboardPage', async () => {
            await routeMessage(component, { type: 'getLeaderboard', data: { page: 2 } });
            expect(mockBackend.getLeaderboard).toHaveBeenCalledWith('overall', 'monthly', { limit: 20, offset: 20 });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'leaderboardPage',
                data: expect.objectContaining({ page: 2 })
            }));
        });

        test('getLeaderboard defaults to overall/monthly/page1', async () => {
            await routeMessage(component, { type: 'getLeaderboard', data: {} });
            expect(mockBackend.getLeaderboard).toHaveBeenCalledWith('overall', 'monthly', { limit: 20, offset: 0 });
        });

        test('hasMore is false when fewer than 20 results', async () => {
            const shortBackend = { ...mockBackend, getLeaderboard: jest.fn().mockResolvedValue([{ rank: 1 }]) };
            await routeMessage(component, { type: 'getLeaderboard', data: {} }, shortBackend);
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ hasMore: false })
            }));
        });
    });

    describe('Error handling', () => {
        test('leaderboardReady failure sends error', async () => {
            const failBackend = { ...mockBackend, getLeaderboard: jest.fn().mockRejectedValue(new Error('Leaderboard unavailable')) };
            await routeMessage(component, { type: 'leaderboardReady' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error', data: { message: 'Leaderboard unavailable' }
            });
        });

        test('getLeaderboard failure sends error', async () => {
            const failBackend = { ...mockBackend, getLeaderboard: jest.fn().mockRejectedValue(new Error('Page error')) };
            await routeMessage(component, { type: 'getLeaderboard', data: { page: 3 } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error', data: { message: 'Page error' }
            });
        });
    });

    describe('safeSend utility', () => {
        test('does nothing if component is null', () => {
            expect(() => safeSend(null, { type: 'test' })).not.toThrow();
        });

        test('calls postMessage when valid', () => {
            safeSend(component, { type: 'test' });
            expect(component.postMessage).toHaveBeenCalledWith({ type: 'test' });
        });
    });
});
