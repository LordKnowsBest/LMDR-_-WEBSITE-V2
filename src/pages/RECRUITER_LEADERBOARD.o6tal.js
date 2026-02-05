/**
 * RECRUITER_LEADERBOARD Page Code
 * Bridges RECRUITER_LEADERBOARD.html with leaderboardService.
 *
 * HTML uses type key pattern.
 * HTML sends: leaderboardReady, getLeaderboard
 * HTML expects: leaderboardData, leaderboardPage
 */

import {
    getLeaderboard,
    getUserLeaderboardPosition
} from 'backend/leaderboardService';

import wixUsers from 'wix-users';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('RECRUITER_LEADERBOARD: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('RECRUITER_LEADERBOARD: No HTML component found');
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
        case 'leaderboardReady':
            await handleLeaderboardReady(component);
            break;
        case 'getLeaderboard':
            await handleGetLeaderboard(component, msg);
            break;
        default:
            console.warn('RECRUITER_LEADERBOARD: Unknown type:', msg.type);
    }
}

async function handleLeaderboardReady(component) {
    try {
        const userId = wixUsers.currentUser.id;
        const [leaderboard, position] = await Promise.all([
            getLeaderboard('overall', 'monthly', { limit: 20 }),
            getUserLeaderboardPosition(userId, 'overall', 'monthly')
        ]);

        safeSend(component, {
            type: 'leaderboardData',
            data: {
                rankings: leaderboard || [],
                currentUser: position || {},
                hasMore: (leaderboard || []).length >= 20
            }
        });
    } catch (error) {
        console.error('RECRUITER_LEADERBOARD: leaderboardReady error:', error);
        safeSend(component, {
            type: 'leaderboardData',
            data: { rankings: [], currentUser: {}, hasMore: false }
        });
    }
}

async function handleGetLeaderboard(component, msg) {
    try {
        const data = msg.data || {};
        const type = data.type || 'overall';
        const period = data.period || 'monthly';
        const page = data.page || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const leaderboard = await getLeaderboard(type, period, { limit, offset });

        safeSend(component, {
            type: page > 1 ? 'leaderboardPage' : 'leaderboardData',
            data: {
                rankings: leaderboard || [],
                currentUser: {},
                hasMore: (leaderboard || []).length >= limit,
                page
            }
        });
    } catch (error) {
        console.error('RECRUITER_LEADERBOARD: getLeaderboard error:', error);
        safeSend(component, {
            type: 'leaderboardData',
            data: { rankings: [], currentUser: {}, hasMore: false }
        });
    }
}
