/* =========================================
   RECRUITER PIPELINE — Bridge Module
   Depends on: PipelineConfig
   ========================================= */
var PipelineBridge = (function () {
  'use strict';

  function sendMessage(type, payload) {
    window.parent.postMessage({ type: type, data: payload }, '*');
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var data = event.data;
      if (!data || !data.type) return;

      if (handlers[data.type]) {
        handlers[data.type](data.data, data);
      }
    });
  }

  function notifyReady() {
    window.parent.postMessage({ type: 'pipelinePageReady' }, '*');
  }

  return {
    sendMessage: sendMessage,
    listen: listen,
    notifyReady: notifyReady
  };
})();
