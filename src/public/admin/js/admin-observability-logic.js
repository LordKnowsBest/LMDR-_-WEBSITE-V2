/* =========================================
   ADMIN OBSERVABILITY — Logic Module
   Depends on: AdminObservabilityConfig, AdminObservabilityBridge, AdminObservabilityRender
   State management, event handlers, user actions
   ========================================= */
var AdminObservabilityLogic = (function () {
    'use strict';

    var C = AdminObservabilityConfig;
    var B = AdminObservabilityBridge;
    var R = AdminObservabilityRender;

    /* --- State --- */

    var state = {
        metadata: { sources: [], levels: [] },
        health: null,
        errors: null,
        aiAnalytics: null,
        agentBehavior: null,
        logs: { items: [], totalCount: 0, page: 1 },
        currentTab: 'overview',
        logsPage: 0,
        autoRefreshInterval: null
    };

    /* --- Theme management --- */

    function initTheme() {
        var saved = localStorage.getItem(C.THEME_KEY);
        var theme = saved || 'dark';
        applyTheme(theme);
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
        }
        R.updateThemeIcon(theme);
    }

    function toggleTheme() {
        var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        var newTheme = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(C.THEME_KEY, newTheme);
        applyTheme(newTheme);
    }

    /* --- Tab management --- */

    function initTabs() {
        document.querySelectorAll('.tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchTab(btn.dataset.tab);
            });
        });
    }

    function switchTab(tab) {
        state.currentTab = tab;

        document.querySelectorAll('.tab-btn').forEach(function (btn) {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
                btn.classList.remove('text-text-muted', 'hover:text-white');
            } else {
                btn.classList.remove('active');
                btn.classList.add('text-text-muted', 'hover:text-white');
            }
        });

        document.querySelectorAll('.tab-content').forEach(function (content) {
            content.classList.add('hidden');
        });
        document.getElementById('tab-' + tab).classList.remove('hidden');

        if (tab === 'logs' && state.logs.items.length === 0) {
            loadLogs();
        }
        if (tab === 'agents' && !state.agentBehavior) {
            loadAgentBehavior();
        }
        if (tab === 'rag' && typeof AdminObservabilityRAG !== 'undefined') {
            AdminObservabilityRAG.loadRagData();
        }
    }

    /* --- Auto-refresh --- */

    function initAutoRefresh() {
        var checkbox = document.getElementById('autoRefresh');
        checkbox.addEventListener('change', function (e) {
            if (e.target.checked) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });
        startAutoRefresh();
    }

    function startAutoRefresh() {
        if (state.autoRefreshInterval) return;
        state.autoRefreshInterval = setInterval(function () {
            if (state.currentTab === 'overview') {
                B.getHealthMetrics('hour');
            }
            if (state.currentTab === 'agents') {
                loadAgentBehavior();
            }
        }, 30000);
    }

    function stopAutoRefresh() {
        if (state.autoRefreshInterval) {
            clearInterval(state.autoRefreshInterval);
            state.autoRefreshInterval = null;
        }
    }

    /* --- Data handlers --- */

    function handleInitialized(data) {
        var payload = data.payload;
        state.metadata = payload.metadata;
        state.health = payload.health;
        state.errors = payload.errors;
        state.aiAnalytics = payload.aiAnalytics;

        // Populate source dropdown
        var sourceSelect = document.getElementById('logSource');
        state.metadata.sources.forEach(function (source) {
            var option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceSelect.appendChild(option);
        });

        R.renderOverview(state.health, state.errors);
        R.renderErrors(state.errors);
        R.renderAIAnalytics(state.aiAnalytics);
        loadAnomalyData();
    }

    /* --- Data loading --- */

    function loadLogs() {
        var options = {
            skip: state.logsPage * 50,
            limit: 50,
            search: document.getElementById('logSearch').value || undefined,
            level: document.getElementById('logLevel').value || undefined,
            source: document.getElementById('logSource').value || undefined
        };

        var date = document.getElementById('logDate').value;
        if (date) {
            options.startDate = new Date(date).toISOString();
            options.endDate = new Date(new Date(date).getTime() + 86400000).toISOString();
        }

        B.getLogs(options);
    }

    function clearLogFilters() {
        document.getElementById('logSearch').value = '';
        document.getElementById('logLevel').value = '';
        document.getElementById('logSource').value = '';
        document.getElementById('logDate').value = '';
        state.logsPage = 0;
        loadLogs();
    }

    function navigateLogs(direction) {
        state.logsPage = Math.max(0, state.logsPage + direction);
        loadLogs();
    }

    function loadErrors() {
        var period = document.getElementById('errorPeriod').value;
        B.getErrors({ period: period });
    }

    function lookupTrace() {
        var traceId = document.getElementById('traceIdInput').value.trim();
        if (!traceId) {
            R.showToast('Please enter a trace ID', 'error');
            return;
        }
        B.getTrace(traceId);
    }

    function loadAIAnalytics() {
        var period = document.getElementById('aiPeriod').value;
        B.getAIAnalytics(period);
    }

    function loadAgentBehavior() {
        var period = document.getElementById('agentPeriod').value;
        B.getAgentBehavior({ period: period, limit: 200 });
    }

    function loadAnomalyData() {
        B.getActiveAnomalies();
        B.getAnomalyRules();
        B.getAnomalyHistory('week');
    }

    /* --- Log modal --- */

    function showLogDetail(logId) {
        var log = window._obsLogsData && window._obsLogsData.find(function (l) { return l._id === logId; });
        if (!log) return;
        R.showLogDetail(log);
    }

    function closeLogModal() {
        document.getElementById('logDetailModal').classList.add('hidden');
        document.getElementById('logDetailModal').classList.remove('flex');
    }

    function lookupTraceFromLog(traceId) {
        if (!traceId || traceId === '-') return;
        closeLogModal();
        document.getElementById('traceIdInput').value = traceId;
        switchTab('traces');
        lookupTrace();
    }

    function openTrace(traceId) {
        if (!traceId) return;
        document.getElementById('traceIdInput').value = traceId;
        switchTab('traces');
        lookupTrace();
    }

    /* --- Anomaly actions --- */

    function acknowledgeAnomaly(id) {
        B.acknowledgeAnomaly(id);
    }

    function resolveAnomaly(id) {
        var notes = prompt('Resolution notes:');
        B.resolveAnomaly(id, notes);
    }

    /* --- Event listeners --- */

    function initEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', toggleTheme);

        // Logs
        document.getElementById('applyLogFilters').addEventListener('click', loadLogs);
        document.getElementById('clearLogFilters').addEventListener('click', clearLogFilters);
        document.getElementById('logsPrevBtn').addEventListener('click', function () { navigateLogs(-1); });
        document.getElementById('logsNextBtn').addEventListener('click', function () { navigateLogs(1); });

        // Errors
        document.getElementById('refreshErrors').addEventListener('click', loadErrors);
        document.getElementById('errorPeriod').addEventListener('change', loadErrors);

        // Traces
        document.getElementById('lookupTrace').addEventListener('click', lookupTrace);
        document.getElementById('closeTrace').addEventListener('click', function () {
            document.getElementById('traceDetails').classList.add('hidden');
        });
        document.getElementById('traceIdInput').addEventListener('keyup', function (e) {
            if (e.key === 'Enter') lookupTrace();
        });

        // AI
        document.getElementById('refreshAI').addEventListener('click', loadAIAnalytics);
        document.getElementById('aiPeriod').addEventListener('change', loadAIAnalytics);

        // Agent behavior
        document.getElementById('refreshAgentBehavior').addEventListener('click', loadAgentBehavior);
        document.getElementById('agentPeriod').addEventListener('change', loadAgentBehavior);
    }

    /* --- Expose globals for onclick handlers in HTML --- */

    function exposeGlobals() {
        window.switchTab = switchTab;
        window.toggleTheme = toggleTheme;
        window.showLogDetail = showLogDetail;
        window.closeLogModal = closeLogModal;
        window.lookupTraceFromLog = lookupTraceFromLog;
        window.openTrace = openTrace;
        window.acknowledgeAnomaly = acknowledgeAnomaly;
        window.resolveAnomaly = resolveAnomaly;
        // AnomalyUI compat for onclick in HTML
        window.AnomalyUI = {
            openAddRule: function () { R.showToast('Add rule dialog not yet implemented', 'info'); },
            editRule: function (id) { R.showToast('Edit rule dialog not yet implemented', 'info'); }
        };
    }

    /* --- Initialization --- */

    function init() {
        exposeGlobals();
        initTheme();
        initTabs();
        initAutoRefresh();
        initEventListeners();

        // Initialize RAG module if available
        if (typeof AdminObservabilityRAG !== 'undefined') {
            AdminObservabilityRAG.init();
        }

        // Build message handler map (merge base + RAG handlers)
        var ragHandlers = (typeof AdminObservabilityRAG !== 'undefined') ? AdminObservabilityRAG.getMessageHandlers() : {};

        var baseHandlers = {
            'init': function () {
                B.sendInit();
            },
            'initialized': handleInitialized,
            'logsLoaded': function (data) {
                state.logs = data.payload;
                window._obsLogsData = data.payload.items;
                R.renderLogs(state.logs, state.logsPage);
            },
            'errorsLoaded': function (data) {
                state.errors = data.payload;
                R.renderErrors(state.errors);
            },
            'traceLoaded': function (data) {
                R.renderTrace(data.payload);
            },
            'healthLoaded': function (data) {
                state.health = data.payload;
                R.renderOverview(state.health, state.errors);
            },
            'aiAnalyticsLoaded': function (data) {
                state.aiAnalytics = data.payload;
                R.renderAIAnalytics(state.aiAnalytics);
            },
            'agentBehaviorLoaded': function (data) {
                state.agentBehavior = data.payload;
                R.renderAgentBehavior(state.agentBehavior);
            },
            'activeAnomaliesLoaded': function (data) {
                R.renderAnomalies(data.payload);
            },
            'anomalyRulesLoaded': function (data) {
                R.renderRules(data.payload);
            },
            'anomalyHistoryLoaded': function (data) {
                R.renderHistory(data.payload);
            },
            'actionSuccess': function (data) {
                R.showToast(data.message, 'success');
                loadAnomalyData();
            },
            'actionError': function (data) {
                R.showToast(data.message, 'error');
            }
        };

        // Merge RAG handlers into base handlers
        var allHandlers = baseHandlers;
        for (var key in ragHandlers) {
            if (ragHandlers.hasOwnProperty(key)) {
                allHandlers[key] = ragHandlers[key];
            }
        }

        B.listen(allHandlers);
    }

    return {
        init: init
    };
})();
