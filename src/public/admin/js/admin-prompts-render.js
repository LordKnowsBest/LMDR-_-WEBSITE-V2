/* =========================================
   ADMIN PROMPTS — Render Module
   Depends on: AdminPromptsConfig
   DOM rendering functions
   ========================================= */
var AdminPromptsRender = (function () {
  'use strict';

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    var id = 'toast-' + Date.now();
    var bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-primary';
    var icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

    var toast = document.createElement('div');
    toast.id = id;
    toast.className = 'toast flex items-center gap-3 px-4 py-3 rounded-lg ' + bgColor + ' shadow-lg';
    toast.innerHTML =
      '<span class="material-symbols-outlined text-[20px]">' + icon + '</span>' +
      '<span class="text-sm font-medium flex-1">' + message + '</span>' +
      '<button onclick="document.getElementById(\'' + id + '\').remove()" class="text-white/80 hover:text-white">' +
        '<span class="material-symbols-outlined text-[18px]">close</span>' +
      '</button>';

    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 5000);
  }

  function renderCategoryFilters(categories) {
    var select = document.getElementById('categoryFilter');
    var modalSelect = document.getElementById('promptCategoryInput');
    var options = categories.map(function (c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
    select.innerHTML = '<option value="">All Categories</option>' + options;
    modalSelect.innerHTML = options;
  }

  function renderPrompts(prompts, categories) {
    var container = document.getElementById('promptsGrid');
    var search = document.getElementById('searchInput').value.toLowerCase();
    var category = document.getElementById('categoryFilter').value;
    var status = document.getElementById('statusFilter').value;

    var filtered = prompts;
    if (search) {
      filtered = filtered.filter(function (p) {
        return p.name.toLowerCase().includes(search) ||
               p.promptId.toLowerCase().includes(search) ||
               (p.description || '').toLowerCase().includes(search);
      });
    }
    if (category) {
      filtered = filtered.filter(function (p) { return p.category === category; });
    }
    if (status === 'active') {
      filtered = filtered.filter(function (p) { return p.isActive; });
    } else if (status === 'inactive') {
      filtered = filtered.filter(function (p) { return !p.isActive; });
    }

    if (filtered.length === 0) {
      container.innerHTML =
        '<div class="text-center py-12 col-span-full text-text-muted">' +
          '<span class="material-symbols-outlined text-4xl mb-2 block">search_off</span>No prompts found' +
        '</div>';
      return;
    }

    container.innerHTML = filtered.map(function (prompt) {
      var categoryInfo = categories.find(function (c) { return c.id === prompt.category; }) || { name: prompt.category };
      var statusColor = prompt.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400';
      var statusText = prompt.isActive ? 'Active' : 'Inactive';

      return '<div class="prompt-card bg-surface-dark border border-border-dark rounded-xl p-4 cursor-pointer" onclick="AdminPromptsLogic.openEditModal(\'' + prompt.promptId + '\')">' +
        '<div class="flex items-start justify-between mb-3">' +
          '<div class="flex-1 min-w-0">' +
            '<h3 class="font-semibold truncate">' + prompt.name + '</h3>' +
            '<p class="text-xs text-text-muted font-mono">' + prompt.promptId + '</p>' +
          '</div>' +
          '<span class="px-2 py-0.5 rounded text-[10px] font-bold ' + statusColor + '">' + statusText + '</span>' +
        '</div>' +
        '<p class="text-sm text-text-muted mb-3 line-clamp-2">' + (prompt.description || 'No description') + '</p>' +
        '<div class="flex items-center gap-2 mb-3">' +
          '<span class="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-[10px] font-medium">' + categoryInfo.name + '</span>' +
          '<span class="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-medium">' + prompt.provider + '</span>' +
        '</div>' +
        '<div class="flex items-center justify-between text-xs text-text-muted">' +
          '<span>v' + prompt.version + '</span>' +
          '<span>' + formatDate(prompt.updatedAt) + '</span>' +
        '</div>' +
        '<div class="flex items-center gap-2 mt-3 pt-3 border-t border-border-dark">' +
          '<button onclick="event.stopPropagation(); AdminPromptsLogic.viewVersions(\'' + prompt.promptId + '\')" class="flex-1 py-1.5 text-xs font-medium text-violet-400 hover:bg-violet-500/10 rounded transition-colors">' +
            '<span class="material-symbols-outlined text-[14px] align-middle mr-1">history</span>History</button>' +
          (prompt.isActive
            ? '<button onclick="event.stopPropagation(); AdminPromptsLogic.deletePrompt(\'' + prompt.promptId + '\')" class="flex-1 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded transition-colors"><span class="material-symbols-outlined text-[14px] align-middle mr-1">delete</span>Deactivate</button>'
            : '<button onclick="event.stopPropagation(); AdminPromptsLogic.restorePrompt(\'' + prompt.promptId + '\')" class="flex-1 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"><span class="material-symbols-outlined text-[14px] align-middle mr-1">restore</span>Restore</button>'
          ) +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderVersions(versions) {
    var container = document.getElementById('versionList');
    if (!versions || versions.length === 0) {
      container.innerHTML = '<p class="text-text-muted">No version history</p>';
      return;
    }

    container.innerHTML = versions.map(function (v) {
      return '<div class="p-4 bg-surface-darker rounded-lg mb-3 border border-border-dark">' +
        '<div class="flex items-center justify-between mb-2">' +
          '<span class="font-bold text-violet-400">Version ' + v.version + '</span>' +
          '<span class="text-xs text-text-muted">' + formatDate(v.createdAt) + '</span>' +
        '</div>' +
        '<p class="text-sm text-text-muted mb-2">' + (v.changeNote || 'No change note') + '</p>' +
        '<p class="text-xs text-text-muted">By: ' + v.createdBy + '</p>' +
        '<button onclick="AdminPromptsLogic.rollbackTo(\'' + v.promptId + '\', ' + v.version + ')" class="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 rounded text-xs font-medium transition-colors">Rollback to this version</button>' +
      '</div>';
    }).join('');
  }

  return {
    formatDate: formatDate,
    showToast: showToast,
    renderCategoryFilters: renderCategoryFilters,
    renderPrompts: renderPrompts,
    renderVersions: renderVersions
  };
})();
