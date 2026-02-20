/* =========================================
   RECRUITER TELEMETRY — Logic Module
   Depends on: TelemetryConfig, TelemetryBridge, TelemetryRender
   ========================================= */
var TelemetryLogic = (function () {
  'use strict';

  var selectedOutcome = null;

  /* --- Sidebar --- */
  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var icon = document.getElementById('toggleIcon');

    sidebar.classList.toggle('w-64');
    sidebar.classList.toggle('w-20');
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
      icon.classList.remove('fa-chevron-left');
      icon.classList.add('fa-chevron-right');
      document.getElementById('sidebarChatContainer').classList.remove('chat-open');
    } else {
      icon.classList.remove('fa-chevron-right');
      icon.classList.add('fa-chevron-left');
    }
  }

  function toggleSidebarChat() {
    var sidebar = document.getElementById('sidebar');
    var container = document.getElementById('sidebarChatContainer');
    var chevron = document.getElementById('sidebarChatChevron');

    if (sidebar.classList.contains('collapsed')) {
      toggleSidebar();
      setTimeout(function () {
        container.classList.add('chat-open');
        chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
      }, 300);
    } else {
      container.classList.toggle('chat-open');
      if (container.classList.contains('chat-open')) {
        chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
      } else {
        chevron.classList.replace('fa-chevron-down', 'fa-chevron-up');
      }
    }
  }

  function updateSidebarUser(profile) {
    if (profile) {
      var name = profile.firstName || profile.name || 'Recruiter';
      var company = profile.company || '--';
      var initials = name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);

      var nameEl = document.getElementById('sidebar-user-name');
      var companyEl = document.getElementById('sidebar-user-company');
      var initialsEl = document.getElementById('sidebar-user-initials');

      if (nameEl) nameEl.textContent = name;
      if (companyEl) companyEl.textContent = company;
      if (initialsEl) initialsEl.textContent = initials || '--';
    }
  }

  /* --- Call Outcome Modal --- */
  function openCallOutcomeModal(driverId) {
    document.getElementById('callOutcomeDriverId').value = driverId || '';
    document.getElementById('callOutcomeModal').classList.remove('hidden');
    document.getElementById('callOutcomeModal').classList.add('flex');
    selectedOutcome = null;
    document.querySelectorAll('.outcome-btn').forEach(function (b) { b.classList.remove('ring-2', 'ring-blue-500'); });
    document.getElementById('submitOutcomeBtn').disabled = true;
  }

  function closeCallOutcomeModal() {
    document.getElementById('callOutcomeModal').classList.add('hidden');
    document.getElementById('callOutcomeModal').classList.remove('flex');
    document.getElementById('callOutcomeNotes').value = '';
    document.getElementById('callFollowUpDate').value = '';
    selectedOutcome = null;
  }

  function selectOutcome(outcome, e) {
    selectedOutcome = outcome;
    document.querySelectorAll('.outcome-btn').forEach(function (b) {
      b.classList.remove('ring-2', 'ring-blue-500');
    });
    if (e && e.target) e.target.classList.add('ring-2', 'ring-blue-500');
    document.getElementById('submitOutcomeBtn').disabled = false;
  }

  function submitCallOutcome() {
    if (!selectedOutcome) return;
    var driverId = document.getElementById('callOutcomeDriverId').value;
    var notes = document.getElementById('callOutcomeNotes').value;
    var followUpDate = document.getElementById('callFollowUpDate').value || null;
    var sentimentEl = document.querySelector('input[name="callSentiment"]:checked');
    var sentiment = sentimentEl ? sentimentEl.value : 'neutral';

    TelemetryBridge.sendMessage('logCallOutcome', {
      driverId: driverId,
      outcome: selectedOutcome,
      notes: notes,
      followUpDate: followUpDate,
      sentiment: sentiment
    });
  }

  function loadCallAnalytics() {
    TelemetryBridge.sendMessage('getCallAnalytics', {});
  }

  function loadRecentCalls() {
    TelemetryBridge.sendMessage('getRecentCalls', { limit: 20 });
  }

  /* --- Init --- */
  function init() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link[data-page]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('collapsed')) {
          toggleSidebar();
        }
        var page = link.getAttribute('data-page');
        if (page) {
          window.parent.postMessage({ type: 'navigateTo', data: { page: page } }, '*');
        }
      });
    });

    // Listen for messages
    TelemetryBridge.listen({
      recruiterProfile: function (data) {
        if (data) updateSidebarUser(data);
      },
      callOutcomeLogged: function (data) {
        if (data && data.success) {
          TelemetryRender.showToast('Call outcome logged!', 'success');
          closeCallOutcomeModal();
          loadCallAnalytics();
          loadRecentCalls();
        } else {
          TelemetryRender.showToast((data && data.error) || 'Failed to log outcome', 'error');
        }
      },
      callAnalyticsLoaded: function (data) {
        if (data && data.success) {
          TelemetryRender.renderCallAnalytics(data.analytics);
        }
      },
      recentCallsLoaded: function (data) {
        if (data && data.success) {
          TelemetryRender.renderRecentCalls(data.outcomes || []);
        }
      },
      driverCallHistoryLoaded: function () {
        // Handle driver-specific call history if needed
      }
    });

    // Notify Wix page is ready
    TelemetryBridge.notifyReady();
  }

  /* --- Expose globals for onclick handlers --- */
  function exposeGlobals() {
    window.toggleSidebar = toggleSidebar;
    window.toggleSidebarChat = toggleSidebarChat;
    window.openCallOutcomeModal = openCallOutcomeModal;
    window.closeCallOutcomeModal = closeCallOutcomeModal;
    window.selectOutcome = selectOutcome;
    window.submitCallOutcome = submitCallOutcome;
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals
  };
})();
