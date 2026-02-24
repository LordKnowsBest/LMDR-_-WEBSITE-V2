/* =========================================
   ADMIN OBSERVABILITY — RAG Intelligence Module
   Depends on: AdminObservabilityConfig, AdminObservabilityBridge, AdminObservabilityRender
   Handles RAG Intelligence tab — metrics, freshness, admin actions, debug
   ========================================= */
var AdminObservabilityRAG = (function () {
    'use strict';

    var B = AdminObservabilityBridge;
    var R = AdminObservabilityRender;

    var state = {
        ragAnalytics: null,
        freshness: null,
        loaded: false
    };

    /* --- Rendering --- */

    function renderRagAnalytics(data) {
        if (!data) return;
        state.ragAnalytics = data;

        var s = data.summary || {};
        _setText('ragRetrievalVolume', _fmtNum(s.totalRetrievals || 0));
        _setText('ragAvgLatency', (s.avgLatencyMs || 0) + 'ms');
        _setText('ragP95Latency', 'P95: ' + (s.p95LatencyMs || 0) + 'ms');
        _setText('ragCitationRate', (s.citationRate || 0) + '%');
        _setText('ragContinuationRate', (s.continuationRate || 0) + '%');
        _setText('ragIntentAccuracy', (s.intentAccuracy || 0) + '%');

        renderVolumeByNamespace(data.volumeByNamespace || {});
        renderVolumeByRole(data.volumeByRole || {});
        renderRecentFailures(data.recentFailures || []);
    }

    function renderFreshness(data) {
        if (!data) return;
        state.freshness = data;

        var container = document.getElementById('ragFreshnessDistribution');
        var namespaces = Object.keys(data);
        if (namespaces.length === 0) {
            container.innerHTML = '<div class="text-text-muted text-center py-8">No documents indexed</div>';
            return;
        }

        container.innerHTML = namespaces.map(function (ns) {
            var d = data[ns];
            return '<div class="space-y-1">' +
                '<div class="flex items-center justify-between text-xs">' +
                    '<span class="text-white font-medium">' + _esc(ns) + '</span>' +
                    '<span class="text-text-muted">' + d.total + ' docs</span>' +
                '</div>' +
                '<div class="flex h-3 rounded-full overflow-hidden bg-surface-darker">' +
                    (d.freshPct > 0 ? '<div class="bg-green-500" style="width: ' + d.freshPct + '%" title="Fresh: ' + d.fresh + '"></div>' : '') +
                    (d.stalePct > 0 ? '<div class="bg-amber-500" style="width: ' + d.stalePct + '%" title="Stale: ' + d.stale + '"></div>' : '') +
                    (d.expiredPct > 0 ? '<div class="bg-red-500" style="width: ' + d.expiredPct + '%" title="Expired: ' + d.expired + '"></div>' : '') +
                '</div>' +
                '<div class="flex justify-between text-[10px] text-text-muted">' +
                    '<span class="text-green-400">' + d.freshPct + '% fresh</span>' +
                    '<span class="text-amber-400">' + d.stalePct + '% stale</span>' +
                    '<span class="text-red-400">' + d.expiredPct + '% expired</span>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    function renderVolumeByNamespace(volumeMap) {
        var container = document.getElementById('ragVolumeByNamespace');
        var entries = Object.entries(volumeMap).sort(function (a, b) { return b[1] - a[1]; });

        if (entries.length === 0) {
            container.innerHTML = '<div class="text-text-muted text-center py-8">No retrieval data</div>';
            return;
        }

        var max = Math.max.apply(null, entries.map(function (e) { return e[1]; }).concat([1]));
        container.innerHTML = entries.map(function (entry) {
            var ns = entry[0];
            var count = entry[1];
            var pct = (count / max) * 100;
            return '<div class="space-y-1">' +
                '<div class="flex items-center justify-between text-xs">' +
                    '<span class="text-white">' + _esc(ns) + '</span>' +
                    '<span class="text-text-muted">' + count + '</span>' +
                '</div>' +
                '<div class="h-2 bg-surface-darker rounded-full overflow-hidden">' +
                    '<div class="bg-brand-teal h-full rounded-full" style="width: ' + pct + '%"></div>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    function renderVolumeByRole(volumeMap) {
        var container = document.getElementById('ragVolumeByRole');
        var entries = Object.entries(volumeMap).sort(function (a, b) { return b[1] - a[1]; });

        if (entries.length === 0) {
            container.innerHTML = '<div class="text-text-muted text-center py-8">No retrieval data</div>';
            return;
        }

        var roleColors = { driver: 'bg-blue-500', recruiter: 'bg-purple-500', admin: 'bg-amber-500', carrier: 'bg-green-500', b2b: 'bg-red-500' };
        var max = Math.max.apply(null, entries.map(function (e) { return e[1]; }).concat([1]));
        container.innerHTML = entries.map(function (entry) {
            var role = entry[0];
            var count = entry[1];
            var pct = (count / max) * 100;
            var color = roleColors[role] || 'bg-brand-blue';
            return '<div class="space-y-1">' +
                '<div class="flex items-center justify-between text-xs">' +
                    '<span class="text-white capitalize">' + _esc(role) + '</span>' +
                    '<span class="text-text-muted">' + count + '</span>' +
                '</div>' +
                '<div class="h-2 bg-surface-darker rounded-full overflow-hidden">' +
                    '<div class="' + color + ' h-full rounded-full" style="width: ' + pct + '%"></div>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    function renderRecentFailures(failures) {
        var container = document.getElementById('ragRecentFailures');
        if (!failures || failures.length === 0) {
            container.innerHTML = '<div class="text-text-muted text-center py-8">No recent failures</div>';
            return;
        }

        container.innerHTML = failures.map(function (f) {
            var reason = f.chunks_injected === 0 ? 'Zero chunks' : 'High latency (' + f.rag_latency_ms + 'ms)';
            return '<div class="p-3 bg-surface-darker rounded-lg border-l-4 border-red-500 flex items-start justify-between">' +
                '<div>' +
                    '<div class="flex items-center gap-2 mb-1">' +
                        '<span class="text-xs font-bold text-red-400">' + _esc(reason) + '</span>' +
                        '<span class="text-xs text-text-muted">' + _esc(f.role || '') + ' / ' + _esc(f.intent_class || '') + '</span>' +
                    '</div>' +
                    '<div class="text-xs text-text-muted font-mono">' + _esc(f.turn_id || '') + '</div>' +
                '</div>' +
                '<span class="text-xs text-text-muted whitespace-nowrap">' + (f.created_at ? R.formatTime(f.created_at) : '--') + '</span>' +
            '</div>';
        }).join('');
    }

    function renderDebugResults(data) {
        var container = document.getElementById('ragDebugResults');
        container.classList.remove('hidden');

        if (!data || !data.chunks || data.chunks.length === 0) {
            container.innerHTML = '<span class="text-amber-400">No chunks retrieved.</span> Latency: ' + (data && data.latencyMs || 0) + 'ms';
            return;
        }

        container.innerHTML =
            '<div class="text-green-400 mb-2">' + data.chunks.length + ' chunks retrieved in ' + (data.latencyMs || 0) + 'ms</div>' +
            data.chunks.map(function (chunk, i) {
                return '<div class="mb-3 p-2 bg-surface-dark rounded border border-border-dark">' +
                    '<div class="flex justify-between text-xs text-text-muted mb-1">' +
                        '<span>#' + (i + 1) + ' — ' + _esc(chunk.namespace || '') + '</span>' +
                        '<span>score: ' + (chunk.score ? chunk.score.toFixed(4) : '--') + '</span>' +
                    '</div>' +
                    '<div class="text-white text-xs whitespace-pre-wrap">' + _esc((chunk.text || '').substring(0, 300)) + (chunk.text && chunk.text.length > 300 ? '...' : '') + '</div>' +
                '</div>';
            }).join('');
    }

    /* --- Bridge commands --- */

    function requestRagAnalytics() {
        B.sendToVelo({ action: 'getRagAnalytics' });
    }

    function requestFreshness() {
        B.sendToVelo({ action: 'getRagFreshness' });
    }

    function requestForceReingestNamespace(namespace) {
        if (!namespace) { R.showToast('Select a namespace', 'error'); return; }
        B.sendToVelo({ action: 'forceReingestNamespace', namespace: namespace });
    }

    function requestReingestCarrier(dotNumber) {
        if (!dotNumber) { R.showToast('Enter a DOT number', 'error'); return; }
        B.sendToVelo({ action: 'reingestCarrier', dotNumber: dotNumber });
    }

    function requestDebugRetrieval(query, role) {
        if (!query) { R.showToast('Enter a test query', 'error'); return; }
        B.sendToVelo({ action: 'debugRetrieval', query: query, role: role || 'admin' });
    }

    /* --- Event wiring --- */

    function initEventListeners() {
        document.getElementById('refreshRag').addEventListener('click', function () {
            loadRagData();
        });

        document.getElementById('btnReingestNamespace').addEventListener('click', function () {
            var ns = document.getElementById('ragReingestNamespace').value;
            requestForceReingestNamespace(ns);
        });

        document.getElementById('btnReingestCarrier').addEventListener('click', function () {
            var dot = document.getElementById('ragReingestDot').value.trim();
            requestReingestCarrier(dot);
        });

        document.getElementById('btnDebugRetrieval').addEventListener('click', function () {
            var query = document.getElementById('ragDebugQuery').value.trim();
            var role = document.getElementById('ragDebugRole').value;
            requestDebugRetrieval(query, role);
        });
    }

    function loadRagData() {
        requestRagAnalytics();
        requestFreshness();
    }

    /* --- Message handlers (registered by logic module) --- */

    function getMessageHandlers() {
        return {
            'ragAnalyticsLoaded': function (data) { renderRagAnalytics(data.payload); },
            'ragFreshnessLoaded': function (data) { renderFreshness(data.payload); },
            'debugRetrievalResult': function (data) { renderDebugResults(data.payload); },
            'reingestSuccess': function (data) {
                R.showToast(data.message || 'Re-ingestion complete', 'success');
                requestFreshness();
            }
        };
    }

    /* --- Utilities --- */

    function _setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function _esc(text) {
        return R.escapeHtml(text);
    }

    function _fmtNum(n) {
        return R.formatNumber(n);
    }

    /* --- Public API --- */

    function init() {
        initEventListeners();
    }

    return {
        init: init,
        loadRagData: loadRagData,
        getMessageHandlers: getMessageHandlers,
        renderRagAnalytics: renderRagAnalytics,
        renderFreshness: renderFreshness,
        renderDebugResults: renderDebugResults
    };
})();
