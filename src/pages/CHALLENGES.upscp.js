/**
 * CHALLENGES Page Code
 * Bridges CHALLENGES.html with challengeService.
 *
 * HTML uses type key pattern.
 * HTML sends: challengesReady, startChallenge, claimReward
 * HTML expects: challengesData, challengeStarted, rewardClaimed, error
 */

import {
    getActiveChallenges,
    getAvailableChallenges,
    getChallengeHistory,
    startChallenge,
    claimChallengeReward
} from 'backend/challengeService';

import wixUsers from 'wix-users';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('CHALLENGES: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('CHALLENGES: No HTML component found');
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
        case 'challengesReady':
            await handleLoadChallenges(component);
            break;
        case 'startChallenge':
            await handleStartChallenge(component, msg);
            break;
        case 'claimReward':
            await handleClaimReward(component, msg);
            break;
        default:
            console.warn('CHALLENGES: Unknown type:', msg.type);
    }
}

async function handleLoadChallenges(component) {
    try {
        const userId = wixUsers.currentUser.id;
        const userType = 'driver';

        const [active, available, history] = await Promise.all([
            getActiveChallenges(userId, userType),
            getAvailableChallenges(userId, userType),
            getChallengeHistory(userId, userType, { limit: 20 })
        ]);

        safeSend(component, {
            type: 'challengesData',
            data: {
                userType,
                active: active || [],
                available: available || [],
                completed: history || []
            }
        });
    } catch (error) {
        console.error('CHALLENGES: loadChallenges error:', error);
        safeSend(component, {
            type: 'challengesData',
            data: { userType: 'driver', active: [], available: [], completed: [] }
        });
    }
}

async function handleStartChallenge(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.challengeId) return;
        const userId = wixUsers.currentUser.id;
        const result = await startChallenge(userId, data.challengeId, 'driver');
        safeSend(component, { type: 'challengeStarted', data: result });
    } catch (error) {
        console.error('CHALLENGES: startChallenge error:', error);
        safeSend(component, { type: 'error', data: { message: error.message } });
    }
}

async function handleClaimReward(component, msg) {
    try {
        const data = msg.data || {};
        if (!data.challengeId) return;
        const userId = wixUsers.currentUser.id;
        const result = await claimChallengeReward(userId, data.challengeId, 'driver');
        safeSend(component, { type: 'rewardClaimed', data: result });
    } catch (error) {
        console.error('CHALLENGES: claimReward error:', error);
        safeSend(component, { type: 'error', data: { message: error.message } });
    }
}
