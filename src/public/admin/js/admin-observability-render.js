/* =========================================
   ADMIN OBSERVABILITY — Render Module
   Depends on: AdminObservabilityConfig
   All DOM rendering and update functions
   ========================================= */
var AdminObservabilityRender = (function () {
    'use strict';

    var C = AdminObservabilityConfig;

    /* --- Utility helpers --- */

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function formatTime(timestamp) {
        var d = new Date(timestamp);
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getSourceIcon(source) {
        return C.SOURCE_ICONS[source] || 'fa-circle';
    }

    /* --- Toast --- */

    function showToast(message, type) {
        type = type || 'info';
        var toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ' +
            (type === 'error' ? 'bg-red-500' : 'bg-green-500') + ' text-white z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(function () { toast.remove(); }, 3000);
    }

    /* --- Theme icons --- */

    function updateThemeIcon(theme) {
        var icon = theme === 'dark' ? 'fa-moon' : 'fa-sun';
        document.getElementById('themeToggle').innerHTML = '<i class="fas ' + icon + ' text-text-muted"></i>';
    }

    /* --- Overview rendering --- */

    function renderOverview(health, errors) {
        if (!health) return;

        var summary = health.summary || {
            totalRequests: health.totalRequests || 0,
            totalErrors: health.totalErrors || 0,
            errorRate: health.errorRate || 0,
            avgLatency: health.avgLatency || health.avgLatencyMs || 0,
            status: health.status || 'healthy'
        };
        var bySource = health.bySource || health.services || [];

        // Update metrics
        document.getElementById('metricRequests').textContent = formatNumber(summary.totalRequests);
        document.getElementById('metricErrorRate').textContent = summary.errorRate + '%';
        document.getElementById('metricLatency').textContent = summary.avgLatency + 'ms';
        document.getElementById('metricErrors').textContent = formatNumber(summary.totalErrors);

        // Update health indicator
        var healthEl = document.getElementById('systemHealth');
        if (summary.status === 'healthy') {
            healthEl.className = 'flex items-center space-x-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg';
            healthEl.innerHTML = '<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span class="text-sm font-medium text-green-400">System Healthy</span>';
        } else if (summary.status === 'warning') {
            healthEl.className = 'flex items-center space-x-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg';
            healthEl.innerHTML = '<div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div><span class="text-sm font-medium text-amber-400">Degraded</span>';
        } else {
            healthEl.className = 'flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg';
            healthEl.innerHTML = '<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div><span class="text-sm font-medium text-red-400">Critical</span>';
        }

        // Render service health
        var serviceList = document.getElementById('serviceHealthList');
        if (bySource.length === 0) {
            serviceList.innerHTML = '<div class="text-text-muted text-center py-8">No services active</div>';
        } else {
            serviceList.innerHTML = bySource.map(function (s) {
                return '<div class="flex items-center justify-between p-3 bg-surface-darker rounded-lg">' +
                    '<div class="flex items-center space-x-3">' +
                        '<div class="w-8 h-8 rounded-lg ' + (s.errorRate > 5 ? 'bg-red-500/20' : 'bg-green-500/20') + ' flex items-center justify-center">' +
                            '<i class="fas ' + getSourceIcon(s.source) + ' ' + (s.errorRate > 5 ? 'text-red-400' : 'text-green-400') + '"></i>' +
                        '</div>' +
                        '<div>' +
                            '<div class="text-white font-medium">' + s.source + '</div>' +
                            '<div class="text-xs text-text-muted">' + s.requests + ' requests</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="text-right">' +
                        '<div class="' + (s.errorRate > 5 ? 'text-red-400' : s.errorRate > 0 ? 'text-amber-400' : 'text-green-400') + '">' + s.errorRate + '% errors</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        // Render errors by hour chart
        if (errors && errors.byHour) {
            renderErrorsChart(errors.byHour);
        }

        // Render recent errors
        if (errors && errors.items) {
            var recentErrors = errors.items.slice(0, 5);
            var errorsList = document.getElementById('recentErrorsList');
            if (recentErrors.length === 0) {
                errorsList.innerHTML = '<div class="text-text-muted text-center py-8">No recent errors</div>';
            } else {
                errorsList.innerHTML = recentErrors.map(function (e) {
                    return '<div class="p-4 bg-surface-darker rounded-lg border-l-4 ' + (e.level === 'CRITICAL' ? 'border-red-500' : 'border-amber-500') + '">' +
                        '<div class="flex items-center justify-between mb-2">' +
                            '<span class="text-xs px-2 py-1 rounded level-' + e.level.toLowerCase() + '">' + e.level + '</span>' +
                            '<span class="text-xs text-text-muted">' + formatTime(e.timestamp) + '</span>' +
                        '</div>' +
                        '<div class="text-white text-sm mb-1">' + escapeHtml(e.message) + '</div>' +
                        '<div class="text-xs text-text-muted">' + e.source + '</div>' +
                    '</div>';
                }).join('');
            }
        }
    }

    function renderErrorsChart(byHour) {
        var container = document.getElementById('errorsByHourChart');
        if (!byHour || byHour.length === 0) {
            container.innerHTML = '<div class="text-text-muted text-center py-8 w-full">No data</div>';
            return;
        }

        var maxCount = Math.max.apply(null, byHour.map(function (h) { return h.count; }).concat([1]));
        container.innerHTML = byHour.slice(-24).map(function (h) {
            var height = (h.count / maxCount) * 100;
            var hour = new Date(h.hour + ':00:00').getHours();
            return '<div class="flex-1 flex flex-col items-center justify-end">' +
                '<div class="chart-bar w-full bg-red-500/80 rounded-t" style="height: ' + Math.max(height, 2) + '%"></div>' +
                '<div class="text-xs text-text-muted mt-1">' + hour + '</div>' +
            '</div>';
        }).join('');
    }

    /* --- Logs rendering --- */

    function renderLogs(logs, logsPage) {
        var items = logs.items;
        var totalCount = logs.totalCount;

        var tbody = document.getElementById('logsTable');
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-text-muted py-8">No logs found</td></tr>';
        } else {
            tbody.innerHTML = items.map(function (log) {
                return '<tr class="log-row border-b border-border-dark cursor-pointer" onclick="showLogDetail(\'' + log._id + '\')">' +
                    '<td class="px-4 py-3 text-sm font-mono text-text-muted">' + formatTime(log.timestamp) + '</td>' +
                    '<td class="px-4 py-3"><span class="text-xs px-2 py-1 rounded level-' + log.level.toLowerCase() + '">' + log.level + '</span></td>' +
                    '<td class="px-4 py-3 text-sm text-text-muted">' + log.source + '</td>' +
                    '<td class="px-4 py-3 text-sm text-white max-w-md truncate">' + escapeHtml(log.message) + '</td>' +
                    '<td class="px-4 py-3 text-sm text-text-muted">' + (log.duration ? log.duration + 'ms' : '-') + '</td>' +
                    '<td class="px-4 py-3 text-sm font-mono text-brand-blue truncate max-w-[120px]">' + (log.traceId || '-') + '</td>' +
                '</tr>';
            }).join('');
        }

        var start = logsPage * 50 + 1;
        var end = Math.min(start + items.length - 1, totalCount);
        document.getElementById('logsPagination').textContent = 'Showing ' + start + '-' + end + ' of ' + totalCount;
        document.getElementById('logsPrevBtn').disabled = logsPage === 0;
        document.getElementById('logsNextBtn').disabled = end >= totalCount;
    }

    function showLogDetail(log) {
        var content = document.getElementById('logDetailContent');
        content.innerHTML =
            '<div class="grid grid-cols-2 gap-4">' +
                '<div>' +
                    '<div class="text-text-muted text-sm mb-1">Timestamp</div>' +
                    '<div class="text-white font-mono">' + formatTime(log.timestamp) + '</div>' +
                '</div>' +
                '<div>' +
                    '<div class="text-text-muted text-sm mb-1">Level</div>' +
                    '<span class="text-xs px-2 py-1 rounded level-' + log.level.toLowerCase() + '">' + log.level + '</span>' +
                '</div>' +
                '<div>' +
                    '<div class="text-text-muted text-sm mb-1">Source</div>' +
                    '<div class="text-white">' + log.source + '</div>' +
                '</div>' +
                '<div>' +
                    '<div class="text-text-muted text-sm mb-1">Duration</div>' +
                    '<div class="text-white">' + (log.duration ? log.duration + 'ms' : '-') + '</div>' +
                '</div>' +
                '<div class="col-span-2">' +
                    '<div class="text-text-muted text-sm mb-1">Trace ID</div>' +
                    '<div class="text-brand-blue font-mono cursor-pointer hover:underline" onclick="lookupTraceFromLog(\'' + (log.traceId || '') + '\')">' + (log.traceId || '-') + '</div>' +
                '</div>' +
            '</div>' +
            '<div>' +
                '<div class="text-text-muted text-sm mb-1">Message</div>' +
                '<div class="text-white bg-surface-darker p-3 rounded-lg">' + escapeHtml(log.message) + '</div>' +
            '</div>' +
            (log.details ? '<div>' +
                '<div class="text-text-muted text-sm mb-1">Details</div>' +
                '<pre class="text-sm text-white bg-surface-darker p-3 rounded-lg overflow-x-auto font-mono">' + escapeHtml(JSON.stringify(log.details, null, 2)) + '</pre>' +
            '</div>' : '') +
            (log.tags && log.tags.length > 0 ? '<div>' +
                '<div class="text-text-muted text-sm mb-1">Tags</div>' +
                '<div class="flex flex-wrap gap-2">' +
                    log.tags.map(function (t) { return '<span class="px-2 py-1 bg-brand-purple/20 text-brand-purple rounded text-xs">' + t + '</span>'; }).join('') +
                '</div>' +
            '</div>' : '');

        document.getElementById('logDetailModal').classList.remove('hidden');
        document.getElementById('logDetailModal').classList.add('flex');
    }

    /* --- Errors rendering --- */

    function renderErrors(errors) {
        if (!errors) return;

        var items = errors.items;
        var bySource = errors.bySource;
        var totalCount = errors.totalCount;

        // Error summary
        var summaryEl = document.getElementById('errorSummary');
        summaryEl.innerHTML =
            '<div class="text-center">' +
                '<div class="text-4xl font-bold text-red-400">' + totalCount + '</div>' +
                '<div class="text-text-muted text-sm mt-1">Total Errors</div>' +
            '</div>' +
            '<div class="text-center">' +
                '<div class="text-2xl font-bold text-white">' + Object.keys(bySource).length + '</div>' +
                '<div class="text-text-muted text-sm mt-1">Affected Services</div>' +
            '</div>' +
            '<div class="text-center">' +
                '<div class="text-2xl font-bold text-amber-400">' + items.filter(function (e) { return e.level === 'CRITICAL'; }).length + '</div>' +
                '<div class="text-text-muted text-sm mt-1">Critical</div>' +
            '</div>';

        // Errors by source
        var sourceEl = document.getElementById('errorsBySource');
        var sources = Object.entries(bySource).sort(function (a, b) { return b[1] - a[1]; });
        if (sources.length === 0) {
            sourceEl.innerHTML = '<div class="text-text-muted text-center py-8">No errors</div>';
        } else {
            var maxCount = Math.max.apply(null, sources.map(function (s) { return s[1]; }));
            sourceEl.innerHTML = sources.map(function (entry) {
                var source = entry[0];
                var count = entry[1];
                return '<div class="flex items-center space-x-4">' +
                    '<div class="w-32 text-sm text-text-muted truncate">' + source + '</div>' +
                    '<div class="flex-1 h-4 bg-surface-darker rounded-full overflow-hidden">' +
                        '<div class="h-full bg-red-500/80 rounded-full" style="width: ' + (count / maxCount) * 100 + '%"></div>' +
                    '</div>' +
                    '<div class="w-12 text-right text-sm text-white font-medium">' + count + '</div>' +
                '</div>';
            }).join('');
        }

        // Error list
        var errorListEl = document.getElementById('errorList');
        if (items.length === 0) {
            errorListEl.innerHTML = '<div class="text-text-muted text-center py-8">No errors found</div>';
        } else {
            errorListEl.innerHTML = items.map(function (e) {
                return '<div class="p-4 hover:bg-surface-darker transition-colors">' +
                    '<div class="flex items-start justify-between mb-2">' +
                        '<div class="flex items-center space-x-3">' +
                            '<span class="text-xs px-2 py-1 rounded level-' + e.level.toLowerCase() + '">' + e.level + '</span>' +
                            '<span class="text-sm text-text-muted">' + e.source + '</span>' +
                        '</div>' +
                        '<span class="text-xs text-text-muted">' + formatTime(e.timestamp) + '</span>' +
                    '</div>' +
                    '<div class="text-white mb-2">' + escapeHtml(e.message) + '</div>' +
                    (e.details && e.details.error ?
                        '<pre class="text-xs text-red-400 bg-red-500/10 p-2 rounded overflow-x-auto font-mono">' +
                            escapeHtml(typeof e.details.error === 'string' ? e.details.error : JSON.stringify(e.details.error)) +
                        '</pre>' : '') +
                    (e.traceId ?
                        '<div class="mt-2 text-xs text-brand-blue font-mono cursor-pointer hover:underline" onclick="lookupTraceFromLog(\'' + e.traceId + '\')">Trace: ' + e.traceId + '</div>' : '') +
                '</div>';
            }).join('');
        }
    }

    /* --- Trace rendering --- */

    function renderTrace(data) {
        if (!data || !data.trace) {
            showToast('Trace not found', 'error');
            return;
        }

        var trace = data.trace;
        var timeline = data.timeline;

        document.getElementById('traceId').textContent = trace.traceId;
        document.getElementById('traceName').textContent = trace.name || '-';
        document.getElementById('traceDuration').textContent = trace.duration ? trace.duration + 'ms' : '-';
        document.getElementById('traceStatus').innerHTML = '<span class="' +
            (trace.status === 'completed' ? 'text-green-400' : trace.status === 'error' ? 'text-red-400' : 'text-amber-400') + '">' +
            trace.status + '</span>';

        var timelineEl = document.getElementById('traceTimeline');
        if (!timeline || timeline.length === 0) {
            timelineEl.innerHTML = '<div class="text-text-muted">No spans found for this trace</div>';
        } else {
            timelineEl.innerHTML = '<div class="timeline-line"></div>' + timeline.map(function (span) {
                return '<div class="relative flex items-start space-x-4">' +
                    '<div class="timeline-dot flex-shrink-0 ' + (span.level === 'ERROR' ? 'border-red-500' : 'border-brand-blue') + '"></div>' +
                    '<div class="flex-1 pb-4">' +
                        '<div class="flex items-center justify-between">' +
                            '<div class="text-white font-medium">' + escapeHtml(span.message) + '</div>' +
                            '<span class="text-xs px-2 py-1 rounded level-' + span.level.toLowerCase() + '">' + span.level + '</span>' +
                        '</div>' +
                        '<div class="flex items-center space-x-4 text-xs text-text-muted mt-1">' +
                            '<span>' + formatTime(span.timestamp) + '</span>' +
                            (span.duration ? '<span>' + span.duration + 'ms</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        document.getElementById('traceDetails').classList.remove('hidden');
    }

    /* --- AI Analytics rendering --- */

    function renderAIAnalytics(aiAnalytics) {
        if (!aiAnalytics) return;

        var summary = aiAnalytics.summary;
        var byProvider = aiAnalytics.byProvider;
        var byFunction = aiAnalytics.byFunction;

        document.getElementById('aiRequests').textContent = formatNumber(summary.totalRequests);
        document.getElementById('aiTokens').textContent = formatNumber(summary.totalTokens);
        document.getElementById('aiCost').textContent = '$' + summary.totalCost.toFixed(2);
        document.getElementById('aiLatency').textContent = summary.avgLatency + 'ms';

        // By provider
        var providerEl = document.getElementById('aiByProvider');
        if (!byProvider || byProvider.length === 0) {
            providerEl.innerHTML = '<div class="text-text-muted text-center py-8">No AI usage</div>';
        } else {
            providerEl.innerHTML = byProvider.map(function (p) {
                return '<div class="p-4 bg-surface-darker rounded-lg">' +
                    '<div class="flex items-center justify-between mb-3">' +
                        '<div class="flex items-center space-x-3">' +
                            '<div class="w-8 h-8 rounded-lg ' + (p.provider === 'anthropic' ? 'bg-purple-500/20' : 'bg-blue-500/20') + ' flex items-center justify-center">' +
                                '<i class="fas fa-brain ' + (p.provider === 'anthropic' ? 'text-purple-400' : 'text-blue-400') + '"></i>' +
                            '</div>' +
                            '<div class="text-white font-medium capitalize">' + p.provider + '</div>' +
                        '</div>' +
                        '<div class="text-green-400 font-medium">$' + p.cost.toFixed(2) + '</div>' +
                    '</div>' +
                    '<div class="grid grid-cols-3 gap-4 text-sm">' +
                        '<div><div class="text-text-muted">Requests</div><div class="text-white font-medium">' + p.requests + '</div></div>' +
                        '<div><div class="text-text-muted">Tokens</div><div class="text-white font-medium">' + formatNumber(p.tokens) + '</div></div>' +
                        '<div><div class="text-text-muted">Avg Latency</div><div class="text-white font-medium">' + p.avgLatency + 'ms</div></div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        // By function
        var functionEl = document.getElementById('aiByFunction');
        if (!byFunction || byFunction.length === 0) {
            functionEl.innerHTML = '<div class="text-text-muted text-center py-8">No AI usage</div>';
        } else {
            functionEl.innerHTML = byFunction.map(function (f) {
                return '<div class="flex items-center justify-between p-3 bg-surface-darker rounded-lg">' +
                    '<div>' +
                        '<div class="text-white font-medium">' + f.functionId + '</div>' +
                        '<div class="text-xs text-text-muted">' + f.requests + ' requests, ' + formatNumber(f.tokens) + ' tokens</div>' +
                    '</div>' +
                    '<div class="text-right">' +
                        '<div class="text-green-400">$' + f.cost.toFixed(2) + '</div>' +
                        '<div class="text-xs text-text-muted">' + f.avgLatency + 'ms</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }
    }

    /* --- Agent Behavior rendering --- */

    function renderAgentBehavior(agentBehavior) {
        if (!agentBehavior || !agentBehavior.summary) return;

        var summary = agentBehavior.summary;
        var bySource = agentBehavior.bySource;
        var recentRuns = agentBehavior.recentRuns;
        var recentEvents = agentBehavior.recentEvents;

        document.getElementById('agentTotalRuns').textContent = formatNumber(summary.totalRuns || 0);
        document.getElementById('agentTotalEvents').textContent = formatNumber(summary.totalEvents || 0);
        document.getElementById('agentTotalErrors').textContent = formatNumber(summary.totalErrors || 0);
        document.getElementById('agentAvgRunDuration').textContent = (summary.avgRunDurationMs || 0) + 'ms';

        var bySourceEl = document.getElementById('agentBySource');
        if (!bySource || bySource.length === 0) {
            bySourceEl.innerHTML = '<div class="text-text-muted text-center py-8">No agent source activity</div>';
        } else {
            var max = Math.max.apply(null, bySource.map(function (row) { return row.events; }).concat([1]));
            bySourceEl.innerHTML = bySource.map(function (row) {
                return '<div class="space-y-1">' +
                    '<div class="flex items-center justify-between text-xs">' +
                        '<span class="text-white">' + escapeHtml(row.source) + '</span>' +
                        '<span class="text-text-muted">' + row.events + ' events</span>' +
                    '</div>' +
                    '<div class="h-2 bg-surface-darker rounded-full overflow-hidden">' +
                        '<div class="' + (row.errorRate > 10 ? 'bg-red-500' : row.errorRate > 0 ? 'bg-amber-500' : 'bg-green-500') + ' h-full" style="width: ' + (row.events / max) * 100 + '%"></div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        var runsEl = document.getElementById('agentRunsTable');
        if (!recentRuns || recentRuns.length === 0) {
            runsEl.innerHTML = '<tr><td colspan="7" class="text-center text-text-muted py-8">No recent agent runs</td></tr>';
        } else {
            runsEl.innerHTML = recentRuns.map(function (run) {
                return '<tr class="hover:bg-white/5">' +
                    '<td class="px-4 py-3 text-xs font-mono text-brand-blue cursor-pointer hover:underline" onclick="openTrace(\'' + (run.traceId || '') + '\')">' + escapeHtml(run.traceId || '-') + '</td>' +
                    '<td class="px-4 py-3 text-sm text-white">' + escapeHtml(run.source || '-') + '</td>' +
                    '<td class="px-4 py-3 text-xs ' + (run.status === 'error' ? 'text-red-400' : run.status === 'completed' ? 'text-green-400' : 'text-amber-400') + '">' + escapeHtml(run.status || 'unknown') + '</td>' +
                    '<td class="px-4 py-3 text-sm text-white">' + (run.eventCount || 0) + '</td>' +
                    '<td class="px-4 py-3 text-sm ' + (run.errorCount > 0 ? 'text-red-400' : 'text-green-400') + '">' + (run.errorCount || 0) + '</td>' +
                    '<td class="px-4 py-3 text-sm text-white">' + (run.durationMs || 0) + 'ms</td>' +
                    '<td class="px-4 py-3 text-xs text-text-muted">' + (run.lastEventAt ? formatTime(run.lastEventAt) : '-') + '</td>' +
                '</tr>';
            }).join('');
        }

        var eventsEl = document.getElementById('agentRecentEvents');
        if (!recentEvents || recentEvents.length === 0) {
            eventsEl.innerHTML = '<div class="text-text-muted text-center py-8">No recent events</div>';
        } else {
            eventsEl.innerHTML = recentEvents.slice(0, 40).map(function (event) {
                return '<div class="p-3 bg-surface-darker rounded-lg border border-border-dark">' +
                    '<div class="flex items-center justify-between mb-1">' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="text-xs px-2 py-1 rounded level-' + String(event.level || 'INFO').toLowerCase() + '">' + escapeHtml(String(event.level || 'INFO').toUpperCase()) + '</span>' +
                            '<span class="text-xs text-text-muted">' + escapeHtml(event.source || 'system') + '</span>' +
                        '</div>' +
                        '<span class="text-xs text-text-muted">' + (event.timestamp ? formatTime(event.timestamp) : '-') + '</span>' +
                    '</div>' +
                    '<div class="text-sm text-white">' + escapeHtml(event.message || '') + '</div>' +
                    (event.traceId ? '<div class="text-xs text-brand-blue mt-1 cursor-pointer hover:underline" onclick="openTrace(\'' + event.traceId + '\')">Trace: ' + escapeHtml(event.traceId) + '</div>' : '') +
                '</div>';
            }).join('');
        }
    }

    /* --- Anomaly rendering --- */

    function renderAnomalies(anomalies) {
        var container = document.getElementById('activeAnomaliesList');
        var badge = document.getElementById('anomalyBadge');
        var banner = document.getElementById('activeAnomalyBanner');

        if (!anomalies || anomalies.length === 0) {
            container.innerHTML = '<div class="text-text-muted text-center py-12"><i class="fas fa-check-circle text-4xl mb-3 text-green-500/30"></i><p>No active anomalies detected.</p></div>';
            badge.classList.add('hidden');
            banner.classList.add('hidden');
            return;
        }

        badge.textContent = anomalies.length;
        badge.classList.remove('hidden');

        var critical = anomalies.filter(function (a) { return a.severity === 'critical'; });
        if (critical.length > 0) {
            banner.classList.remove('hidden');
            banner.innerHTML =
                '<div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">' +
                    '<div class="flex items-center space-x-4">' +
                        '<div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">' +
                            '<i class="fas fa-exclamation-triangle text-red-500"></i>' +
                        '</div>' +
                        '<div>' +
                            '<h3 class="text-red-400 font-bold">' + critical.length + ' Critical Anomalies Detected</h3>' +
                            '<p class="text-xs text-red-400/70">Proactive intervention required. Check Anomalies tab for details.</p>' +
                        '</div>' +
                    '</div>' +
                    '<button onclick="switchTab(\'anomalies\')" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">Investigate</button>' +
                '</div>';
        }

        container.innerHTML = anomalies.map(function (a) {
            return '<div class="p-4 bg-surface-darker rounded-xl border-l-4 ' + (a.severity === 'critical' ? 'border-red-500' : 'border-amber-500') + ' flex items-start justify-between">' +
                '<div class="flex-1">' +
                    '<div class="flex items-center gap-3 mb-2">' +
                        '<span class="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded ' + (a.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400') + '">' + a.severity + '</span>' +
                        '<span class="text-sm font-bold text-white">' + a.message + '</span>' +
                        '<span class="text-xs text-text-muted">' + formatTime(a.detectedAt) + '</span>' +
                    '</div>' +
                    '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">' +
                        '<div><span class="text-text-muted block">Metric</span><span class="text-white">' + a.metric + '</span></div>' +
                        '<div><span class="text-text-muted block">Actual</span><span class="text-white font-mono">' + a.actualValue.toFixed(2) + '</span></div>' +
                        '<div><span class="text-text-muted block">Expected</span><span class="text-white font-mono">' + a.expectedValue.toFixed(2) + '</span></div>' +
                        '<div><span class="text-text-muted block">Deviation</span><span class="' + (a.deviation > 0 ? 'text-red-400' : 'text-green-400') + ' font-bold">' + (a.deviation > 0 ? '+' : '') + (a.deviation * 100).toFixed(1) + '%</span></div>' +
                    '</div>' +
                '</div>' +
                '<div class="flex gap-2">' +
                    '<button onclick="acknowledgeAnomaly(\'' + a._id + '\')" class="p-2 text-text-muted hover:text-white" title="Acknowledge"><i class="fas fa-eye"></i></button>' +
                    '<button onclick="resolveAnomaly(\'' + a._id + '\')" class="p-2 text-green-400 hover:text-green-300" title="Resolve"><i class="fas fa-check"></i></button>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    function renderRules(rules) {
        var tbody = document.getElementById('anomalyRulesTable');
        tbody.innerHTML = rules.map(function (r) {
            return '<tr class="hover:bg-white/5 transition-colors">' +
                '<td class="px-4 py-4">' +
                    '<div class="text-sm font-medium text-white">' + r.name + '</div>' +
                    '<div class="text-[10px] text-text-muted uppercase">' + r.metric + '</div>' +
                '</td>' +
                '<td class="px-4 py-4 text-xs text-text-muted font-mono">' + r.type + '</td>' +
                '<td class="px-4 py-4 text-sm text-white">' + r.threshold + 'x</td>' +
                '<td class="px-4 py-4">' +
                    '<span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ' + (r.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400') + '">' + (r.enabled ? 'Active' : 'Disabled') + '</span>' +
                '</td>' +
                '<td class="px-4 py-4 text-right">' +
                    '<button onclick="editAnomalyRule(\'' + r._id + '\')" class="text-text-muted hover:text-white p-1"><i class="fas fa-edit"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function renderHistory(history) {
        var container = document.getElementById('anomalyHistoryList');
        var severityTrend = document.getElementById('severityTrend');

        if (!history || history.length === 0) {
            container.innerHTML = '<p class="text-xs text-text-muted italic">No recent anomalies</p>';
            return;
        }

        var counts = history.reduce(function (acc, a) {
            acc[a.severity] = (acc[a.severity] || 0) + 1;
            return acc;
        }, {});
        var total = history.length;

        severityTrend.innerHTML = ['critical', 'warning', 'info'].map(function (sev) {
            var count = counts[sev] || 0;
            var pct = (count / total) * 100;
            var color = sev === 'critical' ? 'bg-red-500' : sev === 'warning' ? 'bg-amber-500' : 'bg-blue-500';
            return '<div class="space-y-1">' +
                '<div class="flex justify-between text-[10px] uppercase font-bold">' +
                    '<span class="text-text-muted">' + sev + '</span>' +
                    '<span class="text-white">' + count + '</span>' +
                '</div>' +
                '<div class="h-1.5 bg-surface-darker rounded-full overflow-hidden">' +
                    '<div class="' + color + ' h-full" style="width: ' + pct + '%"></div>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = history.slice(0, 10).map(function (h) {
            return '<div class="p-2 bg-surface-darker rounded border-l-2 ' + (h.severity === 'critical' ? 'border-red-500' : 'border-amber-500') + ' text-[11px]">' +
                '<div class="flex justify-between mb-1">' +
                    '<span class="text-white font-bold">' + h.type + '</span>' +
                    '<span class="text-text-muted">' + formatTime(h.detectedAt).split(',')[1] + '</span>' +
                '</div>' +
                '<div class="text-text-muted truncate">' + h.message + '</div>' +
            '</div>';
        }).join('');
    }

    return {
        formatNumber: formatNumber,
        formatTime: formatTime,
        escapeHtml: escapeHtml,
        showToast: showToast,
        updateThemeIcon: updateThemeIcon,
        renderOverview: renderOverview,
        renderLogs: renderLogs,
        showLogDetail: showLogDetail,
        renderErrors: renderErrors,
        renderTrace: renderTrace,
        renderAIAnalytics: renderAIAnalytics,
        renderAgentBehavior: renderAgentBehavior,
        renderAnomalies: renderAnomalies,
        renderRules: renderRules,
        renderHistory: renderHistory
    };
})();
