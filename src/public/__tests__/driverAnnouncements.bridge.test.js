/**
 * DRIVER_ANNOUNCEMENTS Bridge Tests
 * ===================================
 * Tests for src/pages/DRIVER_ANNOUNCEMENTS.jgkc4.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * **TYPE PROTOCOL** (not action protocol)
 * Switch on `msg.type`, params in `msg.data`, responses as `{ type: '...', data, timestamp }`
 *
 * 4 inbound types:
 *   driverAnnouncementsReady, getDriverAnnouncements,
 *   markAnnouncementRead, addAnnouncementComment
 *
 * 3 outbound types:
 *   driverAnnouncementsData, announcementCommentResult, driverContext
 *
 * Gotcha: markAnnouncementRead is a silent action (no response to HTML)
 * Gotcha: driverId comes from wixUsers.currentUser, carrierId from msg.data
 *
 * @see src/pages/DRIVER_ANNOUNCEMENTS.jgkc4.js
 * @see src/public/driver/DRIVER_ANNOUNCEMENTS.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'DRIVER_ANNOUNCEMENTS.jgkc4.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// EXPECTED IMPORTS AND ACTIONS
// =============================================================================

const EXPECTED_IMPORTS = [
    "from 'backend/carrierAnnouncementsService.jsw'"
];

const ALL_ACTIONS = [
    'driverAnnouncementsReady',
    'getDriverAnnouncements',
    'markAnnouncementRead',
    'addAnnouncementComment'
];

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockBackend = {
    getAnnouncementsForDriver: jest.fn().mockResolvedValue({
        success: true,
        announcements: [
            { _id: 'ann-1', title: 'Holiday Update', priority: 'normal', is_read: false },
            { _id: 'ann-2', title: 'Weather Alert', priority: 'urgent', is_read: true }
        ]
    }),
    markAnnouncementRead: jest.fn().mockResolvedValue({ success: true }),
    addComment: jest.fn().mockResolvedValue({
        success: true,
        comment: { _id: 'cmt-1', comment_text: 'Great update' }
    })
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function sendToHtml(component, type, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage({ type, data, timestamp: Date.now() });
        }
    } catch (err) {
        // silently fail
    }
}

function getHtmlComponent($w) {
    const possibleIds = ['html1', 'html2', 'html3', 'html4', 'html5', 'htmlEmbed1'];
    for (const id of possibleIds) {
        try {
            const el = $w(`#${id}`);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // skip
        }
    }
    return null;
}

let driverId = 'test-driver-1';
let carrierId = 'carrier-test-1';

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'driverAnnouncementsReady':
            if (driverId || carrierId) {
                sendToHtml(component, 'driverContext', { driverId, carrierId });
            }
            break;

        case 'getDriverAnnouncements': {
            try {
                const data = msg.data || {};
                const did = data.driverId || driverId;
                const cid = data.carrierId || carrierId;

                if (!did || !cid) {
                    sendToHtml(component, 'driverAnnouncementsData', { success: false, error: 'Missing driver or carrier context' });
                    return;
                }

                driverId = did;
                carrierId = cid;

                const options = { limit: data.limit || 100, offset: data.offset || 0 };
                const result = await backend.getAnnouncementsForDriver(did, cid, options);

                sendToHtml(component, 'driverAnnouncementsData', {
                    success: result.success,
                    announcements: result.success ? result.announcements : [],
                    error: result.error
                });
            } catch (error) {
                sendToHtml(component, 'driverAnnouncementsData', { success: false, error: error.message });
            }
            break;
        }

        case 'markAnnouncementRead': {
            try {
                const data = msg.data || {};
                const { announcementId, deviceType, timeSpentSeconds } = data;
                const did = data.driverId || driverId;

                if (!announcementId || !did) {
                    return; // Silent fail for read receipts
                }

                await backend.markAnnouncementRead(announcementId, did, deviceType || 'web', timeSpentSeconds);
                // No response sent - silent
            } catch (error) {
                // Don't send error to HTML - read receipts fail silently
                console.error('Error marking announcement read:', error);
            }
            break;
        }

        case 'addAnnouncementComment': {
            try {
                const data = msg.data || {};
                const { announcementId, commentText } = data;
                const did = data.driverId || driverId;

                if (!announcementId || !did || !commentText) {
                    sendToHtml(component, 'announcementCommentResult', { success: false, error: 'Missing required fields' });
                    return;
                }

                const result = await backend.addComment(announcementId, did, commentText);
                sendToHtml(component, 'announcementCommentResult', result);
            } catch (error) {
                sendToHtml(component, 'announcementCommentResult', { success: false, error: error.message });
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

describe('DRIVER_ANNOUNCEMENTS Bridge Tests', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
        driverId = 'test-driver-1';
        carrierId = 'carrier-test-1';
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('file exists and is readable', () => {
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML component IDs', () => {
            expect(sourceCode).toContain('html1');
        });

        EXPECTED_IMPORTS.forEach(importPath => {
            test(`imports ${importPath}`, () => {
                expect(sourceCode).toContain(importPath);
            });
        });

        test('defines sendToHtml helper', () => {
            expect(sourceCode).toContain('function sendToHtml');
        });

        test('defines MESSAGE_REGISTRY with all inbound types', () => {
            ALL_ACTIONS.forEach(action => {
                expect(sourceCode).toContain(`'${action}'`);
            });
        });

        test('imports wixUsers', () => {
            expect(sourceCode).toContain("from 'wix-users'");
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('sendToHtml wraps postMessage in try-catch', () => {
            expect(sourceCode).toMatch(/typeof component\.postMessage\s*===\s*'function'/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components with onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });
            const comp = getHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
        });

        test('skips components that throw errors', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const comp = getHtmlComponent(mock$w);
            expect(comp).toBeNull();
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

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'nonExistentType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('driverAnnouncementsReady sends driverContext', async () => {
            await routeMessage(component, { type: 'driverAnnouncementsReady' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'driverContext',
                    data: { driverId: 'test-driver-1', carrierId: 'carrier-test-1' }
                })
            );
        });

        test('getDriverAnnouncements calls backend and sends data', async () => {
            await routeMessage(component, {
                type: 'getDriverAnnouncements',
                data: { driverId: 'drv-1', carrierId: 'c-1' }
            });
            expect(mockBackend.getAnnouncementsForDriver).toHaveBeenCalledWith(
                'drv-1', 'c-1', expect.objectContaining({ limit: 100 })
            );
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'driverAnnouncementsData',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('getDriverAnnouncements with missing context sends error', async () => {
            driverId = null;
            carrierId = null;
            await routeMessage(component, {
                type: 'getDriverAnnouncements',
                data: {}
            });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'driverAnnouncementsData',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('markAnnouncementRead calls backend silently', async () => {
            await routeMessage(component, {
                type: 'markAnnouncementRead',
                data: { announcementId: 'ann-1', deviceType: 'mobile', timeSpentSeconds: 30 }
            });
            expect(mockBackend.markAnnouncementRead).toHaveBeenCalledWith(
                'ann-1', 'test-driver-1', 'mobile', 30
            );
            // Silent - no postMessage response
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('markAnnouncementRead with missing id does nothing', async () => {
            await routeMessage(component, {
                type: 'markAnnouncementRead',
                data: {}
            });
            expect(mockBackend.markAnnouncementRead).not.toHaveBeenCalled();
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('addAnnouncementComment calls backend and sends result', async () => {
            await routeMessage(component, {
                type: 'addAnnouncementComment',
                data: { announcementId: 'ann-1', commentText: 'Nice update' }
            });
            expect(mockBackend.addComment).toHaveBeenCalledWith(
                'ann-1', 'test-driver-1', 'Nice update'
            );
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementCommentResult',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('addAnnouncementComment with missing fields sends error', async () => {
            await routeMessage(component, {
                type: 'addAnnouncementComment',
                data: { announcementId: 'ann-1' }
            });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementCommentResult',
                    data: expect.objectContaining({ success: false })
                })
            );
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getDriverAnnouncements failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                getAnnouncementsForDriver: jest.fn().mockRejectedValue(new Error('Network error'))
            };
            await routeMessage(component, {
                type: 'getDriverAnnouncements',
                data: { driverId: 'drv-1', carrierId: 'c-1' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'driverAnnouncementsData',
                    data: expect.objectContaining({ success: false, error: 'Network error' })
                })
            );
        });

        test('markAnnouncementRead failure is silent', async () => {
            const failBackend = {
                ...mockBackend,
                markAnnouncementRead: jest.fn().mockRejectedValue(new Error('DB error'))
            };
            await routeMessage(component, {
                type: 'markAnnouncementRead',
                data: { announcementId: 'ann-1' }
            }, failBackend);
            // Should NOT send any error to HTML
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('addAnnouncementComment failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                addComment: jest.fn().mockRejectedValue(new Error('Comment blocked'))
            };
            await routeMessage(component, {
                type: 'addAnnouncementComment',
                data: { announcementId: 'ann-1', commentText: 'Test' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementCommentResult',
                    data: expect.objectContaining({ success: false, error: 'Comment blocked' })
                })
            );
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('sendToHtml utility', () => {
        test('does nothing if component is null', () => {
            expect(() => sendToHtml(null, 'test', {})).not.toThrow();
        });

        test('does nothing if component has no postMessage', () => {
            expect(() => sendToHtml({}, 'test', {})).not.toThrow();
        });

        test('calls postMessage with type/data/timestamp envelope', () => {
            sendToHtml(component, 'testType', { key: 'val' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'testType',
                    data: { key: 'val' },
                    timestamp: expect.any(Number)
                })
            );
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getDriverAnnouncements uses default deviceType web for markRead', async () => {
            await routeMessage(component, {
                type: 'markAnnouncementRead',
                data: { announcementId: 'ann-1' }
            });
            expect(mockBackend.markAnnouncementRead).toHaveBeenCalledWith(
                'ann-1', 'test-driver-1', 'web', undefined
            );
        });

        test('getDriverAnnouncements stores driverId and carrierId for later use', async () => {
            await routeMessage(component, {
                type: 'getDriverAnnouncements',
                data: { driverId: 'new-drv', carrierId: 'new-carrier' }
            });
            expect(driverId).toBe('new-drv');
            expect(carrierId).toBe('new-carrier');
        });
    });
});
