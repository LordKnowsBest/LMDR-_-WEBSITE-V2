/* =========================================
   Admin Content Moderation — Logic Module
   Depends on: ContentBridge
   ========================================= */
var ContentLogic = (function () {
  'use strict';

  var currentFilter = 'all';
  var queueData = [];
  var THEME_KEY = 'lmdr-admin-theme';

  function init() {
    ContentBridge.listen({
      moderationQueueLoaded: function (d) {
        queueData = (d.payload && d.payload.items) || [];
        renderQueue();
        updateCounts(d.payload && d.payload.total);
      },
      actionSuccess: function (d) {
        if (d.payload && d.payload.id) {
          queueData = queueData.filter(function (i) { return i.id !== d.payload.id; });
        }
        renderQueue();
        updateCounts(queueData.length);
      }
    });
    initTheme();
    ContentBridge.sendToVelo({ action: 'getModerationQueue' });
  }

  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    var theme = saved || 'dark';
    applyTheme(theme);
  }

  function applyTheme(theme) {
    var html = document.documentElement;
    var sun = document.getElementById('themeIconSun');
    var moon = document.getElementById('themeIconMoon');
    if (theme === 'dark') {
      html.classList.add('dark'); html.classList.remove('light');
      if (sun) sun.classList.remove('hidden');
      if (moon) moon.classList.add('hidden');
    } else {
      html.classList.remove('dark'); html.classList.add('light');
      if (sun) sun.classList.add('hidden');
      if (moon) moon.classList.remove('hidden');
    }
  }

  function toggleTheme() {
    var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  function loadQueue() { ContentBridge.sendToVelo({ action: 'getModerationQueue' }); }

  function setFilter(filter) {
    currentFilter = filter;
    var btns = document.querySelectorAll('nav button');
    for (var i = 0; i < btns.length; i++) {
      var isActive = btns[i].id === 'nav-' + filter;
      if (isActive) {
        btns[i].className = 'w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surface-dark dark:bg-surface-dark text-text-dark dark:text-white font-medium border border-border-light dark:border-border-dark shadow-sm';
      } else {
        btns[i].className = 'w-full flex items-center justify-between px-4 py-2 rounded-lg text-text-muted hover:bg-surface-dark hover:text-text-dark dark:hover:text-white transition-colors';
      }
    }
    renderQueue();
  }

  function updateCounts(total) {
    var badge = document.getElementById('count-all');
    if (badge) badge.textContent = total || 0;
  }

  function renderQueue() {
    var container = document.getElementById('queue-container');
    var filtered = currentFilter === 'all' ? queueData : queueData.filter(function (i) {
      return i.type === currentFilter || (currentFilter === 'documents' && i.type === 'document');
    });
    if (filtered.length === 0) {
      container.innerHTML = '<div class="text-center py-16 border-2 border-dashed border-border-dark rounded-xl"><div class="w-16 h-16 bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-4"><span class="material-symbols-outlined text-4xl text-emerald-500">check_circle</span></div><h3 class="text-lg font-bold">All caught up!</h3><p class="text-text-muted">No pending items in this queue.</p></div>';
      return;
    }
    container.innerHTML = filtered.map(function (item) { return createCard(item); }).join('');
  }

  function createCard(item) {
    if (item.type === 'review') return createReviewCard(item);
    if (item.type === 'job') return createJobCard(item);
    if (item.type === 'document') return createDocumentCard(item);
    return '';
  }

  function createReviewCard(item) {
    return '<div class="bg-surface-dark border border-border-dark rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"><div class="flex justify-between items-start mb-4"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20"><span class="material-symbols-outlined text-2xl">star</span></div><div><h3 class="font-bold text-lg leading-tight">Review for ' + esc(item.title) + '</h3><p class="text-sm text-text-muted mt-0.5">By ' + esc(item.subtitle) + ' &bull; ' + formatDate(item.timestamp) + '</p></div></div><span class="px-2 py-1 rounded bg-surface-darker text-xs text-text-muted font-mono border border-border-dark">ID: ' + esc((item.id || '').slice(0, 6)) + '</span></div><div class="bg-surface-darker p-4 rounded-lg mb-5 text-sm leading-relaxed border border-border-dark italic text-text-muted">"' + esc((item.data && item.data.content) || 'No content provided') + '"<div class="mt-3 flex gap-1">' + renderStars((item.data && item.data.rating) || 0) + '</div></div><div class="flex justify-end gap-3 border-t border-border-dark pt-4"><button onclick="handleAction(\'reject\', \'' + esc(item.id) + '\', \'review\')" class="px-5 py-2.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold transition-all">Reject</button><button onclick="handleAction(\'approve\', \'' + esc(item.id) + '\', \'review\')" class="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all">Approve Review</button></div></div>';
  }

  function createJobCard(item) {
    return '<div class="bg-surface-dark border border-border-dark rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"><div class="flex justify-between items-start mb-4"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-600/20"><span class="material-symbols-outlined text-2xl">work</span></div><div><h3 class="font-bold text-lg leading-tight">' + esc(item.title) + '</h3><p class="text-sm text-text-muted mt-0.5">' + esc(item.subtitle) + ' &bull; ' + formatDate(item.timestamp) + '</p></div></div><span class="px-2 py-1 rounded bg-surface-darker text-xs text-text-muted font-mono border border-border-dark">ID: ' + esc((item.id || '').slice(0, 6)) + '</span></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-sm"><div class="bg-surface-darker p-3 rounded border border-border-dark"><span class="text-text-muted block text-xs mb-1 uppercase tracking-wider font-bold">Pay Range</span><span class="font-medium">' + esc((item.data && item.data.pay_range) || 'Not specified') + '</span></div><div class="bg-surface-darker p-3 rounded border border-border-dark"><span class="text-text-muted block text-xs mb-1 uppercase tracking-wider font-bold">Experience</span><span class="font-medium">' + esc((item.data && item.data.experience_required) || 'Not specified') + '</span></div></div><div class="flex justify-end gap-3 border-t border-border-dark pt-4"><button onclick="handleAction(\'reject\', \'' + esc(item.id) + '\', \'job\')" class="px-5 py-2.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold transition-all">Reject</button><button onclick="handleAction(\'approve\', \'' + esc(item.id) + '\', \'job\')" class="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all">Approve Post</button></div></div>';
  }

  function createDocumentCard(item) {
    return '<div class="bg-surface-dark border border-border-dark rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"><div class="flex justify-between items-start mb-4"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center border border-violet-600/20"><span class="material-symbols-outlined text-2xl">description</span></div><div><h3 class="font-bold text-lg leading-tight">' + esc(item.title) + ' Verification</h3><p class="text-sm text-text-muted mt-0.5">Driver: ' + esc(item.subtitle) + ' &bull; ' + formatDate(item.timestamp) + '</p></div></div><span class="px-2 py-1 rounded bg-surface-darker text-xs text-text-muted font-mono border border-border-dark">ID: ' + esc((item.id || '').slice(0, 6)) + '</span></div><div class="mb-5"><div class="h-56 bg-surface-darker rounded-lg flex items-center justify-center overflow-hidden border border-border-dark relative group"><img src="' + esc(item.data) + '" class="max-h-full max-w-full object-contain"><div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"><button onclick="openImageModal(\'' + esc(item.data) + '\')" class="px-5 py-2.5 bg-white text-slate-900 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2"><span class="material-symbols-outlined">zoom_in</span> View Fullscreen</button></div></div></div><div class="flex justify-end gap-3 border-t border-border-dark pt-4"><button onclick="handleAction(\'reject\', \'' + esc(item.id) + '\', \'document\', \'' + esc(item.subtype) + '\')" class="px-5 py-2.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold transition-all">Reject</button><button onclick="handleAction(\'approve\', \'' + esc(item.id) + '\', \'document\', \'' + esc(item.subtype) + '\')" class="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all">Verify Document</button></div></div>';
  }

  function handleAction(actionType, id, type, subtype) {
    var reason = null;
    if (actionType === 'reject') {
      reason = prompt('Reason for rejection:');
      if (reason === null) return;
    }
    ContentBridge.sendToVelo({
      action: 'performModeration',
      payload: {
        id: id, type: type, subtype: subtype || null,
        status: actionType === 'approve' ? (type === 'document' ? 'verified' : 'approved') : 'rejected',
        reason: reason
      }
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function renderStars(rating) {
    var html = '';
    for (var i = 0; i < 5; i++) {
      html += '<span class="material-symbols-outlined text-[18px] ' + (i < rating ? 'text-accent fill-current' : 'text-slate-600') + '">star</span>';
    }
    return html;
  }

  function openImageModal(src) {
    var modal = document.getElementById('imageModal');
    document.getElementById('modalImage').src = src;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeImageModal() {
    var modal = document.getElementById('imageModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('modalImage').src = '';
  }

  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  function exposeGlobals() {
    window.toggleTheme = toggleTheme;
    window.loadQueue = loadQueue;
    window.setFilter = setFilter;
    window.handleAction = handleAction;
    window.openImageModal = openImageModal;
    window.closeImageModal = closeImageModal;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
