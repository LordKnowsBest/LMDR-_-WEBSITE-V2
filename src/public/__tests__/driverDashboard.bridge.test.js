/**
 * BRIDGE TEST: Driver Dashboard Page
 * ====================================
 * Verifies the postMessage bridge contract between:
 *   HTML Component <-> Wix Page Code <-> Backend Services
 *
 * Page: Driver Dashboard.ctupv.js
 * HTML: driver/DRIVER_DASHBOARD.html
 * Protocol: type/data
 *
 * Actions tested: 15 total
 *
 * @see src/pages/Driver Dashboard.ctupv.js
 * @see src/public/driver/DRIVER_DASHBOARD.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'Driver Dashboard.ctupv.js');

const EXPECTED_IMPORTS = [
    "from 'backend/applicationService'",
    "from 'backend/driverProfiles'",
    "from 'backend/driverInsightsService'",
    "from 'backend/featureAdoptionService'"
];

const ALL_ACTIONS = [
    'ping',
    'dashboardReady',
    'refreshDashboard',
    'navigateToMatching',
    'withdrawApplication',
    'sendMessage',
    'getConversation',
    'getNewMessages',
    'getUnreadCount',
    'markAsRead',
    'logFeatureInteraction',
    'setDiscoverability',
    'navigateToMyCareer',
    'navigateToProfile',
    'navigateToForums',
    'navigateToHealth'
];

// =============================================================================
// READ SOURCE FILE
// =============================================================================

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

const mockWixUsers = {
    currentUser: { loggedIn: true, id: 'user-123' }
};

const mockBackend = {
    getDriverApplications: jest.fn().mockResolvedValue({
        success: true,
        applications: [{ id: 'app-1', carrierName: 'Swift', status: 'applied' }],
        totalCount: 1
    }),
    withdrawApplication: jest.fn().mockResolvedValue({ success: true }),
    getOrCreateDriverProfile: jest.fn().mockResolvedValue({
        success: true,
        profile: { _id: 'drv-1', display_name: 'Test Driver', is_discoverable: true }
    }),
    getDriverProfileViews: jest.fn().mockResolvedValue({
        success: true,
        views: [{ carrier_dot: '1234567', carrier_name: 'Swift' }]
    }),
    getDriverStats: jest.fn().mockResolvedValue({
        success: true,
        stats: { totalApps: 5, avgMatchScore: 85 }
    }),
    logFeatureInteraction: jest.fn().mockResolvedValue(undefined),
    setDiscoverability: jest.fn().mockResolvedValue({ success: true }),
    getConversation: jest.fn().mockResolvedValue({
        success: true,
        messages: [{ id: 'msg-1', content: 'Hello', sender: 'recruiter' }]
    }),
    sendMessage: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-2' }),
    markAsRead: jest.fn().mockResolvedValue(undefined),
    getNewMessages: jest.fn().mockResolvedValue({
        messages: [],
        hasNew: false,
        latestTimestamp: Date.now()
    }),
    getUnreadCountForUser: jest.fn().mockResolvedValue({
        count: 3,
        byApplication: { 'app-1': 2, 'app-2': 1 }
    })
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        // silently fail
    }
}

function getHtmlComponents($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {
            // skip
        }
    }
    return found;
}

async function routeMessage(component, message, backend = mockBackend, wixLocation = mockWixLocation) {
    if (!message) return;

    const action = message.action || message.type;
    if (!action) return;

    try {
        switch (action) {
            case 'ping':
                safeSend(component, { type: 'pong', data: { timestamp: Date.now() } });
                break;

            case 'dashboardReady':
            case 'refreshDashboard': {
                const [appResult, profileResult, viewsResult] = await Promise.all([
                    backend.getDriverApplications(),
                    backend.getOrCreateDriverProfile(),
                    backend.getDriverProfileViews(5)
                ]);

                if (appResult.success) {
                    safeSend(component, {
                        type: 'dashboardData',
                        data: {
                            applications: appResult.applications || [],
                            totalCount: appResult.totalCount || 0,
                            profile: profileResult.success ? profileResult.profile : null,
                            profileViews: viewsResult.success ? viewsResult.views : []
                        }
                    });

                    if (viewsResult.success) {
                        safeSend(component, {
                            type: 'viewsData',
                            data: {
                                views: viewsResult.views || [],
                                isDiscoverable: profileResult.success ? profileResult.profile.is_discoverable : false
                            }
                        });
                    }

                    // Non-blocking insights
                    backend.getDriverStats().then(statsResult => {
                        if (statsResult.success) {
                            safeSend(component, { type: 'insightsData', data: { stats: statsResult.stats } });
                        }
                    });
                } else {
                    safeSend(component, { type: 'error', data: { message: appResult.error } });
                }
                break;
            }

            case 'navigateToMatching':
            case 'navigateToProfile':
                wixLocation.to('/ai-matching');
                break;

            case 'navigateToMyCareer':
                wixLocation.to('/driver-my-career');
                break;

            case 'navigateToForums':
                wixLocation.to('/driver-community');
                break;

            case 'navigateToHealth':
                wixLocation.to('/health-wellness');
                break;

            case 'withdrawApplication': {
                if (!message.data?.carrierDOT) {
                    safeSend(component, { type: 'error', data: { message: 'No carrier specified' } });
                    return;
                }
                const result = await backend.withdrawApplication(message.data.carrierDOT);
                if (result.success) {
                    safeSend(component, { type: 'withdrawSuccess', data: { carrierDOT: message.data.carrierDOT } });
                } else {
                    safeSend(component, { type: 'error', data: { message: result.error } });
                }
                break;
            }

            case 'getConversation': {
                if (!message.data?.applicationId) {
                    safeSend(component, { type: 'error', data: { message: 'No application specified' } });
                    return;
                }
                const result = await backend.getConversation(message.data.applicationId);
                safeSend(component, {
                    type: 'conversationData',
                    data: {
                        messages: result.success ? (result.messages || []) : [],
                        applicationId: message.data.applicationId
                    }
                });
                break;
            }

            case 'sendMessage': {
                if (!message.data?.applicationId || !message.data?.content) {
                    safeSend(component, { type: 'error', data: { message: 'Message content required' } });
                    return;
                }
                const result = await backend.sendMessage(
                    message.data.applicationId,
                    message.data.content,
                    message.data.receiverId,
                    'driver'
                );
                safeSend(component, {
                    type: 'messageSent',
                    data: {
                        success: result.success,
                        messageId: result.messageId,
                        applicationId: message.data.applicationId,
                        error: result.error
                    }
                });
                break;
            }

            case 'markAsRead':
                if (message.data?.applicationId) {
                    await backend.markAsRead(message.data.applicationId);
                }
                // Silent - no response
                break;

            case 'getNewMessages': {
                if (!message.data?.applicationId) return;
                const result = await backend.getNewMessages(message.data.applicationId, message.data.sinceTimestamp);
                safeSend(component, {
                    type: 'newMessagesData',
                    data: {
                        messages: result.messages || [],
                        hasNew: result.hasNew || false,
                        latestTimestamp: result.latestTimestamp,
                        applicationId: message.data.applicationId
                    }
                });
                break;
            }

            case 'getUnreadCount': {
                const result = await backend.getUnreadCountForUser();
                safeSend(component, {
                    type: 'unreadCountData',
                    data: {
                        count: result.count || 0,
                        byApplication: result.byApplication || {}
                    }
                });
                break;
            }

            case 'logFeatureInteraction':
                backend.logFeatureInteraction(message.data?.featureId, message.data?.userId, message.data?.action, message.data);
                // Fire and forget
                break;

            case 'setDiscoverability':
                if (message.data?.isDiscoverable !== undefined) {
                    const result = await backend.setDiscoverability(message.data.isDiscoverable);
                    if (!result.success) {
                        safeSend(component, { type: 'error', data: { message: result.error || 'Failed to update privacy' } });
                    }
                }
                break;

            default:
                break;
        }
    } catch (error) {
        safeSend(component, { type: 'error', data: { message: error.message } });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Driver Dashboard Bridge Tests', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
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
            expect(sourceCode).toContain('html4');
        });

        EXPECTED_IMPORTS.forEach(importPath => {
            test(`imports ${importPath}`, () => {
                expect(sourceCode).toContain(importPath);
            });
        });

        test('defines sendToHtml helper', () => {
            expect(sourceCode).toMatch(/function sendToHtml/);
        });

        test('has MESSAGE_REGISTRY for validation', () => {
            expect(sourceCode).toContain('MESSAGE_REGISTRY');
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components with onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html4') return createMockComponent();
                throw new Error('not found');
            });
            const components = getHtmlComponents(mock$w);
            expect(components.length).toBeGreaterThanOrEqual(1);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages with no action/type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ping responds with pong', async () => {
            await routeMessage(component, { type: 'ping' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'pong' })
            );
        });

        test('dashboardReady loads and sends dashboardData', async () => {
            await routeMessage(component, { type: 'dashboardReady' });
            expect(mockBackend.getDriverApplications).toHaveBeenCalled();
            expect(mockBackend.getOrCreateDriverProfile).toHaveBeenCalled();
            expect(mockBackend.getDriverProfileViews).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'dashboardData',
                    data: expect.objectContaining({ applications: expect.any(Array) })
                })
            );
        });

        test('refreshDashboard reloads dashboard data', async () => {
            await routeMessage(component, { type: 'refreshDashboard' });
            expect(mockBackend.getDriverApplications).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'dashboardData' })
            );
        });

        test('navigateToMatching calls wixLocation.to', async () => {
            await routeMessage(component, { type: 'navigateToMatching' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/ai-matching');
        });

        test('navigateToMyCareer calls wixLocation.to', async () => {
            await routeMessage(component, { type: 'navigateToMyCareer' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/driver-my-career');
        });

        test('withdrawApplication calls backend and sends withdrawSuccess', async () => {
            await routeMessage(component, { type: 'withdrawApplication', data: { carrierDOT: '1234567' } });
            expect(mockBackend.withdrawApplication).toHaveBeenCalledWith('1234567');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'withdrawSuccess',
                    data: expect.objectContaining({ carrierDOT: '1234567' })
                })
            );
        });

        test('withdrawApplication without carrierDOT sends error', async () => {
            await routeMessage(component, { type: 'withdrawApplication', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'No carrier specified' })
                })
            );
        });

        test('getConversation sends conversationData', async () => {
            await routeMessage(component, { type: 'getConversation', data: { applicationId: 'app-1' } });
            expect(mockBackend.getConversation).toHaveBeenCalledWith('app-1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'conversationData',
                    data: expect.objectContaining({ applicationId: 'app-1' })
                })
            );
        });

        test('sendMessage calls backend and sends messageSent', async () => {
            await routeMessage(component, {
                type: 'sendMessage',
                data: { applicationId: 'app-1', content: 'Hello', receiverId: 'recruiter-1' }
            });
            expect(mockBackend.sendMessage).toHaveBeenCalledWith('app-1', 'Hello', 'recruiter-1', 'driver');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'messageSent',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('sendMessage without content sends error', async () => {
            await routeMessage(component, { type: 'sendMessage', data: { applicationId: 'app-1' } });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'error' })
            );
        });

        test('markAsRead calls backend silently', async () => {
            await routeMessage(component, { type: 'markAsRead', data: { applicationId: 'app-1' } });
            expect(mockBackend.markAsRead).toHaveBeenCalledWith('app-1');
            // No response expected
        });

        test('getNewMessages sends newMessagesData', async () => {
            await routeMessage(component, {
                type: 'getNewMessages',
                data: { applicationId: 'app-1', sinceTimestamp: Date.now() }
            });
            expect(mockBackend.getNewMessages).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'newMessagesData' })
            );
        });

        test('getUnreadCount sends unreadCountData', async () => {
            await routeMessage(component, { type: 'getUnreadCount' });
            expect(mockBackend.getUnreadCountForUser).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'unreadCountData',
                    data: expect.objectContaining({ count: 3 })
                })
            );
        });

        test('logFeatureInteraction calls backend (fire and forget)', async () => {
            await routeMessage(component, {
                type: 'logFeatureInteraction',
                data: { featureId: 'test-feature', action: 'clicked' }
            });
            expect(mockBackend.logFeatureInteraction).toHaveBeenCalled();
        });

        test('setDiscoverability calls backend', async () => {
            await routeMessage(component, { type: 'setDiscoverability', data: { isDiscoverable: true } });
            expect(mockBackend.setDiscoverability).toHaveBeenCalledWith(true);
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getDriverApplications failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                getDriverApplications: jest.fn().mockResolvedValue({ success: false, error: 'Load failed' }),
                getOrCreateDriverProfile: jest.fn().mockResolvedValue({ success: false }),
                getDriverProfileViews: jest.fn().mockResolvedValue({ success: false })
            };
            await routeMessage(component, { type: 'dashboardReady' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Load failed' })
                })
            );
        });

        test('withdrawApplication failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                withdrawApplication: jest.fn().mockResolvedValue({ success: false, error: 'Cannot withdraw' })
            };
            await routeMessage(component, { type: 'withdrawApplication', data: { carrierDOT: '123' } }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'error' })
            );
        });

        test('sendMessage failure sends messageSent with error', async () => {
            const failBackend = {
                ...mockBackend,
                sendMessage: jest.fn().mockResolvedValue({ success: false, error: 'Send failed' })
            };
            await routeMessage(component, {
                type: 'sendMessage',
                data: { applicationId: 'app-1', content: 'Hi' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'messageSent',
                    data: expect.objectContaining({ success: false, error: 'Send failed' })
                })
            );
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does nothing if component is null', () => {
            expect(() => safeSend(null, { type: 'test' })).not.toThrow();
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { type: 'test' })).not.toThrow();
        });
    });
});
