/* =========================================
   ADMIN DASHBOARD — Config Module
   No dependencies
   ========================================= */
var AdminDashboardConfig = (function () {
    'use strict';

    var THEME_KEY = 'lmdr-admin-theme';

    var VALID_ACTIONS = [
        'dashboardLoaded', 'chartDataLoaded',
        'actionSuccess', 'actionError', 'init',
        'aiUsageLoaded', 'aiHealthLoaded', 'featureStatsLoaded',
        'metaGovernanceSummaryLoaded',
        'metaApprovalInboxLoaded', 'metaPolicyEditorLoaded',
        'metaErrorDigestLoaded', 'metaRateLimitPostureLoaded',
        'metaGovernanceActionResult',
        'featureLifecycleReportResult', 'featureStatsResult',
        'atRiskFeaturesResult', 'funnelConversionResult',
        'updateFeatureStatusResult', 'funnelsListResult'
    ];

    var SERVICE_NAMES = {
        matching: 'Matching Engine',
        enrichment: 'AI Enrichment',
        database: 'Database'
    };

    var HEALTH_COLOR_MAP = {
        healthy: { bg: 'bg-emerald-400', text: 'text-emerald-400', label: 'Healthy' },
        degraded: { bg: 'bg-amber-400', text: 'text-amber-400', label: 'Degraded' },
        unhealthy: { bg: 'bg-rose-400', text: 'text-rose-400', label: 'Unhealthy' },
        unknown: { bg: 'bg-slate-400', text: 'text-slate-400', label: 'Unknown' }
    };

    var ACTIVITY_COLOR_MAP = {
        blue: 'bg-blue-500/20 text-blue-400',
        green: 'bg-emerald-500/20 text-emerald-400',
        purple: 'bg-violet-500/20 text-violet-400',
        amber: 'bg-amber-500/20 text-amber-400'
    };

    var ACTION_LABELS = {
        verifyDriver: 'verified a driver',
        suspendDriver: 'suspended a driver',
        updateDriverStatus: 'updated driver status',
        flagCarrier: 'flagged a carrier',
        unflagCarrier: 'unflagged a carrier',
        updateCarrierStatus: 'updated carrier status',
        refreshEnrichment: 'refreshed enrichment'
    };

    var PROVIDER_COLORS = {
        anthropic: 'bg-orange-400',
        openai: 'bg-emerald-400',
        groq: 'bg-cyan-400',
        perplexity: 'bg-violet-400',
        google: 'bg-blue-400',
        mistral: 'bg-amber-400',
        cohere: 'bg-pink-400'
    };

    var BTN_ACTIVE = 'px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-white';
    var BTN_INACTIVE = 'px-3 py-1.5 text-xs font-medium rounded-md text-text-muted hover:text-white';

    var AI_BTN_ACTIVE = 'px-2 py-1 text-[10px] font-medium rounded bg-primary text-white';
    var AI_BTN_INACTIVE = 'px-2 py-1 text-[10px] font-medium rounded text-text-muted hover:text-white';

    return {
        THEME_KEY: THEME_KEY,
        VALID_ACTIONS: VALID_ACTIONS,
        SERVICE_NAMES: SERVICE_NAMES,
        HEALTH_COLOR_MAP: HEALTH_COLOR_MAP,
        ACTIVITY_COLOR_MAP: ACTIVITY_COLOR_MAP,
        ACTION_LABELS: ACTION_LABELS,
        PROVIDER_COLORS: PROVIDER_COLORS,
        BTN_ACTIVE: BTN_ACTIVE,
        BTN_INACTIVE: BTN_INACTIVE,
        AI_BTN_ACTIVE: AI_BTN_ACTIVE,
        AI_BTN_INACTIVE: AI_BTN_INACTIVE
    };
})();
