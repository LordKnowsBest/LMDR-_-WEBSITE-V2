/* =========================================
   ADMIN MODERATION — Logic Module
   Depends on: ModerationConfig, ModerationBridge, ModerationRender
   State management, event handlers, message routing
   ========================================= */
var ModerationLogic = (function () {
  'use strict';

  var state = {
    filter: 'pending',
    reports: [],
    activeReportId: null
  };

  function init() {
    initTheme();
    setupMessageHandlers();
    ModerationBridge.sendReady();
    refreshQueue();
  }

  function setupMessageHandlers() {
    ModerationBridge.listen({
      queueData: function (payload) {
        state.reports = (payload && payload.items) || [];
        ModerationRender.renderList(state.reports, state.filter, state.activeReportId);
      },
      actionSuccess: function (payload) {
        state.reports = state.reports.filter(function (r) {
          return r._id !== payload.reportId;
        });
        if (state.activeReportId === payload.reportId) {
          closeDetail();
        }
        ModerationRender.renderList(state.reports, state.filter, state.activeReportId);
      }
    });
  }

  function setFilter(filter) {
    state.filter = filter;
    ModerationRender.updateFilterTabs(filter);
    ModerationBridge.requestQueue(filter);
  }

  function refreshQueue() {
    ModerationBridge.requestQueue(state.filter);
  }

  function selectReport(id) {
    state.activeReportId = id;
    ModerationRender.renderList(state.reports, state.filter, state.activeReportId);

    var report = null;
    for (var i = 0; i < state.reports.length; i++) {
      if (state.reports[i]._id === id) {
        report = state.reports[i];
        break;
      }
    }
    if (!report) return;

    ModerationRender.showDetail(report);

    if (window.innerWidth < 768) {
      ModerationRender.showDetailPanel();
    }
  }

  function closeDetail() {
    state.activeReportId = null;
    ModerationRender.hideDetail();
    ModerationRender.renderList(state.reports, state.filter, state.activeReportId);

    if (window.innerWidth < 768) {
      backToList();
    }
  }

  function backToList() {
    ModerationRender.showSidebarPanel();
    state.activeReportId = null;
    ModerationRender.renderList(state.reports, state.filter, state.activeReportId);
  }

  function takeAction(action) {
    var notes = document.getElementById('mod-notes').value;
    if (!state.activeReportId) return;
    ModerationBridge.moderateReport(state.activeReportId, action, notes);
  }

  function openExternalLink() {
    // TODO: Navigate to actual thread
  }

  /* --- Theme --- */
  function initTheme() {
    var saved = localStorage.getItem(ModerationConfig.THEME_KEY);
    var theme = saved || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem(
      ModerationConfig.THEME_KEY,
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
  }

  return {
    init: init,
    setFilter: setFilter,
    refreshQueue: refreshQueue,
    selectReport: selectReport,
    closeDetail: closeDetail,
    backToList: backToList,
    takeAction: takeAction,
    openExternalLink: openExternalLink,
    toggleTheme: toggleTheme
  };
})();
