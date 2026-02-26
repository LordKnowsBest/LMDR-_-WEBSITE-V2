// ============================================================================
// ROS-VIEW-JOB-BOARDS — Job Board Distribution & Syndication
// Ported from: Recruiter_Job_Boards.html
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'job-boards';
    const MESSAGES = ['jobBoardsLoaded', 'jobPostingsLoaded', 'jobPosted', 'jobBoardConnected'];

    // ── State ──
    let boards = [];
    let postings = [];
    let activeTab = 'postings';

    // ── Render ──
    function render() {
        return `
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">campaign</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Job Boards</h2>
        </div>
        <button onclick="ROS.views._jobBoards.openPost()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white text-[12px] font-bold">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">add</span>Post Job
        </button>
      </div>

      <!-- Stats Strip -->
      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-sky-500 text-[18px]">developer_board</span>
          <h3 id="jb-stat-boards" class="text-[20px] font-black text-lmdr-dark mt-0.5">${boards.length}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Boards</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">article</span>
          <h3 id="jb-stat-live" class="text-[20px] font-black text-lmdr-dark mt-0.5">${postings.filter(p => p.status === 'live').length}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Live Postings</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-amber-500 text-[18px]">visibility</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${postings.reduce((s, p) => s + (p.views || 0), 0).toLocaleString()}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total Views</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-lmdr-blue text-[18px]">person_add</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${postings.reduce((s, p) => s + (p.applies || 0), 0)}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Applies</p>
        </div>
      </div>

      <!-- Connected Boards -->
      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Connected Job Boards</h3>
        <div class="grid grid-cols-3 gap-3" id="jb-board-cards">
          ${renderBoards()}
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 mt-5 border-b border-tan/20 pb-0">
        <button onclick="ROS.views._jobBoards.switchTab('postings')" class="pb-2 text-[12px] font-bold ${activeTab === 'postings' ? 'text-lmdr-blue border-b-2 border-lmdr-blue' : 'text-tan'}">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">article</span>Job Postings
        </button>
        <button onclick="ROS.views._jobBoards.switchTab('applications')" class="pb-2 text-[12px] font-bold ${activeTab === 'applications' ? 'text-lmdr-blue border-b-2 border-lmdr-blue' : 'text-tan'}">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">groups</span>Applications
        </button>
      </div>

      <!-- Content -->
      <div class="mt-4" id="jb-tab-content">
        ${activeTab === 'postings' ? renderPostings() : renderApplications()}
      </div>

      <!-- Modal container -->
      <div id="jb-modal" class="hidden"></div>`;
    }

    // ── Render Helpers ──
    function renderBoards() {
        const defaultBoards = [
            { name: 'Indeed', icon: 'work', color: 'text-blue-400', connected: false },
            { name: 'ZipRecruiter', icon: 'bolt', color: 'text-emerald-400', connected: false },
            { name: 'CDLJobs', icon: 'local_shipping', color: 'text-amber-400', connected: false }
        ];
        const merged = defaultBoards.map(db => {
            const found = boards.find(b => b.name === db.name);
            return { ...db, connected: found ? true : db.connected };
        });
        return merged.map(b => `
      <div class="neu-x rounded-xl p-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined ${b.color} text-[18px]">${b.icon}</span>
          <div>
            <p class="text-[12px] font-bold text-lmdr-dark">${b.name}</p>
            <p class="text-[9px] text-tan">${b.connected ? 'Connected' : 'Not connected'}</p>
          </div>
        </div>
        <button onclick="ROS.views._jobBoards.connectBoard('${b.name}')" class="px-2 py-1 rounded-lg text-[10px] font-bold ${b.connected ? 'neu-ins text-emerald-500' : 'neu-x text-lmdr-blue'}">
          ${b.connected ? '✓ Active' : 'Connect'}
        </button>
      </div>`).join('');
    }

    function renderPostings() {
        if (!postings.length) {
            return `<div class="neu-in rounded-xl p-8 text-center">
        <span class="material-symbols-outlined text-tan/30 text-[32px]">article</span>
        <p class="text-[12px] text-tan mt-2">No job postings yet. Click "Post Job" to syndicate across boards.</p>
      </div>`;
        }
        return `<div class="space-y-2">
      ${postings.map(p => `
        <div class="neu-x rounded-xl p-3 flex items-center justify-between">
          <div class="flex-1">
            <p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(p.title)}</p>
            <p class="text-[10px] text-tan">${escapeHtml(p.location || 'Nationwide')} · ${p.boards || 0} boards</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'live' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}">${p.status || 'draft'}</span>
            <span class="text-[10px] text-tan">${p.views || 0} views</span>
          </div>
        </div>`).join('')}
    </div>`;
    }

    function renderApplications() {
        return `<div class="neu-in rounded-xl p-8 text-center">
      <span class="material-symbols-outlined text-tan/30 text-[32px]">groups</span>
      <p class="text-[12px] text-tan mt-2">Applications received from job board postings will appear here.</p>
    </div>`;
    }

    // ── Lifecycle ──
    function onMount() {
        ROS.bridge.sendToVelo('fetchJobBoards', {});
    }

    function onUnmount() {
        boards = [];
        postings = [];
    }

    function onMessage(type, payload) {
        switch (type) {
            case 'jobBoardsLoaded':
                boards = payload.boards || [];
                postings = payload.postings || [];
                refreshContent();
                break;
            case 'jobPostingsLoaded':
                postings = payload || [];
                refreshContent();
                break;
            case 'jobPosted':
                showToast('Job posted successfully!');
                ROS.bridge.sendToVelo('fetchJobBoards', {});
                break;
            case 'jobBoardConnected':
                showToast(payload.name + ' connected!');
                ROS.bridge.sendToVelo('fetchJobBoards', {});
                break;
        }
    }

    function refreshContent() {
        const stage = document.getElementById('ros-stage');
        if (stage) stage.innerHTML = render();
    }

    // ── Utilities ──
    function escapeHtml(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
        t.style.animation = 'fadeUp .3s ease';
        t.innerHTML = `<span class="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>${msg}`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    // ── Public API ──
    ROS.views._jobBoards = {
        switchTab(tab) {
            activeTab = tab;
            refreshContent();
        },
        openPost() {
            showToast('Job posting form — coming in next sprint');
        },
        connectBoard(name) {
            ROS.bridge.sendToVelo('connectJobBoard', { name });
        }
    };

    // ── Register ──
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
