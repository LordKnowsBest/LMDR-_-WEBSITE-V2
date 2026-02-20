/* =========================================
   B2B Pipeline — Bridge Module
   No dependencies
   ========================================= */
var PipelineBridge = (function () {
  'use strict';

  var VALID_ACTIONS = ['init', 'pipelineLoaded', 'forecastLoaded', 'stageUpdated', 'actionSuccess', 'actionError'];

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
