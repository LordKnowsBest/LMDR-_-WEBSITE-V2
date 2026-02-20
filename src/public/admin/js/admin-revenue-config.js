/* =========================================
   ADMIN REVENUE DASHBOARD — Config Module
   No dependencies
   ========================================= */
var RevenueConfig = (function () {
  'use strict';

  var TIER_COLORS = {
    free: '#64748b',
    pro: '#2563eb',
    enterprise: '#8b5cf6'
  };

  var CHURN_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];

  return {
    TIER_COLORS: TIER_COLORS,
    CHURN_COLORS: CHURN_COLORS
  };
})();
