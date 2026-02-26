// ============================================================================
// ROS-VIEW-SMS — SMS Campaign Builder & TCPA Compliance
// Ported from: Recruiter_SMS_Campaigns.html
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'sms';
    const MESSAGES = ['smsCampaignsLoaded', 'smsCampaignSent', 'smsStatsLoaded'];

    // ── State ──
    let campaigns = [];
    let stats = { sent: 0, delivered: 0, replied: 0, optOuts: 0 };
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
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">sms</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">SMS Campaigns</h2>
        </div>
        <button onclick="ROS.views._sms.toggleComposer()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[12px] font-bold">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">add</span>New Campaign
        </button>
      </div>

      <!-- TCPA Compliance Banner -->
      <div class="mt-3 neu-ins rounded-xl p-3 flex items-center gap-3 border border-amber-500/20">
        <span class="material-symbols-outlined text-amber-400 text-[18px]">verified_user</span>
        <div>
          <p class="text-[11px] font-bold text-lmdr-dark">TCPA Compliant Messaging</p>
          <p class="text-[10px] text-tan">Messages only sent 9am–8pm CST. STOP/UNSUBSCRIBE handled automatically.</p>
        </div>
      </div>

      <!-- Stats Strip -->
      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">send</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.sent.toLocaleString()}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Total Sent</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-blue-400 text-[18px]">mark_email_read</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.delivered.toLocaleString()}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Delivered</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-amber-400 text-[18px]">reply</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.replied}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Replies</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-red-400 text-[18px]">person_off</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.optOuts}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Opt-Outs</p>
        </div>
      </div>

      ${showComposer ? renderComposer() : ''}

      <!-- Campaign List -->
      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Campaigns</h3>
        ${renderCampaigns()}
      </div>`;
    }

    // ── Render Helpers ──
    function renderComposer() {
        return `
      <div class="mt-4 neu rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[14px] font-bold text-lmdr-dark flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-500 text-[16px]">sms</span>New SMS Campaign
          </h3>
          <button onclick="ROS.views._sms.toggleComposer()" class="text-tan hover:text-lmdr-dark">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <!-- Left: Form -->
          <div class="space-y-3">
            <input id="sms-camp-name" type="text" placeholder="Campaign Name *"
              class="w-full px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark placeholder-tan/50 focus:ring-0 outline-none font-medium">
            <select id="sms-camp-audience" class="w-full px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark focus:ring-0 outline-none">
              <option>All Drivers</option>
              <option>CDL-A Only</option>
              <option>CDL-B Only</option>
              <option>Hazmat Endorsed</option>
              <option>OTR Interested</option>
            </select>
            <textarea id="sms-camp-body" rows="4" placeholder="Hey {{firstName}}, we have a great OTR opportunity in {{state}}..."
              class="w-full px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark placeholder-tan/50 focus:ring-0 outline-none font-mono resize-none"></textarea>
            <p class="text-[9px] text-tan">Use {{firstName}}, {{state}} for personalization. STOP opt-out auto-appended.</p>
            <div class="flex gap-2 pt-1">
              <button onclick="ROS.views._sms.sendCampaign()" class="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[11px] font-bold">
                <span class="material-symbols-outlined text-[13px] align-middle mr-1">send</span>Send Now
              </button>
              <button onclick="ROS.views._sms.toggleComposer()" class="px-3 py-2 rounded-xl neu-x text-[11px] font-bold text-tan">Cancel</button>
            </div>
          </div>
          <!-- Right: Phone Preview -->
          <div class="flex justify-center items-start">
            <div class="w-[200px] rounded-[20px] border-2 border-tan/20 p-4 neu-in">
              <div class="flex items-center gap-2 mb-3 pb-2 border-b border-tan/10">
                <span class="material-symbols-outlined text-emerald-500 text-[14px]">sms</span>
                <span class="text-[10px] font-bold text-lmdr-dark">LMDR Recruiting</span>
              </div>
              <div id="sms-preview-bubble" class="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl rounded-bl-sm p-3 text-white text-[10px]">
                Hey John, we have a great OTR opportunity in Texas...
              </div>
              <p class="text-[8px] text-tan mt-1 text-right">Reply STOP to unsubscribe</p>
            </div>
          </div>
        </div>
      </div>`;
    }

    function renderCampaigns() {
        if (!campaigns.length) {
            return `<div class="neu-in rounded-xl p-8 text-center">
        <span class="material-symbols-outlined text-tan/30 text-[32px]">sms</span>
        <p class="text-[12px] text-tan mt-2">No SMS campaigns yet. Create one to start reaching drivers.</p>
      </div>`;
        }
        return `<div class="space-y-2">
      ${campaigns.map(c => `
        <div class="neu-x rounded-xl p-3 flex items-center justify-between">
          <div class="flex-1">
            <p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(c.name)}</p>
            <p class="text-[10px] text-tan">${c.audience || 'All Drivers'} · ${c.sentCount || 0} sent</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-[10px] font-bold text-emerald-500">${c.deliveryRate || 0}% delivered</p>
              <p class="text-[9px] text-tan">${c.replyRate || 0}% replied</p>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'sent' ? 'bg-emerald-500/15 text-emerald-500' : c.status === 'scheduled' ? 'bg-amber-500/15 text-amber-500' : 'bg-tan/15 text-tan'}">${c.status || 'draft'}</span>
          </div>
        </div>`).join('')}
    </div>`;
    }

    // ── Lifecycle ──
    function onMount() {
        ROS.bridge.sendToVelo('fetchSmsCampaigns', {});
    }

    function onUnmount() {
        campaigns = [];
        showComposer = false;
    }

    function onMessage(type, payload) {
        switch (type) {
            case 'smsCampaignsLoaded':
                campaigns = payload.campaigns || [];
                stats = payload.stats || stats;
                refreshContent();
                break;
            case 'smsCampaignSent':
                showToast('SMS campaign sent to ' + (payload.count || 0) + ' drivers!');
                showComposer = false;
                ROS.bridge.sendToVelo('fetchSmsCampaigns', {});
                break;
            case 'smsStatsLoaded':
                stats = payload || stats;
                refreshContent();
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
    ROS.views._sms = {
        toggleComposer() {
            showComposer = !showComposer;
            refreshContent();
        },
        sendCampaign() {
            const name = document.getElementById('sms-camp-name')?.value;
            const audience = document.getElementById('sms-camp-audience')?.value;
            const body = document.getElementById('sms-camp-body')?.value;
            if (!name || !body) { showToast('Please fill in campaign name and message.'); return; }
            ROS.bridge.sendToVelo('sendSmsCampaign', { name, audience, body });
        }
    };

    // ── Register ──
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
