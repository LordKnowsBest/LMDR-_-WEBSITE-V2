/* =========================================
   ADMIN MODERATION — Config Module
   No dependencies
   ========================================= */
var ModerationConfig = (function () {
  'use strict';

  var THEME_KEY = 'lmdr-admin-theme';

  var SEVERITY_COLORS = {
    spam: 'text-amber-400',
    default: 'text-rose-400'
  };

  function getSeverityColor(reason) {
    return SEVERITY_COLORS[reason] || SEVERITY_COLORS.default;
  }

  return {
    THEME_KEY: THEME_KEY,
    getSeverityColor: getSeverityColor
  };
})();
