import { getAuditLog, getAuditEntryDetail, getAuditStats, exportAuditLogCSV } from 'backend/admin_audit_service';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('ADMIN_AUDIT_LOG: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('ADMIN_AUDIT_LOG: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.action) return;
        await routeMessage(component, msg);
    });

    safeSend(component, { action: 'init' });
});

function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element not present on this page
        }
    }
    return null;
}

// ============================================
// MESSAGE ROUTING
// ============================================

async function routeMessage(component, msg) {
    switch (msg.action) {
        case 'getAuditLog':
            await handleGetAuditLog(component, msg);
            break;
        case 'getStats':
            await handleGetStats(component);
            break;
        case 'getEntryDetail':
            await handleGetEntryDetail(component, msg);
            break;
        case 'exportAuditLog':
            await handleExportAuditLog(component, msg);
            break;
        default:
            console.warn('ADMIN_AUDIT_LOG: Unknown action:', msg.action);
    }
}

// ============================================
// HANDLERS
// ============================================

/**
 * Fetch paginated audit log entries with filters, sorting, and pagination.
 * Sends back { action: 'auditLogLoaded', payload } or { action: 'actionError' }.
 */
async function handleGetAuditLog(component, msg) {
    try {
        const result = await getAuditLog({
            filters: msg.filters || {},
            page: msg.page || 1,
            pageSize: msg.pageSize || 50,
            sortField: msg.sortField || 'timestamp',
            sortDirection: msg.sortDirection || 'desc'
        });

        safeSend(component, {
            action: 'auditLogLoaded',
            payload: {
                entries: result.entries || [],
                totalCount: result.totalCount || 0,
                currentPage: result.currentPage || 1,
                pageSize: result.pageSize || 50
            }
        });
    } catch (err) {
        console.error('ADMIN_AUDIT_LOG: getAuditLog failed:', err);
        safeSend(component, {
            action: 'actionError',
            message: err.message || 'Failed to load audit log'
        });
    }
}

/**
 * Fetch aggregate audit statistics (total, today, thisWeek, thisMonth, dailyAverage).
 * Sends back { action: 'statsLoaded', payload } or { action: 'actionError' }.
 */
async function handleGetStats(component) {
    try {
        const stats = await getAuditStats();

        safeSend(component, {
            action: 'statsLoaded',
            payload: {
                total: stats.total || 0,
                today: stats.today || 0,
                thisWeek: stats.thisWeek || 0,
                thisMonth: stats.thisMonth || 0,
                dailyAverage: stats.dailyAverage || 0
            }
        });
    } catch (err) {
        console.error('ADMIN_AUDIT_LOG: getAuditStats failed:', err);
        safeSend(component, {
            action: 'actionError',
            message: err.message || 'Failed to load audit statistics'
        });
    }
}

/**
 * Fetch a single audit entry's full detail (including target info and related entries).
 * Sends back { action: 'entryDetailLoaded', payload } or { action: 'actionError' }.
 */
async function handleGetEntryDetail(component, msg) {
    try {
        if (!msg.entryId) {
            safeSend(component, {
                action: 'actionError',
                message: 'Missing entry ID'
            });
            return;
        }

        const entry = await getAuditEntryDetail(msg.entryId);

        safeSend(component, {
            action: 'entryDetailLoaded',
            payload: entry
        });
    } catch (err) {
        console.error('ADMIN_AUDIT_LOG: getAuditEntryDetail failed:', err);
        safeSend(component, {
            action: 'actionError',
            message: err.message || 'Failed to load entry details'
        });
    }
}

/**
 * Export filtered audit log as CSV. Requires super-admin role on the backend.
 * Sends back { action: 'exportReady', payload } + { action: 'actionSuccess' }
 * or { action: 'actionError' }.
 */
async function handleExportAuditLog(component, msg) {
    try {
        const csvContent = await exportAuditLogCSV(msg.filters || {});

        safeSend(component, {
            action: 'exportReady',
            payload: csvContent
        });

        safeSend(component, {
            action: 'actionSuccess',
            message: 'Audit log exported successfully'
        });
    } catch (err) {
        console.error('ADMIN_AUDIT_LOG: exportAuditLogCSV failed:', err);
        safeSend(component, {
            action: 'actionError',
            message: err.message || 'Failed to export audit log'
        });
    }
}
