/**
 * Master Page - Global Site Code
 * Runs on every page for auth state, notifications, and navigation
 */

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { session } from 'wix-storage';
import { initUtmTracking } from 'public/js/utm-tracker.js';
import { getUnreadCount } from 'backend/messaging';
import { updateLastActive } from 'backend/memberService';
import {
    createAnnouncement,
    updateAnnouncement,
    publishAnnouncement,
    scheduleAnnouncement,
    archiveAnnouncement,
    uploadAttachment,
    previewRecipients,
    markAnnouncementRead,
    getAnnouncementStats,
    getReadReceipts,
    getUnreadDrivers,
    getAnnouncementsForDriver,
    addComment,
    getAnnouncementsForCarrier,
    getCarrierContextForCurrentUser
} from 'backend/carrierAnnouncementsService';
import {
    createPolicy,
    updatePolicy,
    publishPolicyVersion,
    archivePolicy,
    uploadPolicyFile,
    getComplianceStatus,
    getPoliciesForDriver,
    getPolicyContent,
    acknowledgePolicy,
    getPoliciesForCarrier
} from 'backend/carrierPolicyService';
import { getOrCreateDriverProfile } from 'backend/driverProfiles';

$w.onReady(async function () {
    // Initialize Global Tracking
    initUtmTracking();

    await updateAuthState();
    setupGlobalNavigation();
    setupSidebarNavigation();

    // Track activity and load notifications for logged-in users
    if (wixUsers.currentUser.loggedIn) {
        loadNotificationBadge();
        updateLastActive();

        // Ensure profile exists and link attribution
        const sessionId = session.getItem('lmdr_anon_session_id');
        getOrCreateDriverProfile(sessionId).catch(err => console.log('[MasterPage] Profile sync:', err));
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
                        return;
                    }

                    handleCarrierCommunicationMessage(htmlComponent, msg);
                });
            }
        } catch (e) {
            // HTML component doesn't exist on this page - skip silently
        }
    });
}

// ============================================================================
// CARRIER COMMUNICATION BRIDGE (Announcements + Policies)
// ============================================================================

function getCarrierIdFromQuery() {
    const query = wixLocation.query || {};
    return query.carrierId || query.carrier_id || query.dot_number || query.carrierDot || null;
}

function sendHtmlMessage(htmlComponent, type, data) {
    try {
        htmlComponent.postMessage({ type, data });
    } catch (err) {
        // Silent fail - HTML component might not be ready
    }
}

async function getDriverContext() {
    const profileResult = await getOrCreateDriverProfile();
    const driverId = profileResult?.profile?._id || null;
    return {
        success: profileResult?.success || false,
        driverId,
        carrierId: getCarrierIdFromQuery()
    };
}

async function getCarrierContext() {
    const ctx = await getCarrierContextForCurrentUser();
    if (ctx.success) return ctx;
    const fallbackCarrierId = getCarrierIdFromQuery();
    if (fallbackCarrierId) {
        return { success: true, carrierId: fallbackCarrierId };
    }
    return ctx;
}

async function handleCarrierCommunicationMessage(htmlComponent, msg) {
    try {
        switch (msg.type) {
            // Carrier announcements
            case 'carrierAnnouncementsReady': {
                const ctx = await getCarrierContext();
                sendHtmlMessage(htmlComponent, 'carrierContext', { carrierId: ctx.carrierId || null, error: ctx.error });
                break;
            }
            case 'getCarrierAnnouncements': {
                const payload = msg.data || {};
                const ctx = await getCarrierContext();
                const result = await getAnnouncementsForCarrier(payload.carrierId || ctx.carrierId, {
                    status: payload.status,
                    limit: payload.limit,
                    offset: payload.offset
                });
                sendHtmlMessage(htmlComponent, 'carrierAnnouncementsData', result);
                break;
            }
            case 'createAnnouncement': {
                const result = await createAnnouncement(msg.data || {});
                sendHtmlMessage(htmlComponent, 'announcementActionResult', result);
                break;
            }
            case 'updateAnnouncement': {
                const result = await updateAnnouncement(msg.data?.announcementId, msg.data?.updates || {});
                sendHtmlMessage(htmlComponent, 'announcementActionResult', result);
                break;
            }
            case 'publishAnnouncement': {
                const result = await publishAnnouncement(msg.data?.announcementId);
                sendHtmlMessage(htmlComponent, 'announcementActionResult', result);
                break;
            }
            case 'scheduleAnnouncement': {
                const result = await scheduleAnnouncement(msg.data?.announcementId, msg.data?.scheduledAt);
                sendHtmlMessage(htmlComponent, 'announcementActionResult', result);
                break;
            }
            case 'archiveAnnouncement': {
                const result = await archiveAnnouncement(msg.data?.announcementId);
                sendHtmlMessage(htmlComponent, 'announcementActionResult', result);
                break;
            }
            case 'previewRecipients': {
                const payload = msg.data || {};
                const result = await previewRecipients(payload.carrierId, payload.targetAudience);
                sendHtmlMessage(htmlComponent, 'recipientPreviewResult', result);
                break;
            }
            case 'uploadAnnouncementAttachment': {
                const payload = msg.data || {};
                const result = await uploadAttachment(payload.base64Data, payload.fileName, payload.mimeType, payload.carrierId);
                sendHtmlMessage(htmlComponent, 'announcementAttachmentResult', result);
                break;
            }
            case 'getAnnouncementStats': {
                const result = await getAnnouncementStats(msg.data?.announcementId);
                sendHtmlMessage(htmlComponent, 'announcementStatsData', result);
                break;
            }
            case 'getReadReceipts': {
                const payload = msg.data || {};
                const result = await getReadReceipts(payload.announcementId, payload.limit, payload.offset);
                sendHtmlMessage(htmlComponent, 'announcementReadReceiptsData', result);
                break;
            }
            case 'getUnreadDrivers': {
                const payload = msg.data || {};
                const result = await getUnreadDrivers(payload.announcementId, payload.carrierId, payload.limit, payload.offset);
                sendHtmlMessage(htmlComponent, 'announcementUnreadDriversData', result);
                break;
            }

            // Driver announcements
            case 'driverAnnouncementsReady': {
                const ctx = await getDriverContext();
                sendHtmlMessage(htmlComponent, 'driverContext', { driverId: ctx.driverId, carrierId: ctx.carrierId });
                break;
            }
            case 'getDriverAnnouncements': {
                const payload = msg.data || {};
                const result = await getAnnouncementsForDriver(payload.driverId, payload.carrierId, {
                    limit: payload.limit,
                    offset: payload.offset
                });
                sendHtmlMessage(htmlComponent, 'driverAnnouncementsData', result);
                break;
            }
            case 'markAnnouncementRead': {
                const payload = msg.data || {};
                const result = await markAnnouncementRead(payload.announcementId, payload.driverId, payload.deviceType, payload.timeSpentSeconds);
                sendHtmlMessage(htmlComponent, 'announcementReadResult', result);
                break;
            }
            case 'addAnnouncementComment': {
                const payload = msg.data || {};
                const result = await addComment(payload.announcementId, payload.driverId, payload.commentText);
                sendHtmlMessage(htmlComponent, 'announcementCommentResult', result);
                break;
            }

            // Carrier policies
            case 'carrierPoliciesReady': {
                const ctx = await getCarrierContext();
                sendHtmlMessage(htmlComponent, 'carrierContext', { carrierId: ctx.carrierId || null, error: ctx.error });
                break;
            }
            case 'getCarrierPolicies': {
                const payload = msg.data || {};
                const ctx = await getCarrierContext();
                const result = await getPoliciesForCarrier(payload.carrierId || ctx.carrierId, {
                    status: payload.status,
                    limit: payload.limit,
                    offset: payload.offset,
                    category: payload.category
                });
                sendHtmlMessage(htmlComponent, 'carrierPoliciesData', result);
                break;
            }
            case 'createPolicy': {
                const result = await createPolicy(msg.data || {});
                sendHtmlMessage(htmlComponent, 'policyActionResult', result);
                break;
            }
            case 'updatePolicy': {
                const result = await updatePolicy(msg.data?.policyId, msg.data?.updates || {});
                sendHtmlMessage(htmlComponent, 'policyActionResult', result);
                break;
            }
            case 'publishPolicyVersion': {
                const result = await publishPolicyVersion(msg.data?.policyId, msg.data?.changeSummary || '');
                sendHtmlMessage(htmlComponent, 'policyActionResult', result);
                break;
            }
            case 'archivePolicy': {
                const result = await archivePolicy(msg.data?.policyId);
                sendHtmlMessage(htmlComponent, 'policyActionResult', result);
                break;
            }
            case 'uploadPolicyFile': {
                const payload = msg.data || {};
                const result = await uploadPolicyFile(payload.base64Data, payload.fileName, payload.mimeType, payload.carrierId);
                sendHtmlMessage(htmlComponent, 'policyUploadResult', result);
                break;
            }
            case 'getComplianceStatus': {
                const result = await getComplianceStatus(msg.data?.carrierId);
                sendHtmlMessage(htmlComponent, 'complianceStatusData', result);
                break;
            }

            // Driver policies
            case 'driverPoliciesReady': {
                const ctx = await getDriverContext();
                sendHtmlMessage(htmlComponent, 'driverContext', { driverId: ctx.driverId, carrierId: ctx.carrierId });
                break;
            }
            case 'getDriverPolicies': {
                const payload = msg.data || {};
                const result = await getPoliciesForDriver(payload.driverId, payload.carrierId);
                sendHtmlMessage(htmlComponent, 'driverPoliciesData', result);
                break;
            }
            case 'getPolicyContent': {
                const result = await getPolicyContent(msg.data?.policyId);
                sendHtmlMessage(htmlComponent, 'policyContentData', result);
                break;
            }
            case 'acknowledgePolicy': {
                const payload = msg.data || {};
                const result = await acknowledgePolicy(
                    payload.policyId,
                    payload.driverId,
                    payload.signatureType,
                    payload.ipAddress,
                    payload.deviceInfo
                );
                sendHtmlMessage(htmlComponent, 'policyAcknowledgeResult', result);
                break;
            }
            default:
                break;
        }
    } catch (err) {
        console.error('[MasterPage] Communication bridge error:', err);
    }
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
