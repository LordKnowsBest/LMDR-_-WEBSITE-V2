/* =========================================
   ADMIN REVENUE DASHBOARD — Logic Module
   Depends on: RevenueConfig, RevenueBridge, RevenueRender
   State management, event handlers, message routing
   ========================================= */
var RevenueLogic = (function () {
  'use strict';

  function init() {
    setupMessageHandlers();
    setupExportMenuClose();
  }

  function setupMessageHandlers() {
    RevenueBridge.listen({
      init: function () {
        RevenueBridge.requestAllData();
      },
      revenueLoaded: function (msg) {
        RevenueRender.renderKPICards(msg.payload);
      },
      mrrTrendLoaded: function (msg) {
        RevenueRender.renderMRRChart(msg.payload);
      },
      tierRevenueLoaded: function (msg) {
        RevenueRender.renderTierChart(msg.payload);
      },
      cohortLoaded: function (msg) {
        RevenueRender.renderCohortTable(msg.payload);
      },
      churnLoaded: function (msg) {
        RevenueRender.renderChurnPanel(msg.payload);
      },
      exportReady: function (msg) {
        RevenueRender.downloadCSV(msg.payload);
      },
      actionError: function (msg) {
        RevenueRender.showToast(msg.message, 'error');
      },
      actionSuccess: function (msg) {
        RevenueRender.showToast(msg.message, 'success');
      }
    });
  }

  function setupExportMenuClose() {
    document.addEventListener('click', function (e) {
      var menu = document.getElementById('exportMenu');
      var btn = document.getElementById('btnExport');
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });
  }

  function requestAllData() {
    RevenueBridge.requestAllData();
  }

  function toggleExportMenu() {
    document.getElementById('exportMenu').classList.toggle('hidden');
  }

  function handleExport(type) {
    document.getElementById('exportMenu').classList.add('hidden');
    RevenueBridge.exportCSV(type);
  }

  return {
    init: init,
    requestAllData: requestAllData,
    toggleExportMenu: toggleExportMenu,
    handleExport: handleExport
  };
})();
