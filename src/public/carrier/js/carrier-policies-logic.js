var CarrierPoliciesLogic = (function () {
  'use strict';

  var state = { status: 'published', policies: [], filtered: [], carrierId: null };

  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var icon = document.getElementById('toggleIcon');
    sidebar.classList.toggle('w-56');
    sidebar.classList.toggle('w-16');
    sidebar.classList.toggle('collapsed');
    icon.className = sidebar.classList.contains('collapsed') ? 'fa-solid fa-chevron-right text-[10px]' : 'fa-solid fa-chevron-left text-[10px]';
  }

  function toggleTheme() {
    var body = document.body;
    body.classList.toggle('light-mode');
    var icon = document.getElementById('themeIcon');
    var label = document.getElementById('themeLabel');
    var isLight = body.classList.contains('light-mode');
    icon.className = isLight ? 'fa-solid fa-moon mr-2' : 'fa-solid fa-sun mr-2';
    label.textContent = isLight ? 'Dark mode' : 'Light mode';
  }

  function setTab(status) {
    state.status = status;
    document.getElementById('currentStatus').textContent = status[0].toUpperCase() + status.slice(1);
    ['published', 'draft', 'archived'].forEach(function (key) {
      var tab = document.getElementById('tab' + key[0].toUpperCase() + key.slice(1));
      tab.className = key === status ? 'pb-3 tab-active' : 'pb-3 tab-inactive';
    });
    refreshPolicies();
  }

  function refreshPolicies() {
    CarrierPoliciesBridge.postToParent('getCarrierPolicies', { status: state.status, limit: 200, offset: 0 });
  }

  function refreshCompliance() {
    CarrierPoliciesBridge.postToParent('getComplianceStatus', { carrierId: state.carrierId });
  }

  function openModal() { document.getElementById('policyModal').classList.add('active'); }
  function closeModal() { document.getElementById('policyModal').classList.remove('active'); }

  function toggleContentInputs() {
    var type = document.getElementById('policyContentType').value;
    document.getElementById('markdownWrapper').classList.toggle('hidden', type !== 'markdown');
    document.getElementById('pdfWrapper').classList.toggle('hidden', type !== 'pdf');
    document.getElementById('linkWrapper').classList.toggle('hidden', type !== 'external_link');
  }

  function applyFilters() {
    var category = document.getElementById('categoryFilter').value;
    var search = document.getElementById('searchInput').value.toLowerCase();
    state.filtered = state.policies.filter(function (item) {
      var matchesCategory = category === 'all' || item.category === category;
      var matchesSearch = !search || (item.title || '').toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
    renderPolicies();
  }

  function renderPolicies() {
    var list = document.getElementById('policyList');
    if (!state.filtered.length) {
      list.innerHTML = '<div class="p-6 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">No policies yet.</div>';
      return;
    }
    list.innerHTML = state.filtered.map(function (item) {
      var published = item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Not published';
      return '<div class="p-4 rounded-xl bg-white/5 border border-white/10"><div class="flex items-center justify-between"><div><div class="text-sm font-semibold">' + (item.title || 'Untitled') + '</div><div class="text-xs text-slate-400">' + (item.category || 'category') + ' \u00B7 v' + (item.current_version || 1) + ' \u00B7 ' + published + '</div></div><div class="flex items-center gap-2"><button class="px-3 py-1.5 rounded-lg bg-white/10 text-xs" onclick="CarrierPoliciesLogic.exposeGlobals(); publishPolicy(\'' + item._id + '\')">Publish</button><button class="px-3 py-1.5 rounded-lg bg-white/10 text-xs" onclick="CarrierPoliciesLogic.exposeGlobals(); archivePolicy(\'' + item._id + '\')">Archive</button></div></div><p class="text-sm text-slate-200 mt-2">' + (item.description || '').slice(0, 120) + '</p></div>';
    }).join('');
  }

  function updateStats() {
    var published = state.policies.filter(function (p) { return p.status === 'published'; }).length;
    var drafts = state.policies.filter(function (p) { return p.status === 'draft'; }).length;
    document.getElementById('statPublished').textContent = published;
    document.getElementById('statDrafts').textContent = drafts;
  }

  function submitPolicy(publishNow) {
    var title = document.getElementById('policyTitle').value.trim();
    if (!title) { alert('Title is required'); return; }
    var targetAudience = { type: 'all', segments: [] };
    var audienceValue = document.getElementById('policyAudience').value.trim();
    if (audienceValue) {
      try { targetAudience = JSON.parse(audienceValue); } catch (err) { alert('Invalid audience JSON'); return; }
    }
    var contentType = document.getElementById('policyContentType').value;
    var content = document.getElementById('policyContent').value.trim();
    var externalUrl = document.getElementById('policyExternalUrl').value.trim();
    if (contentType === 'pdf') { content = document.getElementById('policyPdf').value.trim(); }
    var payload = {
      carrier_id: state.carrierId, title: title,
      category: document.getElementById('policyCategory').value,
      description: document.getElementById('policyDescription').value.trim(),
      content_type: contentType, content: content, external_url: externalUrl,
      requires_acknowledgment: document.getElementById('policyRequiresAck').checked,
      acknowledgment_deadline: document.getElementById('policyDeadline').value || null,
      target_audience: targetAudience,
      is_mandatory: document.getElementById('policyMandatory').checked,
      status: publishNow ? 'published' : 'draft'
    };
    CarrierPoliciesBridge.postToParent('createPolicy', payload);
    closeModal();
  }

  function publishPolicy(id) { CarrierPoliciesBridge.postToParent('publishPolicyVersion', { policyId: id, changeSummary: '' }); }
  function archivePolicy(id) { CarrierPoliciesBridge.postToParent('archivePolicy', { policyId: id }); }

  function initNavigation() {
    document.querySelectorAll('.sidebar-link[data-page]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var page = link.getAttribute('data-page');
        if (page) window.parent.postMessage({ type: 'navigateTo', action: 'navigateTo', data: { page: page } }, '*');
      });
    });
  }

  function init() {
    initNavigation();
    CarrierPoliciesBridge.listen({
      carrierPoliciesData: function (data) {
        state.policies = (data && data.policies) || [];
        state.filtered = state.policies.slice();
        updateStats();
        applyFilters();
      },
      complianceStatusData: function (data) {
        var policies = (data && data.policies) || [];
        var avg = policies.length ? Math.round(policies.reduce(function (sum, p) { return sum + (p.completionRate || 0); }, 0) / policies.length) : 0;
        document.getElementById('statCompliance').textContent = avg + '%';
        document.getElementById('complianceSummary').textContent = policies.length + ' policies tracked';
      },
      policyActionResult: function () { refreshPolicies(); },
      carrierContext: function (data) { state.carrierId = (data && data.carrierId) || state.carrierId; }
    });

    CarrierPoliciesBridge.postToParent('carrierPoliciesReady');
    refreshPolicies();
  }

  function exposeGlobals() {
    window.toggleSidebar = toggleSidebar;
    window.toggleTheme = toggleTheme;
    window.setTab = setTab;
    window.refreshPolicies = refreshPolicies;
    window.refreshCompliance = refreshCompliance;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.toggleContentInputs = toggleContentInputs;
    window.applyFilters = applyFilters;
    window.submitPolicy = submitPolicy;
    window.publishPolicy = publishPolicy;
    window.archivePolicy = archivePolicy;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
