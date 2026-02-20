/* =========================================
   ADMIN GAMIFICATION ANALYTICS — Config Module
   No dependencies
   ========================================= */
var GamificationConfig = (function () {
  'use strict';

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  }

  function getHealthBadge(health) {
    var badges = {
      healthy: '<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Healthy</span>',
      too_slow: '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Too Slow</span>',
      too_fast: '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Too Fast</span>',
      insufficient_data: '<span class="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-medium">No Data</span>'
    };
    return badges[health] || badges.insufficient_data;
  }

  function getStatusBadge(status) {
    var badges = {
      active: '<span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Active</span>',
      scheduled: '<span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Scheduled</span>',
      ended: '<span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">Ended</span>',
      draft: '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Draft</span>'
    };
    return badges[status] || status;
  }

  return {
    formatNumber: formatNumber,
    getHealthBadge: getHealthBadge,
    getStatusBadge: getStatusBadge
  };
})();
