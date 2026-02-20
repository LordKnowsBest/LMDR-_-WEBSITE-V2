/* =========================================
   ADMIN GAMIFICATION ANALYTICS — Logic Module
   Depends on: GamificationConfig, GamificationBridge, GamificationRender
   State management, event handlers, message routing
   ========================================= */
var GamificationLogic = (function () {
  'use strict';

  function init() {
    setupMessageHandlers();
    loadMetrics();
  }

  function setupMessageHandlers() {
    GamificationBridge.listen({
      gamificationMetricsResult: function (data) {
        GamificationRender.updateDashboard(data);
        var btn = document.getElementById('refreshBtn');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-refresh"></i> Refresh';
      },
      abuseDetectionResult: function (data) {
        GamificationRender.displayAbuseReport(data);
      }
    });
  }

  function loadMetrics() {
    var btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    GamificationBridge.requestMetrics();
  }

  function checkAbuse() {
    document.getElementById('abuseModal').classList.remove('hidden');
    document.getElementById('abuseContent').innerHTML =
      '<div class="text-center text-slate-400 py-8"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Running analysis...</div>';
    GamificationBridge.requestAbuseDetection();
  }

  function closeAbuseModal() {
    document.getElementById('abuseModal').classList.add('hidden');
  }

  return {
    init: init,
    loadMetrics: loadMetrics,
    checkAbuse: checkAbuse,
    closeAbuseModal: closeAbuseModal
  };
})();
