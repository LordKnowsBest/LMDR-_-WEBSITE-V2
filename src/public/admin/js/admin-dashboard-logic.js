/* =========================================
   ADMIN DASHBOARD — Logic Module
   Depends on: AdminDashboardConfig, AdminDashboardBridge, AdminDashboardRender
   State management, event handlers, init
   ========================================= */
var AdminDashboardLogic = (function () {
    'use strict';

    var C = AdminDashboardConfig;
    var B = AdminDashboardBridge;
    var R = AdminDashboardRender;

    /* --- State --- */
    var state = {
        dashboard: null,
        chartPeriod: 'week',
        chart: null,
        aiUsage: null,
        aiUsageChart: null,
        aiUsagePeriod: 'week',
        metaGovernance: null,
        featureAdoption: {
            lifecycleReport: null,
            atRiskFeatures: null,
            funnels: null,
            selectedFunnel: null,
            funnelData: null,
            timeRange: 7,
            activeTab: 'overview',
            statusChart: null,
            healthChart: null
        }
    };

    /* === THEME === */

    function initTheme() {
        var saved = localStorage.getItem(C.THEME_KEY);
        var theme = saved || 'dark';
        R.applyTheme(theme);

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem(C.THEME_KEY)) {
                R.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    function toggleTheme() {
        var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        var newTheme = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(C.THEME_KEY, newTheme);
        R.applyTheme(newTheme);
        R.showToast('Switched to ' + newTheme + ' mode', 'info');
    }

    /* === CHARTS === */

    function initChart() {
        var ctx = document.getElementById('activityChart').getContext('2d');
        state.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Matches', data: [],
                        borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4
                    },
                    {
                        label: 'New Drivers', data: [],
                        borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { color: 'rgba(51, 65, 85, 0.5)' },
                        ticks: {
                            color: '#94a3b8', font: { size: 10 }, maxRotation: 0,
                            callback: function (val) { var l = this.getLabelForValue(val); return l ? l.slice(5) : ''; }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(51, 65, 85, 0.5)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                }
            }
        });
    }

    function updateChart(data) {
        if (!state.chart || !data) return;
        state.chart.data.labels = data.labels || [];
        state.chart.data.datasets[0].data = data.matches || [];
        state.chart.data.datasets[1].data = data.drivers || [];
        state.chart.update();
    }

    function initAIUsageChart() {
        var ctx = document.getElementById('aiUsageChart').getContext('2d');
        state.aiUsageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cost ($)', data: [],
                    backgroundColor: 'rgba(34, 211, 238, 0.6)',
                    borderColor: '#22d3ee', borderWidth: 1, borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#94a3b8', font: { size: 9 }, maxRotation: 0,
                            callback: function (val) { var l = this.getLabelForValue(val); if (!l) return ''; return l.length > 5 ? l.slice(-5) : l; }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(51, 65, 85, 0.3)' },
                        ticks: { color: '#94a3b8', font: { size: 9 }, callback: function (val) { return '$' + val.toFixed(2); } }
                    }
                }
            }
        });
    }

    function updateAIUsageChart(trends) {
        if (!state.aiUsageChart || !trends) return;
        state.aiUsageChart.data.labels = trends.labels || [];
        state.aiUsageChart.data.datasets[0].data = trends.costs || [];
        state.aiUsageChart.update();
    }

    function initFeatureAdoptionCharts() {
        var statusCtx = document.getElementById('featureStatusChart');
        if (statusCtx) {
            statusCtx = statusCtx.getContext('2d');
            state.featureAdoption.statusChart = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Beta', 'Active', 'Deprecated', 'Sunset'],
                    datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#a855f7', '#22c55e', '#eab308', '#ef4444'], borderWidth: 0, cutout: '70%' }]
                },
                options: {
                    responsive: true, maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: function (ctx) { return ctx.label + ': ' + ctx.raw + ' features'; } } }
                    },
                    onClick: function (event, elements) {
                        if (elements.length > 0) {
                            var idx = elements[0].index;
                            var statuses = ['beta', 'active', 'deprecated', 'sunset'];
                            document.getElementById('featFilterStatus').value = statuses[idx];
                            filterFeatures();
                        }
                    }
                }
            });
        }

        var healthCtx = document.getElementById('featureHealthChart');
        if (healthCtx) {
            healthCtx = healthCtx.getContext('2d');
            state.featureAdoption.healthChart = new Chart(healthCtx, {
                type: 'bar',
                data: {
                    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
                    datasets: [{ label: 'Features', data: [0, 0, 0, 0, 0], backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'], borderRadius: 4 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                        y: { beginAtZero: true, grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 1 } }
                    }
                }
            });
        }
    }

    /* === MESSAGE HANDLERS === */

    function handleDashboardLoaded(data) {
        state.dashboard = data;

        document.getElementById('statDrivers').textContent = (data.drivers && data.drivers.total != null) ? data.drivers.total.toLocaleString() : '0';
        document.getElementById('statDriversNew').textContent = '+' + ((data.drivers && data.drivers.newThisWeek) || 0);
        document.getElementById('statCarriers').textContent = (data.carriers && data.carriers.total != null) ? data.carriers.total.toLocaleString() : '0';
        document.getElementById('statCarriersNew').textContent = '+' + ((data.carriers && data.carriers.newThisWeek) || 0);
        document.getElementById('statMatches').textContent = (data.matches && data.matches.today != null) ? data.matches.today.toLocaleString() : '0';
        document.getElementById('statMatchesWeek').textContent = ((data.matches && data.matches.thisWeek) || 0) + ' this week';

        var attention = ((data.drivers && data.drivers.pending) || 0) + ((data.carriers && data.carriers.flagged) || 0);
        document.getElementById('statAttention').textContent = attention;
        document.getElementById('attentionBreakdown').textContent =
            ((data.drivers && data.drivers.pending) || 0) + ' pending, ' + ((data.carriers && data.carriers.flagged) || 0) + ' flagged';
        if (attention > 0) document.getElementById('attentionBadge').classList.remove('hidden');

        document.getElementById('enrichmentCoverage').textContent = ((data.enrichment && data.enrichment.coverage) || 0) + '% coverage';
        document.getElementById('enrichmentFresh').textContent = (data.enrichment && data.enrichment.fresh) || 0;
        document.getElementById('enrichmentStale').textContent = (data.enrichment && data.enrichment.stale) || 0;
        document.getElementById('enrichmentExpired').textContent = (data.enrichment && data.enrichment.expired) || 0;

        R.updateHealthIndicator(data.health);
        R.renderAlerts(data.alerts);
        R.renderActivityFeed(data.activity);
        R.renderServicesHealth(data.health && data.health.services);

        B.getChartData(state.chartPeriod);
    }

    function handleAIUsageLoaded(data) {
        state.aiUsage = data;
        var s = data.summary || {};

        document.getElementById('statAICost').textContent = '$' + ((s.totalCost || 0)).toFixed(2);
        document.getElementById('aiTokenCount').innerHTML =
            '<span class="text-cyan-400">' + R.formatNumber(s.totalTokens || 0) + '</span> <span class="text-text-muted">tokens</span>';

        var budgetBadge = document.getElementById('aiBudgetBadge');
        if (s.budgetStatus && s.budgetStatus.status === 'critical') {
            budgetBadge.classList.remove('hidden', 'bg-amber-500'); budgetBadge.classList.add('bg-rose-500');
        } else if (s.budgetStatus && s.budgetStatus.status === 'warning') {
            budgetBadge.classList.remove('hidden', 'bg-rose-500'); budgetBadge.classList.add('bg-amber-500');
        } else {
            budgetBadge.classList.add('hidden');
        }

        var budgetPercent = (s.budgetStatus && s.budgetStatus.percentOfWarning) || 0;
        var budgetBar = document.getElementById('aiBudgetBar');
        budgetBar.style.width = Math.min(budgetPercent, 100) + '%';

        if (s.budgetStatus && s.budgetStatus.status === 'critical') {
            budgetBar.className = 'h-full bg-rose-400 rounded-full transition-all duration-500';
        } else if (s.budgetStatus && s.budgetStatus.status === 'warning') {
            budgetBar.className = 'h-full bg-amber-400 rounded-full transition-all duration-500';
        } else {
            budgetBar.className = 'h-full bg-cyan-400 rounded-full transition-all duration-500';
        }

        document.getElementById('aiBudgetPercent').textContent = budgetPercent + '% of $100';
        document.getElementById('aiBudgetProjection').textContent = 'Projected: $' + ((s.monthlyProjection || 0)).toFixed(2);
        document.getElementById('aiTotalCost').textContent = '$' + ((s.totalCost || 0)).toFixed(2);
        document.getElementById('aiTotalTokens').textContent = R.formatNumber(s.totalTokens || 0);
        document.getElementById('aiTotalRequests').textContent = R.formatNumber(s.totalRequests || 0);

        var avgLatency = s.avgLatency || 0;
        var latencyEl = document.getElementById('aiAvgLatency');
        latencyEl.textContent = avgLatency > 1000 ? (avgLatency / 1000).toFixed(1) + 's' : avgLatency + 'ms';
        latencyEl.className = 'text-lg font-bold ' + (avgLatency > 3000 ? 'text-rose-400' : avgLatency > 1500 ? 'text-amber-400' : 'text-emerald-400');

        R.renderProviderBars(data.byProvider || []);
        R.renderFunctionList(data.byFunction || []);
        updateAIUsageChart(data.trends);
    }

    function handleMetaGovernanceSummaryLoaded(data) {
        state.metaGovernance = data || null;
        R.renderMetaGovernanceSummary(state.metaGovernance);
    }

    function handleMetaApprovalInboxLoaded(data) {
        R.renderMetaApprovalInbox(data || {});
    }

    function handleMetaPolicyEditorLoaded(data) {
        if (!data) return;
        var integrations = (data.integrations && data.integrations.items) || [];
        var first = integrations[0] || null;
        if (first && first.integration_id) {
            document.getElementById('metaIntegrationIdInput').value = first.integration_id;
        }
    }

    function handleMetaErrorDigestLoaded(data) {
        document.getElementById('metaErrorEventsCount').textContent = (data && data.totalEvents != null) ? data.totalEvents : '--';
    }

    function handleMetaRateLimitPostureLoaded(data) {
        document.getElementById('metaThrottledCount').textContent = (data && data.throttledCount != null) ? data.throttledCount : '--';
    }

    function handleMetaGovernanceActionResult(payload) {
        var action = (payload && payload.action) || 'governance_action';
        var result = (payload && payload.result) || {};
        if (result.type === 'approval_required') {
            R.showToast(action + ': approval required', 'info');
        } else if (result.success) {
            R.showToast(action + ': success', 'success');
            B.getMetaGovernanceSummary();
            B.getMetaApprovalInbox(7);
            B.getMetaErrorDigest(24, 50);
            B.getMetaRateLimitPosture(24);
        } else {
            R.showToast(action + ': ' + (result.error || 'failed'), 'error');
        }
    }

    function handleFeatureStatsLoaded(features) {
        if (!features || !features.length) return;
        var transformedData = {
            features: features.map(function (f) {
                return {
                    featureId: f.featureId,
                    displayName: f.featureId,
                    status: ((f.status || 'active')).toLowerCase().replace(' ', '_'),
                    category: 'legacy',
                    healthScore: f.interactions30d > 100 ? 80 : f.interactions30d > 50 ? 60 : f.interactions30d > 10 ? 40 : 20,
                    last7DaysUsers: Math.floor(f.interactions30d / 4) || 0,
                    last30DaysUsers: f.interactions30d || 0,
                    completionRate: 0,
                    trend: f.interactions30d > 50 ? 'growing' : f.interactions30d > 10 ? 'stable' : 'declining'
                };
            }),
            summary: {
                total: features.length,
                byStatus: features.reduce(function (acc, f) {
                    var s = ((f.status || 'active')).toLowerCase().replace(' ', '_');
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {}),
                byHealth: {
                    healthy: features.filter(function (f) { return f.interactions30d > 50; }).length,
                    warning: features.filter(function (f) { return f.interactions30d > 10 && f.interactions30d <= 50; }).length,
                    critical: features.filter(function (f) { return f.interactions30d <= 10; }).length
                }
            }
        };
        handleFeatureLifecycleReport(transformedData);
    }

    function handleFeatureLifecycleReport(data) {
        if (!data) return;
        state.featureAdoption.lifecycleReport = data;
        var features = data.features || [];
        var summary = data.summary || {};

        document.getElementById('featTotalFeatures').textContent = summary.total || features.length;
        document.getElementById('featHealthyCount').textContent = (summary.byHealth && summary.byHealth.healthy) || 0;
        document.getElementById('featWarningCount').textContent = (summary.byHealth && summary.byHealth.warning) || 0;
        document.getElementById('featCriticalCount').textContent = (summary.byHealth && summary.byHealth.critical) || 0;
        document.getElementById('featStatusTotal').textContent = summary.total || features.length;

        if (state.featureAdoption.statusChart) {
            var sd = summary.byStatus || {};
            state.featureAdoption.statusChart.data.datasets[0].data = [sd.beta || 0, sd.active || 0, sd.deprecated || 0, sd.sunset || 0];
            state.featureAdoption.statusChart.update();
        }

        if (state.featureAdoption.healthChart) {
            var buckets = [0, 0, 0, 0, 0];
            features.forEach(function (f) {
                var s = f.healthScore || 0;
                if (s <= 20) buckets[0]++;
                else if (s <= 40) buckets[1]++;
                else if (s <= 60) buckets[2]++;
                else if (s <= 80) buckets[3]++;
                else buckets[4]++;
            });
            state.featureAdoption.healthChart.data.datasets[0].data = buckets;
            state.featureAdoption.healthChart.update();
        }

        R.renderFeatureHealthGrid(features, document.getElementById('featFilterStatus').value, document.getElementById('featSortBy').value);
        R.renderTopBottomFeatures(features);
    }

    function handleAtRiskFeatures(data) {
        if (!data) return;
        state.featureAdoption.atRiskFeatures = data;
        var atRiskFeatures = data.atRiskFeatures || [];
        var badge = document.getElementById('atRiskBadge');
        if (atRiskFeatures.length > 0) {
            badge.textContent = atRiskFeatures.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        var banner = document.getElementById('atRiskAlertBanner');
        var criticalFeatures = atRiskFeatures.filter(function (f) { return f.riskLevel === 'critical'; });
        if (criticalFeatures.length > 0) {
            banner.classList.remove('hidden');
            document.getElementById('atRiskAlertMessage').textContent =
                criticalFeatures.length + ' critical feature(s) need immediate attention. Consider deprecating or sunsetting.';
        } else {
            banner.classList.add('hidden');
        }

        R.renderAtRiskFeatures(atRiskFeatures);
    }

    function handleFunnelsList(data) {
        if (!data) return;
        state.featureAdoption.funnels = data.funnels || data || [];
        var selector = document.getElementById('funnelSelector');
        var funnels = state.featureAdoption.funnels;
        selector.innerHTML = '<option value="">-- Select a funnel --</option>' +
            funnels.map(function (f) { return '<option value="' + f.funnelId + '">' + f.displayName + '</option>'; }).join('');
    }

    function handleFunnelConversion(data) {
        if (!data) return;
        state.featureAdoption.funnelData = data;

        document.getElementById('funnelTotalEntered').textContent = data.totalEntered ? data.totalEntered.toLocaleString() : '--';
        document.getElementById('funnelTotalCompleted').textContent = data.totalCompleted ? data.totalCompleted.toLocaleString() : '--';
        document.getElementById('funnelConversionRate').textContent = (data.overallConversionRate != null ? data.overallConversionRate.toFixed(1) : '--') + '%';
        document.getElementById('funnelDetails').classList.remove('hidden');

        R.renderFunnelVisualization(data);
        R.renderFunnelSteps(data.steps || []);
    }

    function handleFeatureStatusUpdate(data) {
        if (data && data.success) {
            R.showToast('Feature status updated to "' + data.newStatus + '"', 'success');
            loadFeatureAdoptionData();
        } else {
            R.showToast('Failed to update feature status', 'error');
        }
    }

    /* === USER ACTIONS === */

    function navigateTo(destination) {
        B.navigateTo(destination);
    }

    function refreshDashboard() {
        B.getDashboard();
        B.getMetaGovernanceSummary();
        R.showToast('Refreshing...', 'info');
    }

    function resolveAlert(alertId) {
        B.resolveAlert(alertId);
    }

    function loadChartData(period) {
        state.chartPeriod = period;
        document.getElementById('chartWeekBtn').className = period === 'week' ? C.BTN_ACTIVE : C.BTN_INACTIVE;
        document.getElementById('chartMonthBtn').className = period === 'month' ? C.BTN_ACTIVE : C.BTN_INACTIVE;
        B.getChartData(period);
    }

    function loadAIUsage(period) {
        state.aiUsagePeriod = period;
        document.getElementById('aiDayBtn').className = period === 'day' ? C.AI_BTN_ACTIVE : C.AI_BTN_INACTIVE;
        document.getElementById('aiWeekBtn').className = period === 'week' ? C.AI_BTN_ACTIVE : C.AI_BTN_INACTIVE;
        document.getElementById('aiMonthBtn').className = period === 'month' ? C.AI_BTN_ACTIVE : C.AI_BTN_INACTIVE;
        B.getAIUsage(period);
    }

    function scrollToAIUsage() {
        document.getElementById('aiUsagePanel').scrollIntoView({ behavior: 'smooth' });
    }

    /* --- Meta Governance Actions --- */

    function saveMetaApprovalThresholds() {
        var launchThreshold = Number(document.getElementById('metaLaunchThresholdInput').value || 0);
        B.setMetaApprovalThresholds({ launchThreshold: launchThreshold, updatedFrom: 'admin_dashboard' });
    }

    function saveMetaBudgetCaps() {
        var defaultDailyCap = Number(document.getElementById('metaBudgetCapInput').value || 0);
        B.setMetaDailyBudgetCaps({ defaultDailyCap: defaultDailyCap, updatedFrom: 'admin_dashboard' });
    }

    function saveMetaCampaignGuardrails() {
        var launchThreshold = Number(document.getElementById('metaLaunchThresholdInput').value || 0);
        var defaultDailyCap = Number(document.getElementById('metaBudgetCapInput').value || 0);
        B.setMetaCampaignGuardrails({ launchThreshold: launchThreshold, defaultDailyCap: defaultDailyCap, updatedFrom: 'admin_dashboard' });
    }

    function quarantineMetaIntegration() {
        var integrationId = document.getElementById('metaIntegrationIdInput').value.trim();
        if (!integrationId) { R.showToast('integration_id is required', 'error'); return; }
        B.quarantineMetaIntegration({ integrationId: integrationId, reason: 'Manual quarantine from Admin Dashboard' });
    }

    function refreshMetaToken() {
        var integrationId = document.getElementById('metaIntegrationIdInput').value.trim();
        if (!integrationId) { R.showToast('integration_id is required', 'error'); return; }
        B.refreshMetaSystemUserToken({ integrationId: integrationId, reason: 'Manual token refresh from Admin Dashboard' });
    }

    function rebindMetaAdAccount() {
        var integrationId = document.getElementById('metaIntegrationIdInput').value.trim();
        var adAccountId = document.getElementById('metaAdAccountIdInput').value.trim();
        if (!integrationId || !adAccountId) { R.showToast('integration_id and ad_account_id are required', 'error'); return; }
        B.rebindMetaAdAccount({ integrationId: integrationId, adAccountId: adAccountId });
    }

    function disableMetaIntegration() {
        var integrationId = document.getElementById('metaIntegrationIdInput').value.trim();
        if (!integrationId) { R.showToast('integration_id is required', 'error'); return; }
        B.disableMetaIntegration({ integrationId: integrationId, reason: 'Manual disable from Admin Dashboard' });
    }

    /* --- Feature Adoption Actions --- */

    function loadFeatureAdoptionData() {
        B.getFeatureLifecycleReport();
        B.getAtRiskFeatures();
        B.getFunnelsList();
    }

    function refreshFeatureAdoption() {
        R.showToast('Refreshing feature adoption data...', 'info');
        loadFeatureAdoptionData();
    }

    function setFeatureTimeRange(days) {
        state.featureAdoption.timeRange = days;
        document.getElementById('featRange7d').className = 'px-2 py-1 text-[10px] font-medium rounded ' + (days === 7 ? 'tab-active' : 'tab-inactive');
        document.getElementById('featRange14d').className = 'px-2 py-1 text-[10px] font-medium rounded ' + (days === 14 ? 'tab-active' : 'tab-inactive');
        document.getElementById('featRange30d').className = 'px-2 py-1 text-[10px] font-medium rounded ' + (days === 30 ? 'tab-active' : 'tab-inactive');
        loadFeatureAdoptionData();
    }

    function setFeatureTab(tab) {
        state.featureAdoption.activeTab = tab;
        document.getElementById('featTabOverview').className = 'flex-1 md:flex-none px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap ' + (tab === 'overview' ? 'tab-active' : 'tab-inactive');
        document.getElementById('featTabFunnels').className = 'flex-1 md:flex-none px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap ' + (tab === 'funnels' ? 'tab-active' : 'tab-inactive');
        document.getElementById('featTabAtRisk').className = 'flex-1 md:flex-none px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap ' + (tab === 'at-risk' ? 'tab-active' : 'tab-inactive');
        document.getElementById('featContentOverview').classList.toggle('hidden', tab !== 'overview');
        document.getElementById('featContentFunnels').classList.toggle('hidden', tab !== 'funnels');
        document.getElementById('featContentAtRisk').classList.toggle('hidden', tab !== 'at-risk');
    }

    function filterFeatures() {
        if (state.featureAdoption.lifecycleReport) {
            R.renderFeatureHealthGrid(
                state.featureAdoption.lifecycleReport.features || [],
                document.getElementById('featFilterStatus').value,
                document.getElementById('featSortBy').value
            );
        }
    }

    function sortFeatures() {
        filterFeatures();
    }

    function loadFunnelData(funnelId) {
        if (!funnelId) {
            document.getElementById('funnelDetails').classList.add('hidden');
            document.getElementById('funnelVisualization').innerHTML =
                '<div class="text-center py-12 text-text-muted">' +
                '<span class="material-symbols-outlined text-5xl mb-3 block">filter_alt</span>' +
                '<p class="text-sm">Select a funnel to view conversion data</p></div>';
            return;
        }
        state.featureAdoption.selectedFunnel = funnelId;
        var tr = state.featureAdoption.timeRange;
        var endDate = new Date();
        var startDate = new Date();
        startDate.setDate(startDate.getDate() - tr);
        B.getFunnelConversion(funnelId, { start: startDate.toISOString(), end: endDate.toISOString() });
    }

    function refreshFunnelList() {
        B.getFunnelsList();
        R.showToast('Refreshing funnels list...', 'info');
    }

    function showFeatureDetails(featureId) {
        var tr = state.featureAdoption.timeRange;
        var endDate = new Date();
        var startDate = new Date();
        startDate.setDate(startDate.getDate() - tr);
        B.getFeatureStatsDetail(featureId, { start: startDate.toISOString(), end: endDate.toISOString() }, 'day');
        R.showToast('Loading details for ' + featureId + '...', 'info');
    }

    function investigateFeature(featureId) {
        showFeatureDetails(featureId);
    }

    function updateFeatureStatus(featureId, status) {
        if (!confirm('Are you sure you want to change the status of "' + featureId + '" to "' + status + '"?')) return;
        B.updateFeatureStatus(featureId, status, 'Manual status change via Admin Dashboard');
    }

    /* === EXPOSE GLOBALS (for onclick handlers in HTML) === */

    function exposeGlobals() {
        window.toggleTheme = toggleTheme;
        window.refreshDashboard = refreshDashboard;
        window.navigateTo = navigateTo;
        window.loadChartData = loadChartData;
        window.loadAIUsage = loadAIUsage;
        window.scrollToAIUsage = scrollToAIUsage;
        window.saveMetaApprovalThresholds = saveMetaApprovalThresholds;
        window.saveMetaBudgetCaps = saveMetaBudgetCaps;
        window.saveMetaCampaignGuardrails = saveMetaCampaignGuardrails;
        window.quarantineMetaIntegration = quarantineMetaIntegration;
        window.refreshMetaToken = refreshMetaToken;
        window.rebindMetaAdAccount = rebindMetaAdAccount;
        window.disableMetaIntegration = disableMetaIntegration;
        window.setFeatureTimeRange = setFeatureTimeRange;
        window.setFeatureTab = setFeatureTab;
        window.refreshFeatureAdoption = refreshFeatureAdoption;
        window.filterFeatures = filterFeatures;
        window.sortFeatures = sortFeatures;
        window.loadFunnelData = loadFunnelData;
        window.refreshFunnelList = refreshFunnelList;
    }

    /* === INIT === */

    function init() {
        exposeGlobals();
        initTheme();
        initChart();
        initAIUsageChart();
        initFeatureAdoptionCharts();

        B.listen({
            'init': function () { B.getDashboard(); },
            'dashboardLoaded': function (d) { handleDashboardLoaded(d.payload); },
            'chartDataLoaded': function (d) { updateChart(d.payload); },
            'actionSuccess': function (d) { R.showToast(d.message || 'Action completed', 'success'); },
            'actionError': function (d) { R.showToast(d.message || 'An error occurred', 'error'); },
            'aiUsageLoaded': function (d) { handleAIUsageLoaded(d.payload); },
            'aiHealthLoaded': function (d) { console.log('[AI Health]', d.payload); },
            'featureStatsLoaded': function (d) { handleFeatureStatsLoaded(d.payload); },
            'metaGovernanceSummaryLoaded': function (d) { handleMetaGovernanceSummaryLoaded(d.payload); },
            'metaApprovalInboxLoaded': function (d) { handleMetaApprovalInboxLoaded(d.payload); },
            'metaPolicyEditorLoaded': function (d) { handleMetaPolicyEditorLoaded(d.payload); },
            'metaErrorDigestLoaded': function (d) { handleMetaErrorDigestLoaded(d.payload); },
            'metaRateLimitPostureLoaded': function (d) { handleMetaRateLimitPostureLoaded(d.payload); },
            'metaGovernanceActionResult': function (d) { handleMetaGovernanceActionResult(d.payload); },
            'featureLifecycleReportResult': function (d) { handleFeatureLifecycleReport(d.payload); },
            'featureStatsResult': function (d) { console.log('[Feature Stats]', d.payload); },
            'atRiskFeaturesResult': function (d) { handleAtRiskFeatures(d.payload); },
            'funnelConversionResult': function (d) { handleFunnelConversion(d.payload); },
            'updateFeatureStatusResult': function (d) { handleFeatureStatusUpdate(d.payload); },
            'funnelsListResult': function (d) { handleFunnelsList(d.payload); }
        });

        B.getDashboard();
        B.getAIUsage('week');
        B.getMetaGovernanceSummary();
        B.getMetaApprovalInbox(7);
        B.getMetaPolicyEditorData();
        B.getMetaErrorDigest(24, 50);
        B.getMetaRateLimitPosture(24);
        B.getFeatureStats();
        loadFeatureAdoptionData();
    }

    return {
        init: init,
        resolveAlert: resolveAlert,
        showFeatureDetails: showFeatureDetails,
        investigateFeature: investigateFeature,
        updateFeatureStatus: updateFeatureStatus
    };
})();
