/**
 * ADMIN_DRIVERS Page Code
 * Wires the ADMIN_DRIVERS.html HTML component with backend admin_service.jsw
 *
 * Message protocol uses "action" key (not "type").
 * Outbound from HTML: getDrivers, getStats, getDriverDetail, verifyDriver,
 *   suspendDriver, bulkVerify, bulkSuspend, exportDrivers, openMessageModal,
 *   openAddDriverModal, revealEmail, ping
 * Inbound to HTML: init, driversLoaded, driverDetail, statsLoaded,
 *   actionSuccess, actionError, emailRevealed, exportReady, pong
 */

import {
    getDriversList,
    getDriverDetail,
    getDriverStats,
    verifyDriver,
    suspendDriver,
    bulkUpdateDrivers,
    exportDriversCSV
} from 'backend/admin_service';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('ADMIN_DRIVERS: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.action) return;
        await routeMessage(component, msg);
    });

    // Send init signal so the HTML can request its initial data
    component.postMessage({ action: 'init' });
});

/**
 * Safely discover the first available HTML component on the page
 */
function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element not present on this page variant
        }
    }
    return null;
}

/**
 * Route incoming messages from the HTML component to the appropriate handler
 */
async function routeMessage(component, msg) {
    switch (msg.action) {
        case 'ping':
            component.postMessage({ action: 'pong', timestamp: Date.now() });
            break;

        case 'getDrivers':
            await handleGetDrivers(component, msg);
            break;

        case 'getStats':
            await handleGetStats(component);
            break;

        case 'getDriverDetail':
            await handleGetDriverDetail(component, msg);
            break;

        case 'verifyDriver':
            await handleVerifyDriver(component, msg);
            break;

        case 'suspendDriver':
            await handleSuspendDriver(component, msg);
            break;

        case 'bulkVerify':
            await handleBulkAction(component, msg, 'verify');
            break;

        case 'bulkSuspend':
            await handleBulkAction(component, msg, 'suspend');
            break;

        case 'exportDrivers':
            await handleExportDrivers(component, msg);
            break;

        case 'revealEmail':
            await handleRevealEmail(component, msg);
            break;

        case 'openMessageModal':
            // Placeholder: messaging handled via Wix inbox or custom modal
            console.log('ADMIN_DRIVERS: openMessageModal requested for', msg.driverId);
            break;

        case 'openAddDriverModal':
            // Placeholder: add-driver flow can be implemented later
            console.log('ADMIN_DRIVERS: openAddDriverModal requested');
            break;

        default:
            console.warn('ADMIN_DRIVERS: Unknown action:', msg.action);
    }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

/**
 * Fetch paginated, filtered, sorted drivers list
 */
async function handleGetDrivers(component, msg) {
    try {
        const result = await getDriversList({
            filters: msg.filters || {},
            page: msg.page || 1,
            pageSize: msg.pageSize || 25,
            sortField: msg.sortField || 'lastActive',
            sortDirection: msg.sortDirection || 'desc'
        });

        component.postMessage({
            action: 'driversLoaded',
            payload: {
                drivers: result.drivers,
                totalCount: result.totalCount,
                currentPage: result.currentPage
            }
        });
    } catch (error) {
        console.error('ADMIN_DRIVERS: getDrivers error:', error);
        component.postMessage({
            action: 'actionError',
            message: 'Failed to load drivers. Please try again.'
        });
    }
}

/**
 * Fetch driver statistics for the stat cards
 */
async function handleGetStats(component) {
    try {
        const stats = await getDriverStats();

        component.postMessage({
            action: 'statsLoaded',
            payload: stats
        });
    } catch (error) {
        console.error('ADMIN_DRIVERS: getStats error:', error);
        // Stats failure is non-critical; HTML shows placeholders
    }
}

/**
 * Fetch detailed driver profile for the modal
 */
async function handleGetDriverDetail(component, msg) {
    try {
        const driver = await getDriverDetail(msg.driverId);

        component.postMessage({
            action: 'driverDetail',
            payload: driver
        });
    } catch (error) {
        console.error('ADMIN_DRIVERS: getDriverDetail error:', error);
        component.postMessage({
            action: 'actionError',
            message: 'Failed to load driver details.'
        });
    }
}

/**
 * Mark a driver as verified
 */
async function handleVerifyDriver(component, msg) {
    try {
        await verifyDriver(msg.driverId);

        component.postMessage({
            action: 'actionSuccess',
            message: 'Driver verified successfully.'
        });
    } catch (error) {
        console.error('ADMIN_DRIVERS: verifyDriver error:', error);
        component.postMessage({
            action: 'actionError',
            message: 'Failed to verify driver.'
        });
    }
}

/**
 * Suspend a driver account
 */
async function handleSuspendDriver(component, msg) {
    try {
        await suspendDriver(msg.driverId, msg.reason || '');

        component.postMessage({
            action: 'actionSuccess',
            message: 'Driver suspended successfully.'
        });
    } catch (error) {
        console.error('ADMIN_DRIVERS: suspendDriver error:', error);
        component.postMessage({
            action: 'actionError',
            message: 'Failed to suspend driver.'
        });
    }
}

/**
 * Handle bulk verify or bulk suspend actions
 */
async function handleBulkAction(component, msg, actionType) {
    try {
        const driverIds = msg.driverIds || [];
        if (driverIds.length === 0) {
            component.postMessage({
                action: 'actionError',
                message: 'No drivers selected for bulk action.'
            });
            return;
        }

        const result = await bulkUpdateDrivers(driverIds, actionType);

        const label = actionType === 'verify' ? 'verified' : 'suspended';
        component.postMessage({
            action: 'actionSuccess',
            message: `${result.success} driver(s) ${label} successfully.${result.failed > 0 ? ` ${result.failed} failed.` : ''}`
        });
    } catch (error) {
        console.error('ADMIN_DRIVERS: bulkAction error:', error);
        component.postMessage({
            action: 'actionError',
            message: `Bulk ${actionType} failed. Please try again.`
        });
    }
}

/**
 * Export drivers to CSV and send data back to the HTML for download
 */
async function handleExportDrivers(component, msg) {
    try {
        const csv = await exportDriversCSV(msg.filters || {});

        component.postMessage({
            action: 'exportReady',
            payload: {
                csv: csv,
                filename: `drivers_export_${new Date().toISOString().split('T')[0]}.csv`
            }
        });
    } catch (error) {
        console.error('ADMIN_DRIVERS: exportDrivers error:', error);
        component.postMessage({
            action: 'actionError',
            message: 'Failed to export drivers.'
        });
    }
}

/**
 * Reveal a masked email for a specific driver
 */
async function handleRevealEmail(component, msg) {
    try {
        const driver = await getDriverDetail(msg.driverId);

        component.postMessage({
            action: 'emailRevealed',
            payload: {
                driverId: msg.driverId,
                email: driver.email || ''
            }
        });
    } catch (error) {
        console.error('ADMIN_DRIVERS: revealEmail error:', error);
        component.postMessage({
            action: 'actionError',
            message: 'Failed to reveal email.'
        });
    }
}
