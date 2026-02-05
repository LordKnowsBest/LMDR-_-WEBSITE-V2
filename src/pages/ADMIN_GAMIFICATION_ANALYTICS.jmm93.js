import { getGamificationDashboardMetrics, detectAbusePatterns } from 'backend/gamificationAnalyticsService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('ADMIN_GAMIFICATION_ANALYTICS: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('ADMIN_GAMIFICATION_ANALYTICS: No HTML component found');
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
            // Element may not exist on page
        }
    }
    return null;
}

async function routeMessage(component, msg) {
    switch (msg.type) {
        case 'getGamificationMetrics':
            await handleGetGamificationMetrics(component);
            break;
        case 'detectAbusePatterns':
            await handleDetectAbusePatterns(component);
            break;
        default:
            console.warn('ADMIN_GAMIFICATION_ANALYTICS: Unknown message type:', msg.type);
    }
}

async function handleGetGamificationMetrics(component) {
    try {
        const result = await getGamificationDashboardMetrics();
        safeSend(component, { type: 'gamificationMetricsResult', data: result });
    } catch (err) {
        console.error('ADMIN_GAMIFICATION_ANALYTICS: getGamificationMetrics error:', err);
        safeSend(component, {
            type: 'gamificationMetricsResult',
            data: { success: false, error: err.message }
        });
    }
}

async function handleDetectAbusePatterns(component) {
    try {
        const result = await detectAbusePatterns();
        safeSend(component, { type: 'abuseDetectionResult', data: result });
    } catch (err) {
        console.error('ADMIN_GAMIFICATION_ANALYTICS: detectAbusePatterns error:', err);
        safeSend(component, {
            type: 'abuseDetectionResult',
            data: { success: false, error: err.message }
        });
    }
}
