// ============================================================================
// MEMBER PAGE - Member Dashboard
// Provides overview of profile, applications, notifications, and quick actions
// ============================================================================

import { getMemberDashboard, getMemberNotifications, markNotificationRead, getMemberActivityStats } from 'backend/memberService';
import { getDriverApplications } from 'backend/applicationService';
import { getUnreadCount } from 'backend/messaging';
import { getOrCreateDriverProfile } from 'backend/driverProfiles';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    htmlComponentId: 'memberDashboardHtml',
    loginUrl: '/login',
    matchingPageUrl: '/ai-matching',
    driverDashboardUrl: '/driver-dashboard',
    quickApplyUrl: '/quick-apply',
    profilePageUrl: '/ai-matching'
};

// ============================================================================
// MESSAGE VALIDATION SYSTEM
// ============================================================================

const DEBUG_MESSAGES = true; // Set to false in production

// Registry of all valid messages - single source of truth
const MESSAGE_REGISTRY = {
    // Messages FROM HTML that page code handles
    inbound: [
        'memberDashboardReady',
        'markNotificationRead',
        'markAllNotificationsRead',
        'navigateTo',
        'refreshDashboard',
        'quickAction',
        'ping' // Health check
    ],
    // Messages TO HTML that page code sends
    outbound: [
        'dashboardData',
        'profileUpdate',
        'notificationsUpdate',
        'applicationsUpdate',
        'activityStatsUpdate',
        'notificationMarkedRead',
        'error',
        'pong' // Health check response
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
// STATE
// ============================================================================

let cachedDashboardData = null;
let cachedProfile = null;

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
    console.log('🚀 Member Page Ready');
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

    // Load dashboard data
    await loadDashboard();
});

// ============================================================================
// HTML COMPONENT COMMUNICATION
// ============================================================================

function getHtmlComponent() {
    try {
        const component = $w(`#${CONFIG.htmlComponentId}`);
        if (component && component.postMessage) {
            return component;
        }
    } catch (e) {
        console.warn('⚠️ HTML component not found:', CONFIG.htmlComponentId);
    }
    return null;
}

function setupHtmlMessageHandlers() {
    const htmlComponent = getHtmlComponent();

    if (htmlComponent) {
        htmlComponent.onMessage((event) => {
            handleHtmlMessage(event.data);
        });
        console.log('✅ HTML message handlers set up');
    } else {
        console.warn('⚠️ HTML component not found, skipping message handler setup');
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

            case 'memberDashboardReady':
                await loadDashboard();
                break;

            case 'refreshDashboard':
                await loadDashboard();
                break;

            case 'markNotificationRead':
                await handleMarkNotificationRead(msg.data);
                break;

            case 'markAllNotificationsRead':
                await handleMarkAllNotificationsRead();
                break;

            case 'navigateTo':
                handleNavigateTo(msg.data);
                break;

            case 'quickAction':
                handleQuickAction(msg.data);
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

    const component = getHtmlComponent();
    if (component) {
        component.postMessage({ type, data, timestamp: Date.now() });
    }
}

// ============================================================================
// MAIN DASHBOARD LOADER
// ============================================================================

async function loadDashboard() {
    console.log('📊 Loading member dashboard...');

    try {
        // Load all dashboard data in parallel
        const [dashboardResult, applicationsResult, profileResult, unreadResult] = await Promise.all([
            getMemberDashboard(),
            getDriverApplications(),
            getOrCreateDriverProfile(),
            getUnreadCount()
        ]);

        console.log('📦 Dashboard data loaded:', {
            dashboard: dashboardResult.success,
            applications: applicationsResult.success,
            profile: profileResult.success,
            unread: unreadResult.success
        });

        // Cache the data
        if (dashboardResult.success) {
            cachedDashboardData = dashboardResult;
        }
        if (profileResult.success) {
            cachedProfile = profileResult.profile;
        }

        // Update UI sections
        await Promise.all([
            loadProfileSection(profileResult),
            loadApplicationsSection(applicationsResult),
            loadNotificationsSection(dashboardResult.notifications || [], unreadResult),
            loadQuickActions(dashboardResult.quickActions || [], profileResult.profile)
        ]);

        // Send complete data to HTML component
        sendToHtml('dashboardData', {
            profile: profileResult.success ? profileResult.profile : null,
            applications: applicationsResult.success ? applicationsResult.applications : [],
            notifications: dashboardResult.success ? dashboardResult.notifications : [],
            activity: dashboardResult.success ? dashboardResult.activity : null,
            quickActions: dashboardResult.success ? dashboardResult.quickActions : [],
            unreadMessageCount: unreadResult.success ? unreadResult.count : 0
        });

    } catch (error) {
        console.error('❌ Dashboard load error:', error);
        sendToHtml('error', { message: 'Failed to load dashboard data' });
    }
}

// ============================================================================
// PROFILE SECTION
// ============================================================================

async function loadProfileSection(profileResult) {
    try {
        const profile = profileResult.success ? profileResult.profile : null;

        // Update display name
        if ($w('#displayName')) {
            try {
                $w('#displayName').text = profile?.display_name || 'Welcome, Driver';
            } catch (e) {
                console.warn('⚠️ Could not set displayName:', e.message);
            }
        }

        // Update email
        if ($w('#memberEmail')) {
            try {
                $w('#memberEmail').text = profile?.email || '';
            } catch (e) {
                console.warn('⚠️ Could not set memberEmail:', e.message);
            }
        }

        // Update profile completeness
        const completeness = profile?.profile_completeness_score || 0;

        if ($w('#profileCompletenessText')) {
            try {
                $w('#profileCompletenessText').text = `${completeness}% Complete`;
            } catch (e) {
                console.warn('⚠️ Could not set profileCompletenessText:', e.message);
            }
        }

        if ($w('#profileCompletenessBar')) {
            try {
                // Assuming this is a progress bar element
                $w('#profileCompletenessBar').value = completeness;
            } catch (e) {
                // Try alternative - might be a box element with width styling
                try {
                    $w('#profileCompletenessBar').style.width = `${completeness}%`;
                } catch (e2) {
                    console.warn('⚠️ Could not set profileCompletenessBar:', e2.message);
                }
            }
        }

        // Show missing fields message if profile is incomplete
        if (profile?.missing_fields && profile.missing_fields.length > 0 && completeness < 80) {
            console.log('📝 Missing profile fields:', profile.missing_fields.join(', '));
        }

        // Send profile update to HTML
        sendToHtml('profileUpdate', {
            profile,
            completeness,
            missingFields: profile?.missing_fields || [],
            isComplete: completeness >= 80
        });

    } catch (error) {
        console.error('❌ Error loading profile section:', error);
    }
}

// ============================================================================
// APPLICATIONS SECTION
// ============================================================================

async function loadApplicationsSection(applicationsResult) {
    try {
        const applications = applicationsResult.success ? applicationsResult.applications : [];
        const totalCount = applicationsResult.success ? applicationsResult.totalCount : 0;

        // Count active applications (applied, in_review, interviewing, contacted)
        const activeStatuses = ['applied', 'in_review', 'interviewing', 'contacted', 'reviewing'];
        const activeCount = applications.filter(app =>
            activeStatuses.includes(app.status || app.action)
        ).length;

        // Update counts
        if ($w('#activeApplicationsCount')) {
            try {
                $w('#activeApplicationsCount').text = String(activeCount);
            } catch (e) {
                console.warn('⚠️ Could not set activeApplicationsCount:', e.message);
            }
        }

        if ($w('#totalApplicationsCount')) {
            try {
                $w('#totalApplicationsCount').text = String(totalCount);
            } catch (e) {
                console.warn('⚠️ Could not set totalApplicationsCount:', e.message);
            }
        }

        // Populate applications repeater
        if ($w('#applicationsRepeater')) {
            try {
                const recentApplications = applications.slice(0, 5);

                if (recentApplications.length > 0) {
                    $w('#applicationsRepeater').data = recentApplications.map(app => ({
                        _id: app._id,
                        carrierName: app.carrier_name || 'Unknown Carrier',
                        carrierDOT: app.carrier_dot,
                        status: app.status || app.action || 'pending',
                        statusLabel: getStatusLabel(app.status || app.action),
                        statusColor: getStatusColor(app.status || app.action),
                        appliedDate: formatDate(app.application_date || app.action_timestamp || app._createdDate),
                        matchScore: app.match_score || 0
                    }));

                    $w('#applicationsRepeater').onItemReady(($item, itemData) => {
                        setupApplicationItem($item, itemData);
                    });

                    $w('#applicationsRepeater').expand();
                } else {
                    $w('#applicationsRepeater').collapse();
                }
            } catch (e) {
                console.warn('⚠️ Could not set up applicationsRepeater:', e.message);
            }
        }

        // Send applications update to HTML
        sendToHtml('applicationsUpdate', {
            applications: applications.slice(0, 10),
            activeCount,
            totalCount
        });

    } catch (error) {
        console.error('❌ Error loading applications section:', error);
    }
}

function setupApplicationItem($item, itemData) {
    try {
        if ($item('#appCarrierName')) {
            $item('#appCarrierName').text = itemData.carrierName;
        }
        if ($item('#appStatus')) {
            $item('#appStatus').text = itemData.statusLabel;
        }
        if ($item('#appStatusBadge')) {
            $item('#appStatusBadge').style.backgroundColor = itemData.statusColor;
        }
        if ($item('#appDate')) {
            $item('#appDate').text = itemData.appliedDate;
        }
        if ($item('#appMatchScore')) {
            $item('#appMatchScore').text = `${itemData.matchScore}% Match`;
        }
    } catch (e) {
        console.warn('⚠️ Error setting up application item:', e.message);
    }
}

// ============================================================================
// NOTIFICATIONS SECTION
// ============================================================================

async function loadNotificationsSection(notifications, unreadResult) {
    try {
        const unreadCount = unreadResult.success ? unreadResult.count : 0;

        // Update unread badge
        if ($w('#unreadBadge')) {
            try {
                if (unreadCount > 0) {
                    $w('#unreadBadge').text = String(unreadCount);
                    $w('#unreadBadge').expand();
                } else {
                    $w('#unreadBadge').collapse();
                }
            } catch (e) {
                console.warn('⚠️ Could not set unreadBadge:', e.message);
            }
        }

        // Populate notifications repeater
        if ($w('#notificationsRepeater')) {
            try {
                if (notifications && notifications.length > 0) {
                    $w('#notificationsRepeater').data = notifications.map(notif => ({
                        _id: notif.id || notif._id,
                        title: notif.title || 'Notification',
                        message: notif.message || '',
                        isRead: notif.isRead || notif.is_read || false,
                        icon: notif.icon || 'bell',
                        createdDate: formatDate(notif.createdDate || notif.created_date),
                        actionUrl: notif.actionUrl || notif.action_url || null,
                        type: notif.type || 'system'
                    }));

                    $w('#notificationsRepeater').onItemReady(($item, itemData) => {
                        setupNotificationItem($item, itemData);
                    });

                    $w('#notificationsRepeater').expand();
                } else {
                    $w('#notificationsRepeater').collapse();
                }
            } catch (e) {
                console.warn('⚠️ Could not set up notificationsRepeater:', e.message);
            }
        }

        // Send notifications update to HTML
        sendToHtml('notificationsUpdate', {
            notifications,
            unreadCount
        });

    } catch (error) {
        console.error('❌ Error loading notifications section:', error);
    }
}

function setupNotificationItem($item, itemData) {
    try {
        if ($item('#notifTitle')) {
            $item('#notifTitle').text = itemData.title;
        }
        if ($item('#notifMessage')) {
            $item('#notifMessage').text = itemData.message;
        }
        if ($item('#notifDate')) {
            $item('#notifDate').text = itemData.createdDate;
        }
        if ($item('#notifIcon')) {
            // Set icon based on type
            $item('#notifIcon').src = getNotificationIconUrl(itemData.icon);
        }

        // Style based on read status
        if (!itemData.isRead) {
            if ($item('#notifContainer')) {
                $item('#notifContainer').style.backgroundColor = '#f0f7ff';
            }
        }

        // Handle click to mark as read and navigate
        if ($item('#notifContainer')) {
            $item('#notifContainer').onClick(async () => {
                if (!itemData.isRead) {
                    await handleMarkNotificationRead({ notificationId: itemData._id });
                }
                if (itemData.actionUrl) {
                    wixLocation.to(itemData.actionUrl);
                }
            });
        }
    } catch (e) {
        console.warn('⚠️ Error setting up notification item:', e.message);
    }
}

// ============================================================================
// QUICK ACTIONS SECTION
// ============================================================================

async function loadQuickActions(quickActions, profile) {
    try {
        // Populate quick actions repeater
        if ($w('#quickActionsRepeater')) {
            try {
                if (quickActions && quickActions.length > 0) {
                    $w('#quickActionsRepeater').data = quickActions.map((action, index) => ({
                        _id: action.id || `action-${index}`,
                        label: action.label,
                        description: action.description || '',
                        priority: action.priority || 'medium',
                        url: action.url || CONFIG.matchingPageUrl,
                        icon: getActionIcon(action.id)
                    }));

                    $w('#quickActionsRepeater').onItemReady(($item, itemData) => {
                        setupQuickActionItem($item, itemData);
                    });

                    $w('#quickActionsRepeater').expand();
                } else {
                    $w('#quickActionsRepeater').collapse();
                }
            } catch (e) {
                console.warn('⚠️ Could not set up quickActionsRepeater:', e.message);
            }
        }

        // Set up static quick action buttons
        setupStaticButtons(profile);

    } catch (error) {
        console.error('❌ Error loading quick actions:', error);
    }
}

function setupQuickActionItem($item, itemData) {
    try {
        if ($item('#actionLabel')) {
            $item('#actionLabel').text = itemData.label;
        }
        if ($item('#actionDescription')) {
            $item('#actionDescription').text = itemData.description;
        }
        if ($item('#actionIcon')) {
            $item('#actionIcon').src = itemData.icon;
        }

        // Priority styling
        if (itemData.priority === 'high' && $item('#actionContainer')) {
            $item('#actionContainer').style.borderColor = '#2563eb';
        }

        // Handle click
        if ($item('#actionContainer')) {
            $item('#actionContainer').onClick(() => {
                wixLocation.to(itemData.url);
            });
        }
        if ($item('#actionButton')) {
            $item('#actionButton').onClick(() => {
                wixLocation.to(itemData.url);
            });
        }
    } catch (e) {
        console.warn('⚠️ Error setting up quick action item:', e.message);
    }
}

function setupStaticButtons(profile) {
    // Find Matches button
    if ($w('#findMatchesBtn')) {
        try {
            $w('#findMatchesBtn').onClick(() => {
                wixLocation.to(CONFIG.matchingPageUrl);
            });
        } catch (e) {
            console.warn('⚠️ Could not set up findMatchesBtn:', e.message);
        }
    }

    // Edit Profile button
    if ($w('#editProfileBtn')) {
        try {
            $w('#editProfileBtn').onClick(() => {
                wixLocation.to(CONFIG.profilePageUrl);
            });
        } catch (e) {
            console.warn('⚠️ Could not set up editProfileBtn:', e.message);
        }
    }

    // View Applications button
    if ($w('#viewApplicationsBtn')) {
        try {
            $w('#viewApplicationsBtn').onClick(() => {
                wixLocation.to(CONFIG.driverDashboardUrl);
            });
        } catch (e) {
            console.warn('⚠️ Could not set up viewApplicationsBtn:', e.message);
        }
    }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleMarkNotificationRead(data) {
    try {
        if (!data || !data.notificationId) {
            console.warn('⚠️ No notification ID provided');
            return;
        }

        const result = await markNotificationRead(data.notificationId);

        if (result.success) {
            console.log('✅ Notification marked as read:', data.notificationId);
            sendToHtml('notificationMarkedRead', { notificationId: data.notificationId });

            // Optionally refresh notifications
            const notificationsResult = await getMemberNotifications();
            if (notificationsResult.success) {
                const unreadResult = await getUnreadCount();
                await loadNotificationsSection(notificationsResult.notifications, unreadResult);
            }
        } else {
            console.error('❌ Failed to mark notification as read:', result.error);
            sendToHtml('error', { message: result.error });
        }
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        sendToHtml('error', { message: error.message });
    }
}

async function handleMarkAllNotificationsRead() {
    try {
        // Import the function dynamically since it's not in our main imports
        const { markAllNotificationsRead } = await import('backend/memberService');
        const result = await markAllNotificationsRead();

        if (result.success) {
            console.log('✅ All notifications marked as read');

            // Refresh notifications section
            const notificationsResult = await getMemberNotifications();
            if (notificationsResult.success) {
                const unreadResult = await getUnreadCount();
                await loadNotificationsSection(notificationsResult.notifications, unreadResult);
            }
        } else {
            console.error('❌ Failed to mark all notifications as read:', result.error);
            sendToHtml('error', { message: result.error });
        }
    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
        sendToHtml('error', { message: error.message });
    }
}

function handleNavigateTo(data) {
    if (data && data.url) {
        console.log('🧭 Navigating to:', data.url);
        wixLocation.to(data.url);
    }
}

function handleQuickAction(data) {
    if (!data || !data.actionId) {
        console.warn('⚠️ No action ID provided');
        return;
    }

    console.log('⚡ Quick action:', data.actionId);

    // Handle specific quick actions
    switch (data.actionId) {
        case 'create_profile':
        case 'complete_profile':
        case 'find_matches':
        case 'enable_discovery':
            wixLocation.to(CONFIG.matchingPageUrl);
            break;

        case 'upload_cdl':
            wixLocation.to(CONFIG.quickApplyUrl);
            break;

        case 'check_applications':
            wixLocation.to(CONFIG.driverDashboardUrl);
            break;

        default:
            if (data.url) {
                wixLocation.to(data.url);
            }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusLabel(status) {
    const labels = {
        'interested': 'Interested',
        'applied': 'Applied',
        'in_review': 'In Review',
        'reviewing': 'In Review',
        'contacted': 'Contacted',
        'interviewing': 'Interviewing',
        'offer': 'Offer Received',
        'hired': 'Hired',
        'rejected': 'Not Selected',
        'withdrawn': 'Withdrawn'
    };
    return labels[status] || status || 'Pending';
}

function getStatusColor(status) {
    const colors = {
        'interested': '#6b7280',
        'applied': '#3b82f6',
        'in_review': '#f59e0b',
        'reviewing': '#f59e0b',
        'contacted': '#8b5cf6',
        'interviewing': '#6366f1',
        'offer': '#10b981',
        'hired': '#059669',
        'rejected': '#ef4444',
        'withdrawn': '#9ca3af'
    };
    return colors[status] || '#6b7280';
}

function formatDate(dateValue) {
    if (!dateValue) return '';

    try {
        const date = new Date(dateValue);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    } catch (e) {
        return '';
    }
}

function getNotificationIconUrl(iconName) {
    const iconMap = {
        'briefcase': 'https://static.wixstatic.com/shapes/...',
        'envelope': 'https://static.wixstatic.com/shapes/...',
        'star': 'https://static.wixstatic.com/shapes/...',
        'user': 'https://static.wixstatic.com/shapes/...',
        'file': 'https://static.wixstatic.com/shapes/...',
        'bell': 'https://static.wixstatic.com/shapes/...'
    };
    return iconMap[iconName] || iconMap['bell'];
}

function getActionIcon(actionId) {
    const iconMap = {
        'create_profile': 'https://static.wixstatic.com/shapes/...',
        'complete_profile': 'https://static.wixstatic.com/shapes/...',
        'upload_cdl': 'https://static.wixstatic.com/shapes/...',
        'find_matches': 'https://static.wixstatic.com/shapes/...',
        'check_applications': 'https://static.wixstatic.com/shapes/...',
        'enable_discovery': 'https://static.wixstatic.com/shapes/...'
    };
    return iconMap[actionId] || 'https://static.wixstatic.com/shapes/...';
}
