/* =========================================
   DRIVER DASHBOARD — Logic Module
   Depends on: DashboardConfig, DashboardBridge, DashboardRender
   Business logic, event handlers, state management
   ========================================= */
var DashboardLogic = (function () {
  'use strict';

  var Config = DashboardConfig;
  var Bridge = DashboardBridge;
  var Render = DashboardRender;

  var state = Config.createInitialState();

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    initTheme();
    Bridge.listen(handleMessage);
    initChatForm();

    Bridge.sendToVelo('dashboardReady');
  }

  function initChatForm() {
    var form = document.getElementById('chat-form');
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        var input = document.getElementById('chat-input');
        var content = input.value.trim();
        if (!content || !state.activeApplicationId) return;

        var app = null;
        for (var i = 0; i < state.applications.length; i++) {
          if (state.applications[i]._id === state.activeApplicationId) {
            app = state.applications[i];
            break;
          }
        }
        var receiverId = (app && app.carrier_user_id) || 'carrier-default';

        if (typeof FeatureTracker !== 'undefined') {
          FeatureTracker.click('driver_send_message', { applicationId: state.activeApplicationId });
        }

        Bridge.sendToVelo('sendMessage', {
          applicationId: state.activeApplicationId,
          content: content,
          receiverId: receiverId
        });

        input.value = '';
      };
    }
  }

  // ============================================
  // MESSAGE HANDLING (type/data protocol)
  // ============================================
  function handleMessage(type, data) {
    switch (type) {
      case 'dashboardData':
        Render.renderDashboard(data, state);
        break;

      case 'conversationData':
        Render.renderMessages(data.messages);
        break;

      case 'newMessagesData':
        if (data.applicationId === state.activeApplicationId) {
          Render.appendNewMessages(data.messages);
        }
        break;

      case 'unreadCountData':
        Render.updateUnreadBadge(data.totalUnread, data.unreadByApplication);
        break;

      case 'viewsData':
        Render.renderViewsList(data.views);
        if (data.isDiscoverable !== undefined) {
          state.isDiscoverable = data.isDiscoverable;
          Render.updatePrivacyUI(data.isDiscoverable);
        }
        break;

      case 'insightsData':
        Render.renderInsightsPanel(data.stats);
        break;

      case 'messageSent':
        Bridge.sendToVelo('getConversation', { applicationId: state.activeApplicationId });
        break;

      case 'withdrawSuccess':
        closeWithdrawModal();
        state.applications = state.applications.filter(function (a) {
          return a._id !== state.applicationToWithdraw;
        });
        Render.renderDashboard({ applications: state.applications }, state);
        break;
    }
  }

  // ============================================
  // NAVIGATION
  // ============================================
  function goToProfile() {
    Bridge.sendToVelo('navigateToProfile');
  }

  function goToMatching() {
    Bridge.sendToVelo('navigateToMatching');
  }

  // ============================================
  // FILTER
  // ============================================
  function filterApps(filterType) {
    if (typeof FeatureTracker !== 'undefined') {
      FeatureTracker.click('driver_app_filter', { filterType: filterType });
    }
    state.currentFilter = filterType;
    document.getElementById('current-filter').textContent = Config.FILTER_LABELS[filterType] || 'Filter';
    Render.renderDashboard({ applications: state.applications }, state);
  }

  // ============================================
  // WITHDRAW
  // ============================================
  function promptWithdraw(carrierDot, carrierName) {
    state.applicationToWithdraw = carrierDot;
    var nameEl = document.getElementById('withdraw-carrier-name');
    if (nameEl) nameEl.textContent = carrierName;
    document.getElementById('withdraw-modal').classList.remove('hidden');
  }

  function closeWithdrawModal() {
    document.getElementById('withdraw-modal').classList.add('hidden');
    state.applicationToWithdraw = null;
  }

  function confirmWithdraw() {
    if (!state.applicationToWithdraw) return;
    Bridge.sendToVelo('withdrawApplication', { carrierDOT: state.applicationToWithdraw });
  }

  // ============================================
  // CHAT
  // ============================================
  function openChat(applicationId, carrierName, receiverId) {
    if (typeof FeatureTracker !== 'undefined') {
      FeatureTracker.click('driver_open_chat', { carrierName: carrierName });
    }
    state.activeApplicationId = applicationId;
    state.lastMessageTimestamp = null;

    document.getElementById('chat-carrier-name').textContent = carrierName;
    document.getElementById('chat-carrier-icon').textContent = carrierName.substring(0, 2).toUpperCase();
    document.getElementById('chat-modal').classList.remove('hidden');
    document.getElementById('quick-replies').classList.remove('hidden');

    document.getElementById('chat-messages').innerHTML =
      '<div class="text-center py-10"><i class="fa-solid fa-spinner fa-spin text-slate-300"></i></div>';

    Bridge.sendToVelo('getConversation', { applicationId: applicationId });
    Bridge.sendToVelo('markAsRead', { applicationId: applicationId });

    Bridge.startChatPolling(applicationId, function () { return state.lastMessageTimestamp; });
  }

  function closeChat() {
    document.getElementById('chat-modal').classList.add('hidden');
    Bridge.stopChatPolling();
    state.activeApplicationId = null;
    Bridge.sendToVelo('getUnreadCount');
  }

  function useQuickReply(text) {
    var input = document.getElementById('chat-input');
    if (input) {
      input.value = text;
      input.focus();
    }
  }

  // ============================================
  // AVAILABILITY / SCHEDULING
  // ============================================
  function showAvailabilityModal() {
    document.getElementById('availability-modal').classList.remove('hidden');
  }

  function closeAvailabilityModal() {
    document.getElementById('availability-modal').classList.add('hidden');
  }

  function submitAvailability() {
    var inputs = document.querySelectorAll('.slot-input');
    var slots = [];
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].value) {
        var dt = new Date(inputs[i].value);
        slots.push({
          id: i + 1,
          start: dt.toISOString(),
          end: new Date(dt.getTime() + 30 * 60000).toISOString()
        });
      }
    }

    if (slots.length < 1) {
      alert('Please pick at least one slot.');
      return;
    }

    Bridge.sendToVelo('proposeTimeSlots', { applicationId: state.activeApplicationId, slots: slots });
    closeAvailabilityModal();
  }

  function confirmSlot(index) {
    if (!confirm('Confirm this interview slot?')) return;
    Bridge.sendToVelo('confirmTimeSlot', { applicationId: state.activeApplicationId, slotIndex: index });
  }

  // ============================================
  // PRIVACY TOGGLE
  // ============================================
  function toggleDiscoverability() {
    var newState = !state.isDiscoverable;
    state.isDiscoverable = newState;
    Render.updatePrivacyUI(newState);

    if (typeof FeatureTracker !== 'undefined') {
      FeatureTracker.click('driver_toggle_privacy', { newState: newState });
    }

    Bridge.sendToVelo('setDiscoverability', { isDiscoverable: newState });
  }

  // ============================================
  // ACTIVITY TIMELINE
  // ============================================
  function toggleTimeline(timelineId) {
    var timeline = document.getElementById(timelineId);
    if (timeline) {
      timeline.classList.toggle('hidden');
    }
  }

  // ============================================
  // THEME MANAGEMENT
  // ============================================
  function initTheme() {
    var saved = localStorage.getItem(Config.THEME_KEY);
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
    Render.updateThemeIcon(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(Config.THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  // ============================================
  // EXPOSE GLOBALS (for onclick handlers in HTML)
  // ============================================
  function exposeGlobals() {
    window.sendToVelo = Bridge.sendToVelo;
    window.toggleTheme = toggleTheme;
    window.goToProfile = goToProfile;
    window.goToMatching = goToMatching;
    window.filterApps = filterApps;
    window.toggleDiscoverability = toggleDiscoverability;
    window.closeWithdrawModal = closeWithdrawModal;
    window.closeAvailabilityModal = closeAvailabilityModal;
    window.useQuickReply = useQuickReply;
    window.closeChat = closeChat;
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals,
    goToProfile: goToProfile,
    goToMatching: goToMatching,
    promptWithdraw: promptWithdraw,
    confirmWithdraw: confirmWithdraw,
    openChat: openChat,
    closeChat: closeChat,
    toggleTimeline: toggleTimeline,
    showAvailabilityModal: showAvailabilityModal,
    closeAvailabilityModal: closeAvailabilityModal,
    submitAvailability: submitAvailability,
    confirmSlot: confirmSlot,
    toggleDiscoverability: toggleDiscoverability,
    useQuickReply: useQuickReply
  };
})();
