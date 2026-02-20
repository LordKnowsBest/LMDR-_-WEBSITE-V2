/* =========================================
   ADMIN PLATFORM CONFIG — Render Module
   Depends on: PlatformConfigConfig
   DOM rendering functions
   ========================================= */
var PlatformConfigRender = (function () {
  'use strict';

  function renderWeightSliders(prefix, weights, labels) {
    var container = document.getElementById(prefix + 'WeightsList');
    container.innerHTML = '';

    Object.keys(weights).forEach(function (key) {
      var value = weights[key];
      var div = document.createElement('div');
      div.className = 'slider-container';
      div.innerHTML =
        '<div class="flex justify-between items-center mb-2">' +
          '<label class="text-sm text-slate-300 font-medium">' + (labels[key] || key) + '</label>' +
          '<span class="text-sm font-bold text-indigo-400" id="' + prefix + '_val_' + key + '">' + value + '%</span>' +
        '</div>' +
        '<input type="range" min="0" max="100" value="' + value + '" ' +
          'oninput="PlatformConfigRender.updateWeightDisplay(\'' + prefix + '\', \'' + key + '\', this.value)" ' +
          'data-key="' + key + '" class="' + prefix + '-weight-slider">';
      container.appendChild(div);
    });

    updateTotal(prefix);
  }

  function updateWeightDisplay(prefix, key, value) {
    document.getElementById(prefix + '_val_' + key).textContent = value + '%';
    updateTotal(prefix);
  }

  function updateTotal(prefix) {
    var sliders = document.querySelectorAll('.' + prefix + '-weight-slider');
    var total = 0;
    sliders.forEach(function (s) { total += parseInt(s.value); });

    var totalDisplay = document.getElementById(prefix + 'WeightsTotal');
    totalDisplay.textContent = 'Total: ' + total + '%';

    if (total !== 100) {
      totalDisplay.classList.remove('bg-indigo-500/20', 'text-indigo-400');
      totalDisplay.classList.add('bg-amber-500/20', 'text-amber-400');
    } else {
      totalDisplay.classList.remove('bg-amber-500/20', 'text-amber-400');
      totalDisplay.classList.add('bg-indigo-500/20', 'text-indigo-400');
    }
  }

  function populateSystemSettings(settings) {
    Object.keys(settings).forEach(function (key) {
      var input = document.getElementById(key);
      if (input) input.value = settings[key];
    });

    var status = document.getElementById('maintenanceStatus');
    var btn = document.getElementById('maintenanceToggle');
    if (settings.maintenance_mode) {
      status.textContent = 'Active';
      status.className = 'text-xs font-bold px-2 py-1 rounded bg-red-500/20 text-red-400 uppercase';
      btn.textContent = 'Disable';
      btn.className = 'touch-target px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors';
    } else {
      status.textContent = 'Inactive';
      status.className = 'text-xs font-bold px-2 py-1 rounded bg-slate-700 text-slate-400 uppercase';
      btn.textContent = 'Enable';
      btn.className = 'touch-target px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors';
    }
  }

  function renderTierLimits(limits) {
    var container = document.getElementById('tierLimitsGrid');
    var html = '';
    Object.keys(limits).forEach(function (tier) {
      var values = limits[tier];
      html +=
        '<div class="glass-card p-6">' +
          '<h3 class="text-lg font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">' + tier + '</h3>' +
          '<div class="space-y-4">' +
            '<div>' +
              '<label class="text-xs text-slate-500 uppercase font-bold block mb-1">Match Results</label>' +
              '<input type="number" data-tier="' + tier + '" data-field="match_results" value="' + values.match_results + '" class="tier-input w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">' +
            '</div>' +
            '<div>' +
              '<label class="text-xs text-slate-500 uppercase font-bold block mb-1">Profile Views</label>' +
              '<input type="number" data-tier="' + tier + '" data-field="profile_views" value="' + values.profile_views + '" class="tier-input w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">' +
              '<p class="text-[10px] text-slate-500 mt-1">(-1 for unlimited)</p>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function renderJobs(jobsList) {
    var container = document.getElementById('jobsList');
    var html = '';
    jobsList.forEach(function (job) {
      var statusClass = job.lastStatus === 'success'
        ? 'bg-green-500/10 text-green-400'
        : (job.lastStatus === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-400');
      html +=
        '<tr class="hover:bg-slate-800/30 transition-colors">' +
          '<td class="px-6 py-4">' +
            '<div class="font-medium text-white">' + job.name + '</div>' +
            '<div class="text-xs text-slate-500">' + job.service + '.' + job.function + '</div>' +
          '</td>' +
          '<td class="px-6 py-4 text-sm text-slate-400">' +
            (job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : 'Never') +
          '</td>' +
          '<td class="px-6 py-4">' +
            '<span class="px-2 py-1 rounded-full text-xs font-bold uppercase ' + statusClass + '">' +
              job.lastStatus +
            '</span>' +
          '</td>' +
          '<td class="px-6 py-4">' +
            '<button onclick="PlatformConfigLogic.triggerJob(\'' + job.id + '\')" class="text-indigo-400 hover:text-indigo-300 font-bold text-sm">' +
              'Run Now' +
            '</button>' +
          '</td>' +
        '</tr>';
    });
    container.innerHTML = html;
  }

  function populateUISettings(settings) {
    var banner = settings.announcement_banner || {};
    document.getElementById('banner_enabled').checked = banner.enabled;
    document.getElementById('banner_text').value = banner.text || '';
    document.getElementById('banner_link').value = banner.link || '';
    document.getElementById('banner_type').value = banner.type || 'info';
  }

  function setLoading(active) {
    document.getElementById('loadingOverlay').classList.toggle('active', active);
  }

  function showToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    setTimeout(function () { toast.classList.remove('show'); }, 3000);
  }

  return {
    renderWeightSliders: renderWeightSliders,
    updateWeightDisplay: updateWeightDisplay,
    updateTotal: updateTotal,
    populateSystemSettings: populateSystemSettings,
    renderTierLimits: renderTierLimits,
    renderJobs: renderJobs,
    populateUISettings: populateUISettings,
    setLoading: setLoading,
    showToast: showToast
  };
})();
