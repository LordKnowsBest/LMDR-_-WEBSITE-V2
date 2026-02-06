/**
 * ADMIN_CONTENT Bridge Tests
 * ===========================
 * Tests for src/pages/ADMIN_CONTENT.ods3g.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * Message protocol: action/payload
 * Actions: navigate, getModerationQueue, performModeration
 * Backend: admin_content_service (getModerationQueue, updateReviewStatus, updateJobStatus, updateDocumentStatus)
 *
 * Gotcha: getModerationQueue failure sends empty data (graceful degradation), NOT actionError
 * Gotcha: performModeration branches by type: review/job/document
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'ADMIN_CONTENT.ods3g.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockWixLocation = { to: jest.fn() };

const mockBackend = {
    getModerationQueue: jest.fn().mockResolvedValue({
        items: [{ id: 'r1', type: 'review', status: 'pending' }],
        total: 1
    }),
    updateReviewStatus: jest.fn().mockResolvedValue({ success: true }),
    updateJobStatus: jest.fn().mockResolvedValue({ success: true }),
    updateDocumentStatus: jest.fn().mockResolvedValue({ success: true })
};

// =============================================================================
// REPLICATED CORE LOGIC (mirrors page code for testability)
// =============================================================================

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        // silently fail like the source
    }
}

function findHtmlComponent($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // skip
        }
    }
    return null;
}

function handleNavigate(target, wixLocation = mockWixLocation) {
    try {
        if (target === 'dashboard') {
            wixLocation.to('/admin-dashboard');
        } else {
            wixLocation.to('/' + (target || ''));
        }
    } catch (err) {
        // silently fail
    }
}

async function handleGetModerationQueue(component, backend = mockBackend) {
    try {
        const result = await backend.getModerationQueue();
        safeSend(component, {
            action: 'moderationQueueLoaded',
            payload: {
                items: result.items || [],
                total: result.total || 0
            }
        });
    } catch (err) {
        // Graceful degradation: send empty data, NOT actionError
        safeSend(component, {
            action: 'moderationQueueLoaded',
            payload: { items: [], total: 0 }
        });
    }
}

async function handlePerformModeration(component, payload, backend = mockBackend) {
    if (!payload || !payload.id || !payload.type || !payload.status) {
        return;
    }

    const { id, type, subtype, status, reason } = payload;

    try {
        let result;

        switch (type) {
            case 'review':
                result = await backend.updateReviewStatus(id, status, reason || '');
                break;
            case 'job':
                result = await backend.updateJobStatus(id, status);
                break;
            case 'document':
                result = await backend.updateDocumentStatus(id, subtype, status, reason || '');
                break;
            default:
                return;
        }

        if (result && result.success) {
            safeSend(component, {
                action: 'actionSuccess',
                payload: { id }
            });
        }
    } catch (err) {
        // silently fail per source
    }
}

async function routeMessage(component, msg, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!msg || !msg.action) return;

    switch (msg.action) {
        case 'navigate':
            handleNavigate(msg.target, wixLocation);
            break;
        case 'getModerationQueue':
            await handleGetModerationQueue(component, backend);
            break;
        case 'performModeration':
            await handlePerformModeration(component, msg.payload, backend);
            break;
        default:
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_CONTENT Page Code (Bridge)', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('imports from backend/admin_content_service', () => {
            expect(sourceCode).toContain("from 'backend/admin_content_service'");
        });

        test('imports wixLocationFrontend', () => {
            expect(sourceCode).toContain("wixLocationFrontend");
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        test('handles navigate action', () => {
            expect(sourceCode).toContain("case 'navigate'");
        });

        test('handles getModerationQueue action', () => {
            expect(sourceCode).toContain("case 'getModerationQueue'");
        });

        test('handles performModeration action', () => {
            expect(sourceCode).toContain("case 'performModeration'");
        });

        test('sends init signal to HTML', () => {
            expect(sourceCode).toContain("action: 'init'");
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('defines safeSend helper', () => {
            expect(sourceCode).toContain('function safeSend');
        });

        test('safeSend is wrapped in try-catch', () => {
            const safeSendMatch = sourceCode.match(/function safeSend[\s\S]*?\n\}/);
            expect(safeSendMatch).not.toBeNull();
            expect(safeSendMatch[0]).toContain('try');
            expect(safeSendMatch[0]).toContain('catch');
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds first component with onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });
            const comp = findHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
        });

        test('returns null when no component found', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            expect(findHtmlComponent(mock$w)).toBeNull();
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores null/undefined/empty messages', async () => {
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            await routeMessage(component, {});
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('navigate to dashboard routes correctly', async () => {
            await routeMessage(component, { action: 'navigate', target: 'dashboard' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/admin-dashboard');
        });

        test('navigate to arbitrary target routes with prefix', async () => {
            await routeMessage(component, { action: 'navigate', target: 'admin-drivers' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/admin-drivers');
        });

        test('getModerationQueue calls backend and sends moderationQueueLoaded', async () => {
            await routeMessage(component, { action: 'getModerationQueue' });
            expect(mockBackend.getModerationQueue).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'moderationQueueLoaded',
                payload: {
                    items: [{ id: 'r1', type: 'review', status: 'pending' }],
                    total: 1
                }
            });
        });

        test('getModerationQueue failure sends empty data (graceful degradation)', async () => {
            const failBackend = {
                ...mockBackend,
                getModerationQueue: jest.fn().mockRejectedValue(new Error('DB error'))
            };
            await routeMessage(component, { action: 'getModerationQueue' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'moderationQueueLoaded',
                payload: { items: [], total: 0 }
            });
        });

        test('performModeration with type=review calls updateReviewStatus', async () => {
            await routeMessage(component, {
                action: 'performModeration',
                payload: { id: 'r1', type: 'review', status: 'approved', reason: 'Looks good' }
            });
            expect(mockBackend.updateReviewStatus).toHaveBeenCalledWith('r1', 'approved', 'Looks good');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                payload: { id: 'r1' }
            });
        });

        test('performModeration with type=job calls updateJobStatus', async () => {
            await routeMessage(component, {
                action: 'performModeration',
                payload: { id: 'j1', type: 'job', status: 'closed' }
            });
            expect(mockBackend.updateJobStatus).toHaveBeenCalledWith('j1', 'closed');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                payload: { id: 'j1' }
            });
        });

        test('performModeration with type=document calls updateDocumentStatus', async () => {
            await routeMessage(component, {
                action: 'performModeration',
                payload: { id: 'd1', type: 'document', subtype: 'cdl', status: 'verified', reason: '' }
            });
            expect(mockBackend.updateDocumentStatus).toHaveBeenCalledWith('d1', 'cdl', 'verified', '');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionSuccess',
                payload: { id: 'd1' }
            });
        });

        test('performModeration with missing params does nothing', async () => {
            await routeMessage(component, {
                action: 'performModeration',
                payload: { id: 'r1' }
            });
            expect(mockBackend.updateReviewStatus).not.toHaveBeenCalled();
            expect(mockBackend.updateJobStatus).not.toHaveBeenCalled();
            expect(mockBackend.updateDocumentStatus).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('performModeration with null payload does nothing', async () => {
            await routeMessage(component, { action: 'performModeration', payload: null });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('performModeration with unknown type does nothing', async () => {
            await routeMessage(component, {
                action: 'performModeration',
                payload: { id: 'x1', type: 'unknown', status: 'active' }
            });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('performModeration defaults reason to empty string for review', async () => {
            await routeMessage(component, {
                action: 'performModeration',
                payload: { id: 'r1', type: 'review', status: 'rejected' }
            });
            expect(mockBackend.updateReviewStatus).toHaveBeenCalledWith('r1', 'rejected', '');
        });

        test('unknown action does not send any message', async () => {
            await routeMessage(component, { action: 'nonExistentAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('performModeration review failure does not send message', async () => {
            const failBackend = {
                ...mockBackend,
                updateReviewStatus: jest.fn().mockRejectedValue(new Error('Update failed'))
            };
            await routeMessage(component, {
                action: 'performModeration',
                payload: { id: 'r1', type: 'review', status: 'approved' }
            }, failBackend);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('performModeration with failed result does not send success', async () => {
            const noSuccessBackend = {
                ...mockBackend,
                updateReviewStatus: jest.fn().mockResolvedValue({ success: false })
            };
            await routeMessage(component, {
                action: 'performModeration',
                payload: { id: 'r1', type: 'review', status: 'approved' }
            }, noSuccessBackend);
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { action: 'test' })).not.toThrow();
        });
    });
});
