/* =========================================
   ADMIN AUDIT LOG — Logic Module
   Depends on: AuditLogConfig, AuditLogBridge, AuditLogRender
   Business logic, event handlers, state management
   ========================================= */
var AuditLogLogic = (function () {
  'use strict';

  var Config = AuditLogConfig;
  var Bridge = AuditLogBridge;
  var Render = AuditLogRender;

  var state = Config.createInitialState();
  var isLoadingMore = false;
  var searchTimeout;

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    initTheme();
    handleResize();
    Bridge.getAuditLog(state.filters, 1, state.pageSize);
    Bridge.getStats();

    Bridge.listen(handleMessage);
    window.addEventListener('resize', handleResize);

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.filter-chip') && !e.target.closest('.filter-dropdown')) {
        document.querySelectorAll('.filter-dropdown').forEach(function (d) { d.classList.remove('open'); });
        document.getElementById('mobileOverlay').classList.remove('open');
      }
    });
  }

  function handleResize() {
    var wasMobile = state.isMobile;
    state.isMobile = window.innerWidth < 768;
    if (wasMobile !== state.isMobile) {
      Render.renderContent(state);
    }
  }

  // ============================================
  // MESSAGE HANDLING
  // ============================================
  function handleMessage(data) {
    switch (data.action) {
      case 'init':
        Bridge.getAuditLog(state.filters, 1, state.pageSize);
        Bridge.getStats();
        Bridge.getReportTemplates();
        break;
      case 'auditLogLoaded':
        handleAuditLogLoaded(data.payload);
        break;
      case 'entryDetailLoaded':
        Render.showEntryDetail(data.payload);
        break;
      case 'statsLoaded':
        Render.updateStats(data.payload);
        break;
      case 'exportReady':
        downloadCSV(data.payload);
        break;
      case 'reportTemplatesLoaded':
        Render.renderReportTemplates(data.payload);
        break;
      case 'complianceReportGenerated':
        Render.showToast('Report generation started', 'success');
        Bridge.listComplianceReports({ limit: 10 });
        break;
      case 'complianceReportsLoaded':
        Render.renderReportHistory(data.payload.items);
        break;
      case 'scheduledReportsLoaded':
        Render.renderSchedules(data.payload);
        break;
      case 'reportDownloadReady':
        handleReportDownload(data.payload);
        break;
      case 'actionSuccess':
        Render.showToast(data.message || 'Action completed', 'success');
        break;
      case 'actionError':
        Render.showToast(data.message || 'An error occurred', 'error');
        break;
    }
  }

  function handleAuditLogLoaded(payload) {
    if (isLoadingMore) {
      state.entries = state.entries.concat(payload.entries || []);
      isLoadingMore = false;
    } else {
      state.entries = payload.entries || [];
    }
    state.totalCount = payload.totalCount || 0;
    state.currentPage = payload.currentPage || 1;
    state.pageSize = payload.pageSize || 50;
    state.isLoading = false;

    Render.renderContent(state);
    Render.updatePagination(state);
  }

  function refreshData() {
    state.isLoading = true;
    Bridge.getAuditLog(state.filters, state.currentPage, state.pageSize, state.sortField, state.sortDirection);
  }

  // ============================================
  // TAB MANAGEMENT
  // ============================================
  function switchTab(tab) {
    document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.add('hidden'); });
    document.getElementById('view-' + tab).classList.remove('hidden');

    document.querySelectorAll('.tab-nav-btn').forEach(function (b) {
      if (b.dataset.tab === tab) {
        b.classList.add('active', 'bg-primary', 'border-primary');
        b.classList.remove('bg-surface-dark', 'border-border-dark');
      } else {
        b.classList.remove('active', 'bg-primary', 'border-primary');
        b.classList.add('bg-surface-dark', 'border-border-dark');
      }
    });

    if (tab === 'reports') {
      Bridge.listComplianceReports({ limit: 10 });
      Bridge.getScheduledReports();
    }
  }

  // ============================================
  // FILTERS & SEARCH
  // ============================================
  function handleSearch() {
    var input = document.getElementById('searchInput');
    var clearBtn = document.getElementById('clearSearchBtn');
    clearBtn.classList.toggle('hidden', !input.value);

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
      state.filters.search = input.value;
      state.currentPage = 1;
      refreshData();
    }, 300);
  }

  function clearSearch() {
    var input = document.getElementById('searchInput');
    input.value = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    state.filters.search = '';
    state.currentPage = 1;
    refreshData();
  }

  function setFilter(filterName, value) {
    state.filters[filterName] = value;
    state.currentPage = 1;

    if (filterName === 'category') {
      document.getElementById('categoryFilterLabel').textContent = Config.FILTER_LABELS.category[value] || 'Category';
    } else if (filterName === 'targetType') {
      document.getElementById('targetFilterLabel').textContent = Config.FILTER_LABELS.targetType[value] || 'Target';
    }

    closeAllMenus();
    refreshData();
  }

  function applyDateFilter() {
    state.filters.dateFrom = document.getElementById('dateFrom').value || null;
    state.filters.dateTo = document.getElementById('dateTo').value || null;
    state.currentPage = 1;
    refreshData();
  }

  function clearFilters() {
    state.filters = { category: 'all', targetType: 'all', dateFrom: null, dateTo: null, search: '' };
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('categoryFilterLabel').textContent = 'Category';
    document.getElementById('targetFilterLabel').textContent = 'Target';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    state.currentPage = 1;
    refreshData();
  }

  function toggleFilterDropdown(id) {
    var dropdown = document.getElementById(id);
    var wasOpen = dropdown.classList.contains('open');
    closeAllMenus();
    if (!wasOpen) {
      dropdown.classList.add('open');
      if (state.isMobile) {
        document.getElementById('mobileOverlay').classList.add('open');
      }
    }
  }

  function closeAllMenus() {
    document.querySelectorAll('.filter-dropdown').forEach(function (d) { d.classList.remove('open'); });
    document.getElementById('mobileOverlay').classList.remove('open');
  }

  // ============================================
  // PAGINATION & SORTING
  // ============================================
  function goToPage(direction) {
    if (direction === 'prev' && state.currentPage > 1) {
      state.currentPage--;
    } else if (direction === 'next') {
      state.currentPage++;
    }
    refreshData();
  }

  function changePageSize() {
    state.pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    state.currentPage = 1;
    refreshData();
  }

  function loadMore() {
    isLoadingMore = true;
    state.currentPage++;
    Bridge.getAuditLog(state.filters, state.currentPage, state.pageSize, state.sortField, state.sortDirection);
  }

  function sortBy(field) {
    if (state.sortField === field) {
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortField = field;
      state.sortDirection = 'desc';
    }
    var icon = document.getElementById('sortIconTime');
    icon.textContent = state.sortDirection === 'asc' ? 'expand_less' : 'expand_more';
    state.currentPage = 1;
    refreshData();
  }

  // ============================================
  // ACTIONS
  // ============================================
  function viewEntry(entryId) {
    Bridge.getEntryDetail(entryId);
  }

  function exportAuditLog() {
    Bridge.exportAuditLog(state.filters);
  }

  function downloadCSV(csvContent) {
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'audit_log_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    URL.revokeObjectURL(url);
    Render.showToast('Audit log exported', 'success');
  }

  function closeEntryModal() {
    document.getElementById('entryDetailModal').classList.add('hidden');
  }

  // ============================================
  // COMPLIANCE REPORTS
  // ============================================
  function generateReport(type) {
    Bridge.generateComplianceReport({ reportType: type, format: 'csv' });
  }

  function generateCustomReport() {
    var options = {
      reportType: document.getElementById('reportTypeSelect').value,
      dateRangeStart: document.getElementById('reportDateFrom').value,
      dateRangeEnd: document.getElementById('reportDateTo').value,
      format: document.querySelector('input[name="reportFormat"]:checked').value,
      maskPII: document.getElementById('maskPII').checked
    };
    Bridge.generateComplianceReport(options);
  }

  function downloadReport(id) {
    Bridge.downloadReport(id);
  }

  function handleReportDownload(payload) {
    if (payload.fileContent) {
      var blob = new Blob([payload.fileContent], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'compliance_report_' + payload.reportId + '.' + payload.format;
      a.click();
      URL.revokeObjectURL(url);
    } else if (payload.fileUrl) {
      window.open(payload.fileUrl, '_blank');
    }
  }

  function deleteSchedule(id) {
    if (confirm('Are you sure you want to delete this schedule?')) {
      Bridge.deleteScheduledReport(id);
    }
  }

  // ============================================
  // THEME MANAGEMENT
  // ============================================
  function initTheme() {
    var saved = localStorage.getItem(Config.THEME_KEY);
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
    updateThemeIcons(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(Config.THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  function updateThemeIcons(theme) {
    var icon = theme === 'dark' ? 'dark_mode' : 'light_mode';
    var mobileBtn = document.getElementById('themeToggleMobile');
    var desktopBtn = document.getElementById('themeToggleDesktop');
    if (mobileBtn) mobileBtn.querySelector('.material-symbols-outlined').textContent = icon;
    if (desktopBtn) desktopBtn.querySelector('.material-symbols-outlined').textContent = icon;
  }

  // ============================================
  // EXPOSE GLOBALS (for onclick handlers in HTML)
  // ============================================
  function exposeGlobals() {
    window.toggleTheme = toggleTheme;
    window.exportAuditLog = exportAuditLog;
    window.handleSearch = handleSearch;
    window.clearSearch = clearSearch;
    window.toggleFilterDropdown = toggleFilterDropdown;
    window.setFilter = setFilter;
    window.applyDateFilter = applyDateFilter;
    window.clearFilters = clearFilters;
    window.goToPage = goToPage;
    window.changePageSize = changePageSize;
    window.loadMore = loadMore;
    window.sortBy = sortBy;
    window.switchTab = switchTab;
    window.closeEntryModal = closeEntryModal;
    window.closeAllMenus = closeAllMenus;
    // ReportsUI compat
    window.ReportsUI = {
      generateCustom: generateCustomReport,
      loadHistory: function () { Bridge.listComplianceReports({ limit: 10 }); },
      openScheduleModal: function () { Render.showToast('Schedule modal coming soon', 'info'); },
      loadData: function () {
        Bridge.listComplianceReports({ limit: 10 });
        Bridge.getScheduledReports();
      }
    };
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals,
    viewEntry: viewEntry,
    closeEntryModal: closeEntryModal,
    generateReport: generateReport,
    downloadReport: downloadReport,
    deleteSchedule: deleteSchedule
  };
})();
