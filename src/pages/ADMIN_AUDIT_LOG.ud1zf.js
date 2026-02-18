import {
    getAuditLog,
    getAuditEntryDetail,
    getAuditStats,
    exportAuditLogCSV,
    getReportTemplates,
    getReportStatus,
    listComplianceReports,
    deleteComplianceReport,
    downloadReport,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    getScheduledReports,
    generateComplianceReport
} from 'backend/admin_audit_service';

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
        case 'getReportTemplates':
            await handleGetReportTemplates(component);
            break;
        case 'generateComplianceReport':
            await handleGenerateComplianceReport(component, msg.options || {});
            break;
        case 'getReportStatus':
            await handleGetReportStatus(component, msg.reportId);
            break;
        case 'listComplianceReports':
            await handleListComplianceReports(component, msg.options || {});
            break;
        case 'downloadReport':
            await handleDownloadReport(component, msg.reportId);
            break;
        case 'deleteComplianceReport':
            await handleDeleteComplianceReport(component, msg.reportId);
            break;
        case 'getScheduledReports':
            await handleGetScheduledReports(component);
            break;
        case 'createScheduledReport':
            await handleCreateScheduledReport(component, msg.schedule || {});
            break;
        case 'updateScheduledReport':
            await handleUpdateScheduledReport(component, msg.scheduleId, msg.updates || {});
            break;
        case 'deleteScheduledReport':
            await handleDeleteScheduledReport(component, msg.scheduleId);
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

async function handleGetReportTemplates(component) {
    try {
        const templates = await getReportTemplates();
        safeSend(component, { action: 'reportTemplatesLoaded', payload: templates });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to load report templates' });
    }
}

async function handleGenerateComplianceReport(component, options) {
    try {
        const result = await generateComplianceReport(options || {});
        safeSend(component, { action: 'complianceReportGenerated', payload: result });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to generate compliance report' });
    }
}

async function handleGetReportStatus(component, reportId) {
    try {
        if (!reportId) throw new Error('Missing report ID');
        const result = await getReportStatus(reportId);
        safeSend(component, { action: 'reportStatusLoaded', payload: result });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to load report status' });
    }
}

async function handleListComplianceReports(component, options) {
    try {
        const result = await listComplianceReports(options || {});
        safeSend(component, { action: 'complianceReportsLoaded', payload: result });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to load compliance reports' });
    }
}

async function handleDownloadReport(component, reportId) {
    try {
        if (!reportId) throw new Error('Missing report ID');
        const result = await downloadReport(reportId);
        safeSend(component, { action: 'reportDownloadReady', payload: result });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to download report' });
    }
}

async function handleDeleteComplianceReport(component, reportId) {
    try {
        if (!reportId) throw new Error('Missing report ID');
        await deleteComplianceReport(reportId);
        safeSend(component, { action: 'actionSuccess', message: 'Compliance report deleted' });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to delete compliance report' });
    }
}

async function handleGetScheduledReports(component) {
    try {
        const result = await getScheduledReports();
        safeSend(component, { action: 'scheduledReportsLoaded', payload: result });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to load scheduled reports' });
    }
}

async function handleCreateScheduledReport(component, schedule) {
    try {
        const result = await createScheduledReport(schedule || {});
        safeSend(component, { action: 'scheduledReportCreated', payload: result });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to create scheduled report' });
    }
}

async function handleUpdateScheduledReport(component, scheduleId, updates) {
    try {
        if (!scheduleId) throw new Error('Missing schedule ID');
        const result = await updateScheduledReport(scheduleId, updates || {});
        safeSend(component, { action: 'scheduledReportUpdated', payload: result });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to update scheduled report' });
    }
}

async function handleDeleteScheduledReport(component, scheduleId) {
    try {
        if (!scheduleId) throw new Error('Missing schedule ID');
        await deleteScheduledReport(scheduleId);
        safeSend(component, { action: 'actionSuccess', message: 'Scheduled report deleted' });
    } catch (err) {
        safeSend(component, { action: 'actionError', message: err.message || 'Failed to delete scheduled report' });
    }
}
