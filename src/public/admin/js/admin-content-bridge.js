/* =========================================
   Admin Content Moderation — Bridge Module
   No dependencies
   ========================================= */
var ContentBridge = (function () {
  'use strict';

  var VALID_ACTIONS = ['moderationQueueLoaded', 'actionSuccess', 'actionError'];

  function isValidMessage(d) {
    return d && typeof d === 'object' && typeof d.action === 'string' && VALID_ACTIONS.indexOf(d.action) !== -1;
  }

  function sendToVelo(msg) { window.parent.postMessage(msg, '*'); }

  function listen(handlers) {
    window.addEventListener('message', function (e) {
      var d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.action && handlers[d.action]) handlers[d.action](d);
    });
  }

  return { sendToVelo: sendToVelo, listen: listen };
})();
