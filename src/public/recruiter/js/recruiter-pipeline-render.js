/* =========================================
   RECRUITER PIPELINE — Render Module
   Depends on: PipelineConfig
   ========================================= */
var PipelineRender = (function () {
  'use strict';

  function showToast(message, type) {
    var existing = document.getElementById('toast-notification');
    if (existing) existing.remove();

    var colors = PipelineConfig.TOAST_COLORS;
    var toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'fixed top-4 right-4 z-[100] ' + (colors[type] || colors.info) + ' text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  function renderAutomationRules(rules) {
    var container = document.getElementById('automationRulesList');
    if (!rules.length) {
      container.innerHTML = '<p class="text-sm text-gray-500">No automation rules configured</p>';
      return;
    }

    var triggerLabels = PipelineConfig.TRIGGER_LABELS;

    container.innerHTML = rules.map(function (r) {
      var editButtons = !r.is_default
        ? '<button onclick=\'PipelineLogic.openAutomationRuleEditor(' + JSON.stringify(r).replace(/'/g, "\\'") + ')\' class="text-xs text-blue-400 hover:text-blue-300">Edit</button>' +
          '<button onclick="PipelineLogic.deleteAutomationRuleItem(\'' + r._id + '\')" class="text-xs text-red-400 hover:text-red-300">Delete</button>'
        : '<span class="text-xs text-gray-500">Default</span>';

      return '<div class="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3">' +
        '<div class="flex items-center gap-3 flex-1 min-w-0">' +
        '<label class="relative inline-flex items-center cursor-pointer">' +
        '<input type="checkbox" ' + (r.is_active ? 'checked' : '') + ' onchange="PipelineLogic.toggleAutomationRule(\'' + r._id + '\', this.checked)" class="sr-only peer">' +
        '<div class="w-9 h-5 bg-gray-700 peer-checked:bg-blue-600 rounded-full peer peer-checked:after:translate-x-full after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>' +
        '</label>' +
        '<div class="min-w-0">' +
        '<span class="text-sm text-white block truncate">' + r.rule_name + '</span>' +
        '<span class="text-xs text-gray-400">' + (triggerLabels[r.trigger_event] || r.trigger_event) + (r.from_stage ? ' from ' + r.from_stage : '') + (r.to_stage ? ' → ' + r.to_stage : '') + '</span>' +
        '</div></div>' +
        '<div class="flex gap-2 ml-2">' + editButtons + '</div></div>';
    }).join('');
  }

  function renderAutomationLog(entries) {
    var container = document.getElementById('automationLogList');
    if (!entries.length) {
      container.innerHTML = '<p class="text-sm text-gray-500">No automation activity yet</p>';
      return;
    }

    container.innerHTML = entries.slice(0, 20).map(function (e) {
      var date = new Date(e.executed_at).toLocaleString();
      var statusColor = e.success ? 'text-green-400' : 'text-red-400';
      var statusIcon = e.success ? '\u2713' : '\u2717';
      return '<div class="flex items-center justify-between py-2 border-b border-gray-700/50">' +
        '<div class="flex-1 min-w-0">' +
        '<span class="text-sm text-white">' + (e.trigger_event || '') + (e.to_stage ? ' \u2192 ' + e.to_stage : '') + '</span>' +
        '<span class="text-xs text-gray-400 block">' + date + '</span>' +
        '</div>' +
        '<span class="' + statusColor + ' text-sm">' + statusIcon + '</span>' +
        '</div>';
    }).join('');
  }

  return {
    showToast: showToast,
    renderAutomationRules: renderAutomationRules,
    renderAutomationLog: renderAutomationLog
  };
})();
