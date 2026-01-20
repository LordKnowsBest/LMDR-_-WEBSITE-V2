/**
 * Master Page - Global Site Code
 * Runs on every page for auth state, notifications, and navigation
 */

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { getUnreadCount } from 'backend/messaging';
import { updateLastActive } from 'backend/memberService';

$w.onReady(async function () {
    await updateAuthState();
    setupGlobalNavigation();
    setupSidebarNavigation();

    // Track activity and load notifications for logged-in users
    if (wixUsers.currentUser.loggedIn) {
        loadNotificationBadge();
        updateLastActive();
    }
});

/**
 * Update UI based on authentication state
 */
async function updateAuthState() {
    const user = wixUsers.currentUser;

    if (user.loggedIn) {
        // Hide auth buttons, show member menu
        safeHide('#loginBtn');
        safeHide('#signupBtn');
        safeShow('#memberMenu');
        safeShow('#notificationBell');

        // Load member display name
        const displayName = await getMemberDisplayName();
        safeSetText('#memberName', displayName);
    } else {
        // Show auth buttons, hide member menu
        safeShow('#loginBtn');
        safeShow('#signupBtn');
        safeHide('#memberMenu');
        safeHide('#notificationBell');
        safeHide('#notificationBadge');
    }
}

/**
 * Load and display unread notification count
 */
async function loadNotificationBadge() {
    try {
        const result = await getUnreadCount();

        if (result.success && result.count > 0) {
            const badgeText = result.count > 9 ? '9+' : String(result.count);
            safeSetText('#notificationBadge', badgeText);
            safeShow('#notificationBadge');
        } else {
            safeHide('#notificationBadge');
        }
    } catch (err) {
        // Silent fail - don't break page
        safeHide('#notificationBadge');
    }
}

/**
 * Get display name for logged-in member
 */
async function getMemberDisplayName() {
    try {
        const user = wixUsers.currentUser;
        const email = await user.getEmail();

        if (email) {
            // Use first part of email as display name
            return email.split('@')[0];
        }
        return 'Member';
    } catch (err) {
        return 'Member';
    }
}

/**
 * Set up global navigation click handlers
 */
function setupGlobalNavigation() {
    // Auth button handlers
    safeOnClick('#loginBtn', () => {
        wixUsers.promptLogin({ mode: 'login' });
    });

    safeOnClick('#signupBtn', () => {
        wixUsers.promptLogin({ mode: 'signup' });
    });

    // CTA navigation handlers
    safeOnClick('#ctaFindMatches', () => {
        wixLocation.to('/ai-matching');
    });

    safeOnClick('#ctaForCarriers', () => {
        wixLocation.to('/trucking-companies');
    });
}

/**
 * Set up sidebar navigation handler for Recruiter pages
 * Listens to HTML components for 'navigateTo' messages from embedded sidebar
 */
function setupSidebarNavigation() {
    // Page routing map - maps sidebar data-page values to Wix page URLs
    const PAGE_ROUTES = {
        'dashboard': '/recruiter-dashboard',
        'driver-search': '/recruiter-driver-search',
        'pipeline': '/recruiter-pipeline',
        'telemetry': '/recruiter-telemetry',
        'jobs': '/recruiter-jobs',
        'ad-studio': '/recruiter-ad-studio',
        'compliance': '/recruiter-compliance',
        'match-scoring': '/recruiter-settings',
        'preferences': '/recruiter-preferences'
    };

    // Try attaching to any HTML component on the page
    const possibleHtmlIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#html6'];

    possibleHtmlIds.forEach(htmlId => {
        try {
            const htmlComponent = $w(htmlId);
            if (htmlComponent && htmlComponent.onMessage) {
                htmlComponent.onMessage((event) => {
                    const msg = event.data;
                    if (!msg || !msg.type) return;

                    // Handle sidebar navigation requests
                    if (msg.type === 'navigateTo' && msg.data && msg.data.page) {
                        const targetPage = PAGE_ROUTES[msg.data.page];
                        if (targetPage) {
                            console.log('[MasterPage] Sidebar navigation to:', targetPage);
                            wixLocation.to(targetPage);
                        } else {
                            console.warn('[MasterPage] Unknown page:', msg.data.page);
                        }
                    }
                });
            }
        } catch (e) {
            // HTML component doesn't exist on this page - skip silently
        }
    });
}

// ============================================================================
// SAFE ELEMENT ACCESS HELPERS
// ============================================================================

function safeShow(selector) {
    try {
        $w(selector).show();
    } catch (err) {
        // Element not on page - silent fail
    }
}

function safeHide(selector) {
    try {
        $w(selector).hide();
    } catch (err) {
        // Element not on page - silent fail
    }
}

function safeSetText(selector, text) {
    try {
        $w(selector).text = text;
    } catch (err) {
        // Element not on page - silent fail
    }
}

function safeOnClick(selector, handler) {
    try {
        $w(selector).onClick(handler);
    } catch (err) {
        // Element not on page - silent fail
    }
}
