/* =========================================
   ADMIN DASHBOARD — Render Module
   Depends on: AdminDashboardConfig
   All DOM rendering / update functions
   ========================================= */
var AdminDashboardRender = (function () {
    'use strict';

    var C = AdminDashboardConfig;

    /* --- Helpers --- */

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function formatAction(action) {
        return C.ACTION_LABELS[action] || action;
    }

    function formatTime(timestamp) {
        if (!timestamp) return '';
        var date = new Date(timestamp);
        var now = new Date();
        var diff = now - date;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
        return date.toLocaleDateString();
    }

    function formatDuration(ms) {
        if (!ms) return '-';
        if (ms < 1000) return ms + 'ms';
        if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
        if (ms < 3600000) return Math.floor(ms / 60000) + 'm';
        return (ms / 3600000).toFixed(1) + 'h';
    }

    /* --- Toast --- */

    function showToast(message, type) {
        type = type || 'info';
        var container = document.getElementById('toastContainer');
        var id = 'toast-' + Date.now();
        var bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-primary';
        var icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

        var toast = document.createElement('div');
        toast.id = id;
        toast.className = 'toast flex items-center gap-3 px-4 py-3 rounded-lg ' + bgColor + ' shadow-lg';
        toast.innerHTML =
            '<span class="material-symbols-outlined text-[20px]">' + icon + '</span>' +
            '<span class="text-sm font-medium flex-1">' + message + '</span>' +
            '<button onclick="document.getElementById(\'' + id + '\').remove()" class="text-white/80 hover:text-white">' +
            '<span class="material-symbols-outlined text-[18px]">close</span></button>';

        container.appendChild(toast);
        setTimeout(function () { toast.remove(); }, 5000);
    }

    /* --- Theme --- */

    function applyTheme(theme) {
        var html = document.documentElement;
        var body = document.body;

        if (theme === 'dark') {
            html.classList.add('dark');
            html.classList.remove('light');
            body.classList.add('bg-background-dark', 'text-white');
            body.classList.remove('bg-background-light', 'text-text-dark');
            document.getElementById('themeIconSun').classList.remove('hidden');
            document.getElementById('themeIconMoon').classList.add('hidden');
        } else {
            html.classList.remove('dark');
            html.classList.add('light');
            body.classList.remove('bg-background-dark', 'text-white');
            body.classList.add('bg-background-light', 'text-text-dark');
            document.getElementById('themeIconSun').classList.add('hidden');
            document.getElementById('themeIconMoon').classList.remove('hidden');
        }
    }

    /* --- Health Indicator --- */

    function updateHealthIndicator(health) {
        var indicator = document.getElementById('healthIndicator');
        var statusEl = document.getElementById('healthStatus');
        var dot = indicator.querySelector('span:first-child');
        var text = indicator.querySelector('span:last-child');

        var status = (health && health.status) || 'unknown';
        var config = C.HEALTH_COLOR_MAP[status] || C.HEALTH_COLOR_MAP.unknown;

        dot.className = 'w-2 h-2 rounded-full ' + config.bg + ' pulse-dot';
        text.className = 'text-xs font-medium ' + config.text;
        text.textContent = config.label;

        statusEl.className = 'px-2 py-0.5 ' + config.bg.replace('bg-', 'bg-').replace('-400', '-500/20') + ' ' + config.text + ' text-xs font-bold rounded-full';
        statusEl.textContent = config.label;
    }

    /* --- Alerts --- */

    function renderAlerts(alerts) {
        var container = document.getElementById('alertsList');
        var countEl = document.getElementById('alertCount');

        countEl.textContent = (alerts && alerts.unresolvedCount) || 0;

        if (!alerts || !alerts.items || !alerts.items.length) {
            container.innerHTML =
                '<div class="text-center py-6 text-text-muted text-sm">' +
                '<span class="material-symbols-outlined text-3xl mb-2 block text-emerald-400">check_circle</span>' +
                'No active alerts</div>';
            return;
        }

        container.innerHTML = alerts.items.map(function (alert) {
            var typeClass = 'alert-' + (alert.type || 'info');
            var icon = alert.type === 'critical' ? 'error' : alert.type === 'warning' ? 'warning' : 'info';
            var closeBtn = !alert.isDynamic
                ? '<button onclick="AdminDashboardLogic.resolveAlert(\'' + alert._id + '\')" class="text-text-muted hover:text-white p-1"><span class="material-symbols-outlined text-[16px]">close</span></button>'
                : '';

            return '<div class="p-3 rounded-lg border-l-4 ' + typeClass + '">' +
                '<div class="flex items-start gap-2">' +
                '<span class="material-symbols-outlined text-[18px] mt-0.5">' + icon + '</span>' +
                '<div class="flex-1 min-w-0">' +
                '<div class="text-sm font-medium">' + alert.title + '</div>' +
                '<div class="text-xs text-text-muted mt-0.5">' + alert.message + '</div></div>' +
                closeBtn + '</div></div>';
        }).join('');
    }

    /* --- Activity Feed --- */

    function renderActivityFeed(activities) {
        var container = document.getElementById('activityFeed');

        if (!activities || !activities.length) {
            container.innerHTML = '<div class="text-center py-6 text-text-muted text-sm">No recent activity</div>';
            return;
        }

        container.innerHTML = activities.map(function (activity) {
            var iconColor = C.ACTIVITY_COLOR_MAP[activity.color] || C.ACTIVITY_COLOR_MAP.blue;
            var description = '';

            switch (activity.type) {
                case 'admin_action':
                    description = (activity.adminEmail || 'Admin') + ' ' + formatAction(activity.action);
                    break;
                case 'match':
                    description = activity.driverName + ' matched with ' + activity.carrierName + ' (' + activity.score + '%)';
                    break;
                case 'new_driver':
                    description = 'New driver registered: ' + activity.name;
                    break;
                default:
                    description = 'Activity';
            }

            return '<div class="flex items-start gap-3">' +
                '<div class="w-8 h-8 rounded-lg ' + iconColor + ' flex items-center justify-center flex-shrink-0">' +
                '<span class="material-symbols-outlined text-[16px]">' + activity.icon + '</span></div>' +
                '<div class="flex-1 min-w-0">' +
                '<div class="text-sm truncate">' + description + '</div>' +
                '<div class="text-xs text-text-muted">' + formatTime(activity.timestamp) + '</div></div></div>';
        }).join('');
    }

    /* --- Services Health --- */

    function renderServicesHealth(services) {
        var container = document.getElementById('servicesList');

        if (!services) {
            container.innerHTML = '<div class="text-text-muted text-sm">No data</div>';
            return;
        }

        container.innerHTML = Object.entries(services).map(function (entry) {
            var key = entry[0];
            var service = entry[1];
            var statusColor = service.status === 'up' ? 'bg-emerald-400' : 'bg-amber-400';
            var textColor = service.status === 'up' ? 'text-emerald-400' : 'text-amber-400';

            return '<div class="flex items-center justify-between py-2">' +
                '<div class="flex items-center gap-2">' +
                '<span class="w-2 h-2 rounded-full ' + statusColor + '"></span>' +
                '<span class="text-sm">' + (C.SERVICE_NAMES[key] || key) + '</span></div>' +
                '<span class="text-xs ' + textColor + '">' + service.score + '%</span></div>';
        }).join('');
    }

    /* --- Meta Governance --- */

    function renderMetaGovernanceSummary(summary) {
        var integrationsTotal = document.getElementById('metaIntegrationsTotal');
        var integrationsActive = document.getElementById('metaIntegrationsActive');
        var adAccountsTotal = document.getElementById('metaAdAccountsTotal');
        var tokenHealthy = document.getElementById('metaTokenHealthy');
        var tokenExpiring = document.getElementById('metaTokenExpiring');
        var tokenCritical = document.getElementById('metaTokenCritical');
        var postureBadge = document.getElementById('metaPostureBadge');

        if (!summary || !summary.success) {
            integrationsTotal.textContent = '--';
            integrationsActive.textContent = '-- active';
            adAccountsTotal.textContent = '--';
            tokenHealthy.textContent = '--';
            tokenExpiring.textContent = '--';
            tokenCritical.textContent = '--';
            postureBadge.textContent = 'Unavailable';
            postureBadge.className = 'px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full';
            return;
        }

        var statusCounts = summary.statusCounts || {};
        var tokenCounts = summary.tokenHealthCounts || {};
        var criticalCount = (tokenCounts.expired || 0) + (tokenCounts.quarantined || 0) + (tokenCounts.disabled || 0);

        integrationsTotal.textContent = (summary.totals && summary.totals.integrations) || 0;
        integrationsActive.textContent = (statusCounts.active || 0) + ' active';
        adAccountsTotal.textContent = (summary.totals && summary.totals.adAccounts) || 0;
        tokenHealthy.textContent = tokenCounts.healthy || 0;
        tokenExpiring.textContent = tokenCounts.expiring_soon || 0;
        tokenCritical.textContent = criticalCount;

        var posture = ((summary.posture || 'healthy')).toLowerCase();
        if (posture === 'critical') {
            postureBadge.textContent = 'Critical';
            postureBadge.className = 'px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full';
        } else if (posture === 'warning') {
            postureBadge.textContent = 'Warning';
            postureBadge.className = 'px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full';
        } else {
            postureBadge.textContent = 'Healthy';
            postureBadge.className = 'px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full';
        }
    }

    function renderMetaApprovalInbox(data) {
        var countEl = document.getElementById('metaApprovalInboxCount');
        var listEl = document.getElementById('metaApprovalInboxList');
        var pending = (data && data.pending) || [];
        countEl.textContent = pending.length;

        if (!pending.length) {
            listEl.innerHTML = '<div>No pending approvals</div>';
            return;
        }

        listEl.innerHTML = pending.slice(0, 8).map(function (item) {
            return '<div class="bg-surface-darker border border-border-dark rounded-lg px-2 py-1.5">' +
                '<div class="font-semibold text-text-dark text-[11px]">' + (item.action_key || item.tool_name || 'execute_high action') + '</div>' +
                '<div class="text-[10px] text-text-muted">' + (item.presented_at || item.created_at || '') + '</div></div>';
        }).join('');
    }

    /* --- AI Usage --- */

    function renderProviderBars(providers) {
        var container = document.getElementById('aiProviderBars');

        if (!providers.length) {
            container.innerHTML = '<div class="text-center py-3 text-text-muted text-xs">No data</div>';
            return;
        }

        var maxCost = Math.max.apply(null, providers.map(function (p) { return p.cost; })) || 1;

        container.innerHTML = providers.map(function (provider) {
            var width = Math.max((provider.cost / maxCost) * 100, 2);
            var color = C.PROVIDER_COLORS[provider.provider] || 'bg-slate-400';

            return '<div class="flex items-center gap-2">' +
                '<div class="w-20 text-[10px] text-text-muted truncate">' + provider.name + '</div>' +
                '<div class="flex-1 h-4 bg-slate-700 rounded overflow-hidden">' +
                '<div class="' + color + ' h-full rounded transition-all duration-500" style="width: ' + width + '%"></div></div>' +
                '<div class="w-14 text-right text-[10px] font-medium">$' + provider.cost.toFixed(2) + '</div></div>';
        }).join('');
    }

    function renderFunctionList(functions) {
        var container = document.getElementById('aiFunctionList');

        if (!functions.length) {
            container.innerHTML = '<div class="text-center py-3 text-text-muted text-xs">No data</div>';
            return;
        }

        container.innerHTML = functions.map(function (func) {
            return '<div class="flex items-center justify-between py-1.5 border-b border-border-dark/50 last:border-0">' +
                '<span class="text-[11px] text-text-muted">' + func.name + '</span>' +
                '<div class="flex items-center gap-3">' +
                '<span class="text-[10px] text-violet-400">' + formatNumber(func.tokens) + ' tok</span>' +
                '<span class="text-[10px] font-medium text-cyan-400">$' + func.cost.toFixed(2) + '</span></div></div>';
        }).join('');
    }

    /* --- Feature Adoption --- */

    function renderFeatureHealthGrid(features, filterStatus, sortBy) {
        var container = document.getElementById('featureHealthGrid');

        var filtered = filterStatus === 'all'
            ? features
            : features.filter(function (f) { return (f.status || '').toLowerCase() === filterStatus; });

        filtered.sort(function (a, b) {
            switch (sortBy) {
                case 'health-desc': return (b.healthScore || 0) - (a.healthScore || 0);
                case 'health-asc': return (a.healthScore || 0) - (b.healthScore || 0);
                case 'users-desc': return (b.last7DaysUsers || 0) - (a.last7DaysUsers || 0);
                case 'name-asc': return (a.displayName || a.featureId).localeCompare(b.displayName || b.featureId);
                default: return 0;
            }
        });

        if (filtered.length === 0) {
            container.innerHTML =
                '<div class="col-span-full text-center py-8 text-text-muted text-sm">' +
                '<span class="material-symbols-outlined text-4xl mb-2 block">search_off</span>' +
                'No features match the selected filter</div>';
            return;
        }

        container.innerHTML = filtered.map(function (feature) {
            var healthScore = feature.healthScore || 0;
            var statusClass = 'status-badge-' + ((feature.status || 'active')).toLowerCase();
            var trend = feature.trend || 'stable';
            var trendIcon = trend === 'growing' ? 'trending_up' : trend === 'declining' ? 'trending_down' : 'trending_flat';
            var trendColor = trend === 'growing' ? 'text-emerald-400' : trend === 'declining' ? 'text-rose-400' : 'text-text-muted';
            var barColor = healthScore >= 70 ? 'bg-emerald-400' : healthScore >= 40 ? 'bg-amber-400' : 'bg-rose-400';

            return '<div class="feature-card bg-surface-darker rounded-xl p-4 cursor-pointer" onclick="AdminDashboardLogic.showFeatureDetails(\'' + feature.featureId + '\')">' +
                '<div class="flex items-start justify-between mb-3">' +
                '<div class="flex-1 min-w-0">' +
                '<div class="text-sm font-semibold truncate">' + (feature.displayName || feature.featureId) + '</div>' +
                '<div class="text-[10px] text-text-muted mt-0.5">' + (feature.category || 'uncategorized') + '</div></div>' +
                '<span class="px-2 py-0.5 text-[9px] font-bold rounded-full ' + statusClass + ' uppercase">' + (feature.status || 'active') + '</span></div>' +
                '<div class="flex items-center justify-between">' +
                '<div><div class="text-2xl font-bold">' + healthScore + '</div>' +
                '<div class="text-[10px] text-text-muted">Health Score</div></div>' +
                '<div class="text-right"><div class="flex items-center gap-1 ' + trendColor + '">' +
                '<span class="material-symbols-outlined text-[16px]">' + trendIcon + '</span>' +
                '<span class="text-xs font-medium">' + ((feature.last7DaysUsers || 0)).toLocaleString() + '</span></div>' +
                '<div class="text-[10px] text-text-muted">Users (7d)</div></div></div>' +
                '<div class="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">' +
                '<div class="h-full rounded-full transition-all duration-500 ' + barColor + '" style="width: ' + healthScore + '%"></div></div></div>';
        }).join('');
    }

    function renderTopBottomFeatures(features) {
        var sorted = features.slice().sort(function (a, b) { return (b.healthScore || 0) - (a.healthScore || 0); });
        var top5 = sorted.slice(0, 5);
        var bottom5 = sorted.slice(-5).reverse();

        var topContainer = document.getElementById('topFeaturesTable');
        topContainer.innerHTML = top5.map(function (f, idx) {
            return '<div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors">' +
                '<div class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">' + (idx + 1) + '</div>' +
                '<div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">' + (f.displayName || f.featureId) + '</div>' +
                '<div class="text-[10px] text-text-muted">' + ((f.last7DaysUsers || 0)).toLocaleString() + ' users</div></div>' +
                '<div class="text-right"><div class="text-sm font-bold text-emerald-400">' + (f.healthScore || 0) + '</div>' +
                '<div class="text-[10px] text-text-muted">' + ((f.completionRate || 0)).toFixed(1) + '% CR</div></div></div>';
        }).join('') || '<div class="text-center py-4 text-text-muted text-xs">No data</div>';

        var bottomContainer = document.getElementById('bottomFeaturesTable');
        bottomContainer.innerHTML = bottom5.map(function (f, idx) {
            return '<div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors">' +
                '<div class="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold">' + (sorted.length - bottom5.length + idx + 1) + '</div>' +
                '<div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">' + (f.displayName || f.featureId) + '</div>' +
                '<div class="text-[10px] text-text-muted">' + ((f.last7DaysUsers || 0)).toLocaleString() + ' users</div></div>' +
                '<div class="text-right"><div class="text-sm font-bold text-rose-400">' + (f.healthScore || 0) + '</div>' +
                '<div class="text-[10px] text-text-muted">' + ((f.completionRate || 0)).toFixed(1) + '% CR</div></div></div>';
        }).join('') || '<div class="text-center py-4 text-text-muted text-xs">No data</div>';
    }

    function renderAtRiskFeatures(features) {
        var container = document.getElementById('atRiskFeaturesList');

        if (!features || features.length === 0) {
            container.innerHTML =
                '<div class="text-center py-12 text-text-muted">' +
                '<span class="material-symbols-outlined text-5xl mb-3 block text-emerald-400">verified</span>' +
                '<p class="text-sm">No at-risk features detected</p>' +
                '<p class="text-xs mt-1">All features are performing within healthy thresholds</p></div>';
            return;
        }

        container.innerHTML = features.map(function (feature) {
            var riskClass = feature.riskLevel === 'critical' ? 'at-risk-alert' : 'at-risk-warning';
            var riskColor = feature.riskLevel === 'critical' ? 'text-rose-400' : 'text-amber-400';
            var riskIcon = feature.riskLevel === 'critical' ? 'error' : 'warning';

            var issuesHtml = (feature.issues || []).map(function (issue) {
                return '<li class="flex items-start gap-2"><span class="material-symbols-outlined text-[14px] ' + riskColor + ' mt-0.5">arrow_right</span><span>' + issue + '</span></li>';
            }).join('');

            var deprecateBtn = feature.recommendedAction === 'deprecate'
                ? '<button onclick="AdminDashboardLogic.updateFeatureStatus(\'' + feature.featureId + '\', \'deprecated\')" class="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"><span class="material-symbols-outlined text-[14px] mr-1 align-middle">do_not_disturb</span>Deprecate</button>'
                : '';
            var sunsetBtn = feature.recommendedAction === 'sunset'
                ? '<button onclick="AdminDashboardLogic.updateFeatureStatus(\'' + feature.featureId + '\', \'sunset\')" class="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"><span class="material-symbols-outlined text-[14px] mr-1 align-middle">cancel</span>Sunset</button>'
                : '';

            return '<div class="' + riskClass + ' rounded-xl p-4">' +
                '<div class="flex items-start justify-between mb-3">' +
                '<div class="flex items-center gap-3">' +
                '<span class="material-symbols-outlined ' + riskColor + ' text-2xl">' + riskIcon + '</span>' +
                '<div><div class="font-semibold">' + (feature.displayName || feature.featureId) + '</div>' +
                '<div class="text-xs text-text-muted mt-0.5">Health Score: <span class="' + riskColor + ' font-bold">' + feature.healthScore + '</span></div></div></div>' +
                '<span class="px-2 py-1 text-[10px] font-bold rounded-full ' + riskColor + ' bg-current/20 uppercase">' + feature.riskLevel + '</span></div>' +
                '<div class="mb-3"><div class="text-xs font-medium text-text-muted mb-1">Issues:</div>' +
                '<ul class="text-xs space-y-1">' + issuesHtml + '</ul></div>' +
                '<div class="flex items-center justify-between text-xs text-text-muted mb-3">' +
                '<span>Days since significant use: <strong class="' + riskColor + '">' + (feature.daysSinceSignificantUse || '--') + '</strong></span>' +
                '<span>Threshold: ' + (feature.retirementThreshold || 30) + ' days</span></div>' +
                '<div class="flex gap-2">' +
                '<button onclick="AdminDashboardLogic.investigateFeature(\'' + feature.featureId + '\')" class="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"><span class="material-symbols-outlined text-[14px] mr-1 align-middle">search</span>Investigate</button>' +
                deprecateBtn + sunsetBtn + '</div></div>';
        }).join('');
    }

    function renderFunnelVisualization(data) {
        var container = document.getElementById('funnelVisualization');
        var steps = data.steps || [];

        if (steps.length === 0) {
            container.innerHTML =
                '<div class="text-center py-12 text-text-muted">' +
                '<span class="material-symbols-outlined text-5xl mb-3 block">filter_alt</span>' +
                '<p class="text-sm">No funnel data available</p></div>';
            return;
        }

        var maxEntered = Math.max.apply(null, steps.map(function (s) { return s.entered || 0; })) || 1;

        var stepsHtml = steps.map(function (step, idx) {
            var width = Math.max(((step.entered || 0) / maxEntered) * 100, 10);
            var dropoff = idx > 0 ? steps[idx - 1].entered - step.entered : 0;
            var dropoffPercent = idx > 0 ? ((dropoff / steps[idx - 1].entered) * 100).toFixed(1) : 0;
            var isProblematic = step.conversionRate < 50;
            var barClass = isProblematic ? 'bg-amber-500' : 'bg-purple-500';
            var completedText = step.completed ? '<span class="text-[10px] font-bold text-white">' + step.completed.toLocaleString() + ' completed</span>' : '';

            var dropoffHtml = (idx > 0 && dropoff > 0)
                ? '<div class="flex items-center gap-1 mt-1 text-xs text-rose-400"><span class="material-symbols-outlined text-[14px]">arrow_downward</span><span>' + dropoff.toLocaleString() + ' dropped (' + dropoffPercent + '%)</span></div>'
                : '';

            return '<div>' +
                '<div class="flex items-center justify-between mb-1">' +
                '<div class="flex items-center gap-2">' +
                '<span class="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">' + step.order + '</span>' +
                '<span class="text-sm font-medium">' + step.displayName + '</span></div>' +
                '<div class="text-right"><span class="text-sm font-bold">' + (step.entered || 0).toLocaleString() + '</span>' +
                '<span class="text-xs text-text-muted ml-2">(' + ((step.conversionRate || 0)).toFixed(1) + '%)</span></div></div>' +
                '<div class="h-8 bg-slate-700 rounded-lg overflow-hidden relative">' +
                '<div class="funnel-bar h-full ' + barClass + ' rounded-lg flex items-center justify-end pr-2" style="width: ' + width + '%">' + completedText + '</div></div>' +
                dropoffHtml + '</div>';
        }).join('');

        var dropoffInsight = '';
        if (data.dropoffAnalysis && data.dropoffAnalysis.biggestDropoff) {
            dropoffInsight =
                '<div class="mt-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">' +
                '<div class="flex items-center gap-2 text-rose-400"><span class="material-symbols-outlined">insights</span>' +
                '<span class="text-sm font-medium">Biggest Drop-off</span></div>' +
                '<p class="text-xs text-text-muted mt-1">Step ' + data.dropoffAnalysis.biggestDropoff.step + ': Lost ' + data.dropoffAnalysis.biggestDropoff.lostUsers.toLocaleString() + ' users</p></div>';
        }

        container.innerHTML =
            '<h4 class="text-sm font-semibold mb-6">' + (data.displayName || 'Funnel Analysis') + '</h4>' +
            '<div class="space-y-4">' + stepsHtml + '</div>' + dropoffInsight;
    }

    function renderFunnelSteps(steps) {
        var container = document.getElementById('funnelStepsTable');

        if (!steps || steps.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-text-muted text-xs">No step data available</div>';
            return;
        }

        var rowsHtml = steps.map(function (step) {
            var convColor = step.conversionRate >= 70 ? 'text-emerald-400' : step.conversionRate >= 40 ? 'text-amber-400' : 'text-rose-400';

            return '<div class="grid grid-cols-6 gap-2 py-2 text-xs border-b border-border-dark/50 last:border-0 hover:bg-slate-700/30 transition-colors">' +
                '<div class="font-bold text-purple-400">' + step.order + '</div>' +
                '<div class="truncate" title="' + step.displayName + '">' + step.displayName + '</div>' +
                '<div class="text-right font-medium">' + (step.entered || 0).toLocaleString() + '</div>' +
                '<div class="text-right font-medium">' + (step.completed || 0).toLocaleString() + '</div>' +
                '<div class="text-right font-bold ' + convColor + '">' + ((step.conversionRate || 0)).toFixed(1) + '%</div>' +
                '<div class="text-right text-text-muted">' + (step.avgTimeToNextMs ? formatDuration(step.avgTimeToNextMs) : '-') + '</div></div>';
        }).join('');

        container.innerHTML =
            '<div class="overflow-x-auto"><div class="min-w-[600px]">' +
            '<div class="grid grid-cols-6 gap-2 text-[10px] text-text-muted font-medium pb-2 border-b border-border-dark">' +
            '<div>Step</div><div>Name</div><div class="text-right">Entered</div>' +
            '<div class="text-right">Completed</div><div class="text-right">Conv. Rate</div>' +
            '<div class="text-right">Avg Time</div></div>' +
            rowsHtml + '</div></div>';
    }

    return {
        formatNumber: formatNumber,
        formatTime: formatTime,
        formatDuration: formatDuration,
        showToast: showToast,
        applyTheme: applyTheme,
        updateHealthIndicator: updateHealthIndicator,
        renderAlerts: renderAlerts,
        renderActivityFeed: renderActivityFeed,
        renderServicesHealth: renderServicesHealth,
        renderMetaGovernanceSummary: renderMetaGovernanceSummary,
        renderMetaApprovalInbox: renderMetaApprovalInbox,
        renderProviderBars: renderProviderBars,
        renderFunctionList: renderFunctionList,
        renderFeatureHealthGrid: renderFeatureHealthGrid,
        renderTopBottomFeatures: renderTopBottomFeatures,
        renderAtRiskFeatures: renderAtRiskFeatures,
        renderFunnelVisualization: renderFunnelVisualization,
        renderFunnelSteps: renderFunnelSteps
    };
})();
