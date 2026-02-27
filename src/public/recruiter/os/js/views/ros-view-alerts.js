// ============================================================================
// ROS-VIEW-ALERTS — Notification Alerts Center
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'alerts';
    const MESSAGES = ['alertsLoaded', 'alertMarkedRead', 'allAlertsMarkedRead'];

    const CATEGORIES = {
        matches:    { icon: 'person_search',   color: '#2563eb', label: 'Matches',    targetView: 'ai-match'  },
        pipeline:   { icon: 'view_column',     color: '#f59e0b', label: 'Pipeline',   targetView: 'pipeline'  },
        onboarding: { icon: 'task_alt',        color: '#059669', label: 'Onboarding', targetView: 'onboard'   },
        comms:      { icon: 'chat',            color: '#f97316', label: 'Comms',      targetView: 'messages'  },
        compliance: { icon: 'gavel',           color: '#0d9488', label: 'Compliance', targetView: 'comply'    },
        retention:  { icon: 'shield',          color: '#dc2626', label: 'Retention',  targetView: 'retention' },
    };

    // -- State --
    let allAlerts = [];
    let activeFilter = 'all';
    let expandedId = null;

    // -- Helpers --

    function formatTimestamp(ts) {
        if (!ts) return '';
        var d = new Date(ts);
        var now = new Date();
        var diff = now - d;
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return Math.floor(diff / 86400000) + 'd ago';
    }

    function updateUnreadBadge() {
        var badge = document.getElementById('alv-unread-badge');
        if (!badge) return;
        var count = allAlerts.filter(function (a) { return !a.read; }).length;
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
    }

    // -- Tabs --

    function renderTabs() {
        var container = document.getElementById('alv-tabs');
        if (!container) return;
        var tabs = ['all'].concat(Object.keys(CATEGORIES));
        container.innerHTML = tabs.map(function (t) {
            var isActive = t === activeFilter;
            var label = t === 'all' ? 'All' : CATEGORIES[t].label;
            var count = t === 'all'
                ? allAlerts.filter(function (a) { return !a.read; }).length
                : allAlerts.filter(function (a) { return a.category === t && !a.read; }).length;
            var countBadge = count > 0
                ? ' <span class="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black" style="' +
                  (isActive ? 'background:rgba(255,255,255,0.2)' : 'background:rgba(37,99,235,0.1);color:#2563eb') +
                  '">' + count + '</span>'
                : '';
            return '<button class="flex-none px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap ' +
                (isActive ? 'bg-lmdr-blue text-beige' : 'neu-x text-tan') +
                '" onclick="window._alvSetFilter(\'' + t + '\')">' +
                label + countBadge + '</button>';
        }).join('');
    }

    // -- Alert items --

    function renderAlertItem(alert) {
        var cat = CATEGORIES[alert.category] || CATEGORIES.matches;
        var isExpanded = expandedId === alert.id;
        var borderStyle = !alert.read ? 'border-left:4px solid #2563eb;padding-left:0.75rem' : '';

        var expandedHtml = '';
        if (isExpanded) {
            var markReadBtn = !alert.read
                ? '<button class="neu-x px-3 py-1.5 rounded-xl text-[11px] font-bold text-lmdr-dark" onclick="window._alvMarkRead(\'' + alert.id + '\')">Mark read</button>'
                : '';
            expandedHtml =
                '<div class="mt-3 pt-3" style="border-top:1px solid rgba(200,184,150,0.2)">' +
                    '<p class="text-[12px] text-lmdr-dark mb-3">' + (alert.detail || alert.preview) + '</p>' +
                    '<div class="flex gap-2 flex-wrap">' +
                        '<button class="neu-x px-3 py-1.5 rounded-xl text-[11px] font-bold text-lmdr-dark flex items-center gap-1" onclick="ROS.views.showView(\'' + cat.targetView + '\')">' +
                            '<span class="material-symbols-outlined text-lmdr-blue text-[13px]">open_in_new</span>View ' + cat.label +
                        '</button>' +
                        markReadBtn +
                    '</div>' +
                '</div>';
        }

        return '<div class="neu-s rounded-xl p-4 cursor-pointer" style="' + borderStyle + '" id="alv-item-' + alert.id + '">' +
            '<div class="flex items-start gap-3">' +
                '<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:' + cat.color + '18">' +
                    '<span class="material-symbols-outlined text-[15px]" style="color:' + cat.color + '">' + cat.icon + '</span>' +
                '</div>' +
                '<div class="flex-1 min-w-0">' +
                    '<p class="text-[13px] font-bold text-lmdr-dark leading-tight">' + alert.title + '</p>' +
                    '<p class="text-[11px] mt-0.5 truncate" style="color:rgba(200,184,150,0.85)">' + alert.preview + '</p>' +
                    '<p class="text-[9px] mt-1 font-bold uppercase tracking-wider" style="color:rgba(200,184,150,0.6)">' + formatTimestamp(alert.timestamp) + '</p>' +
                '</div>' +
                '<button class="w-6 h-6 flex items-center justify-center flex-shrink-0" onclick="window._alvToggleExpand(\'' + alert.id + '\')">' +
                    '<span class="material-symbols-outlined text-tan text-[18px]">' + (isExpanded ? 'expand_less' : 'expand_more') + '</span>' +
                '</button>' +
            '</div>' +
            expandedHtml +
        '</div>';
    }

    // -- List --

    function renderList() {
        var container = document.getElementById('alv-list');
        if (!container) return;
        var filtered = activeFilter === 'all'
            ? allAlerts
            : allAlerts.filter(function (a) { return a.category === activeFilter; });
        if (filtered.length === 0) {
            var catLabel = activeFilter === 'all' ? '' : (CATEGORIES[activeFilter] ? CATEGORIES[activeFilter].label + ' ' : '');
            container.innerHTML =
                '<div class="neu-ins rounded-2xl p-8 text-center">' +
                    '<span class="material-symbols-outlined text-tan text-[32px] mb-2">notifications_none</span>' +
                    '<p class="text-[13px] font-bold text-lmdr-dark">No ' + catLabel + 'alerts</p>' +
                    '<p class="text-[11px] mt-1" style="color:rgba(200,184,150,0.8)">You\'re all caught up!</p>' +
                '</div>';
            return;
        }
        container.innerHTML = filtered.map(function (a) { return renderAlertItem(a); }).join('');
    }

    // -- Skeleton --

    function renderSkeleton() {
        var container = document.getElementById('alv-list');
        if (!container) return;
        var rows = [];
        for (var i = 0; i < 4; i++) {
            rows.push(
                '<div class="neu-s rounded-xl p-4 alv-skel">' +
                    '<div class="flex items-center gap-3">' +
                        '<div class="w-8 h-8 rounded-lg" style="background:rgba(200,184,150,0.15)"></div>' +
                        '<div class="flex-1">' +
                            '<div class="h-3 rounded mb-2" style="background:rgba(200,184,150,0.15);width:60%"></div>' +
                            '<div class="h-2 rounded" style="background:rgba(200,184,150,0.1);width:85%"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );
        }
        container.innerHTML = rows.join('');
    }

    // -- render --

    function render() {
        return '<style>' +
            '@keyframes alv-pulse{0%,100%{opacity:1}50%{opacity:0.5}}' +
            '.alv-skel{animation:alv-pulse 1.5s ease-in-out infinite}' +
        '</style>' +
        '<div id="alv-root">' +
            '<div class="flex items-center gap-3 mb-4">' +
                '<button id="alv-back" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">' +
                    '<span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>' +
                '</button>' +
                '<div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#6366f1,#7c3aed)">' +
                    '<span class="material-symbols-outlined text-beige text-[16px]">notifications</span>' +
                '</div>' +
                '<h2 class="text-lg font-bold text-lmdr-dark">Alerts</h2>' +
                '<div id="alv-unread-badge" class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold hidden" style="background:rgba(37,99,235,0.1);color:#2563eb">0</div>' +
                '<button id="alv-mark-all" class="ml-auto text-[12px] font-bold" style="color:#2563eb">Mark all read</button>' +
            '</div>' +
            '<div class="flex gap-2 overflow-x-auto pb-2 mb-4" id="alv-tabs" style="-webkit-overflow-scrolling:touch;scrollbar-width:none"></div>' +
            '<div id="alv-list" class="flex flex-col gap-2"></div>' +
            '<div class="mt-4 text-center">' +
                '<button id="alv-manage-prefs" class="text-[12px] font-bold" style="color:#2563eb">Manage Preferences &rarr;</button>' +
            '</div>' +
        '</div>';
    }

    // -- Lifecycle --

    function onMount() {
        var back = document.getElementById('alv-back');
        if (back) back.addEventListener('click', function () { ROS.views.showView('home'); });

        var markAll = document.getElementById('alv-mark-all');
        if (markAll) markAll.addEventListener('click', function () {
            ROS.bridge.sendToVelo('markAllAlertsRead', {});
            allAlerts = allAlerts.map(function (a) { return Object.assign({}, a, { read: true }); });
            updateUnreadBadge();
            renderTabs();
            renderList();
        });

        var prefs = document.getElementById('alv-manage-prefs');
        if (prefs) prefs.addEventListener('click', function () {
            if (ROS.shell && ROS.shell.openSettings) ROS.shell.openSettings();
        });

        window._alvSetFilter = function (f) {
            activeFilter = f;
            renderTabs();
            renderList();
        };

        window._alvToggleExpand = function (id) {
            expandedId = expandedId === id ? null : id;
            var alert = allAlerts.find(function (a) { return a.id === id; });
            if (alert && !alert.read) {
                alert.read = true;
                ROS.bridge.sendToVelo('markAlertRead', { alertId: id });
                updateUnreadBadge();
            }
            renderTabs();
            renderList();
        };

        window._alvMarkRead = function (id) {
            var alert = allAlerts.find(function (a) { return a.id === id; });
            if (alert) {
                alert.read = true;
                ROS.bridge.sendToVelo('markAlertRead', { alertId: id });
                updateUnreadBadge();
                renderTabs();
                renderList();
            }
        };

        renderSkeleton();
        ROS.bridge.sendToVelo('getAlerts', {});
    }

    function onUnmount() {
        allAlerts = [];
        activeFilter = 'all';
        expandedId = null;
        delete window._alvSetFilter;
        delete window._alvToggleExpand;
        delete window._alvMarkRead;
    }

    function onMessage(type, data) {
        switch (type) {
            case 'alertsLoaded':
                allAlerts = data.alerts || [];
                updateUnreadBadge();
                renderTabs();
                renderList();
                break;
            case 'alertMarkedRead': {
                var a = allAlerts.find(function (x) { return x.id === data.alertId; });
                if (a) a.read = true;
                updateUnreadBadge();
                renderTabs();
                renderList();
                break;
            }
            case 'allAlertsMarkedRead':
                allAlerts = allAlerts.map(function (a) { return Object.assign({}, a, { read: true }); });
                updateUnreadBadge();
                renderTabs();
                renderList();
                break;
        }
    }

    // -- Register --

    ROS.views.registerView(VIEW_ID, {
        render: render,
        onMount: onMount,
        onUnmount: onUnmount,
        onMessage: onMessage,
        messages: MESSAGES
    });

})();
