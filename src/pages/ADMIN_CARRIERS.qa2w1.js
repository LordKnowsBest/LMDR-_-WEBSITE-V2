/**
 * ADMIN_CARRIERS Page Code
 *
 * Wires the ADMIN_CARRIERS.html iframe to backend/carrierAdminService.jsw.
 * Handles carrier listing, filtering, detail views, status updates,
 * flagging, enrichment refresh, bulk actions, and CSV export.
 */

import wixLocation from 'wix-location';
import {
    getCarriersList,
    getCarrierDetail,
    updateCarrierStatus,
    flagCarrier,
    unflagCarrier,
    refreshCarrierEnrichment,
    bulkUpdateCarriers,
    getCarrierStats,
    exportCarriersCSV
} from 'backend/carrierAdminService';

// Candidate HTML component IDs on the page
const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(function () {
    const components = discoverHtmlComponents();

    if (!components.length) {
        console.warn('[ADMIN_CARRIERS] No HTML components found on page');
        return;
    }

    for (const comp of components) {
        comp.onMessage(async (event) => {
            await routeMessage(comp, event?.data);
        });

        // Send init so the iframe knows the bridge is ready
        comp.postMessage({ action: 'init' });
    }
});

// ============================================
// HTML Component Discovery (safe)
// ============================================

/**
 * Safely discover all HTML embed components on the page.
 * Uses try-catch per the UI Safety Pattern.
 */
function discoverHtmlComponents() {
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                found.push(el);
            }
        } catch (_err) {
            // Element does not exist on this page variant -- skip
        }
    }
    return found;
}

// ============================================
// Message Router
// ============================================

async function routeMessage(component, message) {
    if (!message || !message.action) return;

    switch (message.action) {
        // ---------- Read operations ----------
        case 'getCarriers':
            await handleGetCarriers(component, message);
            break;

        case 'getStats':
            await handleGetStats(component);
            break;

        case 'getCarrierDetail':
            await handleGetCarrierDetail(component, message);
            break;

        // ---------- Write operations ----------
        case 'updateStatus':
            await handleUpdateStatus(component, message);
            break;

        case 'flagCarrier':
            await handleFlagCarrier(component, message);
            break;

        case 'unflagCarrier':
            await handleUnflagCarrier(component, message);
            break;

        case 'refreshEnrichment':
            await handleRefreshEnrichment(component, message);
            break;

        // ---------- Bulk operations ----------
        case 'bulkActivate':
            await handleBulkAction(component, message.carrierIds, 'activate');
            break;

        case 'bulkFlag':
            await handleBulkAction(component, message.carrierIds, 'flag');
            break;

        // ---------- Export ----------
        case 'exportCarriers':
            await handleExport(component, message);
            break;

        // ---------- Navigation ----------
        case 'viewFMCSA':
            handleViewFMCSA(message);
            break;

        case 'openAddCarrierModal':
            // Future: navigate to carrier creation page or show modal
            break;

        default:
            console.warn('[ADMIN_CARRIERS] Unknown action:', message.action);
    }
}

// ============================================
// Handler Implementations
// ============================================

async function handleGetCarriers(component, message) {
    try {
        const result = await getCarriersList({
            filters: message.filters || {},
            page: message.page || 1,
            pageSize: message.pageSize || 25,
            sortField: message.sortField || 'lastUpdated',
            sortDirection: message.sortDirection || 'desc'
        });

        sendMessage(component, {
            action: 'carriersLoaded',
            payload: {
                carriers: result.carriers,
                totalCount: result.totalCount,
                currentPage: result.currentPage,
                pageSize: result.pageSize
            }
        });
    } catch (error) {
        console.error('[ADMIN_CARRIERS] getCarriers error:', error);
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to load carriers. Please try again.'
        });
    }
}

async function handleGetStats(component) {
    try {
        const stats = await getCarrierStats();
        sendMessage(component, {
            action: 'statsLoaded',
            payload: stats
        });
    } catch (error) {
        console.error('[ADMIN_CARRIERS] getStats error:', error);
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to load carrier statistics.'
        });
    }
}

async function handleGetCarrierDetail(component, message) {
    try {
        const detail = await getCarrierDetail(message.carrierId);
        sendMessage(component, {
            action: 'carrierDetail',
            payload: detail
        });
    } catch (error) {
        console.error('[ADMIN_CARRIERS] getCarrierDetail error:', error);
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to load carrier details.'
        });
    }
}

async function handleUpdateStatus(component, message) {
    try {
        await updateCarrierStatus(message.carrierId, message.status, message.reason || '');
        sendMessage(component, {
            action: 'actionSuccess',
            message: `Carrier status updated to ${message.status}.`
        });
    } catch (error) {
        console.error('[ADMIN_CARRIERS] updateStatus error:', error);
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to update carrier status.'
        });
    }
}

async function handleFlagCarrier(component, message) {
    try {
        await flagCarrier(message.carrierId, message.reason || 'Flagged via admin panel');
        sendMessage(component, {
            action: 'actionSuccess',
            message: 'Carrier flagged for review.'
        });
    } catch (error) {
        console.error('[ADMIN_CARRIERS] flagCarrier error:', error);
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to flag carrier.'
        });
    }
}

async function handleUnflagCarrier(component, message) {
    try {
        await unflagCarrier(message.carrierId);
        sendMessage(component, {
            action: 'actionSuccess',
            message: 'Carrier flag removed.'
        });
    } catch (error) {
        console.error('[ADMIN_CARRIERS] unflagCarrier error:', error);
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to remove carrier flag.'
        });
    }
}

async function handleRefreshEnrichment(component, message) {
    try {
        const result = await refreshCarrierEnrichment(message.carrierId);
        sendMessage(component, {
            action: 'actionSuccess',
            message: result.message || 'Enrichment cache refreshed.'
        });
    } catch (error) {
        console.error('[ADMIN_CARRIERS] refreshEnrichment error:', error);
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to refresh enrichment.'
        });
    }
}

async function handleBulkAction(component, carrierIds, action) {
    if (!carrierIds || !carrierIds.length) {
        sendMessage(component, {
            action: 'actionError',
            message: 'No carriers selected.'
        });
        return;
    }

    try {
        const result = await bulkUpdateCarriers(carrierIds, action);
        const label = action === 'activate' ? 'activated' : 'flagged';
        sendMessage(component, {
            action: 'actionSuccess',
            message: `${result.success} carrier(s) ${label} successfully.${result.failed ? ` ${result.failed} failed.` : ''}`
        });
    } catch (error) {
        console.error('[ADMIN_CARRIERS] bulkAction error:', error);
        sendMessage(component, {
            action: 'actionError',
            message: `Failed to perform bulk ${action}.`
        });
    }
}

async function handleExport(component, message) {
    try {
        const csv = await exportCarriersCSV(message.filters || {});
        sendMessage(component, {
            action: 'exportReady',
            payload: csv
        });
    } catch (error) {
        console.error('[ADMIN_CARRIERS] export error:', error);
        sendMessage(component, {
            action: 'actionError',
            message: 'Failed to export carriers.'
        });
    }
}

function handleViewFMCSA(message) {
    if (message.dotNumber) {
        wixLocation.to(`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${message.dotNumber}`);
    }
}

// ============================================
// Utility
// ============================================

/**
 * Safely post a message to an HTML component.
 */
function sendMessage(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (err) {
        console.error('[ADMIN_CARRIERS] postMessage failed:', err);
    }
}
