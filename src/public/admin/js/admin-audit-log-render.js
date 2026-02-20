/* =========================================
   ADMIN AUDIT LOG — Render Module
   Depends on: AuditLogConfig
   DOM rendering functions
   ========================================= */
var AuditLogRender = (function () {
  'use strict';

  var Config = AuditLogConfig;

  function renderContent(state) {
    if (state.isMobile) {
      renderMobileEntries(state);
    } else {
      renderDesktopTable(state);
    }
  }

  function renderMobileEntries(state) {
    var container = document.getElementById('mobileAuditEntries');
    document.getElementById('mobileResultCount').textContent = state.totalCount;

    if (state.entries.length === 0) {
      container.innerHTML =
        '<div class="text-center py-12">' +
          '<span class="material-symbols-outlined text-4xl text-text-muted mb-3 block">history</span>' +
          '<p class="text-text-muted">No audit entries found</p>' +
        '</div>';
      return;
    }

    container.innerHTML = state.entries.map(function (entry) {
      var categoryClass = 'category-' + (entry.category || 'other');
      var dotColor = Config.getCategoryDotColor(entry.category);
      var targetId = entry.targetId ? entry.targetId.substring(0, 8) + '...' : 'N/A';

      return (
        '<div class="audit-entry" onclick="AuditLogLogic.viewEntry(\'' + entry._id + '\')">' +
          '<div class="flex items-start gap-3">' +
            '<div class="timeline-dot ' + dotColor + ' mt-1"></div>' +
            '<div class="flex-1 min-w-0">' +
              '<div class="flex items-center gap-2 mb-1">' +
                '<span class="text-sm font-semibold">' + (entry.actionLabel || entry.action) + '</span>' +
                '<span class="px-1.5 py-0.5 rounded text-[10px] font-medium ' + categoryClass + '">' + (entry.category || 'other') + '</span>' +
              '</div>' +
              '<div class="text-xs text-text-muted mb-2">' + entry.targetType + ': ' + targetId + '</div>' +
              '<div class="flex items-center justify-between text-xs">' +
                '<span class="text-text-muted">' + (entry.adminEmail || 'System') + '</span>' +
                '<span class="text-text-muted">' + (entry.relativeTime || Config.formatTime(entry.timestamp)) + '</span>' +
              '</div>' +
            '</div>' +
            '<span class="material-symbols-outlined text-text-muted text-[18px]">chevron_right</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderDesktopTable(state) {
    var tbody = document.getElementById('auditTableBody');

    if (state.entries.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="px-4 py-12 text-center">' +
          '<span class="material-symbols-outlined text-4xl text-text-muted mb-3 block">history</span>' +
          '<p class="text-text-muted">No audit entries found</p>' +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = state.entries.map(function (entry) {
      var categoryClass = 'category-' + (entry.category || 'other');
      var targetId = entry.targetId ? entry.targetId.substring(0, 12) + '...' : 'N/A';

      return (
        '<tr class="hover:bg-surface-dark/50 transition-colors">' +
          '<td class="px-4 py-3">' +
            '<div class="text-sm">' + Config.formatDateTime(entry.timestamp) + '</div>' +
            '<div class="text-xs text-text-muted">' + (entry.relativeTime || '') + '</div>' +
          '</td>' +
          '<td class="px-4 py-3">' +
            '<div class="flex items-center gap-2">' +
              '<span class="px-2 py-1 rounded text-xs font-medium ' + categoryClass + '">' + (entry.actionLabel || entry.action) + '</span>' +
            '</div>' +
          '</td>' +
          '<td class="px-4 py-3">' +
            '<div class="text-sm capitalize">' + (entry.targetType || 'N/A') + '</div>' +
            '<div class="text-xs text-text-muted font-mono">' + targetId + '</div>' +
          '</td>' +
          '<td class="px-4 py-3"><div class="text-sm">' + (entry.adminEmail || 'System') + '</div></td>' +
          '<td class="px-4 py-3"><div class="text-xs text-text-muted max-w-[200px] truncate">' + Config.formatDetails(entry.details) + '</div></td>' +
          '<td class="px-4 py-3 text-right">' +
            '<button onclick="AuditLogLogic.viewEntry(\'' + entry._id + '\')" class="touch-target flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-dark transition-colors ml-auto">' +
              '<span class="material-symbols-outlined text-[18px]">visibility</span>' +
            '</button>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function updateStats(stats) {
    document.getElementById('statTotal').textContent = stats.total ? stats.total.toLocaleString() : '0';
    document.getElementById('statToday').textContent = stats.today ? stats.today.toLocaleString() : '0';
    document.getElementById('statWeek').textContent = stats.thisWeek ? stats.thisWeek.toLocaleString() : '0';
    document.getElementById('statMonth').textContent = stats.thisMonth ? stats.thisMonth.toLocaleString() : '0';
    document.getElementById('statDailyAvg').textContent = '~' + (stats.dailyAverage || 0) + '/day';
  }

  function updatePagination(state) {
    var from = state.totalCount === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1;
    var to = Math.min(state.currentPage * state.pageSize, state.totalCount);
    var totalPages = Math.ceil(state.totalCount / state.pageSize);

    document.getElementById('paginationFrom').textContent = from;
    document.getElementById('paginationTo').textContent = to;
    document.getElementById('paginationTotal').textContent = state.totalCount;
    document.getElementById('prevPageBtn').disabled = state.currentPage <= 1;
    document.getElementById('nextPageBtn').disabled = state.currentPage >= totalPages;

    var loadMoreBtn = document.getElementById('loadMoreBtn');
    if (state.currentPage < totalPages) {
      loadMoreBtn.classList.remove('hidden');
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  function showEntryDetail(entry) {
    var modal = document.getElementById('entryDetailModal');
    var content = document.getElementById('entryDetailContent');
    var categoryClass = 'category-' + (entry.category || 'other');
    var dotColor = Config.getCategoryDotColor(entry.category);

    var targetDetailsHtml = '';
    if (entry.targetDetails && !entry.targetDetails.error) {
      targetDetailsHtml =
        '<div class="mt-3 pt-3 border-t border-border-dark text-sm">' +
          '<span class="text-text-muted block text-xs mb-1">Target Name</span>' +
          '<span class="font-medium">' + Config.getTargetName(entry.targetDetails, entry.targetType) + '</span>' +
        '</div>';
    }

    var detailsHtml = '';
    if (entry.details && Object.keys(entry.details).length > 0) {
      var detailRows = Object.entries(entry.details).map(function (kv) {
        return '<div class="flex justify-between">' +
          '<span class="text-text-muted capitalize">' + kv[0].replace(/_/g, ' ') + '</span>' +
          '<span class="font-medium">' + Config.formatDetailValue(kv[1]) + '</span>' +
        '</div>';
      }).join('');

      detailsHtml =
        '<div class="bg-surface-dark rounded-xl p-4">' +
          '<h4 class="text-sm font-semibold mb-3 flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-[18px]">info</span>Details</h4>' +
          '<div class="space-y-2 text-sm">' + detailRows + '</div>' +
        '</div>';
    }

    var relatedHtml = '';
    if (entry.relatedEntries && entry.relatedEntries.length > 0) {
      var relatedRows = entry.relatedEntries.map(function (r) {
        return '<div class="flex items-center justify-between text-sm py-2 border-b border-border-dark last:border-0">' +
          '<span>' + r.action + '</span>' +
          '<span class="text-xs text-text-muted">' + Config.formatTime(r.timestamp) + '</span>' +
        '</div>';
      }).join('');

      relatedHtml =
        '<div class="bg-surface-dark rounded-xl p-4">' +
          '<h4 class="text-sm font-semibold mb-3 flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-[18px]">history</span>Related Actions (' + entry.relatedEntries.length + ')</h4>' +
          '<div class="space-y-2 max-h-48 overflow-y-auto">' + relatedRows + '</div>' +
        '</div>';
    }

    content.innerHTML =
      '<div class="sticky top-0 z-10 bg-surface-darker border-b border-border-dark px-4 md:px-6 py-4 flex items-center justify-between">' +
        '<h2 class="text-lg font-bold">Audit Entry Detail</h2>' +
        '<button onclick="AuditLogLogic.closeEntryModal()" class="touch-target flex items-center justify-center w-10 h-10 rounded-lg hover:bg-surface-dark transition-colors">' +
          '<span class="material-symbols-outlined">close</span></button>' +
      '</div>' +
      '<div class="px-4 md:px-6 py-4 space-y-4">' +
        '<div class="bg-surface-dark rounded-xl p-4">' +
          '<div class="flex items-center gap-3 mb-3">' +
            '<div class="w-10 h-10 ' + dotColor.replace('-400', '-500/20') + ' rounded-lg flex items-center justify-center">' +
              '<span class="material-symbols-outlined ' + dotColor.replace('bg-', 'text-') + '">' + Config.getCategoryIcon(entry.category) + '</span>' +
            '</div>' +
            '<div>' +
              '<div class="font-semibold">' + (entry.actionLabel || entry.action) + '</div>' +
              '<span class="px-2 py-0.5 rounded text-xs font-medium ' + categoryClass + '">' + (entry.category || 'other') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="text-sm text-text-muted">' + Config.formatDateTime(entry.timestamp) + ' (' + Config.formatTime(entry.timestamp) + ')</div>' +
        '</div>' +
        '<div class="bg-surface-dark rounded-xl p-4">' +
          '<h4 class="text-sm font-semibold mb-3 flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-[18px]">admin_panel_settings</span>Admin</h4>' +
          '<div class="grid grid-cols-2 gap-3 text-sm">' +
            '<div><span class="text-text-muted block text-xs mb-1">Email</span><span class="font-medium">' + (entry.adminEmail || 'System') + '</span></div>' +
            '<div><span class="text-text-muted block text-xs mb-1">Admin ID</span><span class="font-mono text-xs">' + (entry.adminId || 'N/A') + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="bg-surface-dark rounded-xl p-4">' +
          '<h4 class="text-sm font-semibold mb-3 flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-[18px]">target</span>Target</h4>' +
          '<div class="grid grid-cols-2 gap-3 text-sm">' +
            '<div><span class="text-text-muted block text-xs mb-1">Type</span><span class="font-medium capitalize">' + (entry.targetType || 'N/A') + '</span></div>' +
            '<div><span class="text-text-muted block text-xs mb-1">ID</span><span class="font-mono text-xs break-all">' + (entry.targetId || 'N/A') + '</span></div>' +
          '</div>' +
          targetDetailsHtml +
        '</div>' +
        detailsHtml +
        relatedHtml +
      '</div>';

    modal.classList.remove('hidden');
  }

  function renderReportTemplates(templates) {
    var grid = document.getElementById('quickReportsGrid');
    var select = document.getElementById('reportTypeSelect');

    grid.innerHTML = templates.map(function (t) {
      return (
        '<div class="bg-surface-dark border border-border-dark rounded-xl p-5 hover:border-primary transition-all group">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<div class="w-10 h-10 rounded-lg bg-surface-darker flex items-center justify-center">' +
              '<span class="material-symbols-outlined text-primary">' + Config.getReportIcon(t.reportType) + '</span>' +
            '</div>' +
            '<button onclick="AuditLogLogic.generateReport(\'' + t.reportType + '\')" class="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg group-hover:bg-primary group-hover:text-white transition-all">Generate</button>' +
          '</div>' +
          '<h3 class="font-bold text-sm mb-1">' + t.name + '</h3>' +
          '<p class="text-xs text-text-muted line-clamp-2">' + t.description + '</p>' +
        '</div>'
      );
    }).join('');

    select.innerHTML = templates.map(function (t) {
      return '<option value="' + t.reportType + '">' + t.name + '</option>';
    }).join('');
  }

  function renderReportHistory(reports) {
    var tbody = document.getElementById('recentReportsTable');
    if (!reports || reports.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-text-muted">No reports generated yet.</td></tr>';
      return;
    }

    tbody.innerHTML = reports.map(function (r) {
      var downloadBtn = r.status === 'completed'
        ? '<button onclick="AuditLogLogic.downloadReport(\'' + r._id + '\')" class="text-primary hover:text-primary-dark transition-colors"><span class="material-symbols-outlined">download</span></button>'
        : '';
      var recordsCol = r.status === 'completed'
        ? '<span class="text-white">' + r.recordCount + '</span>'
        : '<span class="text-text-muted italic">' + r.status + '</span>';

      return (
        '<tr class="hover:bg-surface-dark/50 transition-colors">' +
          '<td class="px-6 py-4"><div class="font-medium">' + r.name + '</div><div class="text-[10px] text-text-muted uppercase">' + r.format + ' &bull; ' + r.reportType + '</div></td>' +
          '<td class="px-6 py-4 text-xs text-text-muted">' + Config.formatDateTime(r.requestedAt) + '</td>' +
          '<td class="px-6 py-4 text-xs">' + recordsCol + '</td>' +
          '<td class="px-6 py-4 text-right">' + downloadBtn + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderSchedules(schedules) {
    var container = document.getElementById('scheduledReportsList');
    if (!schedules || schedules.length === 0) {
      container.innerHTML = '<div class="px-6 py-8 text-center text-text-muted text-sm italic">No scheduled reports.</div>';
      return;
    }

    container.innerHTML = schedules.map(function (s) {
      return (
        '<div class="px-6 py-4 flex items-center justify-between hover:bg-surface-dark/50 transition-all">' +
          '<div>' +
            '<div class="font-bold text-sm">' + s.name + '</div>' +
            '<div class="text-xs text-text-muted capitalize">' + s.frequency + ' &bull; Next run: ' + Config.formatDateTime(s.nextRun) + '</div>' +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            '<div class="px-2 py-1 rounded bg-surface-darker border border-border-dark text-[10px] uppercase font-bold text-text-muted">' + s.format + '</div>' +
            '<button onclick="AuditLogLogic.deleteSchedule(\'' + s._id + '\')" class="p-2 text-text-muted hover:text-rose-400 transition-colors">' +
              '<span class="material-symbols-outlined text-[18px]">delete</span></button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function showToast(message, type) {
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

  return {
    renderContent: renderContent,
    updateStats: updateStats,
    updatePagination: updatePagination,
    showEntryDetail: showEntryDetail,
    renderReportTemplates: renderReportTemplates,
    renderReportHistory: renderReportHistory,
    renderSchedules: renderSchedules,
    showToast: showToast
  };
})();
