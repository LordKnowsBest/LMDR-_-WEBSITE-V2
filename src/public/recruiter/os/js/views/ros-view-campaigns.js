// ============================================================================
// ROS-VIEW-CAMPAIGNS — Outbound Calling Campaign Management
// View for creating, managing, and monitoring voice campaigns
// ============================================================================

(function () {
  'use strict';

  if (typeof ROS === 'undefined') return;

  ROS.views = ROS.views || {};

  ROS.views.campaigns = {
    id: 'campaigns',
    label: 'Campaigns',
    icon: 'campaign',
    render,
    onData
  };

  let campaigns = [];
  let loading = false;

  function render() {
    return `
      <div class="p-4 md:p-6 space-y-6 h-full overflow-auto">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-lmdr-dark">Outbound Campaigns</h2>
            <p class="text-sm text-lmdr-dark/60 mt-0.5">Manage voice outreach campaigns</p>
          </div>
          <button onclick="ROS.views.campaigns.showCreate()"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white text-sm font-medium hover:shadow-lg transition-all">
            <span class="material-symbols-outlined text-[18px]">add</span>
            New Campaign
          </button>
        </div>

        <!-- Campaign List -->
        <div id="campaigns-list" class="space-y-4">
          ${loading ? renderSkeleton() : renderCampaigns()}
        </div>

        <!-- Create Campaign Modal -->
        <div id="campaign-create-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-lmdr-dark">Create Campaign</h3>
              <button onclick="ROS.views.campaigns.hideCreate()" class="text-lmdr-dark/40 hover:text-lmdr-dark">&times;</button>
            </div>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Campaign Name</label>
                <input id="campaign-name" type="text" placeholder="e.g., Q1 Driver Outreach"
                  class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue focus:border-transparent" />
              </div>
              <div>
                <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Target Segment</label>
                <select id="campaign-segment"
                  class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue">
                  <option value="new_leads">New Leads</option>
                  <option value="warm_leads">Warm Leads</option>
                  <option value="stale_pipeline">Stale Pipeline</option>
                  <option value="re_engagement">Re-engagement</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Max Calls</label>
                <input id="campaign-max-calls" type="number" value="50" min="1" max="500"
                  class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue" />
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button onclick="ROS.views.campaigns.hideCreate()"
                class="flex-1 px-4 py-2 rounded-xl border border-beige-d text-sm font-medium text-lmdr-dark/70 hover:bg-beige transition-colors">Cancel</button>
              <button onclick="ROS.views.campaigns.submitCreate()"
                class="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white text-sm font-medium hover:shadow-lg transition-all">Create</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderCampaigns() {
    if (!campaigns.length) {
      return `
        <div class="text-center py-12">
          <span class="material-symbols-outlined text-[48px] text-lmdr-dark/20">campaign</span>
          <p class="text-sm text-lmdr-dark/50 mt-3">No campaigns yet. Create your first outbound campaign.</p>
        </div>`;
    }

    return campaigns.map(c => `
      <div class="bg-white rounded-xl border border-beige-d p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-lmdr-dark">${escapeHtml(c.name || 'Untitled')}</h3>
            <p class="text-xs text-lmdr-dark/50 mt-0.5">${c.segment || 'All'} &middot; ${c.totalContacts || 0} contacts</p>
          </div>
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(c.status)}">${c.status || 'draft'}</span>
        </div>
        <div class="flex items-center gap-4 mt-3">
          <div class="flex-1">
            <div class="h-1.5 rounded-full bg-beige-d overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-lmdr-blue to-lmdr-deep transition-all" style="width:${getProgress(c)}%"></div>
            </div>
          </div>
          <span class="text-xs text-lmdr-dark/60">${c.completedCalls || 0}/${c.totalContacts || 0}</span>
        </div>
        ${c.status === 'draft' || c.status === 'paused' ? `
          <div class="flex gap-2 mt-3">
            <button onclick="ROS.views.campaigns.start('${c.id}')"
              class="px-3 py-1.5 rounded-lg bg-sg/10 text-sg text-xs font-medium hover:bg-sg/20 transition-colors">Start</button>
          </div>` : ''}
      </div>`).join('');
  }

  function renderSkeleton() {
    return Array(3).fill(`
      <div class="bg-white rounded-xl border border-beige-d p-4">
        <div class="skeleton h-5 w-40 rounded mb-2"></div>
        <div class="skeleton h-3 w-24 rounded mb-3"></div>
        <div class="skeleton h-1.5 rounded-full"></div>
      </div>`).join('');
  }

  function getStatusClass(status) {
    const map = {
      draft: 'bg-slate-100 text-slate-600',
      active: 'bg-emerald-100 text-emerald-700',
      paused: 'bg-amber-100 text-amber-700',
      completed: 'bg-blue-100 text-blue-700'
    };
    return map[status] || map.draft;
  }

  function getProgress(c) {
    if (!c.totalContacts) return 0;
    return Math.min(100, Math.round(((c.completedCalls || 0) / c.totalContacts) * 100));
  }

  function onData(action, payload) {
    if (action === 'campaignsLoaded') {
      campaigns = payload?.campaigns || payload || [];
      loading = false;
      refreshList();
    }
    if (action === 'campaignCreated') {
      hideCreate();
      loadCampaigns();
      if (ROS.chat) ROS.chat.flashMsg('Campaign created successfully');
    }
    if (action === 'campaignStarted') {
      loadCampaigns();
      if (ROS.chat) ROS.chat.flashMsg('Campaign started');
    }
  }

  function loadCampaigns() {
    loading = true;
    if (ROS.bridge && ROS.bridge.send) {
      ROS.bridge.send('getCampaigns', {});
    }
  }

  function refreshList() {
    const container = document.getElementById('campaigns-list');
    if (container) {
      container.innerHTML = renderCampaigns();
    }
  }

  // Public methods for onclick handlers
  ROS.views.campaigns.showCreate = function () {
    const modal = document.getElementById('campaign-create-modal');
    if (modal) modal.classList.remove('hidden');
  };

  ROS.views.campaigns.hideCreate = function () {
    const modal = document.getElementById('campaign-create-modal');
    if (modal) modal.classList.add('hidden');
  };

  ROS.views.campaigns.submitCreate = function () {
    const name = document.getElementById('campaign-name')?.value?.trim();
    const segment = document.getElementById('campaign-segment')?.value;
    const maxCalls = parseInt(document.getElementById('campaign-max-calls')?.value) || 50;

    if (!name) return;

    if (ROS.bridge && ROS.bridge.send) {
      ROS.bridge.send('createCampaign', { name, segment, maxCalls });
    }
  };

  ROS.views.campaigns.start = function (campaignId) {
    if (ROS.bridge && ROS.bridge.send) {
      ROS.bridge.send('startCampaign', { campaignId });
    }
  };

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

})();
