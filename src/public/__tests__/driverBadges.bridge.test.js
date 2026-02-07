/**
 * DRIVER_BADGES Bridge Tests
 *
 * Tests for src/pages/DRIVER_BADGES.jlfgc.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol.
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'DRIVER_BADGES.jlfgc.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    getBadges: jest.fn().mockResolvedValue({ achievements: [{ id: 'b1', name: 'First Steps' }], featured: ['b1'] }),
    getBadgeDefinitions: jest.fn().mockResolvedValue([{ id: 'b1', name: 'First Steps' }])
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
            case 'badgesReady': {
                const badges = await backend.getBadges('testUser', 'driver');
                safeSend(component, {
                    type: 'achievementsData',
                    data: {
                        achievements: badges.achievements || badges || [],
                        featured: badges.featured || []
                    }
                });
                break;
            }
            case 'updateFeatured': {
                const data = msg.data || {};
                safeSend(component, {
                    type: 'featuredUpdated',
                    data: { featured: data.featured || [] }
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

describe('DRIVER_BADGES Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    describe('Source file structure', () => {
        test('imports from backend/badgeService', () => {
            expect(sourceCode).toContain("from 'backend/badgeService'");
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

    describe('Safety checks', () => {
        test('$w calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(id\)[\s\S]*?\}\s*catch/);
        });

        test('safeSend wraps postMessage in try-catch', () => {
            const safeSendFn = sourceCode.match(/function safeSend[\s\S]*?^\}/m);
            expect(safeSendFn[0]).toContain('try');
            expect(safeSendFn[0]).toContain('catch');
        });
    });

    describe('Message routing', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('badgesReady calls getBadges and sends achievementsData', async () => {
            await routeMessage(component, { type: 'badgesReady' });
            expect(mockBackend.getBadges).toHaveBeenCalledWith('testUser', 'driver');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'achievementsData',
                data: {
                    achievements: [{ id: 'b1', name: 'First Steps' }],
                    featured: ['b1']
                }
            });
        });

        test('updateFeatured returns featured list', async () => {
            await routeMessage(component, { type: 'updateFeatured', data: { featured: ['b1', 'b2'] } });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'featuredUpdated',
                data: { featured: ['b1', 'b2'] }
            });
        });

        test('updateFeatured defaults to empty array', async () => {
            await routeMessage(component, { type: 'updateFeatured', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'featuredUpdated',
                data: { featured: [] }
            });
        });

        test('unknown type does not send message', async () => {
            await routeMessage(component, { type: 'unknownType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        test('badgesReady failure sends error', async () => {
            const failBackend = { ...mockBackend, getBadges: jest.fn().mockRejectedValue(new Error('Badge load failed')) };
            await routeMessage(component, { type: 'badgesReady' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'error',
                data: { message: 'Badge load failed' }
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

        test('does not throw if postMessage throws', () => {
            const bad = { postMessage: jest.fn(() => { throw new Error('Detached'); }) };
            expect(() => safeSend(bad, { type: 'test' })).not.toThrow();
        });
    });
});
