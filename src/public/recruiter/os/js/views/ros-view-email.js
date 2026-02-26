// ============================================================================
// ROS-VIEW-EMAIL — Email Drip Campaigns & Sequences
// Ported from: Recruiter_Email_Campaigns.html
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'email';
    const MESSAGES = ['emailCampaignsLoaded', 'emailCampaignSent', 'emailStatsLoaded'];

    // ── State ──
    let campaigns = [];
    let sequences = [];
    let stats = { sent: 0, opened: 0, clicked: 0, bounced: 0 };
    let activeTab = 'campaigns';
    let showComposer = false;

    // ── Render ──
    function render() {
        return `
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">forward_to_inbox</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Email Campaigns</h2>
        </div>
        <button onclick="ROS.views._email.toggleComposer()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[12px] font-bold">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">add</span>New Campaign
        </button>
      </div>

      <!-- Stats Strip -->
      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-amber-400 text-[18px]">mail</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.sent.toLocaleString()}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total Sent</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">drafts</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.sent ? ((stats.opened / stats.sent) * 100).toFixed(1) : 0}%</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Open Rate</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-lmdr-blue text-[18px]">ads_click</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.sent ? ((stats.clicked / stats.sent) * 100).toFixed(1) : 0}%</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Click Rate</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-red-400 text-[18px]">error</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.bounced}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Bounced</p>
        </div>
      </div>

      ${showComposer ? renderComposer() : ''}

      <!-- Tabs -->
      <div class="flex gap-4 mt-5 border-b border-tan/20 pb-0">
        <button onclick="ROS.views._email.switchTab('campaigns')" class="pb-2 text-[12px] font-bold ${activeTab === 'campaigns' ? 'text-lmdr-blue border-b-2 border-lmdr-blue' : 'text-tan'}">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">mail</span>Campaigns
        </button>
        <button onclick="ROS.views._email.switchTab('sequences')" class="pb-2 text-[12px] font-bold ${activeTab === 'sequences' ? 'text-lmdr-blue border-b-2 border-lmdr-blue' : 'text-tan'}">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">account_tree</span>Sequences
        </button>
      </div>

      <!-- Content -->
      <div class="mt-4">
        ${activeTab === 'campaigns' ? renderCampaigns() : renderSequences()}
      </div>`;
    }

    // ── Render Helpers ──
    function renderComposer() {
        return `
      <div class="mt-4 neu rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[14px] font-bold text-lmdr-dark flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-400 text-[16px]">forward_to_inbox</span>New Email Campaign
          </h3>
          <button onclick="ROS.views._email.toggleComposer()" class="text-tan hover:text-lmdr-dark">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        <div class="space-y-3">
          <input id="email-camp-name" type="text" placeholder="Campaign Name *"
            class="w-full px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark placeholder-tan/50 focus:ring-0 outline-none font-medium">
          <input id="email-camp-subject" type="text" placeholder="Subject Line *"
            class="w-full px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark placeholder-tan/50 focus:ring-0 outline-none font-medium">
          <div class="grid grid-cols-2 gap-3">
            <select id="email-camp-audience" class="px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark focus:ring-0 outline-none">
              <option>All Drivers</option>
              <option>CDL-A Drivers</option>
              <option>CDL-B Drivers</option>
              <option>Applied — No Response</option>
              <option>Pipeline — Inactive 7d</option>
            </select>
            <select id="email-camp-template" class="px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark focus:ring-0 outline-none">
              <option>Blank Template</option>
              <option>Welcome to LMDR</option>
              <option>Hot Job Alert</option>
              <option>Re-engagement</option>
              <option>Interview Invite</option>
            </select>
          </div>
          <textarea id="email-camp-body" rows="5" placeholder="Email body (HTML or plain text)..."
            class="w-full px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark placeholder-tan/50 focus:ring-0 outline-none font-mono resize-none"></textarea>
          <div class="flex gap-2 pt-1">
            <button onclick="ROS.views._email.sendCampaign()" class="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-bold">
              <span class="material-symbols-outlined text-[13px] align-middle mr-1">send</span>Send Campaign
            </button>
            <button onclick="ROS.views._email.toggleComposer()" class="px-3 py-2 rounded-xl neu-x text-[11px] font-bold text-tan">Cancel</button>
          </div>
        </div>
      </div>`;
    }

    function renderCampaigns() {
        if (!campaigns.length) {
            return `<div class="neu-in rounded-xl p-8 text-center">
        <span class="material-symbols-outlined text-tan/30 text-[32px]">mail</span>
        <p class="text-[12px] text-tan mt-2">No email campaigns yet. Create one to start engaging drivers.</p>
      </div>`;
        }
        return `<div class="space-y-2">
      ${campaigns.map(c => `
        <div class="neu-x rounded-xl p-3 flex items-center justify-between">
          <div class="flex-1">
            <p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(c.name)}</p>
            <p class="text-[10px] text-tan">${escapeHtml(c.subject || '')} · ${c.recipients || 0} recipients</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-[10px] font-bold text-emerald-500">${c.openRate || 0}% opened</p>
              <p class="text-[9px] text-tan">${c.clickRate || 0}% clicked</p>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'sent' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}">${c.status || 'draft'}</span>
          </div>
        </div>`).join('')}
    </div>`;
    }

    function renderSequences() {
        if (!sequences.length) {
            return `<div class="neu-in rounded-xl p-8 text-center">
        <span class="material-symbols-outlined text-tan/30 text-[32px]">account_tree</span>
        <p class="text-[12px] text-tan mt-2">No email sequences yet. Sequences are multi-step drip campaigns.</p>
      </div>`;
        }
        return `<div class="space-y-2">
      ${sequences.map(s => `
        <div class="neu-x rounded-xl p-3">
          <div class="flex items-center justify-between">
            <p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(s.name)}</p>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lmdr-blue/15 text-lmdr-blue">${s.steps || 0} steps</span>
          </div>
          <p class="text-[10px] text-tan mt-1">${s.activeContacts || 0} active contacts · ${s.completedCount || 0} completed</p>
        </div>`).join('')}
    </div>`;
    }

    // ── Lifecycle ──
    function onMount() {
        ROS.bridge.sendToVelo('fetchEmailCampaigns', {});
    }

    function onUnmount() {
        campaigns = [];
        sequences = [];
        showComposer = false;
    }

    function onMessage(type, payload) {
        switch (type) {
            case 'emailCampaignsLoaded':
                campaigns = payload.campaigns || [];
                sequences = payload.sequences || [];
                stats = payload.stats || stats;
                refreshContent();
                break;
            case 'emailCampaignSent':
                showToast('Email campaign sent to ' + (payload.count || 0) + ' drivers!');
                showComposer = false;
                ROS.bridge.sendToVelo('fetchEmailCampaigns', {});
                break;
            case 'emailStatsLoaded':
                stats = payload || stats;
                refreshContent();
                break;
        }
    }

    function refreshContent() {
        const stage = document.getElementById('ros-stage');
        if (stage) stage.innerHTML = render();
    }

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
    ROS.views._email = {
        switchTab(tab) {
            activeTab = tab;
            refreshContent();
        },
        toggleComposer() {
            showComposer = !showComposer;
            refreshContent();
        },
        sendCampaign() {
            const name = document.getElementById('email-camp-name')?.value;
            const subject = document.getElementById('email-camp-subject')?.value;
            const audience = document.getElementById('email-camp-audience')?.value;
            const body = document.getElementById('email-camp-body')?.value;
            if (!name || !subject) { showToast('Please fill in campaign name and subject.'); return; }
            ROS.bridge.sendToVelo('sendEmailCampaign', { name, subject, audience, body });
        }
    };

    // ── Register ──
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
