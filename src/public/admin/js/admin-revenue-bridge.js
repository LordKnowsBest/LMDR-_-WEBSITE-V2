/* =========================================
   ADMIN REVENUE DASHBOARD — Bridge Module
   Depends on: RevenueConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var RevenueBridge = (function () {
  'use strict';

  function send(action, payload) {
    var msg = { action: action };
    if (payload) {
      var keys = Object.keys(payload);
      for (var i = 0; i < keys.length; i++) {
        msg[keys[i]] = payload[keys[i]];
      }
    }
    window.parent.postMessage(msg, '*');
  }

  function requestAllData() {
    send('getRevenue');
    send('getMRRTrend', { months: 12 });
    send('getTierRevenue');
    send('getCohort', { months: 6 });
    send('getChurn', { days: 30 });
  }

  function exportCSV(exportType) {
    send('exportCSV', { exportType: exportType });
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.action) return;
      if (handlers[msg.action]) {
        handlers[msg.action](msg);
      }
    });
  }

  return {
    send: send,
    requestAllData: requestAllData,
    exportCSV: exportCSV,
    listen: listen
  };
})();
