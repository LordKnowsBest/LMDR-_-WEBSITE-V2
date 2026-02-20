/* =========================================
   ADMIN FEATURE ADOPTION — Config Module
   No dependencies
   ========================================= */
var FeatureAdoptionConfig = (function () {
  'use strict';

  var STATUS_COLORS = {
    beta: 'bg-blue-900/40 text-blue-300',
    active: 'bg-emerald-900/40 text-emerald-300',
    deprecated: 'bg-amber-900/40 text-amber-300',
    sunset: 'bg-red-900/40 text-red-300'
  };

  return {
    STATUS_COLORS: STATUS_COLORS
  };
})();
