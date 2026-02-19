// ============================================================================
// ROS-VIEW-CAMPAIGNS — Recruiter Paid Media Lifecycle
// Meta campaign wizard (campaign -> ad set -> creative -> launch)
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
  let paidMediaState = {
    campaignId: '',
    adSetId: '',
    creativeId: ''
  };

  function render() {
    return `
      <div class="p-4 md:p-6 space-y-6 h-full overflow-auto">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-lmdr-dark">Paid Media Campaigns</h2>
            <p class="text-sm text-lmdr-dark/60 mt-0.5">Plan, draft, and launch Meta campaigns</p>
          </div>
          <button onclick="ROS.views.campaigns.showCreate()"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white text-sm font-medium hover:shadow-lg transition-all">
            <span class="material-symbols-outlined text-[18px]">add</span>
            New Paid Campaign
          </button>
        </div>

        <!-- Campaign List -->
        <div id="campaigns-list" class="space-y-4">
          ${loading ? renderSkeleton() : renderCampaigns()}
        </div>

        <!-- Create Campaign Modal -->
        <div id="campaign-create-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-lmdr-dark">Create Paid Media Campaign</h3>
              <button onclick="ROS.views.campaigns.hideCreate()" class="text-lmdr-dark/40 hover:text-lmdr-dark">&times;</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3 rounded-xl border border-beige-d p-4 bg-beige/20">
                <h4 class="text-sm font-semibold text-lmdr-dark">Step 1 · Campaign</h4>
                <div>
                  <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Campaign Name</label>
                  <input id="campaign-name" type="text" placeholder="e.g., Q1 Driver Outreach"
                    class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Objective</label>
                  <select id="campaign-objective"
                    class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue">
                    <option value="OUTCOME_TRAFFIC">Traffic</option>
                    <option value="OUTCOME_LEADS">Leads</option>
                    <option value="OUTCOME_ENGAGEMENT">Engagement</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Daily Budget ($)</label>
                  <input id="campaign-budget" type="number" value="150" min="1" step="1"
                    class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Schedule</label>
                  <input id="campaign-start" type="datetime-local"
                    class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue mb-2" />
                  <input id="campaign-end" type="datetime-local"
                    class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue" />
                </div>
              </div>

              <div class="space-y-3 rounded-xl border border-beige-d p-4 bg-beige/20">
                <h4 class="text-sm font-semibold text-lmdr-dark">Step 2 · Ad Set</h4>
                <div>
                  <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Audience</label>
                  <select id="adset-audience"
                    class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue">
                    <option value="broad">Broad CDL Audience</option>
                    <option value="regional">Regional Route Drivers</option>
                    <option value="experienced">Experienced OTR Drivers</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Regions (comma separated)</label>
                  <input id="adset-regions" type="text" placeholder="TX, OK, AR"
                    class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Placements</label>
                  <div class="flex flex-wrap gap-3 text-xs text-lmdr-dark/80">
                    <label><input id="placement-facebook" type="checkbox" checked class="mr-1">Facebook Feed</label>
                    <label><input id="placement-instagram" type="checkbox" checked class="mr-1">Instagram Feed</label>
                    <label><input id="placement-reels" type="checkbox" class="mr-1">Reels</label>
                    <label><input id="placement-stories" type="checkbox" class="mr-1">Stories</label>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-3 rounded-xl border border-beige-d p-4 bg-beige/20">
              <h4 class="text-sm font-semibold text-lmdr-dark">Step 3 · Creative</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Headline</label>
                  <input id="creative-headline" type="text" placeholder="CDL-A Drivers: Earn More Weekly"
                    class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">CTA</label>
                  <select id="creative-cta"
                    class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue">
                    <option value="APPLY_NOW">Apply Now</option>
                    <option value="LEARN_MORE">Learn More</option>
                    <option value="SIGN_UP">Sign Up</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Body Copy</label>
                <textarea id="creative-body" rows="3" placeholder="Share pay, lanes, home time, and benefits."
                  class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-lmdr-dark/70 mb-1">Destination URL</label>
                <input id="creative-url" type="url" placeholder="https://www.lastmiledr.app/recruiter-driver-search"
                  class="w-full px-3 py-2 rounded-lg border border-beige-d text-sm focus:ring-2 focus:ring-lmdr-blue" />
              </div>
              <label class="flex items-center gap-2 text-xs text-lmdr-dark/70">
                <input id="launch-confirm" type="checkbox" />
                I confirm draft validation is complete and launch approvals are understood.
              </label>
              <div id="launch-warning" class="hidden text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Launch requires confirmation. Check the box above to continue.
              </div>
              <div id="campaign-action-status" class="hidden text-xs rounded-lg px-3 py-2"></div>
            </div>
            <div class="flex gap-3 pt-2">
              <button onclick="ROS.views.campaigns.hideCreate()"
                class="flex-1 px-4 py-2 rounded-xl border border-beige-d text-sm font-medium text-lmdr-dark/70 hover:bg-beige transition-colors">Cancel</button>
              <button onclick="ROS.views.campaigns.saveDraft()"
                class="flex-1 px-4 py-2 rounded-xl bg-lmdr-blue/10 text-lmdr-blue text-sm font-medium hover:bg-lmdr-blue/20 transition-all">Save Draft</button>
              <button onclick="ROS.views.campaigns.launch()"
                class="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-sg to-lmdr-deep text-white text-sm font-medium hover:shadow-lg transition-all">Launch</button>
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
          <p class="text-sm text-lmdr-dark/50 mt-3">No paid campaigns yet. Create your first Meta draft.</p>
        </div>`;
    }

    return campaigns.map(c => `
      <div class="bg-white rounded-xl border border-beige-d p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-lmdr-dark">${escapeHtml(c.name || 'Untitled')}</h3>
            <p class="text-xs text-lmdr-dark/50 mt-0.5">${c.objective || c.segment || 'All'} &middot; $${c.daily_budget || c.dailyBudget || 0}/day</p>
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
      ROS.views.campaigns.hideCreate();
      loadCampaigns();
      if (ROS.chat) ROS.chat.flashMsg('Campaign created successfully');
    }
    if (action === 'campaignStarted') {
      loadCampaigns();
      if (ROS.chat) ROS.chat.flashMsg('Campaign started');
    }
    if (action === 'paidMediaStateLoaded') {
      paidMediaState = {
        ...paidMediaState,
        campaignId: payload?.campaignId || '',
        adSetId: payload?.adSetId || '',
        creativeId: payload?.creativeId || ''
      };
    }
    if (action === 'paidMediaDraftCreated') {
      if (payload?.success) {
        paidMediaState.campaignId = payload?.campaign?.campaign_id || paidMediaState.campaignId;
        paidMediaState.adSetId = payload?.adSet?.ad_set_id || paidMediaState.adSetId;
        setActionStatus('Draft saved. Campaign and ad set are ready.', 'success');
        if (ROS.chat) ROS.chat.flashMsg('Paid media draft saved');
      } else {
        setActionStatus(`Draft save failed: ${(payload?.errors || [payload?.error]).filter(Boolean).join(', ')}`, 'error');
      }
    }
    if (action === 'paidMediaAdSetUpdated') {
      setActionStatus(payload?.success ? 'Ad set updated.' : `Ad set update failed: ${payload?.error || 'Unknown error'}`, payload?.success ? 'success' : 'error');
    }
    if (action === 'paidMediaCreativeCreated') {
      if (payload?.success) {
        paidMediaState.creativeId = payload?.creative?.creative_id || paidMediaState.creativeId;
        setActionStatus('Creative draft saved.', 'success');
      } else {
        setActionStatus(`Creative save failed: ${payload?.error || 'Unknown error'}`, 'error');
      }
    }
    if (action === 'paidMediaLaunchResult') {
      if (payload?.type === 'approval_required') {
        setActionStatus('Launch requires approval in the agent approval gate.', 'warning');
        if (ROS.chat) ROS.chat.flashMsg('Approval required before launch');
        return;
      }
      if (payload?.success) {
        setActionStatus('Campaign launched successfully.', 'success');
        loadCampaigns();
      } else {
        setActionStatus(`Launch failed: ${payload?.error || 'Unknown error'}`, 'error');
      }
    }
  }

  function loadCampaigns() {
    loading = true;
    if (ROS.bridge && ROS.bridge.send) {
      ROS.bridge.send('getCampaigns', {});
      ROS.bridge.send('getPaidMediaState', {});
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

  function collectFormState() {
    const name = document.getElementById('campaign-name')?.value?.trim();
    const objective = document.getElementById('campaign-objective')?.value;
    const dailyBudget = parseInt(document.getElementById('campaign-budget')?.value, 10) || 0;
    const startTime = document.getElementById('campaign-start')?.value || '';
    const endTime = document.getElementById('campaign-end')?.value || '';
    const audience = document.getElementById('adset-audience')?.value || 'broad';
    const regions = (document.getElementById('adset-regions')?.value || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    const placements = [
      document.getElementById('placement-facebook')?.checked ? 'facebook_feed' : null,
      document.getElementById('placement-instagram')?.checked ? 'instagram_feed' : null,
      document.getElementById('placement-reels')?.checked ? 'reels' : null,
      document.getElementById('placement-stories')?.checked ? 'stories' : null
    ].filter(Boolean);
    const headline = document.getElementById('creative-headline')?.value?.trim() || '';
    const body = document.getElementById('creative-body')?.value?.trim() || '';
    const ctaType = document.getElementById('creative-cta')?.value || 'APPLY_NOW';
    const destinationUrl = document.getElementById('creative-url')?.value?.trim() || '';

    return {
      name,
      objective,
      category: 'recruitment',
      dailyBudget,
      startTime,
      endTime,
      audience,
      regions,
      placements,
      targeting: { audience, regions, placements },
      headline,
      body,
      ctaType,
      destinationUrl,
      campaignId: paidMediaState.campaignId,
      adSetId: paidMediaState.adSetId,
      creativeId: paidMediaState.creativeId
    };
  }

  ROS.views.campaigns.saveDraft = function () {
    const form = collectFormState();
    if (!form.name) {
      setActionStatus('Campaign name is required.', 'warning');
      return;
    }

    if (ROS.bridge && ROS.bridge.send) {
      ROS.bridge.send('createPaidMediaDraft', form);
      ROS.bridge.send('updatePaidMediaAdSet', form);
      ROS.bridge.send('createPaidMediaCreative', form);
    }
  };

  ROS.views.campaigns.launch = function () {
    const form = collectFormState();
    const confirm = document.getElementById('launch-confirm');
    const warning = document.getElementById('launch-warning');
    if (!confirm?.checked) {
      if (warning) warning.classList.remove('hidden');
      setActionStatus('Launch confirmation required.', 'warning');
      return;
    }
    if (!form.name || !form.headline || !form.body) {
      setActionStatus('Campaign, headline, and body are required before launch.', 'warning');
      return;
    }
    if (warning) warning.classList.add('hidden');
    if (ROS.bridge && ROS.bridge.send) {
      ROS.bridge.send('launchPaidMediaCampaign', form);
    }
  };

  ROS.views.campaigns.start = function (campaignId) {
    if (ROS.bridge && ROS.bridge.send) {
      ROS.bridge.send('startCampaign', { campaignId });
    }
  };

  if (ROS.views && typeof ROS.views.registerView === 'function') {
    ROS.views.registerView('campaigns', {
      render,
      onMount: loadCampaigns,
      onUnmount: function () {},
      onMessage: onData,
      messages: [
        'campaignsLoaded',
        'campaignCreated',
        'campaignStarted',
        'paidMediaStateLoaded',
        'paidMediaDraftCreated',
        'paidMediaAdSetUpdated',
        'paidMediaCreativeCreated',
        'paidMediaLaunchResult'
      ]
    });
  }

  function setActionStatus(message, variant) {
    const el = document.getElementById('campaign-action-status');
    if (!el) return;
    el.textContent = message || '';
    el.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-200', 'text-emerald-700', 'bg-rose-50', 'border-rose-200', 'text-rose-700', 'bg-amber-50', 'border-amber-200', 'text-amber-700');
    if (variant === 'success') {
      el.classList.add('bg-emerald-50', 'border', 'border-emerald-200', 'text-emerald-700');
    } else if (variant === 'error') {
      el.classList.add('bg-rose-50', 'border', 'border-rose-200', 'text-rose-700');
    } else {
      el.classList.add('bg-amber-50', 'border', 'border-amber-200', 'text-amber-700');
    }
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

})();
