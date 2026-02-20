/* =========================================
   ADMIN MODERATION — Render Module
   Depends on: ModerationConfig
   DOM rendering functions
   ========================================= */
var ModerationRender = (function () {
  'use strict';

  function renderList(reports, filter, activeReportId) {
    var container = document.getElementById('report-list');
    if (reports.length === 0) {
      container.innerHTML = '<div class="text-center py-10 text-text-muted text-xs">No ' + filter + ' reports.</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < reports.length; i++) {
      var report = reports[i];
      var isActive = report._id === activeReportId;
      var severityColor = ModerationConfig.getSeverityColor(report.reason);
      var activeClass = isActive
        ? 'active'
        : 'hover:bg-surface-dark border-l-4 border-transparent';

      html +=
        '<div onclick="ModerationLogic.selectReport(\'' + report._id + '\')" ' +
          'class="report-item p-3 rounded-lg cursor-pointer transition-colors ' + activeClass + '">' +
          '<div class="flex justify-between items-start mb-1">' +
            '<span class="text-xs font-bold uppercase ' + severityColor + '">' + report.reason + '</span>' +
            '<span class="text-[10px] text-text-muted">' + new Date(report.createdAt).toLocaleDateString() + '</span>' +
          '</div>' +
          '<div class="text-sm font-medium truncate text-white mb-1">Report on ' + report.postId + '</div>' +
          '<div class="text-xs text-text-muted truncate">' + (report.details || 'No details provided') + '</div>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  function showDetail(report) {
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('detail-view').classList.remove('hidden');

    document.getElementById('detail-reason').textContent = report.reason;
    document.getElementById('detail-date').textContent = new Date(report.createdAt).toLocaleString();
    document.getElementById('detail-reporter').textContent = report.reporterId || 'Anonymous';

    var content = report.postContent || '*Content not available or deleted*';
    document.getElementById('detail-content').innerHTML = marked.parse(content);
    document.getElementById('mod-notes').value = '';
  }

  function hideDetail() {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
  }

  function showDetailPanel() {
    document.getElementById('sidebar-panel').classList.add('hidden');
    document.getElementById('detail-panel').classList.remove('hidden');
    document.getElementById('detail-panel').classList.add('flex');
  }

  function showSidebarPanel() {
    document.getElementById('detail-panel').classList.add('hidden');
    document.getElementById('detail-panel').classList.remove('flex');
    document.getElementById('sidebar-panel').classList.remove('hidden');
  }

  function updateFilterTabs(filter) {
    var activeClass = 'flex-1 py-1.5 text-xs font-medium rounded bg-primary text-white';
    var inactiveClass = 'flex-1 py-1.5 text-xs font-medium rounded text-text-muted hover:text-white';

    document.getElementById('tab-pending').className = filter === 'pending' ? activeClass : inactiveClass;
    document.getElementById('tab-resolved').className = filter === 'resolved' ? activeClass : inactiveClass;
  }

  return {
    renderList: renderList,
    showDetail: showDetail,
    hideDetail: hideDetail,
    showDetailPanel: showDetailPanel,
    showSidebarPanel: showSidebarPanel,
    updateFilterTabs: updateFilterTabs
  };
})();
