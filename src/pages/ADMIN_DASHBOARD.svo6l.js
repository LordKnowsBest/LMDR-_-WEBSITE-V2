import wixLocation from 'wix-location';
import {
    getDashboardOverview,
    getActivityChartData,
    getAIUsageStats,
    getAIHealthCheck,
    resolveAlert
} from 'backend/admin_dashboard_service';
import {
    getFeatureStats,
    getFeatureLifecycleReport,
    getAtRiskFeatures,
    getFunnels,
    getFunnelConversion,
    updateFeatureStatus
} from 'backend/featureAdoptionService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();

    if (!components.length) {
        console.warn('ADMIN_DASHBOARD: No HTML component found');
        return;
    }

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send init signal so HTML requests its data
        component.postMessage({ action: 'init' });
    }
});

/**
 * Safely discover HTML components on the page.
 * Uses try-catch around each $w() call per the UI Safety Pattern.
 */
function getHtmlComponents() {
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {
            // Element does not exist on this page variant - skip
        }
    }
    return found;
}

/**
 * Route incoming messages from the HTML component to appropriate backend handlers.
 */
async function routeMessage(component, message) {
    if (!message?.action) return;

    const { action } = message;

    // Handle navigation separately (no backend call needed)
    if (action === 'navigateTo') {
        const destination = message.destination;
        if (destination) {
            wixLocation.to(`/${destination}`);
        }
        return;
    }

    try {
        switch (action) {
            case 'getDashboard':
                await handleGetDashboard(component);
                break;

            case 'getChartData':
                await handleGetChartData(component, message.period);
                break;

            case 'getAIUsage':
                await handleGetAIUsage(component, message.period);
                break;

            case 'resolveAlert':
                await handleResolveAlert(component, message.alertId);
                break;

            case 'getFeatureStats':
                await handleGetFeatureStats(component, message.featureId, message.timeRange, message.groupBy);
                break;

            case 'getFeatureLifecycleReport':
                await handleGetFeatureLifecycleReport(component);
                break;

            case 'getAtRiskFeatures':
                await handleGetAtRiskFeatures(component);
                break;

            case 'getFunnelsList':
                await handleGetFunnelsList(component);
                break;

            case 'getFunnelConversion':
                await handleGetFunnelConversion(component, message.funnelId, message.timeRange);
                break;

            case 'updateFeatureStatus':
                await handleUpdateFeatureStatus(component, message.featureId, message.status, message.reason);
                break;

            default:
                console.warn('ADMIN_DASHBOARD: Unknown action:', action);
        }
    } catch (error) {
        console.error('ADMIN_DASHBOARD: Error handling action', action, error);
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

async function handleGetDashboard(component) {
    const data = await getDashboardOverview();
    safeSend(component, { action: 'dashboardLoaded', payload: data });
}

async function handleGetChartData(component, period) {
    const data = await getActivityChartData(period || 'week');
    safeSend(component, { action: 'chartDataLoaded', payload: data });
}

async function handleGetAIUsage(component, period) {
    const [usageData, healthData] = await Promise.all([
        getAIUsageStats(period || 'week'),
        getAIHealthCheck()
    ]);

    safeSend(component, { action: 'aiUsageLoaded', payload: usageData });
    safeSend(component, { action: 'aiHealthLoaded', payload: healthData });
}

async function handleResolveAlert(component, alertId) {
    if (!alertId) {
        safeSend(component, { action: 'actionError', message: 'Missing alert ID' });
        return;
    }
    await resolveAlert(alertId);
    safeSend(component, { action: 'actionSuccess', message: 'Alert resolved successfully' });

    // Refresh dashboard after resolving
    const data = await getDashboardOverview();
    safeSend(component, { action: 'dashboardLoaded', payload: data });
}

async function handleGetFeatureStats(component, featureId, timeRange, groupBy) {
    if (featureId) {
        // Detailed stats for a specific feature
        const data = await getFeatureStats(featureId, timeRange, groupBy || 'day');
        safeSend(component, { action: 'featureStatsResult', payload: data });
    } else {
        // General feature stats overview (initial load)
        const data = await getFeatureLifecycleReport();
        safeSend(component, { action: 'featureStatsLoaded', payload: data });
    }
}

async function handleGetFeatureLifecycleReport(component) {
    const data = await getFeatureLifecycleReport();
    safeSend(component, { action: 'featureLifecycleReportResult', payload: data });
}

async function handleGetAtRiskFeatures(component) {
    const data = await getAtRiskFeatures();
    safeSend(component, { action: 'atRiskFeaturesResult', payload: data });
}

async function handleGetFunnelsList(component) {
    const data = await getFunnels();
    safeSend(component, { action: 'funnelsListResult', payload: data });
}

async function handleGetFunnelConversion(component, funnelId, timeRange) {
    if (!funnelId) {
        safeSend(component, { action: 'actionError', message: 'Missing funnel ID' });
        return;
    }
    const data = await getFunnelConversion(funnelId, timeRange);
    safeSend(component, { action: 'funnelConversionResult', payload: data });
}

async function handleUpdateFeatureStatus(component, featureId, status, reason) {
    if (!featureId || !status) {
        safeSend(component, { action: 'actionError', message: 'Missing feature ID or status' });
        return;
    }
    const data = await updateFeatureStatus(featureId, status, reason || '');
    safeSend(component, { action: 'updateFeatureStatusResult', payload: data });
    safeSend(component, { action: 'actionSuccess', message: `Feature "${featureId}" status updated to "${status}"` });
}

// ============================================
// UTILITY
// ============================================

/**
 * Safely send a postMessage to a component, guarding against detached elements.
 */
function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        console.error('ADMIN_DASHBOARD: Failed to postMessage:', error);
    }
}
