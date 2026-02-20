/* =========================================
   ADMIN COMMISSIONS — Config Module
   No dependencies
   ========================================= */
var CommissionsConfig = (function () {
  'use strict';

  var DEFAULT_RATES = {
    new_subscription: 10,
    upgrade: 5,
    renewal: 3,
    placement: 15
  };

  return {
    DEFAULT_RATES: DEFAULT_RATES
  };
})();
