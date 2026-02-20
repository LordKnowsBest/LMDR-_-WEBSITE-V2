/* =========================================
   DRIVER ROAD UTILITIES — Config Module
   No dependencies
   ========================================= */
var RoadUtilitiesConfig = (function () {
  'use strict';

  var TABS = ['dashboard', 'parking', 'fuel', 'weighstation', 'ratings', 'weather', 'conditions'];

  var DEFAULT_COORDS = { lat: 35.1495, lng: -90.0490 };

  var TAB_ACTIVE_CLASS =
    'flex-1 py-2.5 px-3 min-w-[80px] text-center font-black text-xs uppercase tracking-wider rounded-lg transition-all bg-white shadow-sm text-slate-900 ring-1 ring-black/5';

  var TAB_INACTIVE_CLASS =
    'flex-1 py-2.5 px-3 min-w-[80px] text-center font-black text-xs uppercase tracking-wider rounded-lg transition-all text-slate-500 hover:text-slate-700 hover:bg-white/50';

  return {
    TABS: TABS,
    DEFAULT_COORDS: DEFAULT_COORDS,
    TAB_ACTIVE_CLASS: TAB_ACTIVE_CLASS,
    TAB_INACTIVE_CLASS: TAB_INACTIVE_CLASS
  };
})();
