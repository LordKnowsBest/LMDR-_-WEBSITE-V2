/* =========================================
   ADMIN FEATURE FLAGS — Config Module
   No dependencies
   ========================================= */
var FeatureFlagsConfig = (function () {
  'use strict';

  var CATEGORY_COLORS = {
    ui: 'bg-violet-500/20 text-violet-400',
    backend: 'bg-blue-500/20 text-blue-400',
    experiment: 'bg-amber-500/20 text-amber-400',
    killswitch: 'bg-rose-500/20 text-rose-400'
  };

  var DEFAULT_CATEGORY_COLOR = 'bg-slate-500/20 text-slate-400';

  function getCategoryColor(cat) {
    return CATEGORY_COLORS[cat] || DEFAULT_CATEGORY_COLOR;
  }

  return {
    getCategoryColor: getCategoryColor
  };
})();
