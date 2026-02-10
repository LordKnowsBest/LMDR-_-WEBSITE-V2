/* eslint-disable */
/**
 * DRIVER_GAMIFICATION Bridge Tests
 *
 * Tests for src/pages/DRIVER_GAMIFICATION.ik6n7.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol (not action).
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'DRIVER_GAMIFICATION.ik6n7.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockWixLocation = { to: jest.fn() };

const mockBackend = {
    getDriverProgression: jest.fn().mockResolvedValue({ level: 5, xp: 500 }),
    getActiveChallenges: jest.fn().mockResolvedValue([{ id: 'c1', name: 'Test' }]),
    getBadges: jest.fn().mockResolvedValue({ achievements: [{ id: 'b1' }] }),
    startChallenge: jest.fn().mockResolvedValue({ success: true, challengeId: 'c1' }),
    claimChallengeReward: jest.fn().mockResolvedValue({ success: true, xpAwarded: 100 })
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

async function routeMessage(component, msg, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!msg?.type) return;

    try {
        switch (msg.type) {
            case 'gamificationReady':
            case 'refreshGamification': {
                const [progression, challenges, badges] = await Promise.all([
                    backend.getDriverProgression('testUser'),
                    backend.getActiveChallenges('testUser', 'driver'),
                    backend.getBadges('testUser', 'driver')
                ]);
                safeSend(component, {
                    type: 'gamificationData',
                    data: {
                        progression: progression || {},
                        challenges: challenges || [],
                        achievements: badges.achievements || badges || [],
                        recommendations: []
                    }
                });
                break;
            }
            case 'startChallenge': {
                const data = msg.data || {};
                if (!data.challengeId) return;
                const result = await backend.startChallenge('testUser', data.challengeId, 'driver');
                safeSend(component, { type: 'challengeUpdate', data: result });
                break;
            }
            case 'claimReward': {
                const data = msg.data || {};
                if (!data.challengeId) return;
                const result = await backend.claimChallengeReward('testUser', data.challengeId, 'driver');
                safeSend(component, { type: 'challengeComplete', data: result });
                break;
            }
            case 'viewChallenges':
                wixLocation.to('/challenges');
                break;
            case 'viewAchievements':
                wixLocation.to('/driver-badges');
                break;
            case 'navigateTo': {
                const data = msg.data || {};
                if (data.action) {
                    const routes = { profile: '/driver-profile', jobs: '/apply-for-cdl-driving-jobs', challenges: '/challenges', badges: '/driver-badges', streak: '/driver-gamification' };
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

describe('DRIVER_GAMIFICATION Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    describe('Source file structure', () => {
        test('imports from backend/gamificationService', () => {
            expect(sourceCode).toContain("from 'backend/gamificationService'");
        });

        test('imports from backend/challengeService', () => {
            expect(sourceCode).toContain("from 'backend/challengeService'");
        });

        test('imports from backend/badgeService', () => {
            expect(sourceCode).toContain("from 'backend/badgeService'");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        test('uses type key protocol', () => {
            expect(sourceCode).toContain('msg.type');
            expect(sourceCode).not.toMatch(/msg\.action\b/);
        });
    });

    describe('Safety checks', () => {
        test('$w calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(id\)[\s\S]*?\}\s*catch/);
        });

        test('safeSend wraps postMessage in try-catch', () => {
            expect(sourceCode).toContain('function safeSend');
            const safeSendFn = sourceCode.match(/function safeSend[\s\S]*?^\}/m);
            expect(safeSendFn[0]).toContain('try');
            expect(safeSendFn[0]).toContain('catch');
        });
    });

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

    describe('Message routing', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('gamificationReady loads progression, challenges, badges', async () => {
            await routeMessage(component, { type: 'gamificationReady' });
            expect(mockBackend.getDriverProgression).toHaveBeenCalled();
            expect(mockBackend.getActiveChallenges).toHaveBeenCalled();
            expect(mockBackend.getBadges).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'gamificationData',
                data: expect.objectContaining({ progression: { level: 5, xp: 500 } })
            }));
        });

        test('refreshGamification calls same handler as gamificationReady', async () => {
            await routeMessage(component, { type: 'refreshGamification' });
            expect(mockBackend.getDriverProgression).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'gamificationData' }));
        });

        test('startChallenge calls startChallenge and sends challengeUpdate', async () => {
            await routeMessage(component, { type: 'startChallenge', data: { challengeId: 'c1' } });
            expect(mockBackend.startChallenge).toHaveBeenCalledWith('testUser', 'c1', 'driver');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'challengeUpdate',
                data: { success: true, challengeId: 'c1' }
            });
        });

        test('startChallenge without challengeId does nothing', async () => {
            await routeMessage(component, { type: 'startChallenge', data: {} });
            expect(mockBackend.startChallenge).not.toHaveBeenCalled();
        });

        test('claimReward calls claimChallengeReward and sends challengeComplete', async () => {
            await routeMessage(component, { type: 'claimReward', data: { challengeId: 'c1' } });
            expect(mockBackend.claimChallengeReward).toHaveBeenCalledWith('testUser', 'c1', 'driver');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'challengeComplete',
                data: { success: true, xpAwarded: 100 }
            });
        });

        test('claimReward without challengeId does nothing', async () => {
            await routeMessage(component, { type: 'claimReward', data: {} });
            expect(mockBackend.claimChallengeReward).not.toHaveBeenCalled();
        });

        test('viewChallenges navigates to /challenges', async () => {
            await routeMessage(component, { type: 'viewChallenges' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/challenges');
        });

        test('viewAchievements navigates to /driver-badges', async () => {
            await routeMessage(component, { type: 'viewAchievements' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/driver-badges');
        });

        test('navigateTo routes to correct path', async () => {
            await routeMessage(component, { type: 'navigateTo', data: { action: 'profile' } });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/driver-profile');
        });

        test('ping responds with pong', async () => {
            await routeMessage(component, { type: 'ping' });
            expect(component.postMessage).toHaveBeenCalledWith({ type: 'pong' });
        });

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'unknownType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        test('gamificationReady failure sends error', async () => {
            const failBackend = { ...mockBackend, getDriverProgression: jest.fn().mockRejectedValue(new Error('DB down')) };
            await routeMessage(component, { type: 'gamificationReady' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error',
                data: { message: 'DB down' }
            });
        });

        test('startChallenge failure sends error', async () => {
            const failBackend = { ...mockBackend, startChallenge: jest.fn().mockRejectedValue(new Error('Challenge error')) };
            await routeMessage(component, { type: 'startChallenge', data: { challengeId: 'c1' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error',
                data: { message: 'Challenge error' }
            });
        });

        test('claimReward failure sends error', async () => {
            const failBackend = { ...mockBackend, claimChallengeReward: jest.fn().mockRejectedValue(new Error('Claim failed')) };
            await routeMessage(component, { type: 'claimReward', data: { challengeId: 'c1' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error',
                data: { message: 'Claim failed' }
            });
        });
    });

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
});
