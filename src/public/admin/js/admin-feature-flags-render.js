/* =========================================
   ADMIN FEATURE FLAGS — Render Module
   Depends on: FeatureFlagsConfig
   DOM rendering functions
   ========================================= */
var FeatureFlagsRender = (function () {
  'use strict';

  function renderFlags(flags) {
    var grid = document.getElementById('flagGrid');
    if (!flags || flags.length === 0) {
      grid.innerHTML =
        '<div class="col-span-full py-20 text-center">' +
          '<span class="material-symbols-outlined text-4xl text-slate-600 mb-2">flag</span>' +
          '<p class="text-slate-400">No feature flags found</p>' +
          '<button onclick="FeatureFlagsLogic.openCreateModal()" class="mt-4 text-blue-400 font-bold hover:underline">Create your first flag</button>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < flags.length; i++) {
      var flag = flags[i];
      var catColor = FeatureFlagsConfig.getCategoryColor(flag.category);
      var checkedAttr = flag.enabled ? 'checked' : '';
      var rulesCount = (flag.targetRules || []).length;

      html +=
        '<div class="bg-surface-dark border border-border-dark rounded-xl p-5 space-y-4 hover:border-slate-600 transition-colors">' +
          '<div class="flex items-start justify-between">' +
            '<div class="min-w-0">' +
              '<div class="flex items-center gap-2 mb-1">' +
                '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ' + catColor + '">' + flag.category + '</span>' +
                '<span class="text-xs text-slate-500 font-medium">' + flag.environment + '</span>' +
              '</div>' +
              '<h3 class="text-base font-bold truncate text-white" title="' + escapeAttr(flag.name) + '">' + escapeHtml(flag.name) + '</h3>' +
              '<code class="text-[10px] text-blue-400 bg-blue-400/10 px-1 rounded">' + escapeHtml(flag.key) + '</code>' +
            '</div>' +
            '<label class="relative inline-flex items-center cursor-pointer">' +
              '<input type="checkbox" ' + checkedAttr + ' onchange="FeatureFlagsLogic.toggleFlag(\'' + escapeAttr(flag.key) + '\', this.checked)" class="sr-only peer">' +
              '<div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>' +
            '</label>' +
          '</div>' +
          '<p class="text-xs text-slate-400 line-clamp-2 h-8">' + escapeHtml(flag.description || 'No description provided') + '</p>' +
          '<div class="space-y-2">' +
            '<div class="flex justify-between text-[10px] font-bold uppercase text-slate-500">' +
              '<span>Rollout</span>' +
              '<span class="text-blue-400">' + flag.rolloutPercentage + '%</span>' +
            '</div>' +
            '<div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">' +
              '<div class="h-full bg-blue-600" style="width: ' + flag.rolloutPercentage + '%"></div>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center justify-between pt-2 border-t border-border-dark/50">' +
            '<div class="flex items-center gap-3">' +
              '<div class="flex flex-col">' +
                '<span class="text-[9px] text-slate-500 font-bold uppercase">Rules</span>' +
                '<span class="text-xs font-medium">' + rulesCount + '</span>' +
              '</div>' +
              '<div class="flex flex-col">' +
                '<span class="text-[9px] text-slate-500 font-bold uppercase">Default</span>' +
                '<span class="text-xs font-medium text-slate-300">' + (flag.defaultValue ? 'True' : 'False') + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="flex gap-1">' +
              '<button onclick="FeatureFlagsLogic.editFlag(\'' + escapeAttr(flag.key) + '\')" class="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">' +
                '<span class="material-symbols-outlined text-[20px]">edit</span>' +
              '</button>' +
              '<button onclick="FeatureFlagsLogic.confirmDelete(\'' + escapeAttr(flag.key) + '\')" class="p-2 hover:bg-rose-900/30 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">' +
                '<span class="material-symbols-outlined text-[20px]">delete</span>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }
    grid.innerHTML = html;
  }

  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    var id = 'toast-' + Date.now();
    var bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-blue-600';
    var icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

    var toast = document.createElement('div');
    toast.id = id;
    toast.className = 'toast flex items-center gap-3 px-4 py-3 rounded-lg ' + bgColor + ' shadow-lg text-white';
    toast.innerHTML =
      '<span class="material-symbols-outlined text-[20px]">' + icon + '</span>' +
      '<span class="text-sm font-medium flex-1">' + message + '</span>' +
      '<button onclick="document.getElementById(\'' + id + '\').remove()" class="text-white/80 hover:text-white">' +
        '<span class="material-symbols-outlined text-[18px]">close</span>' +
      '</button>';
    container.appendChild(toast);
    setTimeout(function () {
      var el = document.getElementById(id);
      if (el) el.remove();
    }, 5000);
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  return {
    renderFlags: renderFlags,
    showToast: showToast
  };
})();
