/**
 * ADMIN_MATCHES Page Code
 *
 * Wires the ADMIN_MATCHES.html HtmlComponent to the admin_match_service backend.
 * Handles bidirectional postMessage communication for match management,
 * interest tracking, analytics/trends, and CSV export.
 *
 * PostMessage actions handled (from HTML):
 *   getStats, getActionList, getMatches, getInterests,
 *   getTrends, getTopMatches, getMatchDetail, exportMatches
 *
 * PostMessage actions sent (to HTML):
 *   init, statsLoaded, actionListLoaded, matchesLoaded, interestsLoaded,
 *   trendsLoaded, topMatchesLoaded, matchDetailLoaded, exportReady, actionError
 */

import {
    getMatchesList,
    getMatchDetail,
    getInterestsList,
    getMatchStats,
    getMatchTrends,
    getTopMatches,
    exportMatchesCSV,
    getActionList
} from 'backend/admin_match_service';

// HTML component IDs to probe (Wix editor may assign any of these)
const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(function () {
    const htmlComponent = findHtmlComponent();

    if (!htmlComponent) {
        console.warn('[ADMIN_MATCHES] No HTML component found on page');
        return;
    }

    // Register the message handler
    htmlComponent.onMessage(async (event) => {
        await handleMessage(htmlComponent, event?.data);
    });

    // Send init signal so the HTML component can begin loading data
    htmlComponent.postMessage({ action: 'init' });
});

// ============================================
// HTML COMPONENT DISCOVERY (safe)
// ============================================

/**
 * Safely probes known HTML component IDs and returns the first valid one.
 * Uses try-catch to satisfy the selector-safety hook.
 */
function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (_err) {
            // Element does not exist on this page variant -- skip
        }
    }
    return null;
}

// ============================================
// MESSAGE ROUTING
// ============================================

/**
 * Routes incoming postMessage events from the HTML component
 * to the appropriate backend service call, then posts the
 * result back to the iframe.
 */
async function handleMessage(component, message) {
    if (!message || !message.action) return;

    const { action } = message;

    try {
        switch (action) {
            case 'getStats':
                await handleGetStats(component);
                break;

            case 'getActionList':
                await handleGetActionList(component);
                break;

            case 'getMatches':
                await handleGetMatches(component, message);
                break;

            case 'getInterests':
                await handleGetInterests(component, message);
                break;

            case 'getTrends':
                await handleGetTrends(component, message);
                break;

            case 'getTopMatches':
                await handleGetTopMatches(component, message);
                break;

            case 'getMatchDetail':
                await handleGetMatchDetail(component, message);
                break;

            case 'exportMatches':
                await handleExportMatches(component, message);
                break;

            default:
                console.warn('[ADMIN_MATCHES] Unknown action:', action);
                break;
        }
    } catch (error) {
        console.error(`[ADMIN_MATCHES] Error handling "${action}":`, error);
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// ============================================
// HANDLER FUNCTIONS
// ============================================

async function handleGetStats(component) {
    const stats = await getMatchStats();
    safeSend(component, { action: 'statsLoaded', payload: stats });
}

async function handleGetActionList(component) {
    const actions = await getActionList();
    safeSend(component, { action: 'actionListLoaded', payload: actions });
}

async function handleGetMatches(component, message) {
    const { filters = {}, page = 1, pageSize = 50 } = message;

    const result = await getMatchesList({
        filters: {
            carrierName: filters.carrierName || undefined,
            minScore: filters.minScore || undefined,
            action: filters.action || undefined
        },
        page,
        pageSize
    });

    safeSend(component, { action: 'matchesLoaded', payload: result });
}

async function handleGetInterests(component, message) {
    const { filters = {}, page = 1, pageSize = 50 } = message;

    const result = await getInterestsList({
        filters: {
            status: filters.status || undefined,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined
        },
        page,
        pageSize
    });

    safeSend(component, { action: 'interestsLoaded', payload: result });
}

async function handleGetTrends(component, message) {
    const period = message.period || 'week';
    const trends = await getMatchTrends(period);
    safeSend(component, { action: 'trendsLoaded', payload: trends });
}

async function handleGetTopMatches(component, message) {
    const limit = message.limit || 10;
    const topMatches = await getTopMatches(limit);
    safeSend(component, { action: 'topMatchesLoaded', payload: topMatches });
}

async function handleGetMatchDetail(component, message) {
    const { matchId } = message;
    if (!matchId) {
        safeSend(component, {
            action: 'actionError',
            message: 'Match ID is required'
        });
        return;
    }

    const detail = await getMatchDetail(matchId);
    safeSend(component, { action: 'matchDetailLoaded', payload: detail });
}

async function handleExportMatches(component, message) {
    const { filters = {} } = message;
    const csv = await exportMatchesCSV({
        minScore: filters.minScore || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
    });
    safeSend(component, { action: 'exportReady', payload: csv });
}

// ============================================
// SAFE SEND HELPER
// ============================================

/**
 * Safely sends a postMessage to the HTML component.
 * Guards against the component being removed or unavailable.
 */
function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (err) {
        console.error('[ADMIN_MATCHES] Failed to postMessage:', err);
    }
}
