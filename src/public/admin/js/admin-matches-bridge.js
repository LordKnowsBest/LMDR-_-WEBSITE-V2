/* =========================================
   ADMIN MATCHES — Bridge Module
   Depends on: AdminMatchesConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var AdminMatchesBridge = (function () {
  'use strict';

  function sendToVelo(message) {
    window.parent.postMessage(message, '*');
  }

  function getStats() {
    sendToVelo({ action: 'getStats' });
  }

  function getActionList() {
    sendToVelo({ action: 'getActionList' });
  }

  function getMatches(filters, page, pageSize) {
    sendToVelo({ action: 'getMatches', filters: filters, page: page, pageSize: pageSize });
  }

  function getInterests(filters, page, pageSize) {
    sendToVelo({ action: 'getInterests', filters: filters, page: page, pageSize: pageSize });
  }

  function getTrends(period) {
    sendToVelo({ action: 'getTrends', period: period });
  }

  function getTopMatches(limit) {
    sendToVelo({ action: 'getTopMatches', limit: limit });
  }

  function getMatchDetail(matchId) {
    sendToVelo({ action: 'getMatchDetail', matchId: matchId });
  }

  function exportMatches(filters) {
    sendToVelo({ action: 'exportMatches', filters: filters });
  }

  function listen(handlers) {
    window.onmessage = function (event) {
      var data = event.data;
      if (!data || !data.action) return;
      var action = data.action;
      var payload = data.payload;
      var message = data.message;
      if (handlers[action]) {
        handlers[action](payload, message);
      }
    };
  }

  return {
    sendToVelo: sendToVelo,
    getStats: getStats,
    getActionList: getActionList,
    getMatches: getMatches,
    getInterests: getInterests,
    getTrends: getTrends,
    getTopMatches: getTopMatches,
    getMatchDetail: getMatchDetail,
    exportMatches: exportMatches,
    listen: listen
  };
})();
