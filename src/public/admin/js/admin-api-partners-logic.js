/* =========================================
   Admin API Partners — Logic Module
   Depends on: PartnersBridge
   ========================================= */
var PartnersLogic = (function () {
  'use strict';

  function init() {
    PartnersBridge.listen({
      partnersLoaded: function (d) { show('partnersPane', d.payload); },
      partnerDetailLoaded: function (d) { show('detailPane', d.payload); syncFieldsFromDetail(d.payload); },
      partnerUsageLoaded: function (d) { show('usagePane', d.payload); },
      partnerHistoryLoaded: function (d) { show('historyPane', d.payload); },
      revenueReportLoaded: function (d) {
        var p = d.payload || {};
        show('revenueSummaryPane', p.summary || p);
        show('revenueTierPane', p.tier_breakdown || []);
        renderBars('revenueTrend', p.monthly_revenue || [], 'month', 'revenue', '#2563eb');
        renderBars('topPartners', p.top_partners || [], 'company_name', 'revenue', '#f59e0b');
      },
      partnerTierUpdated: function (d) { show('statusPane', { action: d.action, payload: d.payload || d.message }); },
      partnerStatusUpdated: function (d) { show('statusPane', { action: d.action, payload: d.payload || d.message }); },
      partnerEnvironmentUpdated: function (d) { show('statusPane', { action: d.action, payload: d.payload || d.message }); },
      actionError: function (d) { show('statusPane', { action: d.action, payload: d.payload || d.message }); }
    });

    bindButtons();
  }

  function $(id) { return document.getElementById(id); }

  function partnerId() { return $('partnerId').value.trim(); }
  function periodKey() { return $('period').value || null; }
  function revenueMonths() { return Number($('revenueMonths').value || 12); }

  function show(id, value) { $(id).textContent = JSON.stringify(value, null, 2); }

  function toNumber(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function renderBars(containerId, items, keyLabel, keyValue, barColor) {
    var host = $(containerId);
    host.innerHTML = '';
    if (!Array.isArray(items) || !items.length) { host.textContent = 'No data'; return; }

    var max = 1;
    for (var i = 0; i < items.length; i++) {
      var v = toNumber(items[i][keyValue]);
      if (v > max) max = v;
    }

    var count = Math.min(items.length, 12);
    for (var j = 0; j < count; j++) {
      var label = items[j][keyLabel] || 'n/a';
      var value = toNumber(items[j][keyValue]);
      var width = Math.max(5, Math.round((value / max) * 100));
      var row = document.createElement('div');
      row.innerHTML = '<div class="flex justify-between"><span>' + label + '</span><span>$' + value.toFixed(2) + '</span></div>' +
        '<div class="mt-1 h-2 bg-slate-800 rounded"><div class="h-2 rounded" style="background:' + barColor + ';width:' + width + '%"></div></div>';
      host.appendChild(row);
    }
  }

  function syncFieldsFromDetail(payload) {
    if (payload && payload.partner && payload.partner.tier) {
      $('tier').value = payload.partner.tier;
    }
    if (payload && payload.environment) {
      $('environment').value = payload.environment;
    }
  }

  function bindButtons() {
    $('loadPartners').addEventListener('click', function () {
      PartnersBridge.sendToVelo('listPartners', { limit: 100 });
    });
    $('loadDetail').addEventListener('click', function () {
      PartnersBridge.sendToVelo('getPartnerDetail', { partnerId: partnerId(), periodKey: periodKey() });
    });
    $('loadUsage').addEventListener('click', function () {
      PartnersBridge.sendToVelo('getPartnerUsage', { partnerId: partnerId(), periodKey: periodKey() });
    });
    $('loadHistory').addEventListener('click', function () {
      PartnersBridge.sendToVelo('getPartnerHistory', { partnerId: partnerId(), limit: 100 });
    });
    $('loadRevenue').addEventListener('click', function () {
      PartnersBridge.sendToVelo('getRevenueReport', { partnerId: partnerId(), months: revenueMonths() });
    });
    $('setTier').addEventListener('click', function () {
      PartnersBridge.sendToVelo('setPartnerTier', { partnerId: partnerId(), tier: $('tier').value });
    });
    $('setEnvironment').addEventListener('click', function () {
      PartnersBridge.sendToVelo('setPartnerEnvironment', { partnerId: partnerId(), environment: $('environment').value });
    });
    $('suspend').addEventListener('click', function () {
      PartnersBridge.sendToVelo('setPartnerStatus', { partnerId: partnerId(), status: 'suspended' });
    });
    $('activate').addEventListener('click', function () {
      PartnersBridge.sendToVelo('setPartnerStatus', { partnerId: partnerId(), status: 'active' });
    });
  }

  function exposeGlobals() {
    /* No onclick globals needed - all buttons use addEventListener */
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
