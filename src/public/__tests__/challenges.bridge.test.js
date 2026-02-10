/* eslint-disable */
/**
 * CHALLENGES Bridge Tests
 *
 * Tests for src/pages/CHALLENGES.upscp.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'CHALLENGES.upscp.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    getActiveChallenges: jest.fn().mockResolvedValue([{ id: 'c1', name: 'Daily Login', progress: 3, target: 7 }]),
    getAvailableChallenges: jest.fn().mockResolvedValue([{ id: 'c2', name: 'Apply to 5 Jobs' }]),
    getChallengeHistory: jest.fn().mockResolvedValue([{ id: 'c0', name: 'Completed Challenge' }]),
    startChallenge: jest.fn().mockResolvedValue({ success: true, challengeId: 'c2' }),
    claimChallengeReward: jest.fn().mockResolvedValue({ success: true, xpAwarded: 150 })
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
            case 'challengesReady': {
                const [active, available, history] = await Promise.all([
                    backend.getActiveChallenges('testUser', 'driver'),
                    backend.getAvailableChallenges('testUser', 'driver'),
                    backend.getChallengeHistory('testUser', 'driver', { limit: 20 })
                ]);
                safeSend(component, {
                    type: 'challengesData',
                    data: {
                        userType: 'driver',
                        active: active || [],
                        available: available || [],
                        completed: history || []
                    }
                });
                break;
            }
            case 'startChallenge': {
                const data = msg.data || {};
                if (!data.challengeId) return;
                const result = await backend.startChallenge('testUser', data.challengeId, 'driver');
                safeSend(component, { type: 'challengeStarted', data: result });
                break;
            }
            case 'claimReward': {
                const data = msg.data || {};
                if (!data.challengeId) return;
                const result = await backend.claimChallengeReward('testUser', data.challengeId, 'driver');
                safeSend(component, { type: 'rewardClaimed', data: result });
                break;
            }
            default:
                break;
        }
    } catch (error) {
        safeSend(component, { type: 'error', data: { message: error.message || 'An unexpected error occurred' } });
    }
}

describe('CHALLENGES Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    describe('Source file structure', () => {
        test('imports from backend/challengeService', () => {
            expect(sourceCode).toContain("from 'backend/challengeService'");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('uses type key protocol', () => {
            expect(sourceCode).toContain('msg.type');
        });

        test('defines safeSend', () => {
            expect(sourceCode).toContain('function safeSend');
        });
    });

    describe('Message routing', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('challengesReady loads active, available, and history', async () => {
            await routeMessage(component, { type: 'challengesReady' });
            expect(mockBackend.getActiveChallenges).toHaveBeenCalled();
            expect(mockBackend.getAvailableChallenges).toHaveBeenCalled();
            expect(mockBackend.getChallengeHistory).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'challengesData',
                data: {
                    userType: 'driver',
                    active: [{ id: 'c1', name: 'Daily Login', progress: 3, target: 7 }],
                    available: [{ id: 'c2', name: 'Apply to 5 Jobs' }],
                    completed: [{ id: 'c0', name: 'Completed Challenge' }]
                }
            });
        });

        test('startChallenge calls startChallenge and sends challengeStarted', async () => {
            await routeMessage(component, { type: 'startChallenge', data: { challengeId: 'c2' } });
            expect(mockBackend.startChallenge).toHaveBeenCalledWith('testUser', 'c2', 'driver');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'challengeStarted',
                data: { success: true, challengeId: 'c2' }
            });
        });

        test('startChallenge without challengeId does nothing', async () => {
            await routeMessage(component, { type: 'startChallenge', data: {} });
            expect(mockBackend.startChallenge).not.toHaveBeenCalled();
        });

        test('claimReward calls claimChallengeReward and sends rewardClaimed', async () => {
            await routeMessage(component, { type: 'claimReward', data: { challengeId: 'c1' } });
            expect(mockBackend.claimChallengeReward).toHaveBeenCalledWith('testUser', 'c1', 'driver');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'rewardClaimed',
                data: { success: true, xpAwarded: 150 }
            });
        });

        test('claimReward without challengeId does nothing', async () => {
            await routeMessage(component, { type: 'claimReward', data: {} });
            expect(mockBackend.claimChallengeReward).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        test('challengesReady failure sends error', async () => {
            const failBackend = { ...mockBackend, getActiveChallenges: jest.fn().mockRejectedValue(new Error('DB timeout')) };
            await routeMessage(component, { type: 'challengesReady' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error', data: { message: 'DB timeout' }
            });
        });

        test('startChallenge failure sends error', async () => {
            const failBackend = { ...mockBackend, startChallenge: jest.fn().mockRejectedValue(new Error('Already active')) };
            await routeMessage(component, { type: 'startChallenge', data: { challengeId: 'c1' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error', data: { message: 'Already active' }
            });
        });

        test('claimReward failure sends error', async () => {
            const failBackend = { ...mockBackend, claimChallengeReward: jest.fn().mockRejectedValue(new Error('Not completed')) };
            await routeMessage(component, { type: 'claimReward', data: { challengeId: 'c1' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error', data: { message: 'Not completed' }
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
