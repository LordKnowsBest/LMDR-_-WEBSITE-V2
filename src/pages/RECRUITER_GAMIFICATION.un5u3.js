/**
 * RECRUITER_GAMIFICATION Page Code
 * Bridges recruiter gamification HTML with gamificationService, badgeService, leaderboardService.
 *
 * NOTE: No dedicated HTML file found during audit. This bridge provides
 * the standard gamification message protocol for when the HTML is created.
 *
 * HTML uses type key pattern.
 * HTML sends: gamificationReady, refreshGamification, viewLeaderboard, viewBadges, navigateTo, ping
 * HTML expects: gamificationData, error, pong
 */

import {
    getRecruiterProgression
} from 'backend/gamificationService';

import {
    getBadges
} from 'backend/badgeService';

import {
    getUserLeaderboardPosition
} from 'backend/leaderboardService';

import wixUsers from 'wix-users';
import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('RECRUITER_GAMIFICATION: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('RECRUITER_GAMIFICATION: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.type) return;
        await routeMessage(component, msg);
    });

    safeSend(component, { type: 'init' });
});

function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element not present
        }
    }
    return null;
}

async function routeMessage(component, msg) {
    switch (msg.type) {
        case 'gamificationReady':
        case 'refreshGamification':
            await handleLoadGamification(component);
            break;
        case 'viewLeaderboard':
            wixLocationFrontend.to('/recruiter-leaderboard');
            break;
        case 'viewBadges':
            wixLocationFrontend.to('/driver-badges');
            break;
        case 'navigateTo':
            handleNavigateTo(msg);
            break;
        case 'ping':
            safeSend(component, { type: 'pong' });
            break;
        default:
            console.warn('RECRUITER_GAMIFICATION: Unknown type:', msg.type);
    }
}

async function handleLoadGamification(component) {
    try {
        const userId = wixUsers.currentUser.id;

        const [progression, badges, leaderboardPos] = await Promise.all([
            getRecruiterProgression(userId),
            getBadges(userId, 'recruiter'),
            getUserLeaderboardPosition(userId, 'overall', 'monthly')
        ]);

        safeSend(component, {
            type: 'gamificationData',
            data: {
                progression: progression || {},
                achievements: badges.achievements || badges || [],
                leaderboardPosition: leaderboardPos || {},
                recommendations: []
            }
        });
    } catch (error) {
        console.error('RECRUITER_GAMIFICATION: loadGamification error:', error);
        safeSend(component, {
            type: 'gamificationData',
            data: { progression: {}, achievements: [], leaderboardPosition: {}, recommendations: [] }
        });
    }
}

function handleNavigateTo(msg) {
    const data = msg.data || {};
    const action = data.action;
    if (!action) return;
    const routes = {
        'dashboard': '/carrier-dashboard',
        'leaderboard': '/recruiter-leaderboard',
        'badges': '/driver-badges',
        'search': '/search-cdl-drivers',
        'telemetry': '/recruiter-telemetry'
    };
    wixLocationFrontend.to(routes[action] || `/${action}`);
}
