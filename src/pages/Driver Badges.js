// ============================================================================
// DRIVER BADGES PAGE - Page Code
// Handles communication between DRIVER_BADGES.html and Velo backend
// ============================================================================

import { setupBadgesPage } from 'public/js/gamificationPageHandlers';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // HTML component ID - adjust if different in editor
    htmlComponentId: '#badgesHtml',
    loginUrl: '/login'
};

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
    console.log('Driver Badges Page Ready');

    // Check if user is logged in
    if (!wixUsers.currentUser.loggedIn) {
        console.log('User not logged in, redirecting to login...');
        wixLocation.to(CONFIG.loginUrl);
        return;
    }

    // Find and set up the HTML component
    try {
        const htmlComponent = $w(CONFIG.htmlComponentId);
        if (htmlComponent && typeof htmlComponent.onMessage === 'function') {
            setupBadgesPage(htmlComponent);
            console.log('Driver badges page initialized');
        } else {
            console.error('Badges HTML component not found:', CONFIG.htmlComponentId);
        }
    } catch (e) {
        console.error('Error initializing badges page:', e);
    }
});
