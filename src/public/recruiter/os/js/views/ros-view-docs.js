// ============================================================================
// ROS-VIEW-DOCS — Document Management (CDL, Medical Card, MVR)
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'docs';
    const MESSAGES = ['driverDocsLoaded', 'docUploaded', 'ocrComplete'];

    let documents = [];
    let stats = { total: 0, verified: 0, expired: 0, pending: 0 };

    function render() {
        return `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">folder_supervised</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Documents</h2>
        </div>
        <button onclick="ROS.views._docs.upload()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-600 text-white text-[12px] font-bold">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">upload_file</span>Upload Doc
        </button>
      </div>

      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-teal-500 text-[18px]">description</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.total}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total Docs</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.verified}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Verified</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-amber-400 text-[18px]">hourglass_top</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.pending}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Pending</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-red-400 text-[18px]">warning</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.expired}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Expired</p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-3">
        ${renderDocType('CDL License', 'badge', 'text-blue-400')}
        ${renderDocType('Medical Card', 'medical_information', 'text-emerald-500')}
        ${renderDocType('Motor Vehicle Record', 'directions_car', 'text-amber-400')}
        ${renderDocType('Drug Test Results', 'biotech', 'text-teal-400')}
        ${renderDocType('Background Check', 'shield_person', 'text-purple-400')}
        ${renderDocType('Employment History', 'work_history', 'text-sky-400')}
      </div>

      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Recent Documents</h3>
        ${renderDocList()}
      </div>`;
    }

    function renderDocType(name, icon, color) {
        const count = documents.filter(d => d.type === name).length;
        return `<div class="neu-x rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform">
      <span class="material-symbols-outlined ${color} text-[20px]">${icon}</span>
      <div><p class="text-[11px] font-bold text-lmdr-dark">${name}</p><p class="text-[9px] text-tan">${count} files</p></div>
    </div>`;
    }

    function renderDocList() {
        if (!documents.length) return `<div class="neu-in rounded-xl p-8 text-center"><span class="material-symbols-outlined text-tan/30 text-[32px]">folder_open</span><p class="text-[12px] text-tan mt-2">No documents uploaded yet.</p></div>`;
        return `<div class="space-y-2">${documents.slice(0, 10).map(d => `
      <div class="neu-x rounded-xl p-3 flex items-center justify-between">
        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-teal-400 text-[16px]">description</span><div><p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(d.name || d.type)}</p><p class="text-[9px] text-tan">${d.driver || 'Unknown'} · ${d.uploadDate || 'Today'}</p></div></div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status === 'verified' ? 'bg-emerald-500/15 text-emerald-500' : d.status === 'expired' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'}">${d.status || 'pending'}</span>
      </div>`).join('')}</div>`;
    }

    function onMount() { ROS.bridge.sendToVelo('fetchDriverDocs', {}); }
    function onUnmount() { documents = []; }
    function onMessage(type, payload) {
        if (type === 'driverDocsLoaded') { documents = payload.docs || []; stats = payload.stats || stats; refreshContent(); }
        if (type === 'docUploaded') { showToast('Document uploaded!'); ROS.bridge.sendToVelo('fetchDriverDocs', {}); }
        if (type === 'ocrComplete') { showToast('OCR extraction complete!'); }
    }
    function refreshContent() { const s = document.getElementById('ros-stage'); if (s) s.innerHTML = render(); }
    function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function showToast(msg) { const t = document.createElement('div'); t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2'; t.style.animation = 'fadeUp .3s ease'; t.innerHTML = `<span class="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>${msg}`; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }

    ROS.views._docs = { upload() { showToast('Document upload — opening file picker...'); } };
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
