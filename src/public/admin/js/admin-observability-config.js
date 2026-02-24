/* =========================================
   ADMIN OBSERVABILITY — Config Module
   No dependencies
   ========================================= */
var AdminObservabilityConfig = (function () {
    'use strict';

    var THEME_KEY = 'lmdr-admin-theme';

    var SOURCE_ICONS = {
        'ai-enrichment': 'fa-magic',
        'ai-router': 'fa-robot',
        'carrier-matching': 'fa-handshake',
        'social-scanner': 'fa-globe',
        'ocr-service': 'fa-file-image',
        'scheduler': 'fa-clock',
        'auth': 'fa-lock',
        'api': 'fa-plug',
        'database': 'fa-database',
        'external-api': 'fa-external-link-alt',
        'system': 'fa-cog'
    };

    var VALID_ACTIONS = [
        'init', 'initialized',
        'logsLoaded', 'errorsLoaded', 'traceLoaded',
        'healthLoaded', 'aiAnalyticsLoaded', 'agentBehaviorLoaded',
        'activeAnomaliesLoaded', 'anomalyRulesLoaded', 'anomalyHistoryLoaded',
        'ragAnalyticsLoaded', 'ragFreshnessLoaded', 'debugRetrievalResult', 'reingestSuccess',
        'actionSuccess', 'actionError'
    ];

    return {
        THEME_KEY: THEME_KEY,
        SOURCE_ICONS: SOURCE_ICONS,
        VALID_ACTIONS: VALID_ACTIONS
    };
})();
