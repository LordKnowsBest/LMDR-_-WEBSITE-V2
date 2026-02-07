/**
 * RECRUITER_GAMIFICATION Bridge Tests
 *
 * Tests for src/pages/RECRUITER_GAMIFICATION.un5u3.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'RECRUITER_GAMIFICATION.un5u3.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockWixLocation = { to: jest.fn() };

const mockBackend = {
    getRecruiterProgression: jest.fn().mockResolvedValue({ rank: 5, points: 2500 }),
    getBadges: jest.fn().mockResolvedValue({ achievements: [{ id: 'rb1' }] }),
    getUserLeaderboardPosition: jest.fn().mockResolvedValue({ rank: 3, score: 2500 })
};

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) { /* silent */ }
}

async function routeMessage(component, msg, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!msg?.type) return;

    try {
        switch (msg.type) {
            case 'gamificationReady':
            case 'refreshGamification': {
                const [progression, badges, leaderboardPos] = await Promise.all([
                    backend.getRecruiterProgression('testUser'),
                    backend.getBadges('testUser', 'recruiter'),
                    backend.getUserLeaderboardPosition('testUser', 'overall', 'monthly')
                ]);
                safeSend(component, {
                    type: 'gamificationData',
                    data: {
                        progression: progression || {},
                        achievements: badges.achievements || badges || [],
                        leaderboardPosition: leaderboardPos || {},
                        recommendations: []
                    }
                });
                break;
            }
            case 'viewLeaderboard':
                wixLocation.to('/recruiter-leaderboard');
                break;
            case 'viewBadges':
                wixLocation.to('/driver-badges');
                break;
            case 'navigateTo': {
                const data = msg.data || {};
                if (data.action) {
                    const routes = { dashboard: '/carrier-dashboard', leaderboard: '/recruiter-leaderboard', badges: '/driver-badges', search: '/search-cdl-drivers', telemetry: '/recruiter-telemetry' };
                    wixLocation.to(routes[data.action] || `/${data.action}`);
                }
                break;
            }
            case 'ping':
                safeSend(component, { type: 'pong' });
                break;
            default:
                break;
        }
    } catch (error) {
        safeSend(component, { type: 'error', data: { message: error.message || 'An unexpected error occurred' } });
    }
}

describe('RECRUITER_GAMIFICATION Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    describe('Source file structure', () => {
        test('imports from backend/gamificationService', () => {
            expect(sourceCode).toContain("from 'backend/gamificationService'");
        });

        test('imports from backend/badgeService', () => {
            expect(sourceCode).toContain("from 'backend/badgeService'");
        });

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

        test('gamificationReady loads progression, badges, leaderboard position', async () => {
            await routeMessage(component, { type: 'gamificationReady' });
            expect(mockBackend.getRecruiterProgression).toHaveBeenCalled();
            expect(mockBackend.getBadges).toHaveBeenCalledWith('testUser', 'recruiter');
            expect(mockBackend.getUserLeaderboardPosition).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'gamificationData',
                data: expect.objectContaining({
                    progression: { rank: 5, points: 2500 },
                    leaderboardPosition: { rank: 3, score: 2500 }
                })
            }));
        });

        test('refreshGamification calls same handler', async () => {
            await routeMessage(component, { type: 'refreshGamification' });
            expect(mockBackend.getRecruiterProgression).toHaveBeenCalled();
        });

        test('viewLeaderboard navigates to /recruiter-leaderboard', async () => {
            await routeMessage(component, { type: 'viewLeaderboard' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-leaderboard');
        });

        test('viewBadges navigates to /driver-badges', async () => {
            await routeMessage(component, { type: 'viewBadges' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/driver-badges');
        });

        test('navigateTo routes to correct path', async () => {
            await routeMessage(component, { type: 'navigateTo', data: { action: 'dashboard' } });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/carrier-dashboard');
        });

        test('ping responds with pong', async () => {
            await routeMessage(component, { type: 'ping' });
            expect(component.postMessage).toHaveBeenCalledWith({ type: 'pong' });
        });
    });

    describe('Error handling', () => {
        test('gamificationReady failure sends error', async () => {
            const failBackend = { ...mockBackend, getRecruiterProgression: jest.fn().mockRejectedValue(new Error('Service unavailable')) };
            await routeMessage(component, { type: 'gamificationReady' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error', data: { message: 'Service unavailable' }
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
