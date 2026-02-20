/* =========================================
   ADMIN EMAIL TEMPLATES — Render Module
   Depends on: EmailTemplatesConfig
   DOM rendering functions
   ========================================= */
var EmailTemplatesRender = (function () {
  'use strict';

  function renderTemplates(templates) {
    var grid = document.getElementById('templateGrid');
    if (!templates || templates.length === 0) {
      grid.innerHTML =
        '<div class="col-span-full py-20 text-center">' +
          '<span class="material-symbols-outlined text-4xl text-slate-600 mb-2">email</span>' +
          '<p class="text-slate-400">No email templates found</p>' +
          '<button onclick="EmailTemplatesLogic.openCreateModal()" class="mt-4 text-blue-400 font-bold hover:underline">Create your first template</button>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < templates.length; i++) {
      var t = templates[i];
      var catColor = EmailTemplatesConfig.getCategoryColor(t.category);
      var activeLabel = t.isActive
        ? '<span class="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold uppercase">Active</span>'
        : '<span class="px-1.5 py-0.5 bg-slate-500/20 text-slate-400 rounded text-[10px] font-bold uppercase">Draft</span>';

      html +=
        '<div class="bg-surface-dark border border-border-dark rounded-xl p-5 space-y-4 hover:border-slate-600 transition-colors group">' +
          '<div class="flex items-start justify-between">' +
            '<div class="min-w-0">' +
              '<div class="flex items-center gap-2 mb-1">' +
                '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ' + catColor + '">' + t.category + '</span>' +
                activeLabel +
              '</div>' +
              '<h3 class="text-base font-bold truncate text-white" title="' + escapeAttr(t.name) + '">' + escapeHtml(t.name) + '</h3>' +
              '<code class="text-[10px] text-blue-400 bg-blue-400/10 px-1 rounded">' + escapeHtml(t.templateKey) + '</code>' +
            '</div>' +
            '<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">' +
              '<button onclick="EmailTemplatesLogic.editTemplate(\'' + escapeAttr(t.templateKey) + '\')" class="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">' +
                '<span class="material-symbols-outlined text-[20px]">edit</span>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="bg-surface-darker rounded-lg p-3 space-y-1">' +
            '<p class="text-[10px] font-bold text-slate-500 uppercase">Subject</p>' +
            '<p class="text-xs text-slate-300 truncate">' + escapeHtml(t.subject || 'No subject') + '</p>' +
          '</div>' +
          '<div class="flex items-center justify-between pt-2 border-t border-border-dark/50">' +
            '<div class="flex items-center gap-3">' +
              '<div class="flex flex-col">' +
                '<span class="text-[9px] text-slate-500 font-bold uppercase">Version</span>' +
                '<span class="text-xs font-medium text-white">' + (t.version || 1) + '</span>' +
              '</div>' +
              '<div class="flex flex-col">' +
                '<span class="text-[9px] text-slate-500 font-bold uppercase">Updated</span>' +
                '<span class="text-xs font-medium text-slate-400">' + formatDate(t.updatedAt) + '</span>' +
              '</div>' +
            '</div>' +
            '<button onclick="EmailTemplatesLogic.previewTemplateInModal(\'' + escapeAttr(t.templateKey) + '\')" class="text-xs font-bold text-blue-400 hover:text-blue-300">Quick View</button>' +
          '</div>' +
        '</div>';
    }
    grid.innerHTML = html;
  }

  function updatePreview(quill) {
    var content = quill.root.innerHTML;
    var mockData = EmailTemplatesConfig.MOCK_PREVIEW_DATA;
    var rendered = content;
    var keys = Object.keys(mockData);
    for (var i = 0; i < keys.length; i++) {
      var regex = new RegExp('\\{\\{' + keys[i] + '\\}\\}', 'g');
      rendered = rendered.replace(regex, mockData[keys[i]]);
    }
    document.getElementById('emailPreview').innerHTML = rendered;
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

  function formatDate(date) {
    if (!date) return 'Never';
    var d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    renderTemplates: renderTemplates,
    updatePreview: updatePreview,
    showToast: showToast,
    formatDate: formatDate
  };
})();
