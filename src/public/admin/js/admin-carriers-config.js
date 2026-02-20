/* =========================================
   ADMIN CARRIERS — Config Module
   No dependencies
   ========================================= */
var AdminCarriersConfig = (function () {
  'use strict';

  var VALID_ACTIONS = [
    'carriersLoaded', 'carrierDetail', 'statsLoaded',
    'actionSuccess', 'actionError', 'init', 'exportReady'
  ];

  var THEME_KEY = 'lmdr-admin-theme';

  var FILTER_LABELS = {
    status: { all: 'Status', active: 'Active', inactive: 'Inactive', pending_review: 'Pending', suspended: 'Suspended' },
    fleetSize: { all: 'Fleet Size', small: 'Small', medium: 'Medium', large: 'Large' },
    safetyRating: { all: 'Safety', SATISFACTORY: 'Satisfactory', CONDITIONAL: 'Conditional', UNSATISFACTORY: 'Unsatisfactory', 'NOT RATED': 'Not Rated' }
  };

  function createInitialState() {
    return {
      carriers: [],
      selectedIds: new Set(),
      currentPage: 1,
      pageSize: 25,
      totalCount: 0,
      sortField: 'lastUpdated',
      sortDirection: 'desc',
      filters: {
        status: 'all',
        fleetSize: 'all',
        safetyRating: 'all',
        search: ''
      },
      isLoading: false,
      viewMode: 'card',
      isMobile: window.innerWidth < 768
    };
  }

  function isValidMessage(data) {
    return data && typeof data === 'object' &&
      typeof data.action === 'string' &&
      VALID_ACTIONS.indexOf(data.action) !== -1;
  }

  function getSafetyClass(rating) {
    var r = rating ? rating.toUpperCase() : '';
    switch (r) {
      case 'SATISFACTORY': return 'bg-emerald-500/20 text-emerald-400';
      case 'CONDITIONAL': return 'bg-amber-500/20 text-amber-400';
      case 'UNSATISFACTORY': return 'bg-rose-500/20 text-rose-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  function getEnrichmentClass(status) {
    switch (status) {
      case 'fresh': return 'enrichment-fresh';
      case 'stale': return 'enrichment-stale';
      case 'expired': return 'enrichment-expired';
      default: return 'enrichment-none';
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400';
      case 'inactive': return 'bg-slate-500/20 text-slate-400';
      case 'pending_review': return 'bg-amber-500/20 text-amber-400';
      case 'suspended': return 'bg-rose-500/20 text-rose-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }

  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  }

  return {
    VALID_ACTIONS: VALID_ACTIONS,
    THEME_KEY: THEME_KEY,
    FILTER_LABELS: FILTER_LABELS,
    createInitialState: createInitialState,
    isValidMessage: isValidMessage,
    getSafetyClass: getSafetyClass,
    getEnrichmentClass: getEnrichmentClass,
    getStatusClass: getStatusClass,
    capitalizeFirst: capitalizeFirst
  };
})();
