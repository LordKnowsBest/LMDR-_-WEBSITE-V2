/* =========================================
   ADMIN AUDIT LOG — Config Module
   No dependencies
   ========================================= */
var AuditLogConfig = (function () {
  'use strict';

  var VALID_ACTIONS = [
    'auditLogLoaded', 'entryDetailLoaded', 'statsLoaded',
    'adminListLoaded', 'actionListLoaded', 'exportReady',
    'actionSuccess', 'actionError', 'init',
    'reportTemplatesLoaded', 'complianceReportGenerated',
    'complianceReportsLoaded', 'scheduledReportsLoaded',
    'reportDownloadReady'
  ];

  var THEME_KEY = 'lmdr-admin-theme';

  var FILTER_LABELS = {
    category: { all: 'Category', driver: 'Driver', carrier: 'Carrier', system: 'System', auth: 'Auth' },
    targetType: { all: 'Target', driver: 'Drivers', carrier: 'Carriers', system: 'System' }
  };

  var CATEGORY_DOT_COLORS = {
    driver: 'bg-violet-400',
    carrier: 'bg-blue-400',
    system: 'bg-amber-400',
    auth: 'bg-emerald-400'
  };

  var CATEGORY_ICONS = {
    driver: 'person',
    carrier: 'local_shipping',
    system: 'settings',
    auth: 'lock'
  };

  var REPORT_ICONS = {
    admin_activity: 'badge',
    data_access: 'database',
    system_changes: 'settings_suggest',
    security_events: 'security',
    full_audit: 'history_edu',
    custom: 'edit_note'
  };

  function createInitialState() {
    return {
      entries: [],
      currentPage: 1,
      pageSize: 50,
      totalCount: 0,
      sortField: 'timestamp',
      sortDirection: 'desc',
      filters: {
        category: 'all',
        targetType: 'all',
        dateFrom: null,
        dateTo: null,
        search: ''
      },
      isLoading: false,
      isMobile: window.innerWidth < 768
    };
  }

  function isValidMessage(data) {
    return data && typeof data === 'object' &&
      typeof data.action === 'string' &&
      VALID_ACTIONS.indexOf(data.action) !== -1;
  }

  function getCategoryDotColor(category) {
    return CATEGORY_DOT_COLORS[category] || 'bg-slate-400';
  }

  function getCategoryIcon(category) {
    return CATEGORY_ICONS[category] || 'history';
  }

  function getReportIcon(type) {
    return REPORT_ICONS[type] || 'description';
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return 'N/A';
    var date = new Date(timestamp);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  function formatDetails(details) {
    if (!details) return 'No details';
    if (typeof details === 'string') return details;
    var entries = Object.entries(details);
    if (entries.length === 0) return 'No details';
    return entries.slice(0, 2).map(function (e) { return e[0] + ': ' + e[1]; }).join(', ');
  }

  function formatDetailValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  function getTargetName(target, type) {
    if (type === 'driver') {
      return ((target.firstName || '') + ' ' + (target.lastName || '')).trim() || 'Unknown';
    } else if (type === 'carrier') {
      return target.legal_name || target.legalName || 'Unknown';
    }
    return 'N/A';
  }

  return {
    VALID_ACTIONS: VALID_ACTIONS,
    THEME_KEY: THEME_KEY,
    FILTER_LABELS: FILTER_LABELS,
    createInitialState: createInitialState,
    isValidMessage: isValidMessage,
    getCategoryDotColor: getCategoryDotColor,
    getCategoryIcon: getCategoryIcon,
    getReportIcon: getReportIcon,
    formatDateTime: formatDateTime,
    formatTime: formatTime,
    formatDetails: formatDetails,
    formatDetailValue: formatDetailValue,
    getTargetName: getTargetName
  };
})();
