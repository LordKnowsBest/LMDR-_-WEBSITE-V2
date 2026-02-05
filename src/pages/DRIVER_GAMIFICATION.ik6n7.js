/**
 * DRIVER_GAMIFICATION Page Code
 * Bridges DRIVER_GAMIFICATION.html with gamificationService, challengeService, badgeService.
 *
 * HTML uses type key pattern.
 * HTML sends: gamificationReady, refreshGamification, startChallenge, claimReward,
 *             viewChallenges, viewAchievements, navigateTo, ping
 * HTML expects: gamificationData, progressionUpdate, challengeUpdate,
 *               achievementUnlocked, levelUp, streakUpdate, xpAwarded,
 *               challengeComplete, error, pong
 */

import {
    getDriverProgression
} from 'backend/gamificationService';

import {
    getActiveChallenges,
    startChallenge,
    claimChallengeReward
} from 'backend/challengeService';

import {
    getBadges
} from 'backend/badgeService';

import wixUsers from 'wix-users';
import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('DRIVER_GAMIFICATION: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('DRIVER_GAMIFICATION: No HTML component found');
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
        case 'startChallenge':
            await handleStartChallenge(component, msg);
            break;
        case 'claimReward':
            await handleClaimReward(component, msg);
            break;
        case 'viewChallenges':
            wixLocationFrontend.to('/challenges');
            break;
        case 'viewAchievements':
            wixLocationFrontend.to('/driver-badges');
            break;
        case 'navigateTo':
            handleNavigateTo(msg);
            break;
        case 'ping':
            safeSend(component, { type: 'pong' });
            break;
        default:
            console.warn('DRIVER_GAMIFICATION: Unknown type:', msg.type);
    }
}

async function handleLoadGamification(component) {
    try {
        const userId = wixUsers.currentUser.id;

        const [progression, challenges, badges] = await Promise.all([
            getDriverProgression(userId),
            getActiveChallenges(userId, 'driver'),
            getBadges(userId, 'driver')
        ]);

        safeSend(component, {
            type: 'gamificationData',
            data: {
                progression: progression || {},
                challenges: challenges || [],
                achievements: badges.achievements || badges || [],
                recommendations: []
            }
        });
    } catch (error) {
        console.error('DRIVER_GAMIFICATION: loadGamification error:', error);
        safeSend(component, {
            type: 'gamificationData',
            data: { progression: {}, challenges: [], achievements: [], recommendations: [] }
        });
    }
}

async function handleStartChallenge(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.challengeId) return;
        const userId = wixUsers.currentUser.id;
        const result = await startChallenge(userId, data.challengeId, 'driver');
        safeSend(component, { type: 'challengeUpdate', data: result });
    } catch (error) {
        console.error('DRIVER_GAMIFICATION: startChallenge error:', error);
        safeSend(component, { type: 'error', data: { message: error.message } });
    }
}

async function handleClaimReward(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.challengeId) return;
        const userId = wixUsers.currentUser.id;
        const result = await claimChallengeReward(userId, data.challengeId, 'driver');
        safeSend(component, { type: 'challengeComplete', data: result });
    } catch (error) {
        console.error('DRIVER_GAMIFICATION: claimReward error:', error);
        safeSend(component, { type: 'error', data: { message: error.message } });
    }
}

function handleNavigateTo(msg) {
    const data = msg.data || {};
    const action = data.action;
    if (!action) return;
    const routes = {
        'profile': '/driver-profile',
        'jobs': '/apply-for-cdl-driving-jobs',
        'challenges': '/challenges',
        'badges': '/driver-badges',
        'streak': '/driver-gamification'
    };
    wixLocationFrontend.to(routes[action] || `/${action}`);
}
