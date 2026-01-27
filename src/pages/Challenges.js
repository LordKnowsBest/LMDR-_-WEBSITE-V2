// ============================================================================
// CHALLENGES PAGE - Page Code
// Handles communication between CHALLENGES.html and Velo backend
// Works for both drivers and recruiters
// ============================================================================

import { setupChallengesPage } from 'public/js/gamificationPageHandlers';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // HTML component ID - adjust if different in editor
    htmlComponentId: '#challengesHtml',
    loginUrl: '/login'
};

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
    console.log('Challenges Page Ready');

    // Check if user is logged in
    if (!wixUsers.currentUser.loggedIn) {
        console.log('User not logged in, redirecting to login...');
        wixLocation.to(CONFIG.loginUrl);
        return;
    }

    // Determine user type based on URL or profile
    // This can be enhanced to check actual user role
    const path = wixLocation.path;
    const userType = path.includes('recruiter') ? 'recruiter' : 'driver';
    console.log('User type detected:', userType);

    // Find and set up the HTML component
    try {
        const htmlComponent = $w(CONFIG.htmlComponentId);
        if (htmlComponent && typeof htmlComponent.onMessage === 'function') {
            setupChallengesPage(htmlComponent, userType);
            console.log('Challenges page initialized for:', userType);
        } else {
            console.error('Challenges HTML component not found:', CONFIG.htmlComponentId);
        }
    } catch (e) {
        console.error('Error initializing challenges page:', e);
    }
});
