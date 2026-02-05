/**
 * DRIVER_BADGES Page Code
 * Bridges DRIVER_BADGES.html with badgeService.
 *
 * HTML uses type key pattern.
 * HTML sends: badgesReady, updateFeatured
 * HTML expects: achievementsData, featuredUpdated, error
 */

import {
    getBadges,
    getBadgeDefinitions
} from 'backend/badgeService';

import wixUsers from 'wix-users';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('DRIVER_BADGES: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('DRIVER_BADGES: No HTML component found');
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
        case 'badgesReady':
            await handleLoadBadges(component);
            break;
        case 'updateFeatured':
            await handleUpdateFeatured(component, msg);
            break;
        default:
            console.warn('DRIVER_BADGES: Unknown type:', msg.type);
    }
}

async function handleLoadBadges(component) {
    try {
        const userId = wixUsers.currentUser.id;
        const badges = await getBadges(userId, 'driver');
        safeSend(component, {
            type: 'achievementsData',
            data: {
                achievements: badges.achievements || badges || [],
                featured: badges.featured || []
            }
        });
    } catch (error) {
        console.error('DRIVER_BADGES: loadBadges error:', error);
        safeSend(component, {
            type: 'achievementsData',
            data: { achievements: [], featured: [] }
        });
    }
}

async function handleUpdateFeatured(component, msg) {
    try {
        const data = msg.data || {};
        safeSend(component, {
            type: 'featuredUpdated',
            data: { featured: data.featured || [] }
        });
    } catch (error) {
        console.error('DRIVER_BADGES: updateFeatured error:', error);
        safeSend(component, { type: 'error', data: { message: error.message } });
    }
}
