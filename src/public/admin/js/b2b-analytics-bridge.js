/* =========================================
   B2B Analytics — Bridge Module
   No dependencies
   ========================================= */
var AnalyticsBridge = (function () {
  'use strict';

  var VALID_ACTIONS = ['init', 'kpisLoaded', 'conversionsLoaded', 'sourcesLoaded', 'cpaLoaded', 'intelLoaded', 'snapshotSaved', 'forecastAccuracyLoaded', 'actionError'];

  function isValidMessage(d) {
    return d && typeof d === 'object' && typeof d.action === 'string' && VALID_ACTIONS.indexOf(d.action) !== -1;
  }

  function sendToVelo(msg) { window.parent.postMessage(msg, '*'); }

  function listen(handlers) {
    window.addEventListener('message', function (e) {
      var d = e.data;
      if (!isValidMessage(d)) return;
      if (handlers[d.action]) handlers[d.action](d);
    });
  }

  return { sendToVelo: sendToVelo, listen: listen };
})();
