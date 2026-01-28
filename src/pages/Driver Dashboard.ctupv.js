// ============================================================================
// DRIVER DASHBOARD PAGE - Application Tracker
// Handles communication between DRIVER_DASHBOARD.html and Velo backend
// ============================================================================

import { getDriverApplications, withdrawApplication } from 'backend/applicationService';
import { logFeatureInteraction } from 'backend/featureAdoptionService';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { setupDriverGamification } from 'public/js/gamificationPageHandlers';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Auto-discovery will try these IDs in order (html4 first - confirmed as dashboard component)
    possibleHtmlIds: ['#driverDashboardHtml', '#html4', '#html1', '#html2', '#html3', '#html5', '#htmlComponent'],
    loginUrl: '/login',
    matchingPageUrl: '/ai-matching'
};

// Cached reference to discovered HTML component
let _htmlComponent = null;

// ============================================================================
// MESSAGE VALIDATION SYSTEM
// ============================================================================

const DEBUG_MESSAGES = true;

// Registry of all valid messages - must match DRIVER_DASHBOARD.html
const MESSAGE_REGISTRY = {
    // Messages FROM HTML that page code handles
    inbound: [
        'dashboardReady',
        'refreshDashboard',
        'navigateToMatching',
        'withdrawApplication',
        'sendMessage',
        'getConversation',
        'getNewMessages',    // Smart polling request
        'getUnreadCount',    // Unread badge request
        'markAsRead',
        'logFeatureInteraction', // Feature adoption tracking
        'ping'
    ],
    // Messages TO HTML that page code sends
    outbound: [
        'dashboardData',
        'withdrawSuccess',
        'conversationData',
        'messageSent',
        'newMessagesData',   // Smart polling response
        'unreadCountData',   // Unread badge data
        'error',
        'pong'
    ]
};

function validateInboundMessage(action) {
    if (!MESSAGE_REGISTRY.inbound.includes(action)) {
        console.warn(`⚠️ UNREGISTERED INBOUND MESSAGE: "${action}" - Add to MESSAGE_REGISTRY.inbound`);
        return false;
    }
    return true;
}

function logMessageFlow(direction, type, data) {
    if (!DEBUG_MESSAGES) return;
    const arrow = direction === 'in' ? '📥' : '📤';
    const label = direction === 'in' ? 'HTML→Velo' : 'Velo→HTML';
    console.log(`${arrow} [${label}] ${type}`, data ? Object.keys(data) : '(no data)');
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
    console.log('🚀 Driver Dashboard Page Ready');
    console.log('📋 Message Registry:', {
        inbound: MESSAGE_REGISTRY.inbound.length,
        outbound: MESSAGE_REGISTRY.outbound.length
    });

    // Check if user is logged in
    if (!wixUsers.currentUser.loggedIn) {
        console.log('⚠️ User not logged in, redirecting to login...');
        wixLocation.to(CONFIG.loginUrl);
        return;
    }

    // Set up HTML component message handlers
    setupHtmlMessageHandlers();

    // Set up gamification widget if present
    // Add an HTML component with ID #gamificationHtml pointing to public/driver/DRIVER_GAMIFICATION.html
    try {
        const gamificationWidget = $w('#gamificationHtml');
        if (gamificationWidget && typeof gamificationWidget.onMessage === 'function') {
            setupDriverGamification(gamificationWidget);
            console.log('🎮 Gamification widget initialized');
        }
    } catch (e) {
        // Gamification widget not present on page, that's OK
    }

    // Load data WITHOUT blocking - keeps message handlers responsive
    // HTML will also send 'dashboardReady' which triggers load if this fails
    console.log('📊 Initiating dashboard data load (non-blocking)...');
    loadDashboardData().catch(err => console.error('Initial load failed:', err));
});

// ============================================================================
// HTML COMPONENT COMMUNICATION (Auto-Discovery Pattern)
// ============================================================================

/**
 * Find HTML component by trying multiple possible IDs
 * Caches the result for subsequent calls
 */
function findHtmlComponent() {
    // Return cached component if already found
    if (_htmlComponent) {
        return _htmlComponent;
    }

    for (const id of CONFIG.possibleHtmlIds) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                _htmlComponent = component;
                console.log(`✅ Driver Dashboard HTML component found: ${id}`);
                return component;
            }
        } catch (e) {
            // Component doesn't exist, try next
        }
    }

    console.warn('⚠️ No HTML component found. Tried:', CONFIG.possibleHtmlIds.join(', '));
    return null;
}

function setupHtmlMessageHandlers() {
    const htmlComponent = findHtmlComponent();

    if (htmlComponent) {
        htmlComponent.onMessage((event) => {
            handleHtmlMessage(event.data);
        });
    } else {
        console.warn('💡 Make sure an HTML component exists on this page');
    }
}

async function handleHtmlMessage(msg) {
    if (!msg || !msg.type) return;

    const action = msg.action || msg.type;

    // Validate and log inbound message
    validateInboundMessage(action);
    logMessageFlow('in', action, msg.data);

    try {
        switch (action) {
            // Health check - respond immediately
            case 'ping':
                sendToHtml('pong', {
                    timestamp: Date.now(),
                    registeredInbound: MESSAGE_REGISTRY.inbound.length,
                    registeredOutbound: MESSAGE_REGISTRY.outbound.length
                });
                break;

            case 'dashboardReady':
                await loadDashboardData();
                break;

            case 'refreshDashboard':
                await loadDashboardData(true);
                break;

            case 'navigateToMatching':
                wixLocation.to(CONFIG.matchingPageUrl);
                break;

            case 'withdrawApplication':
                await handleWithdrawApplication(msg.data);
                break;

            case 'getConversation':
                await handleGetConversation(msg.data);
                break;

            case 'sendMessage':
                await handleSendMessage(msg.data);
                break;

            case 'markAsRead':
                await handleMarkAsRead(msg.data);
                break;

            case 'getNewMessages':
                await handleGetNewMessages(msg.data);
                break;

            case 'getUnreadCount':
                await handleGetUnreadCount();
                break;

            case 'logFeatureInteraction':
                // Non-blocking feature tracking
                logFeatureInteraction(msg.data.featureId, msg.data.userId, msg.data.action, msg.data)
                    .catch(err => console.warn('Feature tracking failed:', err.message));
                break;

            default:
                console.warn('⚠️ Unhandled action:', action);
        }
    } catch (error) {
        console.error('❌ Error handling message:', error);
        sendToHtml('error', { message: error.message });
    }
}

function sendToHtml(type, data) {
    // Validate outbound message is registered
    if (!MESSAGE_REGISTRY.outbound.includes(type)) {
        console.warn(`⚠️ UNREGISTERED OUTBOUND MESSAGE: "${type}" - Add to MESSAGE_REGISTRY.outbound`);
    }
    logMessageFlow('out', type, data);

    const component = findHtmlComponent();
    if (component) {
        component.postMessage({ type, data, timestamp: Date.now() });
    } else {
        console.error('❌ Cannot send message - HTML component not found');
    }
}

// ============================================================================
// DASHBOARD DATA LOADER
// ============================================================================

async function loadDashboardData(isBackground = false) {
    console.log('📊 Loading driver applications...');

    try {
        const result = await getDriverApplications();

        console.log('📦 Applications loaded:', {
            success: result.success,
            count: result.applications?.length || 0
        });

        if (result.success) {
            sendToHtml('dashboardData', {
                applications: result.applications || [],
                totalCount: result.totalCount || 0,
                memberId: wixUsers.currentUser.id || null
            });
        } else {
            console.error('❌ Failed to load applications:', result.error);
            sendToHtml('error', {
                message: result.error || 'Failed to load applications',
                isBackground
            });
        }

    } catch (error) {
        console.error('❌ Dashboard load error:', error);
        sendToHtml('error', {
            message: 'Failed to load dashboard data',
            isBackground
        });
    }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleWithdrawApplication(data) {
    if (!data || !data.carrierDOT) {
        console.warn('⚠️ No carrier DOT provided for withdrawal');
        sendToHtml('error', { message: 'No carrier specified' });
        return;
    }

    console.log('🗑️ Withdrawing application for DOT:', data.carrierDOT);

    try {
        const result = await withdrawApplication(data.carrierDOT);

        if (result.success) {
            console.log('✅ Application withdrawn successfully');
            sendToHtml('withdrawSuccess', { carrierDOT: data.carrierDOT });
        } else {
            console.error('❌ Withdrawal failed:', result.error);
            sendToHtml('error', { message: result.error || 'Failed to withdraw application' });
        }
    } catch (error) {
        console.error('❌ Withdrawal error:', error);
        sendToHtml('error', { message: error.message });
    }
}

async function handleGetConversation(data) {
    if (!data || !data.applicationId) {
        console.warn('⚠️ No application ID provided for conversation');
        sendToHtml('error', { message: 'No application specified' });
        return;
    }

    console.log('💬 Getting conversation for application:', data.applicationId);

    try {
        // Import messaging service dynamically
        const { getConversation } = await import('backend/messaging');
        const result = await getConversation(data.applicationId);

        if (result.success) {
            sendToHtml('conversationData', {
                messages: result.messages || [],
                applicationId: data.applicationId
            });
        } else {
            // Don't show error for empty conversations
            sendToHtml('conversationData', {
                messages: [],
                applicationId: data.applicationId
            });
        }
    } catch (error) {
        console.error('❌ Get conversation error:', error);
        // Send empty messages instead of error for better UX
        sendToHtml('conversationData', {
            messages: [],
            applicationId: data.applicationId
        });
    }
}

async function handleSendMessage(data) {
    if (!data || !data.applicationId || !data.content) {
        console.warn('⚠️ Missing data for sending message');
        sendToHtml('error', { message: 'Message content required' });
        return;
    }

    console.log('✉️ Sending message for application:', data.applicationId);

    try {
        // Import messaging service dynamically
        const { sendMessage } = await import('backend/messaging');
        const result = await sendMessage(data.applicationId, data.content, data.receiverId, 'driver');

        if (result.success) {
            sendToHtml('messageSent', {
                success: true,
                messageId: result.messageId,
                applicationId: data.applicationId
            });
        } else {
            sendToHtml('messageSent', {
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Send message error:', error);
        sendToHtml('messageSent', {
            success: false,
            error: error.message
        });
    }
}

async function handleMarkAsRead(data) {
    if (!data || !data.applicationId) {
        return;
    }

    console.log('👁️ Marking messages as read for:', data.applicationId);

    try {
        // Import messaging service dynamically
        const { markAsRead } = await import('backend/messaging');
        await markAsRead(data.applicationId);
    } catch (error) {
        // Silent failure - not critical
        console.warn('⚠️ Could not mark messages as read:', error.message);
    }
}

async function handleGetNewMessages(data) {
    if (!data || !data.applicationId) {
        return;
    }

    try {
        const { getNewMessages } = await import('backend/messagingRealtime');
        const result = await getNewMessages(data.applicationId, data.sinceTimestamp);

        sendToHtml('newMessagesData', {
            messages: result.messages || [],
            hasNew: result.hasNew || false,
            latestTimestamp: result.latestTimestamp,
            applicationId: data.applicationId
        });
    } catch (error) {
        console.warn('⚠️ Could not fetch new messages:', error.message);
        // Send empty result instead of error
        sendToHtml('newMessagesData', {
            messages: [],
            hasNew: false,
            applicationId: data.applicationId
        });
    }
}

async function handleGetUnreadCount() {
    try {
        const { getUnreadCountForUser } = await import('backend/messagingRealtime');
        const result = await getUnreadCountForUser();

        sendToHtml('unreadCountData', {
            count: result.count || 0,
            byApplication: result.byApplication || {}
        });
    } catch (error) {
        console.warn('⚠️ Could not fetch unread count:', error.message);
        sendToHtml('unreadCountData', { count: 0, byApplication: {} });
    }
}
