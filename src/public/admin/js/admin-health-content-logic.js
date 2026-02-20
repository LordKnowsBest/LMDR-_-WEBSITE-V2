/* =========================================
   Admin Health Content — Logic Module
   Depends on: HealthContentBridge, marked.js
   ========================================= */
var HealthContentLogic = (function () {
  'use strict';

  var resources = [];
  var tips = [];

  function init() {
    HealthContentBridge.listen({
      resourcesList: function (data) { resources = data; renderResources(); },
      tipsList: function (data) { tips = data; renderTips(); updatePendingCount(); }
    });

    var titleEl = document.getElementById('edit-title');
    if (titleEl) {
      titleEl.addEventListener('input', function (e) {
        if (!document.getElementById('edit-id').value) {
          document.getElementById('edit-slug').value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
      });
    }

    HealthContentBridge.sendToVelo('ready');
    HealthContentBridge.sendToVelo('getResources');
  }

  function switchTab(tab) {
    var buttons = document.querySelectorAll('button[id^="tab-"]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove('tab-active', 'border-blue-600', 'text-blue-600');
    }
    document.getElementById('tab-' + tab).classList.add('tab-active', 'border-blue-600', 'text-blue-600');
    document.getElementById('view-resources').classList.add('hidden');
    document.getElementById('view-tips').classList.add('hidden');
    document.getElementById('view-' + tab).classList.remove('hidden');
    if (tab === 'resources') HealthContentBridge.sendToVelo('getResources');
    if (tab === 'tips') HealthContentBridge.sendToVelo('getPendingTips');
  }

  function renderResources() {
    var tbody = document.getElementById('resources-list');
    tbody.innerHTML = resources.map(function (r) {
      return '<tr class="hover:bg-slate-50 group"><td class="py-3 pl-2"><div class="font-medium text-slate-900">' + esc(r.title) + '</div><div class="text-xs text-slate-400 font-mono">/' + esc(r.slug) + '</div></td><td class="py-3"><span class="px-2 py-1 bg-slate-100 rounded text-xs font-medium uppercase tracking-wide text-slate-600">' + esc(r.category) + '</span></td><td class="py-3 text-xs text-slate-500"><div class="flex gap-3"><span><i class="fa-solid fa-eye mr-1"></i> ' + (r.view_count || 0) + '</span><span><i class="fa-solid fa-thumbs-up mr-1"></i> ' + (r.helpful_count || 0) + '</span></div></td><td class="py-3">' + (r.is_featured ? '<span class="text-amber-600 text-xs font-bold"><i class="fa-solid fa-star mr-1"></i> Featured</span>' : '<span class="text-slate-400 text-xs">Standard</span>') + '</td><td class="py-3 text-right pr-2"><button onclick="editResource(\'' + esc(r._id) + '\')" class="text-blue-600 hover:text-blue-800 p-2"><i class="fa-solid fa-pen-to-square"></i></button><button onclick="deleteResource(\'' + esc(r._id) + '\')" class="text-red-400 hover:text-red-600 p-2"><i class="fa-solid fa-trash"></i></button></td></tr>';
    }).join('');
  }

  function renderTips() {
    var list = document.getElementById('tips-list');
    if (tips.length === 0) { list.innerHTML = '<div class="text-center py-10 text-slate-400">No pending tips to moderate.</div>'; return; }
    list.innerHTML = tips.map(function (tip) {
      return '<div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex gap-4"><div class="flex-1"><div class="flex items-center justify-between mb-2"><span class="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wide text-slate-500">' + esc(tip.category) + '</span><span class="text-xs text-slate-400">' + new Date(tip.created_at).toLocaleDateString() + '</span></div><h4 class="font-bold text-slate-900 mb-1">' + esc(tip.title) + '</h4><p class="text-slate-600 text-sm italic">"' + esc(tip.tip_text) + '"</p></div><div class="flex flex-col gap-2 justify-center border-l border-slate-100 pl-4"><button onclick="moderateTip(\'' + esc(tip._id) + '\', \'approve\')" class="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1"><i class="fa-solid fa-check"></i> Approve</button><button onclick="moderateTip(\'' + esc(tip._id) + '\', \'reject\')" class="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1"><i class="fa-solid fa-xmark"></i> Reject</button></div></div>';
    }).join('');
  }

  function updatePendingCount() {
    var count = tips.length;
    var badge = document.getElementById('pending-count');
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }

  function moderateTip(id, action) {
    HealthContentBridge.sendToVelo('moderateTip', { id: id, action: action });
    tips = tips.filter(function (t) { return t._id !== id; });
    renderTips();
    updatePendingCount();
  }

  function editResource(id) {
    var r = null;
    for (var i = 0; i < resources.length; i++) { if (resources[i]._id === id) { r = resources[i]; break; } }
    if (!r) return;
    document.getElementById('editor-title').textContent = 'Edit Resource';
    document.getElementById('edit-id').value = r._id;
    document.getElementById('edit-title').value = r.title;
    document.getElementById('edit-slug').value = r.slug;
    document.getElementById('edit-category').value = r.category;
    document.getElementById('edit-thumbnail').value = (r.thumbnail && r.thumbnail.url) || '';
    document.getElementById('edit-summary').value = r.summary || '';
    document.getElementById('edit-content').value = r.content || '';
    document.getElementById('edit-featured').checked = r.is_featured || false;
    updatePreview();
    document.getElementById('editor-modal').classList.remove('hidden');
  }

  function openResourceModal() {
    document.getElementById('editor-title').textContent = 'New Resource';
    document.getElementById('edit-id').value = '';
    document.getElementById('edit-title').value = '';
    document.getElementById('edit-slug').value = '';
    document.getElementById('edit-category').value = 'exercise';
    document.getElementById('edit-thumbnail').value = '';
    document.getElementById('edit-summary').value = '';
    document.getElementById('edit-content').value = '';
    document.getElementById('edit-featured').checked = false;
    updatePreview();
    document.getElementById('editor-modal').classList.remove('hidden');
  }

  function closeEditor() { document.getElementById('editor-modal').classList.add('hidden'); }

  function updatePreview() {
    var content = document.getElementById('edit-content').value;
    document.getElementById('preview-content').innerHTML = marked.parse(content);
  }

  function saveResource() {
    var data = {
      _id: document.getElementById('edit-id').value || null,
      title: document.getElementById('edit-title').value,
      slug: document.getElementById('edit-slug').value,
      category: document.getElementById('edit-category').value,
      thumbnail: { url: document.getElementById('edit-thumbnail').value },
      summary: document.getElementById('edit-summary').value,
      content: document.getElementById('edit-content').value,
      is_featured: document.getElementById('edit-featured').checked
    };
    HealthContentBridge.sendToVelo('saveResource', data);
    closeEditor();
  }

  function deleteResource(id) {
    if (confirm('Are you sure you want to delete this resource?')) {
      HealthContentBridge.sendToVelo('deleteResource', { id: id });
    }
  }

  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  function exposeGlobals() {
    window.switchTab = switchTab;
    window.openResourceModal = openResourceModal;
    window.closeEditor = closeEditor;
    window.saveResource = saveResource;
    window.editResource = editResource;
    window.deleteResource = deleteResource;
    window.moderateTip = moderateTip;
    window.updatePreview = updatePreview;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
