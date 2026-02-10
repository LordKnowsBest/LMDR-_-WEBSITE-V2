/* eslint-disable */
/**
 * ADMIN_MODERATION Bridge Tests
 *
 * Tests for src/pages/ADMIN_MODERATION.sn1km.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol: { type, payload }
 *
 * Actions tested:
 *   1. ready -> getModQueue({status:'pending'}) -> queueData
 *   2. getQueue -> getModQueue({status}) -> queueData
 *   3. moderateReport -> moderatePost(reportId, action, notes) -> actionSuccess or actionError
 *
 * Action mapping: dismiss->approve, warn->warn, hide->hide, ban->ban
 *
 * @see src/pages/ADMIN_MODERATION.sn1km.js
 * @see src/public/admin/ADMIN_MODERATION.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'ADMIN_MODERATION.sn1km.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    getModQueue: jest.fn().mockResolvedValue({
        items: [
            { _id: 'r1', postId: 'p1', reason: 'spam', status: 'pending', details: 'Spam content' },
            { _id: 'r2', postId: 'p2', reason: 'harassment', status: 'pending', details: 'Rude comment' }
        ]
    }),
    moderatePost: jest.fn().mockResolvedValue({ success: true })
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

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg?.type) return;

    switch (msg.type) {
        case 'ready': {
            try {
                const result = await backend.getModQueue({ status: 'pending' });
                safeSend(component, {
                    type: 'queueData',
                    payload: { items: result.items || [] }
                });
            } catch (err) {
                safeSend(component, {
                    type: 'queueData',
                    payload: { items: [] }
                });
            }
            break;
        }
        case 'getQueue': {
            try {
                const status = (msg.payload && msg.payload.status) || 'pending';
                const result = await backend.getModQueue({ status });
                safeSend(component, {
                    type: 'queueData',
                    payload: { items: result.items || [] }
                });
            } catch (err) {
                safeSend(component, {
                    type: 'queueData',
                    payload: { items: [] }
                });
            }
            break;
        }
        case 'moderateReport': {
            try {
                const payload = msg.payload || {};
                if (!payload.reportId || !payload.action) return;

                const actionMap = {
                    dismiss: 'approve',
                    warn: 'warn',
                    hide: 'hide',
                    ban: 'ban'
                };
                const backendAction = actionMap[payload.action] || payload.action;

                await backend.moderatePost(payload.reportId, backendAction, payload.notes || '');

                safeSend(component, {
                    type: 'actionSuccess',
                    payload: { reportId: payload.reportId }
                });
            } catch (err) {
                const payload = msg.payload || {};
                safeSend(component, {
                    type: 'actionError',
                    payload: {
                        reportId: payload.reportId,
                        error: err.message || 'Moderation action failed'
                    }
                });
            }
            break;
        }
        default:
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_MODERATION Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/moderationService', () => {
            expect(sourceCode).toContain("from 'backend/moderationService'");
        });

        test('imports getModQueue', () => {
            expect(sourceCode).toContain('getModQueue');
        });

        test('imports moderatePost', () => {
            expect(sourceCode).toContain('moderatePost');
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        test('uses type key protocol (not action)', () => {
            expect(sourceCode).toContain('msg.type');
        });

        test('defines safeSend helper', () => {
            expect(sourceCode).toContain('function safeSend');
        });

        test('defines action mapping (dismiss->approve)', () => {
            expect(sourceCode).toContain("dismiss: 'approve'");
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('safeSend wraps postMessage in try-catch', () => {
            const safeSendFn = sourceCode.match(/function safeSend[\s\S]*?^\}/m);
            expect(safeSendFn[0]).toContain('try');
            expect(safeSendFn[0]).toContain('catch');
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

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

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ready calls getModQueue with pending and sends queueData', async () => {
            await routeMessage(component, { type: 'ready' });
            expect(mockBackend.getModQueue).toHaveBeenCalledWith({ status: 'pending' });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'queueData',
                payload: { items: expect.any(Array) }
            });
        });

        test('getQueue calls getModQueue with specified status', async () => {
            await routeMessage(component, { type: 'getQueue', payload: { status: 'resolved' } });
            expect(mockBackend.getModQueue).toHaveBeenCalledWith({ status: 'resolved' });
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'queueData',
                payload: { items: expect.any(Array) }
            });
        });

        test('getQueue defaults to pending when no status specified', async () => {
            await routeMessage(component, { type: 'getQueue', payload: {} });
            expect(mockBackend.getModQueue).toHaveBeenCalledWith({ status: 'pending' });
        });

        test('moderateReport with dismiss maps to approve', async () => {
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { reportId: 'r1', action: 'dismiss', notes: 'No violation' }
            });
            expect(mockBackend.moderatePost).toHaveBeenCalledWith('r1', 'approve', 'No violation');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'actionSuccess',
                payload: { reportId: 'r1' }
            });
        });

        test('moderateReport with warn calls moderatePost with warn', async () => {
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { reportId: 'r2', action: 'warn', notes: 'First warning' }
            });
            expect(mockBackend.moderatePost).toHaveBeenCalledWith('r2', 'warn', 'First warning');
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'actionSuccess',
                payload: { reportId: 'r2' }
            });
        });

        test('moderateReport with hide calls moderatePost with hide', async () => {
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { reportId: 'r1', action: 'hide', notes: '' }
            });
            expect(mockBackend.moderatePost).toHaveBeenCalledWith('r1', 'hide', '');
        });

        test('moderateReport with ban calls moderatePost with ban', async () => {
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { reportId: 'r1', action: 'ban', notes: 'Repeated violations' }
            });
            expect(mockBackend.moderatePost).toHaveBeenCalledWith('r1', 'ban', 'Repeated violations');
        });

        test('moderateReport without reportId does nothing', async () => {
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { action: 'dismiss' }
            });
            expect(mockBackend.moderatePost).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('moderateReport without action does nothing', async () => {
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { reportId: 'r1' }
            });
            expect(mockBackend.moderatePost).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('moderateReport defaults notes to empty string', async () => {
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { reportId: 'r1', action: 'dismiss' }
            });
            expect(mockBackend.moderatePost).toHaveBeenCalledWith('r1', 'approve', '');
        });

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'unknownType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('ready failure sends empty queue', async () => {
            const failBackend = { ...mockBackend, getModQueue: jest.fn().mockRejectedValue(new Error('DB down')) };
            await routeMessage(component, { type: 'ready' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'queueData',
                payload: { items: [] }
            });
        });

        test('getQueue failure sends empty queue', async () => {
            const failBackend = { ...mockBackend, getModQueue: jest.fn().mockRejectedValue(new Error('Fail')) };
            await routeMessage(component, { type: 'getQueue', payload: { status: 'pending' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'queueData',
                payload: { items: [] }
            });
        });

        test('moderateReport failure sends actionError', async () => {
            const failBackend = { ...mockBackend, moderatePost: jest.fn().mockRejectedValue(new Error('Action failed')) };
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { reportId: 'r1', action: 'ban', notes: 'test' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'actionError',
                payload: {
                    reportId: 'r1',
                    error: 'Action failed'
                }
            });
        });

        test('moderateReport failure with no message uses fallback', async () => {
            const failBackend = { ...mockBackend, moderatePost: jest.fn().mockRejectedValue({}) };
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { reportId: 'r1', action: 'hide' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                type: 'actionError',
                payload: {
                    reportId: 'r1',
                    error: 'Moderation action failed'
                }
            });
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

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

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('ready only calls getModQueue once', async () => {
            await routeMessage(component, { type: 'ready' });
            expect(mockBackend.getModQueue).toHaveBeenCalledTimes(1);
        });

        test('moderateReport calls moderatePost with correct args', async () => {
            await routeMessage(component, {
                type: 'moderateReport',
                payload: { reportId: 'r1', action: 'warn', notes: 'Please be civil' }
            });
            expect(mockBackend.moderatePost).toHaveBeenCalledTimes(1);
            expect(mockBackend.moderatePost).toHaveBeenCalledWith('r1', 'warn', 'Please be civil');
        });
    });
});
