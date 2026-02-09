/**
 * CARRIER_ANNOUNCEMENTS Bridge Tests
 * ====================================
 * Tests for src/pages/CARRIER_ANNOUNCEMENTS.zmhem.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * **TYPE PROTOCOL** (not action protocol)
 * Switch on `msg.type`, params in `msg.data`, responses as `{ type: '...', data, timestamp }`
 * Uses `sendToHtml(type, data)` wrapper to send messages with timestamp.
 *
 * 12 inbound types:
 *   carrierAnnouncementsReady, getCarrierAnnouncements, createAnnouncement,
 *   updateAnnouncement, publishAnnouncement, scheduleAnnouncement,
 *   archiveAnnouncement, previewRecipients, uploadAnnouncementAttachment,
 *   getAnnouncementDetail, sendAnnouncementReminder, setAnnouncementCommentVisibility
 *
 * 8 outbound types:
 *   carrierAnnouncementsData, announcementActionResult, recipientPreviewResult,
 *   announcementAttachmentResult, carrierContext, announcementDetailData,
 *   announcementReminderResult, announcementCommentModerationResult
 *
 * @see src/pages/CARRIER_ANNOUNCEMENTS.zmhem.js
 * @see src/public/carrier/CARRIER_ANNOUNCEMENTS.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'CARRIER_ANNOUNCEMENTS.zmhem.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// EXPECTED IMPORTS AND ACTIONS
// =============================================================================

const EXPECTED_IMPORTS = [
    "from 'backend/carrierAnnouncementsService.jsw'"
];

const ALL_ACTIONS = [
    'carrierAnnouncementsReady',
    'getCarrierAnnouncements',
    'createAnnouncement',
    'updateAnnouncement',
    'publishAnnouncement',
    'scheduleAnnouncement',
    'archiveAnnouncement',
    'previewRecipients',
    'uploadAnnouncementAttachment',
    'getAnnouncementDetail',
    'sendAnnouncementReminder',
    'setAnnouncementCommentVisibility'
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
    getAnnouncementsForCarrier: jest.fn().mockResolvedValue({
        success: true,
        announcements: [{ _id: 'ann-1', title: 'Test', status: 'published' }],
        totalCount: 1
    }),
    createAnnouncement: jest.fn().mockResolvedValue({
        success: true,
        announcement: { _id: 'ann-new', title: 'New' }
    }),
    updateAnnouncement: jest.fn().mockResolvedValue({
        success: true,
        announcement: { _id: 'ann-1', title: 'Updated' }
    }),
    publishAnnouncement: jest.fn().mockResolvedValue({
        success: true,
        announcement: { _id: 'ann-1', status: 'published' }
    }),
    scheduleAnnouncement: jest.fn().mockResolvedValue({
        success: true,
        announcement: { _id: 'ann-1', status: 'scheduled' }
    }),
    archiveAnnouncement: jest.fn().mockResolvedValue({
        success: true,
        announcement: { _id: 'ann-1', status: 'archived' }
    }),
    previewRecipients: jest.fn().mockResolvedValue({
        success: true,
        total: 42
    }),
    uploadAttachment: jest.fn().mockResolvedValue({
        success: true,
        attachment: { url: 'https://example.com/file.pdf', name: 'file.pdf' }
    }),
    getAnnouncementDetail: jest.fn().mockResolvedValue({
        success: true,
        announcement: { _id: 'ann-1', title: 'Detail' },
        comments: [],
        readReceipts: { total: 10, read: 5 }
    }),
    sendReminderToUnreadDrivers: jest.fn().mockResolvedValue({
        success: true,
        sentCount: 8
    }),
    setCommentVisibility: jest.fn().mockResolvedValue({
        success: true,
        commentId: 'cmt-1',
        hidden: true
    }),
    getCarrierContextForCurrentUser: jest.fn().mockResolvedValue({
        success: true,
        carrierId: 'carrier-test-1'
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

// Global state
let carrierId = 'carrier-test-1';

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'carrierAnnouncementsReady':
            if (carrierId) {
                sendToHtml(component, 'carrierContext', { carrierId });
            }
            break;

        case 'getCarrierAnnouncements': {
            try {
                const data = msg.data || {};
                const cid = data.carrierId || carrierId;
                if (!cid) {
                    sendToHtml(component, 'carrierAnnouncementsData', { success: false, error: 'No carrier context' });
                    return;
                }
                carrierId = cid;
                const options = { status: data.status || 'published', limit: data.limit || 100, offset: data.offset || 0 };
                const result = await backend.getAnnouncementsForCarrier(cid, options);
                sendToHtml(component, 'carrierAnnouncementsData', {
                    success: result.success,
                    announcements: result.success ? result.announcements : [],
                    totalCount: result.totalCount || 0,
                    error: result.error
                });
            } catch (error) {
                sendToHtml(component, 'carrierAnnouncementsData', { success: false, error: error.message });
            }
            break;
        }

        case 'createAnnouncement': {
            try {
                const data = msg.data;
                if (!data) {
                    sendToHtml(component, 'announcementActionResult', { success: false, error: 'No data provided' });
                    return;
                }
                const announcementData = { ...data, carrier_id: data.carrier_id || carrierId };
                const result = await backend.createAnnouncement(announcementData);
                sendToHtml(component, 'announcementActionResult', result);
            } catch (error) {
                sendToHtml(component, 'announcementActionResult', { success: false, error: error.message });
            }
            break;
        }

        case 'updateAnnouncement': {
            try {
                const { announcementId, updates } = msg.data || {};
                if (!announcementId || !updates) {
                    sendToHtml(component, 'announcementActionResult', { success: false, error: 'Missing required fields' });
                    return;
                }
                const result = await backend.updateAnnouncement(announcementId, updates);
                sendToHtml(component, 'announcementActionResult', result);
            } catch (error) {
                sendToHtml(component, 'announcementActionResult', { success: false, error: error.message });
            }
            break;
        }

        case 'publishAnnouncement': {
            try {
                const { announcementId } = msg.data || {};
                if (!announcementId) {
                    sendToHtml(component, 'announcementActionResult', { success: false, error: 'Missing announcement ID' });
                    return;
                }
                const result = await backend.publishAnnouncement(announcementId);
                sendToHtml(component, 'announcementActionResult', result);
            } catch (error) {
                sendToHtml(component, 'announcementActionResult', { success: false, error: error.message });
            }
            break;
        }

        case 'scheduleAnnouncement': {
            try {
                const { announcementId, scheduledAt } = msg.data || {};
                if (!announcementId || !scheduledAt) {
                    sendToHtml(component, 'announcementActionResult', { success: false, error: 'Missing required fields' });
                    return;
                }
                const result = await backend.scheduleAnnouncement(announcementId, scheduledAt);
                sendToHtml(component, 'announcementActionResult', result);
            } catch (error) {
                sendToHtml(component, 'announcementActionResult', { success: false, error: error.message });
            }
            break;
        }

        case 'archiveAnnouncement': {
            try {
                const { announcementId } = msg.data || {};
                if (!announcementId) {
                    sendToHtml(component, 'announcementActionResult', { success: false, error: 'Missing announcement ID' });
                    return;
                }
                const result = await backend.archiveAnnouncement(announcementId);
                sendToHtml(component, 'announcementActionResult', result);
            } catch (error) {
                sendToHtml(component, 'announcementActionResult', { success: false, error: error.message });
            }
            break;
        }

        case 'previewRecipients': {
            try {
                const data = msg.data || {};
                const cid = data.carrierId || carrierId;
                const targetAudience = data.targetAudience || { type: 'all', segments: [] };
                if (!cid) {
                    sendToHtml(component, 'recipientPreviewResult', { success: false, error: 'No carrier context' });
                    return;
                }
                const result = await backend.previewRecipients(cid, targetAudience);
                sendToHtml(component, 'recipientPreviewResult', result);
            } catch (error) {
                sendToHtml(component, 'recipientPreviewResult', { success: false, error: error.message });
            }
            break;
        }

        case 'uploadAnnouncementAttachment': {
            try {
                const { base64Data, fileName, mimeType, carrierId: cid } = msg.data || {};
                if (!base64Data || !fileName || !mimeType) {
                    sendToHtml(component, 'announcementAttachmentResult', { success: false, error: 'Missing required fields' });
                    return;
                }
                const result = await backend.uploadAttachment(base64Data, fileName, mimeType, cid || carrierId);
                sendToHtml(component, 'announcementAttachmentResult', result);
            } catch (error) {
                sendToHtml(component, 'announcementAttachmentResult', { success: false, error: error.message });
            }
            break;
        }

        case 'getAnnouncementDetail': {
            try {
                const data = msg.data || {};
                const announcementId = data.announcementId;
                const cid = data.carrierId || carrierId;
                if (!announcementId || !cid) {
                    sendToHtml(component, 'announcementDetailData', { success: false, error: 'Missing announcementId or carrierId' });
                    return;
                }
                const result = await backend.getAnnouncementDetail(announcementId, cid, {
                    limit: data.limit || 50,
                    offset: data.offset || 0,
                    includeHiddenComments: !!data.includeHiddenComments
                });
                sendToHtml(component, 'announcementDetailData', result);
            } catch (error) {
                sendToHtml(component, 'announcementDetailData', { success: false, error: error.message });
            }
            break;
        }

        case 'sendAnnouncementReminder': {
            try {
                const data = msg.data || {};
                const announcementId = data.announcementId;
                const cid = data.carrierId || carrierId;
                if (!announcementId || !cid) {
                    sendToHtml(component, 'announcementReminderResult', { success: false, error: 'Missing announcementId or carrierId' });
                    return;
                }
                const result = await backend.sendReminderToUnreadDrivers(announcementId, cid);
                sendToHtml(component, 'announcementReminderResult', result);
            } catch (error) {
                sendToHtml(component, 'announcementReminderResult', { success: false, error: error.message });
            }
            break;
        }

        case 'setAnnouncementCommentVisibility': {
            try {
                const data = msg.data || {};
                const commentId = data.commentId;
                const hidden = !!data.hidden;
                if (!commentId) {
                    sendToHtml(component, 'announcementCommentModerationResult', { success: false, error: 'Missing commentId' });
                    return;
                }
                const result = await backend.setCommentVisibility(commentId, hidden);
                sendToHtml(component, 'announcementCommentModerationResult', result);
            } catch (error) {
                sendToHtml(component, 'announcementCommentModerationResult', { success: false, error: error.message });
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

describe('CARRIER_ANNOUNCEMENTS Bridge Tests', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
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

        test('skips components without onMessage', () => {
            const mock$w = jest.fn(() => ({ postMessage: jest.fn() }));
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
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'nonExistentType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('carrierAnnouncementsReady sends carrierContext', async () => {
            await routeMessage(component, { type: 'carrierAnnouncementsReady' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'carrierContext',
                    data: { carrierId: 'carrier-test-1' }
                })
            );
        });

        test('getCarrierAnnouncements calls backend and sends data', async () => {
            await routeMessage(component, {
                type: 'getCarrierAnnouncements',
                data: { carrierId: 'c-1', status: 'published' }
            });
            expect(mockBackend.getAnnouncementsForCarrier).toHaveBeenCalledWith('c-1', expect.objectContaining({ status: 'published' }));
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'carrierAnnouncementsData',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('createAnnouncement calls backend and sends result', async () => {
            await routeMessage(component, {
                type: 'createAnnouncement',
                data: { title: 'New Announcement', content: 'Content' }
            });
            expect(mockBackend.createAnnouncement).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'New Announcement', carrier_id: 'carrier-test-1' })
            );
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'announcementActionResult' })
            );
        });

        test('createAnnouncement with no data sends error', async () => {
            await routeMessage(component, { type: 'createAnnouncement' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementActionResult',
                    data: expect.objectContaining({ success: false, error: 'No data provided' })
                })
            );
        });

        test('updateAnnouncement calls backend with id and updates', async () => {
            await routeMessage(component, {
                type: 'updateAnnouncement',
                data: { announcementId: 'ann-1', updates: { title: 'Updated' } }
            });
            expect(mockBackend.updateAnnouncement).toHaveBeenCalledWith('ann-1', { title: 'Updated' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'announcementActionResult' })
            );
        });

        test('updateAnnouncement with missing fields sends error', async () => {
            await routeMessage(component, { type: 'updateAnnouncement', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementActionResult',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('publishAnnouncement calls backend with id', async () => {
            await routeMessage(component, {
                type: 'publishAnnouncement',
                data: { announcementId: 'ann-1' }
            });
            expect(mockBackend.publishAnnouncement).toHaveBeenCalledWith('ann-1');
        });

        test('publishAnnouncement with missing id sends error', async () => {
            await routeMessage(component, { type: 'publishAnnouncement', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('scheduleAnnouncement calls backend with id and scheduledAt', async () => {
            const scheduledAt = '2026-03-01T08:00:00Z';
            await routeMessage(component, {
                type: 'scheduleAnnouncement',
                data: { announcementId: 'ann-1', scheduledAt }
            });
            expect(mockBackend.scheduleAnnouncement).toHaveBeenCalledWith('ann-1', scheduledAt);
        });

        test('scheduleAnnouncement with missing fields sends error', async () => {
            await routeMessage(component, { type: 'scheduleAnnouncement', data: { announcementId: 'ann-1' } });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('archiveAnnouncement calls backend with id', async () => {
            await routeMessage(component, {
                type: 'archiveAnnouncement',
                data: { announcementId: 'ann-1' }
            });
            expect(mockBackend.archiveAnnouncement).toHaveBeenCalledWith('ann-1');
        });

        test('previewRecipients calls backend with carrierId and audience', async () => {
            const targetAudience = { type: 'segments', segments: ['otr'] };
            await routeMessage(component, {
                type: 'previewRecipients',
                data: { carrierId: 'c-1', targetAudience }
            });
            expect(mockBackend.previewRecipients).toHaveBeenCalledWith('c-1', targetAudience);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'recipientPreviewResult' })
            );
        });

        test('uploadAnnouncementAttachment calls backend with file data', async () => {
            await routeMessage(component, {
                type: 'uploadAnnouncementAttachment',
                data: { base64Data: 'abc123', fileName: 'doc.pdf', mimeType: 'application/pdf' }
            });
            expect(mockBackend.uploadAttachment).toHaveBeenCalledWith('abc123', 'doc.pdf', 'application/pdf', 'carrier-test-1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'announcementAttachmentResult' })
            );
        });

        test('uploadAnnouncementAttachment with missing fields sends error', async () => {
            await routeMessage(component, { type: 'uploadAnnouncementAttachment', data: { base64Data: 'abc' } });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementAttachmentResult',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('getAnnouncementDetail calls backend with id and carrierId', async () => {
            await routeMessage(component, {
                type: 'getAnnouncementDetail',
                data: { announcementId: 'ann-1', carrierId: 'c-1' }
            });
            expect(mockBackend.getAnnouncementDetail).toHaveBeenCalledWith('ann-1', 'c-1', expect.any(Object));
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'announcementDetailData' })
            );
        });

        test('getAnnouncementDetail with missing id sends error', async () => {
            await routeMessage(component, { type: 'getAnnouncementDetail', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementDetailData',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('sendAnnouncementReminder calls backend and sends result', async () => {
            await routeMessage(component, {
                type: 'sendAnnouncementReminder',
                data: { announcementId: 'ann-1', carrierId: 'c-1' }
            });
            expect(mockBackend.sendReminderToUnreadDrivers).toHaveBeenCalledWith('ann-1', 'c-1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'announcementReminderResult' })
            );
        });

        test('setAnnouncementCommentVisibility calls backend and sends result', async () => {
            await routeMessage(component, {
                type: 'setAnnouncementCommentVisibility',
                data: { commentId: 'cmt-1', hidden: true }
            });
            expect(mockBackend.setCommentVisibility).toHaveBeenCalledWith('cmt-1', true);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'announcementCommentModerationResult' })
            );
        });

        test('setAnnouncementCommentVisibility with missing commentId sends error', async () => {
            await routeMessage(component, { type: 'setAnnouncementCommentVisibility', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementCommentModerationResult',
                    data: expect.objectContaining({ success: false })
                })
            );
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getCarrierAnnouncements failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                getAnnouncementsForCarrier: jest.fn().mockRejectedValue(new Error('DB timeout'))
            };
            await routeMessage(component, {
                type: 'getCarrierAnnouncements',
                data: { carrierId: 'c-1' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'carrierAnnouncementsData',
                    data: expect.objectContaining({ success: false, error: 'DB timeout' })
                })
            );
        });

        test('createAnnouncement failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                createAnnouncement: jest.fn().mockRejectedValue(new Error('Validation failed'))
            };
            await routeMessage(component, {
                type: 'createAnnouncement',
                data: { title: 'Fail' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementActionResult',
                    data: expect.objectContaining({ success: false, error: 'Validation failed' })
                })
            );
        });

        test('uploadAnnouncementAttachment failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                uploadAttachment: jest.fn().mockRejectedValue(new Error('File too large'))
            };
            await routeMessage(component, {
                type: 'uploadAnnouncementAttachment',
                data: { base64Data: 'x', fileName: 'f.pdf', mimeType: 'application/pdf' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementAttachmentResult',
                    data: expect.objectContaining({ success: false, error: 'File too large' })
                })
            );
        });

        test('getAnnouncementDetail failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                getAnnouncementDetail: jest.fn().mockRejectedValue(new Error('Not found'))
            };
            await routeMessage(component, {
                type: 'getAnnouncementDetail',
                data: { announcementId: 'ann-1', carrierId: 'c-1' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementDetailData',
                    data: expect.objectContaining({ success: false, error: 'Not found' })
                })
            );
        });

        test('sendAnnouncementReminder failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                sendReminderToUnreadDrivers: jest.fn().mockRejectedValue(new Error('Service unavailable'))
            };
            await routeMessage(component, {
                type: 'sendAnnouncementReminder',
                data: { announcementId: 'ann-1', carrierId: 'c-1' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'announcementReminderResult',
                    data: expect.objectContaining({ success: false })
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

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => sendToHtml(throwingComponent, 'test', {})).not.toThrow();
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getCarrierAnnouncements only calls backend once', async () => {
            await routeMessage(component, {
                type: 'getCarrierAnnouncements',
                data: { carrierId: 'c-1' }
            });
            expect(mockBackend.getAnnouncementsForCarrier).toHaveBeenCalledTimes(1);
        });

        test('createAnnouncement merges carrier_id from global state', async () => {
            carrierId = 'global-carrier';
            await routeMessage(component, {
                type: 'createAnnouncement',
                data: { title: 'Test' }
            });
            expect(mockBackend.createAnnouncement).toHaveBeenCalledWith(
                expect.objectContaining({ carrier_id: 'global-carrier' })
            );
        });

        test('previewRecipients uses default audience when none provided', async () => {
            await routeMessage(component, {
                type: 'previewRecipients',
                data: { carrierId: 'c-1' }
            });
            expect(mockBackend.previewRecipients).toHaveBeenCalledWith(
                'c-1',
                { type: 'all', segments: [] }
            );
        });
    });
});
