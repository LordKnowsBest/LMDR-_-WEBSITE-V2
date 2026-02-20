/* =========================================
   DRIVER DASHBOARD — Bridge Module
   Depends on: DashboardConfig
   PostMessage communication + smart polling
   Uses { type, data } protocol
   ========================================= */
var DashboardBridge = (function () {
  'use strict';

  var Config = DashboardConfig;

  // ── Smart Polling State ──
  var pollTimer = null;
  var currentPollInterval = Config.POLL_CONFIG.baseInterval;
  var chatPollTimer = null;
  var chatPollInterval = Config.POLL_CONFIG.baseInterval;

  function sendToVelo(type, data) {
    if (!data) data = {};
    if (window.parent) {
      window.parent.postMessage({ type: type, data: data }, '*');
    }
  }

  function listen(handler) {
    window.addEventListener('message', function (event) {
      var evData = event.data || {};
      var type = evData.type;
      var data = evData.data;
      if (!type) return;
      handler(type, data);
    });
  }

  // ── Dashboard Polling ──
  function startPolling() {
    if (pollTimer) clearTimeout(pollTimer);
    currentPollInterval = Config.POLL_CONFIG.baseInterval;
    schedulePoll();
  }

  function schedulePoll() {
    pollTimer = setTimeout(function () {
      sendToVelo('refreshDashboard');
      currentPollInterval = Math.min(
        currentPollInterval * Config.POLL_CONFIG.backoffMultiplier,
        Config.POLL_CONFIG.maxInterval
      );
      schedulePoll();
    }, currentPollInterval);
  }

  function resetPollInterval() {
    currentPollInterval = Config.POLL_CONFIG.baseInterval;
    if (pollTimer) {
      clearTimeout(pollTimer);
      schedulePoll();
    }
  }

  // ── Chat Polling ──
  function startChatPolling(applicationId, getTimestamp) {
    if (chatPollTimer) clearTimeout(chatPollTimer);
    chatPollInterval = Config.POLL_CONFIG.baseInterval;
    scheduleChatPoll(applicationId, getTimestamp);
  }

  function scheduleChatPoll(applicationId, getTimestamp) {
    chatPollTimer = setTimeout(function () {
      if (!applicationId) return;
      sendToVelo('getNewMessages', {
        applicationId: applicationId,
        sinceTimestamp: getTimestamp()
      });
      chatPollInterval = Math.min(
        chatPollInterval * Config.POLL_CONFIG.backoffMultiplier,
        Config.POLL_CONFIG.maxInterval
      );
      scheduleChatPoll(applicationId, getTimestamp);
    }, chatPollInterval);
  }

  function resetChatPollInterval(applicationId, getTimestamp) {
    chatPollInterval = Config.POLL_CONFIG.baseInterval;
    if (chatPollTimer && applicationId) {
      clearTimeout(chatPollTimer);
      scheduleChatPoll(applicationId, getTimestamp);
    }
  }

  function stopChatPolling() {
    if (chatPollTimer) {
      clearTimeout(chatPollTimer);
      chatPollTimer = null;
    }
  }

  return {
    sendToVelo: sendToVelo,
    listen: listen,
    startPolling: startPolling,
    resetPollInterval: resetPollInterval,
    startChatPolling: startChatPolling,
    resetChatPollInterval: resetChatPollInterval,
    stopChatPolling: stopChatPolling
  };
})();
