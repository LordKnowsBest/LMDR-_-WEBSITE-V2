var ComplianceCalendarBridge = (function () {
  'use strict';

  function sendToVelo(action, payload) {
    window.parent.postMessage({ type: action, action: action, data: payload || {} }, '*');
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.type) return;
      if (handlers[msg.type]) handlers[msg.type](msg.data);
    });
  }

  function notifyReady() {
    window.parent.postMessage({ type: 'calendarReady', action: 'calendarReady' }, '*');
  }

  return {
    sendToVelo: sendToVelo,
    listen: listen,
    notifyReady: notifyReady
  };
})();
