/* =========================================
   DRIVER DASHBOARD — Render Module
   Depends on: DashboardConfig
   DOM rendering and UI updates
   ========================================= */
var DashboardRender = (function () {
  'use strict';

  var Config = DashboardConfig;

  // ============================================
  // PROFILE STRENGTH
  // ============================================
  function renderProfileStrength(profile) {
    var container = document.getElementById('profile-strength-container');
    var scoreText = document.getElementById('strength-text');
    var circle = document.getElementById('strength-circle');
    var message = document.getElementById('strength-message');
    var suggestionsContainer = document.getElementById('strength-suggestions');

    if (!container || !profile) return;
    container.classList.remove('hidden');

    var score = profile.profile_completeness_score || 0;
    scoreText.textContent = score + '%';

    var circumference = 251.2;
    var offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    if (score >= 80) {
      circle.classList.add('text-emerald-500');
      circle.classList.remove('text-lmdr-blue', 'text-yellow-500', 'text-red-500');
      message.innerHTML = '<span class="text-emerald-600 font-bold"><i class="fa-solid fa-check-circle mr-1"></i>Excellent!</span> Your profile stands out to recruiters.';
    } else if (score >= 50) {
      circle.classList.add('text-lmdr-blue');
      circle.classList.remove('text-emerald-500', 'text-yellow-500', 'text-red-500');
      message.textContent = 'Good progress. Add a few more details to reach All-Star status.';
    } else {
      circle.classList.add('text-yellow-500');
      circle.classList.remove('text-emerald-500', 'text-lmdr-blue', 'text-red-500');
      message.textContent = 'Complete your profile to verify your account and get matches.';
    }

    suggestionsContainer.innerHTML = '';
    var suggestions = profile.suggestions || [];

    if (suggestions.length > 0) {
      suggestions.slice(0, 3).forEach(function (s) {
        var btn = document.createElement('button');
        btn.onclick = function () { DashboardLogic.goToProfile(); };
        btn.className = 'px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:border-lmdr-blue hover:text-lmdr-blue transition flex items-center gap-1.5';
        btn.innerHTML = '<span>' + s.label + '</span>' +
          '<span class="bg-indigo-100 text-indigo-700 px-1.5 rounded text-[10px] font-black">+' + s.points + '</span>';
        suggestionsContainer.appendChild(btn);
      });
    } else if (score < 100) {
      suggestionsContainer.innerHTML = '<div class="text-xs text-slate-400 italic">No specific suggestions available.</div>';
    }
  }

  // ============================================
  // VIEWS LIST (Phase 3)
  // ============================================
  function renderViewsList(views) {
    var container = document.getElementById('views-list');
    if (!container) return;

    if (!views || views.length === 0) {
      container.innerHTML =
        '<div class="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">' +
        '<i class="fa-solid fa-eye-slash text-slate-300 text-2xl mb-2 block"></i>' +
        '<p class="text-xs font-medium text-slate-400">No views yet.</p>' +
        '<p class="text-[10px] text-slate-400 mt-1">Complete your profile to appear in more searches.</p></div>';
      return;
    }

    var html = '';
    views.forEach(function (view) {
      var date = new Date(view.viewDate);
      var isRecent = view.isNew;
      html += '<div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-lmdr-blue transition group">';
      html += '<div class="flex items-center gap-3">';
      html += '<div class="w-10 h-10 ' + (isRecent ? 'bg-blue-50 text-lmdr-blue' : 'bg-slate-50 text-slate-400') + ' rounded-full flex items-center justify-center font-bold text-sm">';
      html += view.carrierName.substring(0, 2).toUpperCase() + '</div>';
      html += '<div><h4 class="text-sm font-bold text-slate-900 group-hover:text-lmdr-blue transition">' + view.carrierName + '</h4>';
      html += '<p class="text-[10px] font-medium text-slate-400">' + date.toLocaleDateString() + ' &bull; ' + (view.location || 'USA') + '</p></div></div>';
      if (isRecent) html += '<span class="w-2 h-2 bg-lmdr-blue rounded-full"></span>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ============================================
  // INSIGHTS PANEL (Phase 4)
  // ============================================
  function renderInsightsPanel(stats) {
    if (!stats) return;
    var el;
    el = document.getElementById('insight-views-count');
    if (el) el.textContent = String(stats.profileViews30d || 0);
    el = document.getElementById('insight-search-count');
    if (el) el.textContent = String(stats.searchAppearances || 0);
    el = document.getElementById('insight-active-apps');
    if (el) el.textContent = String(stats.activeApplications || 0);
    el = document.getElementById('insight-offer-rate');
    if (el) el.textContent = String(stats.offerRate || '0%');
  }

  // ============================================
  // PRIVACY TOGGLE
  // ============================================
  function updatePrivacyUI(active) {
    var toggle = document.getElementById('privacy-toggle');
    var knob = document.getElementById('privacy-knob');
    var label = document.getElementById('privacy-label');
    if (!toggle || !knob || !label) return;

    if (active) {
      toggle.classList.remove('bg-slate-200');
      toggle.classList.add('bg-lmdr-blue');
      knob.classList.remove('translate-x-0');
      knob.classList.add('translate-x-5');
      label.textContent = 'Profile Visible';
      label.classList.add('text-lmdr-blue');
      label.classList.remove('text-slate-600');
    } else {
      toggle.classList.add('bg-slate-200');
      toggle.classList.remove('bg-lmdr-blue');
      knob.classList.add('translate-x-0');
      knob.classList.remove('translate-x-5');
      label.textContent = 'Profile Hidden';
      label.classList.add('text-slate-600');
      label.classList.remove('text-lmdr-blue');
    }
  }

  // ============================================
  // UNREAD BADGE
  // ============================================
  function updateUnreadBadge(count, byApplication) {
    var badge = document.getElementById('unread-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = String(count > 99 ? '99+' : count);
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    window.unreadByApplication = byApplication;
  }

  // ============================================
  // CHAT MESSAGES
  // ============================================
  function renderMessages(messages) {
    var container = document.getElementById('chat-messages');
    if (!messages || messages.length === 0) {
      container.innerHTML =
        '<div class="text-center py-10 text-slate-400 text-sm">' +
        '<i class="fa-solid fa-comments mb-2 block text-3xl opacity-20"></i>' +
        'No messages yet. Start the conversation!</div>';
      return;
    }

    var html = '';
    messages.forEach(function (msg) {
      var isDriver = msg.sender_type === 'driver';
      var isSystem = msg.sender_type === 'system';

      if (isSystem) {
        html += renderSystemMessage(msg);
        return;
      }

      html += '<div class="flex flex-col ' + (isDriver ? 'items-end' : 'items-start') + '">';
      html += '<div class="message-bubble ' + (isDriver ? 'message-driver' : 'message-recruiter') + '">';
      html += Config.stripHtml(msg.content) + '</div>';
      html += '<div class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider mx-2">';
      html += new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div></div>';
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  function renderSystemMessage(msg) {
    var metadata = {};
    try { metadata = JSON.parse(msg.metadata || '{}'); } catch (e) { /* ignore */ }
    var isAction = metadata.subType === 'ACTION_REQUIRED';

    var html = '<div class="flex flex-col items-center w-full my-4">';
    html += '<div class="bg-white border-2 ' + (isAction ? 'border-lmdr-blue shadow-blue-50' : 'border-slate-100') + ' rounded-2xl p-5 w-full max-w-[90%] shadow-sm text-center">';
    html += '<div class="w-10 h-10 ' + (isAction ? 'bg-blue-50 text-lmdr-blue' : 'bg-slate-50 text-slate-400') + ' rounded-full flex items-center justify-center mx-auto mb-3">';
    html += '<i class="fa-solid ' + (isAction ? 'fa-calendar-day' : 'fa-info-circle') + '"></i></div>';
    html += '<h4 class="font-black text-slate-900 text-sm mb-1">' + (isAction ? 'Scheduling Update' : 'System Notice') + '</h4>';
    html += '<p class="text-xs text-slate-600 font-medium leading-relaxed">' + Config.stripHtml(msg.content) + '</p>';

    if (isAction && metadata.payload && metadata.payload.action === 'PROVIDE_AVAILABILITY') {
      html += '<button onclick="DashboardLogic.showAvailabilityModal()" class="mt-4 w-full py-2.5 bg-lmdr-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition">Select Times</button>';
    }

    if (isAction && metadata.payload && metadata.payload.action === 'REVIEW_SLOTS' && metadata.payload.slots) {
      html += '<div class="mt-4 space-y-2">';
      metadata.payload.slots.forEach(function (s, idx) {
        html += '<button onclick="DashboardLogic.confirmSlot(' + idx + ')" class="w-full py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:border-lmdr-blue transition">';
        html += new Date(s.start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</button>';
      });
      html += '</div>';
    }

    html += '</div></div>';
    return html;
  }

  function appendNewMessages(messages) {
    var container = document.getElementById('chat-messages');
    if (!container || !messages || messages.length === 0) return;

    messages.forEach(function (msg) {
      var isDriver = msg.sender_type === 'driver';
      var div = document.createElement('div');
      div.className = 'flex flex-col ' + (isDriver ? 'items-end' : 'items-start');
      div.innerHTML =
        '<div class="message-bubble ' + (isDriver ? 'message-driver' : 'message-recruiter') + '">' +
        Config.stripHtml(msg.content) + '</div>' +
        '<div class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider mx-2">' +
        new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>';
      container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
  }

  // ============================================
  // APPLICATION CARDS
  // ============================================
  function renderDashboard(data, state) {
    var list = document.getElementById('application-list');
    var loading = document.getElementById('loading-state');
    var empty = document.getElementById('empty-state');

    if (data.applications) state.applications = data.applications;

    if (data.profile) {
      renderProfileStrength(data.profile);
    }

    var filtered = state.applications;
    if (state.currentFilter === 'active') {
      filtered = state.applications.filter(function (a) {
        return ['applied', 'in_review', 'contacted', 'offer'].indexOf(a.status) !== -1;
      });
    } else if (state.currentFilter === 'offer') {
      filtered = state.applications.filter(function (a) { return a.status === 'offer'; });
    } else if (state.currentFilter === 'withdrawn') {
      filtered = state.applications.filter(function (a) { return a.status === 'withdrawn'; });
    }

    var activeCount = state.applications.filter(function (a) {
      return ['applied', 'in_review', 'contacted', 'offer'].indexOf(a.status) !== -1;
    }).length;

    document.getElementById('stat-active').textContent = String(activeCount);
    document.getElementById('stat-total').textContent = String(state.applications.length);

    loading.classList.add('hidden');

    if (filtered.length === 0) {
      if (state.applications.length === 0) {
        empty.classList.remove('hidden');
      } else {
        list.innerHTML = '<div class="text-center py-10 text-slate-400">No applications match this filter.</div>';
        list.classList.remove('hidden');
        empty.classList.add('hidden');
        return;
      }
      list.classList.add('hidden');
      return;
    }

    empty.classList.add('hidden');
    list.classList.remove('hidden');
    list.innerHTML = '';

    filtered.forEach(function (app) {
      var card = document.createElement('div');
      card.className = 'bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover flex flex-col md:flex-row md:items-center gap-6';

      var statusKey = app.status || 'applied';
      var label = Config.STATUS_LABELS[statusKey] || statusKey;
      var dateStr = new Date(app.action_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      var isWithdrawn = statusKey === 'withdrawn';
      var isRejected = statusKey === 'rejected';
      var isTerminal = isWithdrawn || isRejected || statusKey === 'hired';
      var safeCarrierName = Config.stripHtml(app.carrier_name || '');
      var safeCarrierNameJs = String(app.carrier_name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      var timelineHtml = buildActivityTimeline(app.status_history || []);
      var hasHistory = app.status_history && app.status_history.length > 0;

      var html = '<div class="w-full">';
      html += '<div class="flex flex-col md:flex-row md:items-center gap-6">';
      html += '<div class="hidden md:flex flex-none w-16 h-16 bg-slate-100 rounded-xl items-center justify-center text-slate-400 font-bold text-xl">';
      html += safeCarrierName.substring(0, 2).toUpperCase() + '</div>';
      html += '<div class="flex-1">';
      html += '<div class="flex items-center gap-3 mb-1">';
      html += '<h3 class="font-bold text-lg text-slate-900">' + safeCarrierName + '</h3>';
      html += '<span class="status-badge status-' + statusKey + '">' + label + '</span></div>';
      html += '<div class="text-sm text-slate-500 font-medium flex items-center gap-4">';
      html += '<span><i class="fa-regular fa-calendar mr-1.5"></i>Applied ' + dateStr + '</span>';
      if (app.carrier_dot) html += '<span><i class="fa-solid fa-truck mr-1.5 text-slate-300"></i>DOT ' + app.carrier_dot + '</span>';
      html += '</div></div>';

      // Actions
      html += '<div class="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">';
      if (hasHistory) {
        html += '<button onclick="DashboardLogic.toggleTimeline(\'timeline-' + app._id + '\')" ';
        html += 'class="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-lmdr-blue hover:bg-blue-50 transition border border-transparent hover:border-blue-100">';
        html += '<i class="fa-solid fa-clock-rotate-left mr-1.5"></i> Activity</button>';
      }
      if (!isTerminal) {
        html += '<button onclick="DashboardLogic.promptWithdraw(\'' + app.carrier_dot + '\', \'' + safeCarrierNameJs + '\')" ';
        html += 'class="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition border border-transparent hover:border-red-100">Withdraw</button>';
      }
      html += '<button onclick="DashboardLogic.openChat(\'' + app._id + '\', \'' + safeCarrierNameJs + '\')" ';
      html += 'class="px-5 py-2.5 rounded-xl text-sm font-bold bg-lmdr-blue text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200">';
      html += '<i class="fa-solid fa-message mr-2"></i> Message</button>';
      html += '</div></div>';

      // Timeline
      if (hasHistory) {
        html += '<div id="timeline-' + app._id + '" class="hidden mt-4 pt-4 border-t border-slate-100">';
        html += '<h4 class="text-sm font-bold text-slate-600 mb-3"><i class="fa-solid fa-timeline mr-2"></i>Activity Timeline</h4>';
        html += timelineHtml + '</div>';
      }

      html += '</div>';
      card.innerHTML = html;
      list.appendChild(card);
    });
  }

  function buildActivityTimeline(history) {
    if (!history || history.length === 0) {
      return '<p class="text-sm text-slate-400">No activity recorded yet.</p>';
    }

    var sorted = history.slice().sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    var html = '<div class="relative pl-6 space-y-4">';
    html += '<div class="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"></div>';

    sorted.forEach(function (entry, idx) {
      var date = new Date(entry.timestamp);
      var dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      var timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      var statusLabel = Config.STATUS_LABELS[entry.status] || entry.status;
      var isLatest = idx === 0;
      var actorIcon = entry.actor === 'recruiter' ? 'fa-user-tie' : 'fa-user';
      var actorLabel = entry.actor === 'recruiter' ? 'Recruiter' : 'You';

      html += '<div class="relative flex items-start gap-3">';
      html += '<div class="absolute -left-4 top-1 w-3 h-3 rounded-full ' + (isLatest ? 'bg-lmdr-blue ring-4 ring-blue-100' : 'bg-slate-300') + '"></div>';
      html += '<div class="flex-1 min-w-0">';
      html += '<div class="flex items-center gap-2 flex-wrap">';
      html += '<span class="status-badge status-' + entry.status + ' text-xs">' + Config.stripHtml(statusLabel) + '</span>';
      html += '<span class="text-xs text-slate-400"><i class="fa-solid ' + actorIcon + ' mr-1"></i>' + actorLabel + '</span></div>';
      html += '<p class="text-xs text-slate-500 mt-1">' + Config.stripHtml(entry.note || '') + '</p>';
      html += '<p class="text-xs text-slate-400 mt-0.5">' + dateStr + ' at ' + timeStr + '</p>';
      html += '</div></div>';
    });

    html += '</div>';
    return html;
  }

  // ============================================
  // THEME
  // ============================================
  function updateThemeIcon(theme) {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }
  }

  return {
    renderProfileStrength: renderProfileStrength,
    renderViewsList: renderViewsList,
    renderInsightsPanel: renderInsightsPanel,
    updatePrivacyUI: updatePrivacyUI,
    updateUnreadBadge: updateUnreadBadge,
    renderMessages: renderMessages,
    appendNewMessages: appendNewMessages,
    renderDashboard: renderDashboard,
    updateThemeIcon: updateThemeIcon
  };
})();
