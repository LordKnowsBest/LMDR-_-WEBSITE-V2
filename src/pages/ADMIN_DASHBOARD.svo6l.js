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
import { handleAgentTurn, resumeAfterApproval } from 'backend/agentService';
import { getVoiceConfig } from 'backend/voiceService';

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

            case 'agentMessage':
                await handleAgentMessage(component, message);
                break;

            case 'resolveApprovalGate':
                await handleResolveApprovalGate(component, message);
                break;

            case 'getVoiceConfig':
                await handleGetVoiceConfig(component);
                break;

            case 'getAgentKpis':
                await handleGetAgentKpis(component, message);
                break;

            case 'getAgentRuns':
                await handleGetAgentRuns(component, message);
                break;

            case 'getRunDetail':
                await handleGetRunDetail(component, message);
                break;

            case 'getApprovalAudit':
                await handleGetApprovalAudit(component, message);
                break;

            case 'getQualityTrends':
                await handleGetQualityTrends(component, message);
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
// AGENT & VOICE HANDLERS
// ============================================

async function handleAgentMessage(component, message) {
    const text = message.data?.text || message.payload?.text || '';
    const context = message.data?.context || message.payload?.context || {};
    if (!text) {
        safeSend(component, { action: 'agentResponse', payload: { error: 'No message text provided' } });
        return;
    }
    const result = await handleAgentTurn('admin', 'admin-user', text, context);
    if (result.type === 'approval_required') {
        safeSend(component, { action: 'agentApprovalRequired', payload: result });
    } else {
        safeSend(component, { action: 'agentResponse', payload: result });
    }
}

async function handleResolveApprovalGate(component, message) {
    const { approvalContext, decision, decidedBy } = message.data || message.payload || {};
    safeSend(component, { action: 'agentTyping', payload: {} });
    try {
        const result = await resumeAfterApproval(approvalContext, decision, decidedBy || 'admin');
        safeSend(component, { action: 'agentResponse', payload: result });
    } catch (err) {
        safeSend(component, { action: 'agentResponse', payload: { error: err.message } });
    }
}

async function handleGetVoiceConfig(component) {
    const config = await getVoiceConfig();
    safeSend(component, { action: 'voiceReady', payload: config });
}

async function handleGetAgentKpis(component, message) {
    try {
        const { getOutcomeStats } = await import('backend/agentOutcomeService');
        const days = message.days || 7;
        const stats = await getOutcomeStats('all', days);
        safeSend(component, { action: 'agentKpisLoaded', payload: stats });
    } catch (err) {
        safeSend(component, { action: 'agentKpisLoaded', payload: { total_runs: 0, success_rate: 0, avg_quality_score: 0, partial_rate: 0, failure_rate: 0, period_days: 7, role: 'all', error: err.message } });
    }
}

// ============================================
// AGENT RUN MONITOR HANDLERS
// ============================================

async function handleGetAgentRuns(component, message) {
    try {
        const { getRecentRuns } = await import('backend/agentRunLedgerService');
        const result = await getRecentRuns({
            status: message.status || undefined,
            limit: message.limit || 20,
            offset: message.offset || 0
        });

        // If completed runs, attach quality scores from outcomes
        let runs = result.items || [];
        if (message.status === 'completed' && runs.length > 0) {
            try {
                const { getRunOutcome } = await import('backend/agentOutcomeService');
                const enriched = await Promise.all(runs.map(async (run) => {
                    try {
                        const outcome = await getRunOutcome(run.run_id);
                        return {
                            ...run,
                            quality_score: outcome ? outcome.quality_score : 0,
                            objective_met: outcome ? outcome.objective_met : 'unknown'
                        };
                    } catch (e) {
                        return { ...run, quality_score: 0, objective_met: 'unknown' };
                    }
                }));
                runs = enriched;
            } catch (e) {
                // Outcome service unavailable — return runs without scores
            }
        }

        safeSend(component, { action: 'agentRunsLoaded', payload: { runs, total: result.totalCount || runs.length } });
    } catch (err) {
        safeSend(component, { action: 'agentRunsLoaded', payload: { runs: [], total: 0, error: err.message } });
    }
}

async function handleGetRunDetail(component, message) {
    try {
        const { getRun, getSteps, getGatesForRun } = await import('backend/agentRunLedgerService');
        const { getRunOutcome } = await import('backend/agentOutcomeService');
        const runId = message.runId;
        if (!runId) {
            safeSend(component, { action: 'actionError', message: 'Missing runId' });
            return;
        }
        const [run, steps, gates, outcome] = await Promise.all([
            getRun(runId),
            getSteps(runId),
            getGatesForRun(runId),
            getRunOutcome(runId)
        ]);
        safeSend(component, { action: 'runDetailLoaded', payload: { run: run || {}, steps: steps || [], gates: gates || [], outcome: outcome || {} } });
    } catch (err) {
        safeSend(component, { action: 'runDetailLoaded', payload: { run: {}, steps: [], gates: [], outcome: {}, error: err.message } });
    }
}

async function handleGetApprovalAudit(component, message) {
    try {
        const { getApprovalGatesByDateRange } = await import('backend/agentRunLedgerService');
        const days = message.days || 7;
        const gates = await getApprovalGatesByDateRange(days);

        // Calculate summary stats
        const total = gates.length;
        const approved = gates.filter(g => g.decision === 'approved').length;
        const rejections = gates.filter(g => g.decision === 'rejected').length;
        const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

        // Average decision time
        let totalDecisionMs = 0;
        let decidedCount = 0;
        for (const g of gates) {
            if (g.presented_at && g.decided_at) {
                const diff = new Date(g.decided_at).getTime() - new Date(g.presented_at).getTime();
                if (diff > 0) {
                    totalDecisionMs += diff;
                    decidedCount++;
                }
            }
        }
        const avgMs = decidedCount > 0 ? Math.round(totalDecisionMs / decidedCount) : 0;
        const avgDecisionTime = avgMs > 0 ? (avgMs < 60000 ? Math.round(avgMs / 1000) + 's' : Math.round(avgMs / 60000) + 'm') : '-';

        safeSend(component, {
            action: 'approvalAuditLoaded',
            payload: {
                gates,
                summary: { total, approval_rate: approvalRate, avg_decision_time: avgDecisionTime, rejections }
            }
        });
    } catch (err) {
        safeSend(component, { action: 'approvalAuditLoaded', payload: { gates: [], summary: {}, error: err.message } });
    }
}

async function handleGetQualityTrends(component, message) {
    try {
        const { getOutcomeTrends } = await import('backend/agentOutcomeService');
        const days = message.days || 7;
        const result = await getOutcomeTrends(days);
        safeSend(component, { action: 'qualityTrendsLoaded', payload: result });
    } catch (err) {
        safeSend(component, { action: 'qualityTrendsLoaded', payload: { trends: [], costs: { by_role: {}, total: 0 }, period_days: 7, error: err.message } });
    }
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
