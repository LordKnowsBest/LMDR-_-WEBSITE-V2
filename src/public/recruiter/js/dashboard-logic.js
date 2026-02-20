/* =========================================
   RECRUITER DASHBOARD — Logic Module
   Depends on: DashboardConfig, DashboardBridge, DashboardRender
   State management, event handlers, initialization
   ========================================= */
var DashboardLogic = (function () {
  'use strict';

  var send = DashboardBridge.sendToWix;
  var render = DashboardRender;
  var config = DashboardConfig;

  /* --- State --- */
  var recruiterProfile = null;
  var carriers = [];
  var currentCarrierDOT = null;
  var currentCarrier = null;
  var pipelineData = { candidates: [], groupedByStatus: {}, totalCount: 0 };
  var statsData = {};
  var selectedCandidate = null;
  var validatedCarrier = null;
  var activeTab = 'pipeline';
  var isAddingFromDashboard = false;
  var currentMobileView = 'list';
  var currentMobileFilter = 'all';
  var activeApplicationId = null;
  var lastMessageTimestamp = null;

  /* --- Sidebar Weights (mutable) --- */
  var sidebarWeights = Object.assign({}, config.DEFAULT_WEIGHTS);

  /* --- Chat Polling --- */
  var chatPollTimer = null;
  var chatPollInterval = config.POLL_CONFIG.baseInterval;

  function startChatPolling(applicationId) {
    if (chatPollTimer) clearTimeout(chatPollTimer);
    chatPollInterval = config.POLL_CONFIG.baseInterval;
    scheduleChatPoll(applicationId);
  }

  function scheduleChatPoll(applicationId) {
    chatPollTimer = setTimeout(function () {
      if (!activeApplicationId) return;
      send('getNewMessages', {
        applicationId: applicationId,
        sinceTimestamp: lastMessageTimestamp
      });
      chatPollInterval = Math.min(
        chatPollInterval * config.POLL_CONFIG.backoffMultiplier,
        config.POLL_CONFIG.maxInterval
      );
      scheduleChatPoll(applicationId);
    }, chatPollInterval);
  }

  function resetChatPollInterval() {
    chatPollInterval = config.POLL_CONFIG.baseInterval;
    if (chatPollTimer && activeApplicationId) {
      clearTimeout(chatPollTimer);
      scheduleChatPoll(activeApplicationId);
    }
  }

  function stopChatPolling() {
    if (chatPollTimer) {
      clearTimeout(chatPollTimer);
      chatPollTimer = null;
    }
  }

  /* --- Theme Management --- */
  function initTheme() {
    var saved = localStorage.getItem(config.THEME_KEY);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(config.THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  function updateThemeIcon(theme) {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }
  }

  /* --- Sidebar --- */
  function toggleComplianceMenu() {
    var submenu = document.getElementById('complianceSubmenu');
    var chevron = document.getElementById('complianceChevron');
    if (!submenu) return;
    submenu.classList.toggle('hidden');
    if (chevron) {
      chevron.style.transform = submenu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }

  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var icon = document.getElementById('toggleIcon');

    sidebar.classList.toggle('w-64');
    sidebar.classList.toggle('w-20');
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
      icon.classList.remove('fa-chevron-left');
      icon.classList.add('fa-chevron-right');
      var chatContainer = document.getElementById('sidebarChatContainer');
      if (chatContainer) chatContainer.classList.remove('chat-open');
    } else {
      icon.classList.remove('fa-chevron-right');
      icon.classList.add('fa-chevron-left');
    }
  }

  function toggleSidebarChat() {
    var sidebar = document.getElementById('sidebar');
    var container = document.getElementById('sidebarChatContainer');
    var chevron = document.getElementById('sidebarChatChevron');
    if (!container) return;

    if (sidebar.classList.contains('collapsed')) {
      toggleSidebar();
      setTimeout(function () {
        container.classList.add('chat-open');
        if (chevron) chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
      }, 300);
    } else {
      container.classList.toggle('chat-open');
      if (chevron) {
        if (container.classList.contains('chat-open')) {
          chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
        } else {
          chevron.classList.replace('fa-chevron-down', 'fa-chevron-up');
        }
      }
    }
  }

  /* --- Settings Panel --- */
  function openSettingsPanel() {
    document.getElementById('settingsPanel').classList.add('open');
    document.getElementById('settingsBackdrop').classList.add('open');
    send('getWeightPreferences', {});
  }

  function closeSettingsPanel() {
    document.getElementById('settingsPanel').classList.remove('open');
    document.getElementById('settingsBackdrop').classList.remove('open');
  }

  function updateWeight(key, value) {
    sidebarWeights[key] = parseInt(value);
    var valEl = document.getElementById('val-' + key);
    if (valEl) valEl.textContent = value + '%';
    render.updateDonutChart(sidebarWeights);
  }

  function applyPreset(presetName) {
    var preset = config.SIDEBAR_PRESETS[presetName];
    if (!preset) return;

    Object.keys(preset).forEach(function (key) {
      sidebarWeights[key] = preset[key];
    });
    render.updateWeightSliders(sidebarWeights);
  }

  function resetWeights() {
    applyPreset('balanced');
  }

  function saveWeights() {
    var saveBtn = document.getElementById('saveBtn');
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Saving...';
    saveBtn.disabled = true;

    send('saveWeightPreferences', {
      weight_qualifications: sidebarWeights.qualifications,
      weight_experience: sidebarWeights.experience,
      weight_location: sidebarWeights.location,
      weight_availability: sidebarWeights.availability,
      weight_salaryFit: sidebarWeights.salaryFit,
      weight_engagement: sidebarWeights.engagement
    });
  }

  function handleSaveResult(result) {
    var saveBtn = document.getElementById('saveBtn');

    if (result.success) {
      saveBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Saved!';
      saveBtn.classList.remove('from-blue-600', 'to-purple-600');
      saveBtn.classList.add('from-green-600', 'to-emerald-600');

      setTimeout(function () {
        saveBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Save';
        saveBtn.classList.remove('from-green-600', 'to-emerald-600');
        saveBtn.classList.add('from-blue-600', 'to-purple-600');
        saveBtn.disabled = false;
        closeSettingsPanel();
      }, 1500);
    } else {
      saveBtn.innerHTML = '<i class="fa-solid fa-exclamation-triangle mr-1"></i>Error';
      saveBtn.classList.remove('from-blue-600', 'to-purple-600');
      saveBtn.classList.add('from-red-600', 'to-red-600');

      setTimeout(function () {
        saveBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Save';
        saveBtn.classList.remove('from-red-600');
        saveBtn.classList.add('from-blue-600', 'to-purple-600');
        saveBtn.disabled = false;
      }, 2000);
    }
  }

  /* --- Navigation --- */
  function navigateToPage(pageId) {
    document.querySelectorAll('.sidebar-link').forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('data-page') === pageId);
    });

    if (pageId === 'dashboard') {
      showDashboard();
      document.getElementById('system-health-tab').classList.add('hidden');
    } else if (pageId === 'system-health') {
      document.getElementById('dashboard').classList.remove('hidden');
      document.getElementById('pipeline-tab').classList.add('hidden');
      document.getElementById('stats-tab').classList.add('hidden');
      document.getElementById('system-health-tab').classList.remove('hidden');
      requestSystemHealth();
      send('logFeatureInteraction', { feature: 'recruiter_system_health_view', type: 'view' });
    } else {
      send('navigateTo', { page: pageId });
    }
  }

  /* --- Dashboard --- */
  function showDashboard() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('add-carrier-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    render.updateHeaderCarrier(currentCarrier, currentCarrierDOT);
    render.updateCarrierDropdown(carriers, currentCarrierDOT);

    send('getPipeline', {});
    send('getStats', {});
  }

  function hideLoading() {
    document.getElementById('loading-state').classList.add('hidden');
  }

  /* --- Tabs --- */
  function switchTab(tab) {
    if (typeof FeatureTracker !== 'undefined') FeatureTracker.click('recruiter_switch_tab', { tab: tab });
    activeTab = tab;

    document.querySelectorAll('.tab-btn').forEach(function (btn) { btn.classList.remove('active'); });
    document.getElementById('tab-' + tab).classList.add('active');

    document.getElementById('pipeline-tab').classList.toggle('hidden', tab !== 'pipeline');
    document.getElementById('stats-tab').classList.toggle('hidden', tab !== 'stats');

    var viewToggle = document.getElementById('view-toggle');
    if (viewToggle) {
      viewToggle.style.display = tab === 'pipeline' ? 'flex' : 'none';
    }

    if (tab === 'stats') {
      send('getStats', {});
    }

    document.getElementById('system-health-tab').classList.add('hidden');
  }

  /* --- Mobile View --- */
  function setMobileView(view) {
    currentMobileView = view;

    document.getElementById('view-list-btn').classList.toggle('active', view === 'list');
    document.getElementById('view-kanban-btn').classList.toggle('active', view === 'kanban');

    var kanbanWrapper = document.querySelector('.kanban-container-wrapper');
    var mobileList = document.getElementById('mobile-list-container');

    if (view === 'kanban') {
      kanbanWrapper.classList.add('show-on-mobile');
      mobileList.classList.add('hide-on-mobile');
    } else {
      kanbanWrapper.classList.remove('show-on-mobile');
      mobileList.classList.remove('hide-on-mobile');
    }
  }

  function filterMobileList(status) {
    currentMobileFilter = status;

    document.querySelectorAll('[id^="filter-"]').forEach(function (btn) {
      var isActive = btn.id === 'filter-' + status;
      btn.classList.toggle('bg-lmdr-blue', isActive);
      btn.classList.toggle('text-white', isActive);
      btn.classList.toggle('bg-white', !isActive);
      btn.classList.toggle('text-slate-600', !isActive);
      btn.classList.toggle('border', !isActive);
      btn.classList.toggle('border-slate-200', !isActive);
    });

    if (pipelineData) {
      render.renderMobileList(pipelineData.groupedByStatus, currentMobileFilter);
    }
  }

  /* --- Add Carrier Flow --- */
  function showAddCarrierSection(isOnboarding) {
    isAddingFromDashboard = !isOnboarding;

    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('add-carrier-section').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');

    document.getElementById('add-carrier-title').textContent =
      isOnboarding ? 'Add Your First Carrier' : 'Add a Carrier';
    document.getElementById('cancel-add-btn').classList.toggle('hidden', !isAddingFromDashboard);

    document.getElementById('dot-input').value = '';
    document.getElementById('carrier-preview').classList.add('hidden');
    document.getElementById('add-btn').classList.add('hidden');
    hideAddCarrierError();
    validatedCarrier = null;
  }

  function showAddCarrierModal() {
    closeCarrierDropdown();
    showAddCarrierSection(false);
  }

  function cancelAddCarrier() {
    document.getElementById('add-carrier-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
  }

  function validateDOT() {
    var dot = document.getElementById('dot-input').value.trim();
    if (!dot) {
      showAddCarrierError('Please enter a DOT number');
      return;
    }
    if (typeof FeatureTracker !== 'undefined') FeatureTracker.click('recruiter_validate_dot', { dotNumber: dot });

    document.getElementById('validate-btn').innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Searching...';
    document.getElementById('validate-btn').disabled = true;

    send('validateCarrier', { carrierDOT: dot });
  }

  function addCarrier() {
    if (!validatedCarrier) return;

    document.getElementById('add-btn').innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Adding...';
    document.getElementById('add-btn').disabled = true;

    send('addCarrier', { carrierDOT: validatedCarrier.dot_number });
  }

  function showAddCarrierError(message) {
    var el = document.getElementById('add-carrier-error');
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideAddCarrierError() {
    document.getElementById('add-carrier-error').classList.add('hidden');
  }

  /* --- Carrier Switching --- */
  function toggleCarrierDropdown() {
    var dropdown = document.getElementById('carrier-dropdown');
    dropdown.classList.toggle('open');

    if (dropdown.classList.contains('open')) {
      setTimeout(function () {
        document.addEventListener('click', closeDropdownOnOutsideClick);
      }, 0);
    }
  }

  function closeDropdownOnOutsideClick(e) {
    var dropdown = document.getElementById('carrier-dropdown');
    if (!dropdown.contains(e.target)) {
      closeCarrierDropdown();
    }
  }

  function closeCarrierDropdown() {
    document.getElementById('carrier-dropdown').classList.remove('open');
    document.removeEventListener('click', closeDropdownOnOutsideClick);
  }

  function switchCarrier(dot) {
    if (dot === currentCarrierDOT) {
      closeCarrierDropdown();
      return;
    }
    closeCarrierDropdown();
    send('switchCarrier', { carrierDOT: dot });
  }

  function removeCarrier(carrierDOT, carrierName) {
    if (confirm('Remove "' + carrierName + '" from your portfolio?\n\nThis will not delete any candidate data.')) {
      send('removeCarrier', { carrierDOT: carrierDOT });
    }
  }

  /* --- Candidate Modal --- */
  function openCandidateModal(candidate) {
    if (typeof FeatureTracker !== 'undefined') FeatureTracker.view('recruiter_candidate_detail', { candidateName: candidate.driverName, matchScore: candidate.matchScore });
    selectedCandidate = candidate;
    send('getCandidateDetails', { interestId: candidate.interestId });
  }

  function closeModal() {
    document.getElementById('candidate-modal').classList.add('hidden');
    document.body.style.overflow = '';
    selectedCandidate = null;
  }

  function updateStatus(newStatus) {
    if (!selectedCandidate) return;
    if (typeof FeatureTracker !== 'undefined') FeatureTracker.click('recruiter_update_status', { newStatus: newStatus, candidateName: selectedCandidate.driverName });

    send('updateCandidateStatus', {
      interestId: selectedCandidate.interestId,
      newStatus: newStatus,
      notes: ''
    });
  }

  function saveNotes() {
    if (!selectedCandidate) return;
    if (typeof FeatureTracker !== 'undefined') FeatureTracker.click('recruiter_save_notes', { candidateName: selectedCandidate.driverName });

    var notes = document.getElementById('modal-notes').value;
    send('addNotes', {
      interestId: selectedCandidate.interestId,
      notes: notes
    });
  }

  /* --- Chat --- */
  function openChat(applicationId, driverName, driverId) {
    activeApplicationId = applicationId;
    lastMessageTimestamp = null;
    document.getElementById('chat-driver-name').textContent = driverName;
    document.getElementById('chat-driver-icon').textContent = driverName.substring(0, 2).toUpperCase();
    document.getElementById('chat-modal').classList.remove('hidden');
    document.getElementById('chat-messages').innerHTML = '<div class="text-center py-10"><i class="fa-solid fa-spinner fa-spin text-slate-300"></i></div>';

    send('getConversation', { applicationId: applicationId });
    send('markAsRead', { applicationId: applicationId });

    startChatPolling(applicationId);
  }

  function closeChat() {
    document.getElementById('chat-modal').classList.add('hidden');
    document.getElementById('schedule-menu').classList.add('hidden');
    stopChatPolling();
    activeApplicationId = null;
    send('getUnreadCount');
  }

  function toggleScheduleMenu() {
    document.getElementById('schedule-menu').classList.toggle('hidden');
  }

  function requestAvailability() {
    document.getElementById('schedule-menu').classList.add('hidden');
    send('requestAvailability', { applicationId: activeApplicationId });
  }

  function confirmSlot(index) {
    if (!confirm('Confirm this interview slot?')) return;
    send('confirmTimeSlot', { applicationId: activeApplicationId, slotIndex: index });
  }

  function showProposalModal() {
    alert('Propose Specific Times is coming in the next build. For now, please use "Request Times".');
    document.getElementById('schedule-menu').classList.add('hidden');
  }

  /* --- System Health --- */
  function requestSystemHealth() {
    var dot = document.getElementById('health-indicator-dot');
    var text = document.getElementById('health-indicator-text');
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-300 animate-pulse';
    if (text) text.textContent = 'Refreshing...';

    send('getSystemHealth', { carrierDot: currentCarrierDOT });
    send('logFeatureInteraction', { feature: 'recruiter_system_health_refresh', type: 'click' });
  }

  /* =========================================================================
     MESSAGE HANDLERS
     ========================================================================= */
  function handleRecruiterReady(data) {
    hideLoading();

    recruiterProfile = data.recruiterProfile;
    carriers = data.carriers || [];
    currentCarrierDOT = data.currentCarrierDOT;

    if (data.memberId && typeof FeatureTracker !== 'undefined' && !FeatureTracker.isInitialized()) {
      FeatureTracker.init({ userId: data.memberId, userRole: 'recruiter' });
      FeatureTracker.view('recruiter_dashboard', { entryPoint: 'page_load', carrierCount: carriers.length });
    }

    render.updateSidebarUser(recruiterProfile, currentCarrier);

    if (data.needsSetup || carriers.length === 0) {
      showAddCarrierSection(true);
      return;
    }

    currentCarrier = carriers.find(function (c) { return c.carrier_dot === currentCarrierDOT; }) || data.defaultCarrier;
    showDashboard();
  }

  function handleCarrierValidated(data) {
    document.getElementById('validate-btn').innerHTML = '<i class="fa-solid fa-search mr-2"></i>Find Carrier';
    document.getElementById('validate-btn').disabled = false;

    if (!data.success) {
      showAddCarrierError(data.error || 'Carrier not found');
      document.getElementById('carrier-preview').classList.add('hidden');
      document.getElementById('add-btn').classList.add('hidden');
      return;
    }

    validatedCarrier = data.carrier;
    hideAddCarrierError();

    var initials = render.getInitials(data.carrier.legal_name);
    document.getElementById('carrier-initials').textContent = initials;
    document.getElementById('carrier-name-preview').textContent = data.carrier.legal_name;
    document.getElementById('carrier-location-preview').textContent =
      (data.carrier.phy_city || '') + ', ' + (data.carrier.phy_state || '') + ' | ' + (data.carrier.nbr_power_unit || 0) + ' trucks';

    document.getElementById('carrier-preview').classList.remove('hidden');
    document.getElementById('add-btn').classList.remove('hidden');
  }

  function handleCarrierAdded(data) {
    document.getElementById('add-btn').innerHTML = '<i class="fa-solid fa-plus mr-2"></i>Add to Portfolio';
    document.getElementById('add-btn').disabled = false;

    if (!data.success) {
      showAddCarrierError(data.error || 'Failed to add carrier');
      return;
    }

    carriers = data.carriers || carriers;
    currentCarrierDOT = data.currentCarrierDOT;
    currentCarrier = carriers.find(function (c) { return c.carrier_dot === currentCarrierDOT; });

    render.showToast('Carrier added to portfolio');
    showDashboard();
  }

  function handleCarrierRemoved(data) {
    if (!data.success) {
      render.showError(data.error);
      return;
    }

    carriers = data.carriers || [];
    currentCarrierDOT = data.currentCarrierDOT;
    currentCarrier = carriers.find(function (c) { return c.carrier_dot === currentCarrierDOT; });

    if (carriers.length === 0) {
      showAddCarrierSection(true);
    } else {
      render.updateCarrierDropdown(carriers, currentCarrierDOT);
      render.updateHeaderCarrier(currentCarrier, currentCarrierDOT);
      send('getPipeline', {});
    }

    render.showToast('Carrier removed');
  }

  function handleCarrierSwitched(data) {
    if (!data.success) {
      render.showError(data.error);
      return;
    }

    currentCarrierDOT = data.currentCarrierDOT;
    currentCarrier = data.carrier || carriers.find(function (c) { return c.carrier_dot === currentCarrierDOT; });
    render.updateHeaderCarrier(currentCarrier, currentCarrierDOT);
  }

  function handleCarriersLoaded(data) {
    if (data.success) {
      carriers = data.carriers || [];
      currentCarrierDOT = data.currentCarrierDOT;
      render.updateCarrierDropdown(carriers, currentCarrierDOT);
    }
  }

  function handlePipelineLoaded(data) {
    pipelineData = data;

    document.getElementById('stat-total').textContent = data.totalCount || 0;
    document.getElementById('stat-hired').textContent =
      (data.groupedByStatus && data.groupedByStatus.hired ? data.groupedByStatus.hired.length : 0);

    var kanbanWrapper = document.querySelector('.kanban-container-wrapper');
    var mobileListContainer = document.getElementById('mobile-list-container');
    var emptyState = document.getElementById('empty-pipeline');

    if (data.totalCount === 0 || data.noCarrier) {
      kanbanWrapper.classList.add('hidden');
      mobileListContainer.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    kanbanWrapper.classList.remove('hidden');
    mobileListContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    render.renderKanban(data.groupedByStatus);
    render.renderMobileList(data.groupedByStatus, currentMobileFilter);
  }

  function handleStatsLoaded(data) {
    statsData = data.stats || data;

    document.getElementById('stat-response').textContent =
      statsData.avgResponseTime ? statsData.avgResponseTime + 'h' : '--';

    document.getElementById('stats-total').textContent = statsData.totalPipeline || 0;
    document.getElementById('stats-7days').textContent = statsData.last7Days || 0;
    document.getElementById('stats-response').textContent =
      statsData.avgResponseTime ? statsData.avgResponseTime + 'h' : '--';
    document.getElementById('stats-badge').textContent = statsData.responseBadge || '';
    document.getElementById('stats-conversion').textContent = (statsData.conversionRate || 0) + '%';

    render.renderStageBreakdown(statsData.byStage);
  }

  function handleCandidateDetails(data) {
    if (!data.success) {
      render.showError(data.error);
      return;
    }

    var candidate = selectedCandidate;
    var interest = data.interest || {};
    var driver = data.driverProfile || {};

    document.getElementById('modal-initials').textContent = render.getInitials(candidate.driverName);
    document.getElementById('modal-name').textContent = candidate.driverName;
    document.getElementById('modal-match-score').textContent = candidate.matchScore + '% Match';

    var statusBadge = document.getElementById('modal-status-badge');
    var stageConfig = config.STAGE_CONFIG[candidate.status] || { label: candidate.status, color: 'slate' };
    statusBadge.textContent = stageConfig.label;
    statusBadge.className = 'text-xs px-2 py-0.5 rounded-full font-bold bg-' + stageConfig.color + '-100 text-' + stageConfig.color + '-700';

    document.getElementById('modal-phone').textContent = candidate.driverPhone || candidate.contactPhone || 'Not provided';
    document.getElementById('modal-email').textContent = candidate.driverEmail || candidate.contactEmail || 'Not provided';
    document.getElementById('modal-location').textContent = candidate.homeZip || 'Not provided';

    var qualContainer = document.getElementById('modal-qualifications');
    qualContainer.innerHTML = '';
    if (driver.cdl_class) qualContainer.innerHTML += '<span class="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded">' + driver.cdl_class + '</span>';
    if (driver.years_experience) qualContainer.innerHTML += '<span class="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded">' + driver.years_experience + ' Years</span>';
    if (driver.endorsements) qualContainer.innerHTML += '<span class="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded">' + driver.endorsements + '</span>';
    if (driver.clean_mvr) qualContainer.innerHTML += '<span class="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">Clean MVR</span>';

    if (interest.driver_message) {
      document.getElementById('modal-message-section').classList.remove('hidden');
      document.getElementById('modal-message').textContent = interest.driver_message;
    } else {
      document.getElementById('modal-message-section').classList.add('hidden');
    }

    document.getElementById('modal-notes').value = interest.recruiter_notes || '';

    render.renderStatusButtons(candidate.status);
    render.renderStatusHistory(interest.status_history || []);

    document.getElementById('candidate-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    var modalHeader = document.querySelector('#candidate-modal h2').parentElement;
    if (!modalHeader.querySelector('.chat-btn')) {
      var chatBtn = document.createElement('button');
      chatBtn.className = 'chat-btn mr-4 bg-lmdr-blue text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition';
      chatBtn.innerHTML = '<i class="fa-solid fa-message mr-2"></i>Open Chat';
      chatBtn.onclick = function () { openChat(candidate.interestId, candidate.driverName, candidate.driverId); };
      modalHeader.insertBefore(chatBtn, modalHeader.lastElementChild);
    }
  }

  function handleStatusUpdated(data) {
    render.showToast('Moved to ' + (config.STAGE_CONFIG[data.newStatus] ? config.STAGE_CONFIG[data.newStatus].label : data.newStatus));
    closeModal();
    send('getPipeline', {});
  }

  /* =========================================================================
     SETUP CHAT FORM
     ========================================================================= */
  function setupChatForm() {
    var form = document.getElementById('chat-form');
    if (!form) return;
    form.onsubmit = function (e) {
      e.preventDefault();
      var input = document.getElementById('chat-input');
      var content = input.value.trim();
      if (!content || !activeApplicationId) return;

      var driverId = null;
      for (var stage in pipelineData.groupedByStatus) {
        var cand = pipelineData.groupedByStatus[stage].find(function (c) { return c.interestId === activeApplicationId; });
        if (cand) {
          driverId = cand.driverId;
          break;
        }
      }

      send('sendMessage', {
        applicationId: activeApplicationId,
        content: content,
        receiverId: driverId || 'driver-default'
      });

      input.value = '';
    };
  }

  /* =========================================================================
     EXPOSE GLOBALS (for onclick handlers in HTML)
     ========================================================================= */
  function exposeGlobals() {
    window.toggleSidebar = toggleSidebar;
    window.toggleSidebarChat = toggleSidebarChat;
    window.toggleComplianceMenu = toggleComplianceMenu;
    window.openSettingsPanel = openSettingsPanel;
    window.closeSettingsPanel = closeSettingsPanel;
    window.updateWeight = updateWeight;
    window.applyPreset = applyPreset;
    window.resetWeights = resetWeights;
    window.saveWeights = saveWeights;
    window.toggleCarrierDropdown = toggleCarrierDropdown;
    window.switchCarrier = switchCarrier;
    window.showAddCarrierModal = showAddCarrierModal;
    window.cancelAddCarrier = cancelAddCarrier;
    window.validateDOT = validateDOT;
    window.addCarrier = addCarrier;
    window.switchTab = switchTab;
    window.setMobileView = setMobileView;
    window.filterMobileList = filterMobileList;
    window.closeModal = closeModal;
    window.saveNotes = saveNotes;
    window.toggleTheme = toggleTheme;
    window.requestSystemHealth = requestSystemHealth;
    window.sendToWix = send;
    window.toggleScheduleMenu = toggleScheduleMenu;
    window.requestAvailability = requestAvailability;
    window.showProposalModal = showProposalModal;
    window.closeChat = closeChat;
  }

  /* =========================================================================
     INIT
     ========================================================================= */
  function init() {
    exposeGlobals();
    initTheme();
    render.updateDonutChart(sidebarWeights);
    setupChatForm();

    /* Setup sidebar nav links */
    document.querySelectorAll('.sidebar-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('collapsed')) {
          toggleSidebar();
        }
        var page = link.getAttribute('data-page');
        if (page) navigateToPage(page);
      });
    });

    /* Setup message bridge */
    DashboardBridge.listen({
      recruiterReady: handleRecruiterReady,
      carrierValidated: handleCarrierValidated,
      carrierAdded: handleCarrierAdded,
      carrierRemoved: handleCarrierRemoved,
      carrierSwitched: handleCarrierSwitched,
      carriersLoaded: handleCarriersLoaded,
      pipelineLoaded: handlePipelineLoaded,
      statusUpdated: handleStatusUpdated,
      statsLoaded: handleStatsLoaded,
      candidateDetails: handleCandidateDetails,
      notesAdded: function () { render.showToast('Notes saved'); },
      conversationData: function (data) { render.renderMessages(data.messages); },
      messageSent: function (data) {
        if (data.success) {
          send('getConversation', { applicationId: activeApplicationId });
          resetChatPollInterval();
        }
      },
      newMessagesData: function (data) {
        if (data.hasNew && data.messages && data.messages.length > 0) {
          render.appendNewMessages(data.messages);
          lastMessageTimestamp = data.latestTimestamp;
          resetChatPollInterval();
        }
      },
      unreadCountData: function (data) {
        render.updateUnreadBadge(data.count || 0, data.byApplication || {});
      },
      getWeightPreferencesResult: function (data) {
        if (data && data.preferences) {
          Object.keys(data.preferences).forEach(function (key) {
            if (sidebarWeights.hasOwnProperty(key)) {
              sidebarWeights[key] = data.preferences[key];
            }
          });
          render.updateWeightSliders(sidebarWeights);
        }
      },
      saveWeightPreferencesResult: handleSaveResult,
      error: function (data) { render.showError(data.message || 'An error occurred'); },
      pong: function (data) {
        DashboardBridge.markConnectionVerified();
        console.log('CONNECTION VERIFIED: Velo<->HTML bridge operational', data);
      },
      systemHealthUpdate: function (data) { render.updateSystemHealthUI(data); }
    });

    /* Notify Wix we are ready */
    send('recruiterDashboardReady', {});
    send('getUnreadCount');

    setTimeout(function () { DashboardBridge.verifyConnection(); }, 500);

    console.log('VelocityMatch Recruiter Dashboard V2 (CDN Shell) Ready');
    console.log('Message Registry:', {
      inbound: config.MESSAGE_REGISTRY.inbound.length,
      outbound: config.MESSAGE_REGISTRY.outbound.length
    });
  }

  return {
    init: init,
    switchCarrier: switchCarrier,
    removeCarrier: removeCarrier,
    openCandidateModal: openCandidateModal,
    openChat: openChat,
    updateStatus: updateStatus,
    confirmSlot: confirmSlot
  };
})();
