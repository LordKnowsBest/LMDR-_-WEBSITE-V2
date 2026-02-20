/* =========================================
   Admin API Partners — Bridge Module
   No dependencies
   ========================================= */
var PartnersBridge = (function () {
  'use strict';

  var VALID_ACTIONS = [
    'partnersLoaded', 'partnerDetailLoaded', 'partnerUsageLoaded',
    'partnerHistoryLoaded', 'revenueReportLoaded',
    'partnerTierUpdated', 'partnerStatusUpdated', 'partnerEnvironmentUpdated',
    'actionError'
  ];

  function sendToVelo(action, extra) {
    var msg = { action: action };
    if (extra) {
      var keys = Object.keys(extra);
      for (var i = 0; i < keys.length; i++) { msg[keys[i]] = extra[keys[i]]; }
    }
    window.parent.postMessage(msg, '*');
  }

  function listen(handlers) {
    window.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.action && handlers[d.action]) handlers[d.action](d);
    });
  }

  return { sendToVelo: sendToVelo, listen: listen, VALID_ACTIONS: VALID_ACTIONS };
})();
