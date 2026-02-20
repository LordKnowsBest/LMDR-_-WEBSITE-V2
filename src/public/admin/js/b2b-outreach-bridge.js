/* =========================================
   B2B Outreach — Bridge Module
   No dependencies
   ========================================= */
var OutreachBridge = (function () {
  'use strict';

  var VALID_ACTIONS = ['init','sequencesLoaded','sequenceLoaded','throttleStatus','sequenceSaved','stepSaved','actionSuccess','actionError','emailContentGenerated','smsContentGenerated','callScriptGenerated','draftSaved','draftApproved','draftsLoaded'];

  function isValidMessage(d) {
    return d && typeof d === 'object' && typeof d.action === 'string' && VALID_ACTIONS.includes(d.action);
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
