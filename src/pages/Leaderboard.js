// ============================================================================
// LEADERBOARD PAGE - Page Code
// Handles communication between Leaderboard.html and Velo backend
// ============================================================================

import { setupLeaderboardPage } from 'public/js/gamificationPageHandlers';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // HTML component ID - adjust if different in editor
    htmlComponentId: '#leaderboardHtml',
    loginUrl: '/login'
};

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
    console.log('Leaderboard Page Ready');

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
            setupLeaderboardPage(htmlComponent);
            console.log('Leaderboard page initialized');
        } else {
            console.error('Leaderboard HTML component not found:', CONFIG.htmlComponentId);
        }
    } catch (e) {
        console.error('Error initializing leaderboard page:', e);
    }
});
