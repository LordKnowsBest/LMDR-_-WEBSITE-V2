/**
 * GAMIFICATION_HELP Page Code
 * Bridges GAMIFICATION_HELP.html with minimal context.
 *
 * HTML is mostly static help/FAQ content about XP, streaks, achievements.
 * HTML uses type key pattern.
 * HTML sends: gamificationHelpReady
 * HTML expects: setUserType
 */

import wixLocationFrontend from 'wix-location-frontend';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('GAMIFICATION_HELP: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('GAMIFICATION_HELP: No HTML component found');
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
        case 'gamificationHelpReady':
            handleHelpReady(component);
            break;
        default:
            console.warn('GAMIFICATION_HELP: Unknown type:', msg.type);
    }
}

function handleHelpReady(component) {
    const query = wixLocationFrontend.query;
    const userType = query.userType || query.type || 'driver';

    safeSend(component, {
        type: 'setUserType',
        data: { userType }
    });
}
