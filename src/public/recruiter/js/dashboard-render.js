/* =========================================
   RECRUITER DASHBOARD — Render Module
   Depends on: DashboardConfig, DashboardBridge
   All DOM building and update functions
   ========================================= */
var DashboardRender = (function () {
  'use strict';

  var strip = DashboardBridge.stripHtml;
  var STAGE_CONFIG = DashboardConfig.STAGE_CONFIG;
  var STAGE_ORDER = DashboardConfig.STAGE_ORDER;

  /* --- Utilities --- */
  function getInitials(name) {
    if (!name) return '??';
    var parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function showToast(message) {
    console.log('Toast:', message);
    var toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
  }

  function showError(message) {
    console.error('Error:', message);
    alert(message);
  }

  /* --- Donut Chart --- */
  function updateDonutChart(weights) {
    var total = Object.values(weights).reduce(function (a, b) { return a + b; }, 0);
    var totalEl = document.getElementById('totalPercent');
    if (totalEl) totalEl.textContent = total + '%';

    var circumference = 2 * Math.PI * 40;
    var offset = 0;

    Object.keys(weights).forEach(function (key) {
      var percent = weights[key] / 100;
      var dashLength = percent * circumference;
      var segment = document.getElementById('seg-' + key);
      if (segment) {
        segment.style.strokeDasharray = dashLength + ' ' + circumference;
        segment.style.strokeDashoffset = -offset;
        offset += dashLength;
      }
    });
  }

  /* --- Sidebar User --- */
  function updateSidebarUser(profile, currentCarrier) {
    if (!profile) return;
    var name = profile.firstName || profile.name || 'Recruiter';
    var company = profile.company || (currentCarrier && currentCarrier.carrier_name) || '--';
    var initials = getInitials(name);

    var nameEl = document.getElementById('sidebar-user-name');
    var companyEl = document.getElementById('sidebar-user-company');
    var initialsEl = document.getElementById('sidebar-user-initials');

    if (nameEl) nameEl.textContent = name;
    if (companyEl) companyEl.textContent = company;
    if (initialsEl) initialsEl.textContent = initials;
  }

  /* --- Carrier Header --- */
  function updateHeaderCarrier(currentCarrier, currentCarrierDOT) {
    var name = (currentCarrier && (currentCarrier.carrier_name || currentCarrier.legal_name)) || 'Select Carrier';
    document.getElementById('carrier-name').textContent = name;
    document.getElementById('carrier-dot').textContent = currentCarrierDOT ? 'DOT: ' + currentCarrierDOT : '';
  }

  /* --- Carrier Dropdown --- */
  function updateCarrierDropdown(carriers, currentCarrierDOT) {
    var list = document.getElementById('carrier-list');
    list.innerHTML = '';

    carriers.forEach(function (carrier) {
      var isActive = carrier.carrier_dot === currentCarrierDOT;
      var item = document.createElement('div');
      item.className = 'w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition ' + (isActive ? 'bg-blue-50' : '');

      var initials = getInitials(carrier.carrier_name);
      item.innerHTML =
        '<button class="flex-1 flex items-center gap-3 text-left" onclick="DashboardLogic.switchCarrier(\'' + carrier.carrier_dot + '\')">' +
          '<div class="w-8 h-8 rounded-lg bg-' + (isActive ? 'lmdr-blue' : 'slate-200') + ' flex items-center justify-center text-' + (isActive ? 'white' : 'slate-600') + ' font-bold text-xs">' + initials + '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="font-medium text-slate-900 text-sm truncate">' + strip(carrier.carrier_name) + '</div>' +
            '<div class="text-xs text-slate-500">DOT: ' + carrier.carrier_dot + '</div>' +
          '</div>' +
          (isActive ? '<i class="fa-solid fa-check text-lmdr-blue"></i>' : '') +
        '</button>' +
        '<button onclick="event.stopPropagation(); DashboardLogic.removeCarrier(\'' + carrier.carrier_dot + '\', \'' + carrier.carrier_name.replace(/'/g, "\\'") + '\')" ' +
          'class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove carrier">' +
          '<i class="fa-solid fa-trash-can text-xs"></i>' +
        '</button>';

      list.appendChild(item);
    });

    if (carriers.length === 0) {
      list.innerHTML = '<p class="text-center text-slate-400 text-sm py-4">No carriers yet</p>';
    }
  }

  /* --- Kanban --- */
  function renderKanban(groupedByStatus) {
    var container = document.getElementById('kanban-container');
    container.innerHTML = '';

    STAGE_ORDER.forEach(function (stage) {
      var config = STAGE_CONFIG[stage];
      var candidates = groupedByStatus[stage] || [];

      var column = document.createElement('div');
      column.className = 'kanban-column flex flex-col h-full rounded-2xl bg-white/50 border border-slate-200';
      column.innerHTML =
        '<div class="p-4 flex justify-between items-center bg-white rounded-t-2xl border-b border-slate-200 sticky top-0">' +
          '<div class="flex items-center gap-2">' +
            '<div class="status-dot status-' + stage + '"></div>' +
            '<h3 class="font-bold text-slate-900 text-sm">' + config.label + '</h3>' +
            '<span class="bg-slate-100 text-slate-500 text-xs font-bold px-2 rounded-full">' + candidates.length + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide" id="column-' + stage + '">' +
          (candidates.length === 0 ? '<p class="text-xs text-slate-400 text-center py-4">No candidates</p>' : '') +
        '</div>';

      container.appendChild(column);

      var columnBody = document.getElementById('column-' + stage);
      candidates.forEach(function (candidate) {
        columnBody.appendChild(createCandidateCard(candidate, stage));
      });
    });
  }

  function createCandidateCard(candidate, stage) {
    var card = document.createElement('div');
    card.className = 'card-drag bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden';
    card.onclick = function () { DashboardLogic.openCandidateModal(candidate); };

    var initials = getInitials(candidate.driverName);
    var scoreColor = candidate.matchScore >= 80 ? 'text-green-600' :
      candidate.matchScore >= 60 ? 'text-blue-600' : 'text-slate-500';

    card.innerHTML =
      '<div class="absolute top-0 left-0 w-1 h-full bg-' + (STAGE_CONFIG[stage] ? STAGE_CONFIG[stage].color : 'slate') + '-500"></div>' +
      '<div class="flex justify-between items-start mb-2">' +
        '<div class="flex items-center gap-2">' +
          '<div class="w-8 h-8 rounded-full bg-lmdr-blue flex items-center justify-center text-white font-bold text-xs">' + initials + '</div>' +
          '<span class="font-bold text-slate-900 text-sm">' + strip(candidate.driverName) + '</span>' +
        '</div>' +
        '<span class="' + scoreColor + ' text-xs font-black">' + candidate.matchScore + '%</span>' +
      '</div>' +
      '<div class="text-xs text-slate-500 mb-3 flex flex-wrap gap-1">' +
        (candidate.cdlClass ? '<span class="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">' + candidate.cdlClass + '</span>' : '') +
        (candidate.yearsExperience ? '<span class="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">' + candidate.yearsExperience + ' Yrs</span>' : '') +
        (candidate.endorsements ? '<span class="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">' + candidate.endorsements + '</span>' : '') +
      '</div>' +
      '<div class="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">' +
        '<button class="flex-1 bg-slate-50 text-slate-600 text-xs font-bold py-1.5 rounded hover:bg-slate-100">' +
          '<i class="fa-solid fa-eye mr-1"></i>View' +
        '</button>' +
        '<button onclick="event.stopPropagation(); DashboardLogic.openChat(\'' + candidate.interestId + '\', \'' + candidate.driverName.replace(/'/g, "\\'") + '\', \'' + candidate.driverId + '\')" ' +
          'class="flex-1 bg-blue-50 text-blue-600 text-xs font-bold py-1.5 rounded hover:bg-blue-100">' +
          '<i class="fa-solid fa-message mr-1"></i>Chat' +
        '</button>' +
      '</div>';

    return card;
  }

  /* --- Mobile List --- */
  function renderMobileList(groupedByStatus, currentMobileFilter) {
    var container = document.getElementById('mobile-list');
    container.innerHTML = '';

    var allCandidates = [];
    STAGE_ORDER.forEach(function (stage) {
      var candidates = groupedByStatus[stage] || [];
      candidates.forEach(function (c) {
        var copy = Object.assign({}, c);
        copy.status = stage;
        allCandidates.push(copy);
      });
    });

    if (currentMobileFilter !== 'all') {
      allCandidates = allCandidates.filter(function (c) { return c.status === currentMobileFilter; });
    }

    if (allCandidates.length === 0) {
      container.innerHTML =
        '<div class="text-center py-8 text-slate-400">' +
          '<i class="fa-solid fa-filter-circle-xmark text-2xl mb-2"></i>' +
          '<p class="text-sm">No candidates in this stage</p>' +
        '</div>';
      return;
    }

    allCandidates.forEach(function (candidate) {
      container.appendChild(createMobileListCard(candidate));
    });
  }

  function createMobileListCard(candidate) {
    var card = document.createElement('div');
    card.className = 'bg-white rounded-xl p-4 shadow-sm border border-slate-200 active:scale-[0.98] transition-transform';
    card.onclick = function () { DashboardLogic.openCandidateModal(candidate); };

    var initials = getInitials(candidate.driverName);
    var stageConfig = STAGE_CONFIG[candidate.status];
    var scoreColor = candidate.matchScore >= 80 ? 'text-green-600' :
      candidate.matchScore >= 60 ? 'text-blue-600' : 'text-slate-500';

    card.innerHTML =
      '<div class="flex items-center gap-3">' +
        '<div class="w-12 h-12 rounded-full bg-lmdr-blue flex items-center justify-center text-white font-bold text-sm flex-none">' +
          strip(initials) +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center justify-between gap-2 mb-1">' +
            '<span class="font-bold text-slate-900 truncate">' + strip(candidate.driverName) + '</span>' +
            '<span class="' + scoreColor + ' text-sm font-black flex-none">' + candidate.matchScore + '%</span>' +
          '</div>' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<span class="status-badge-sm status-badge-' + candidate.status + '">' + (stageConfig ? stageConfig.label : candidate.status) + '</span>' +
            (candidate.cdlClass ? '<span class="text-xs text-slate-500">' + strip(candidate.cdlClass) + '</span>' : '') +
            (candidate.yearsExperience ? '<span class="text-xs text-slate-500">' + candidate.yearsExperience + ' yrs</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<button onclick="event.stopPropagation(); DashboardLogic.openChat(\'' + candidate.interestId + '\', \'' + candidate.driverName.replace(/'/g, "\\'") + '\', \'' + candidate.driverId + '\')" ' +
            'class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition">' +
            '<i class="fa-solid fa-message text-sm"></i>' +
          '</button>' +
          '<i class="fa-solid fa-chevron-right text-slate-300 flex-none"></i>' +
        '</div>' +
      '</div>';

    return card;
  }

  /* --- Stats --- */
  function renderStageBreakdown(byStage) {
    var container = document.getElementById('stage-breakdown');
    container.innerHTML = '';

    var total = Object.values(byStage || {}).reduce(function (a, b) { return a + b; }, 0) || 1;

    STAGE_ORDER.forEach(function (stage) {
      var count = (byStage && byStage[stage]) || 0;
      var percent = Math.round((count / total) * 100);
      var config = STAGE_CONFIG[stage];

      container.innerHTML +=
        '<div class="flex items-center gap-3">' +
          '<div class="w-24 text-sm font-medium text-slate-600">' + config.label + '</div>' +
          '<div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">' +
            '<div class="h-full bg-' + config.color + '-500 rounded-full" style="width: ' + percent + '%"></div>' +
          '</div>' +
          '<div class="w-8 text-right text-sm font-bold text-slate-900">' + count + '</div>' +
        '</div>';
    });
  }

  /* --- Candidate Modal --- */
  function renderStatusButtons(currentStatus) {
    var container = document.getElementById('modal-status-buttons');
    container.innerHTML = '';

    STAGE_ORDER.forEach(function (stage) {
      if (stage === currentStatus) return;

      var config = STAGE_CONFIG[stage];
      var btn = document.createElement('button');
      btn.className = 'text-xs font-medium py-2 px-3 rounded-lg border border-slate-200 hover:bg-' + config.color + '-50 hover:border-' + config.color + '-200 transition';
      btn.innerHTML = '<i class="fa-solid ' + config.icon + ' mr-1"></i>' + config.label;
      btn.onclick = function () { DashboardLogic.updateStatus(stage); };
      container.appendChild(btn);
    });
  }

  function renderStatusHistory(history) {
    var container = document.getElementById('modal-history');
    container.innerHTML = '';

    if (!history || history.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-xs">No history yet</p>';
      return;
    }

    history.slice().reverse().forEach(function (entry) {
      var date = new Date(entry.timestamp);
      var config = STAGE_CONFIG[entry.status] || { label: entry.status, color: 'slate' };

      container.innerHTML +=
        '<div class="flex items-start gap-3">' +
          '<div class="status-dot status-' + entry.status + ' mt-1.5"></div>' +
          '<div class="flex-1">' +
            '<div class="font-medium text-slate-900">' + config.label + '</div>' +
            '<div class="text-xs text-slate-400">' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + '</div>' +
            (entry.note ? '<div class="text-xs text-slate-500 mt-1">' + entry.note + '</div>' : '') +
          '</div>' +
        '</div>';
    });
  }

  /* --- Chat Messages --- */
  function renderMessages(messages) {
    var container = document.getElementById('chat-messages');
    if (!messages || messages.length === 0) {
      container.innerHTML =
        '<div class="text-center py-10 text-slate-400 text-sm">' +
          '<i class="fa-solid fa-comments mb-2 block text-3xl opacity-20"></i>' +
          'No messages yet. Start the conversation!' +
        '</div>';
      return;
    }

    container.innerHTML = messages.map(function (msg) {
      var isRecruiter = msg.sender_type === 'recruiter';
      var isSystem = msg.sender_type === 'system';

      if (isSystem) {
        var metadata = {};
        try { metadata = JSON.parse(msg.metadata || '{}'); } catch (e) { }
        var isAction = metadata.subType === 'ACTION_REQUIRED';

        var slotsHtml = '';
        if (isAction && metadata.payload && metadata.payload.action === 'REVIEW_SLOTS' && metadata.payload.slots) {
          slotsHtml = '<div class="mt-4 space-y-2">' +
            metadata.payload.slots.map(function (s, idx) {
              return '<button onclick="DashboardLogic.confirmSlot(' + idx + ')" class="w-full py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:border-lmdr-blue transition">' +
                new Date(s.start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) +
              '</button>';
            }).join('') +
          '</div>';
        }

        return '<div class="flex flex-col items-center w-full my-4">' +
          '<div class="bg-white border-2 ' + (isAction ? 'border-lmdr-blue shadow-blue-50' : 'border-slate-100') + ' rounded-2xl p-5 w-full max-w-[90%] shadow-sm text-center">' +
            '<div class="w-10 h-10 ' + (isAction ? 'bg-blue-50 text-lmdr-blue' : 'bg-slate-50 text-slate-400') + ' rounded-full flex items-center justify-center mx-auto mb-3">' +
              '<i class="fa-solid ' + (isAction ? 'fa-calendar-day' : 'fa-info-circle') + '"></i>' +
            '</div>' +
            '<h4 class="font-black text-slate-900 text-sm mb-1">' + (isAction ? 'Scheduling Update' : 'System Notice') + '</h4>' +
            '<p class="text-xs text-slate-600 font-medium leading-relaxed">' + strip(msg.content) + '</p>' +
            slotsHtml +
          '</div>' +
        '</div>';
      }

      return '<div class="flex flex-col ' + (isRecruiter ? 'items-end' : 'items-start') + '">' +
        '<div class="message-bubble ' + (isRecruiter ? 'message-recruiter' : 'message-driver') + '">' +
          strip(msg.content) +
        '</div>' +
        '<div class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider mx-2">' +
          new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        '</div>' +
      '</div>';
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  function appendNewMessages(messages) {
    var container = document.getElementById('chat-messages');
    if (!container || !messages || messages.length === 0) return;

    messages.forEach(function (msg) {
      var isRecruiter = msg.sender_type === 'recruiter';
      var div = document.createElement('div');
      div.className = 'flex flex-col ' + (isRecruiter ? 'items-end' : 'items-start');
      div.innerHTML =
        '<div class="message-bubble ' + (isRecruiter ? 'message-recruiter' : 'message-driver') + '">' +
          strip(msg.content) +
        '</div>' +
        '<div class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider mx-2">' +
          new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        '</div>';
      container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
  }

  /* --- Unread Badge --- */
  function updateUnreadBadge(count, byApplication) {
    var badge = document.getElementById('unread-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    window.unreadByApplication = byApplication;
  }

  /* --- System Health --- */
  function updateSystemHealthUI(data) {
    if (!data) return;

    var dot = document.getElementById('health-indicator-dot');
    var text = document.getElementById('health-indicator-text');

    if (dot && text) {
      if (data.status === 'outage') {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse';
        text.textContent = 'System Issues';
        text.className = 'text-xs font-bold text-red-600';
      } else if (data.status === 'degraded') {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse';
        text.textContent = 'Degraded';
        text.className = 'text-xs font-bold text-yellow-600';
      } else {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse';
        text.textContent = 'Operational';
        text.className = 'text-xs font-bold text-green-600';
      }
    }

    document.getElementById('health-last-updated').textContent = 'Last checked: ' + new Date().toLocaleTimeString();

    updateServiceCard('database', data.checks ? data.checks.database : null);
    updateServiceCard('ai', data.checks ? data.checks.ai : null);
    updateServiceCard('enrichment', data.checks ? data.checks.enrichment : null);
    updateServiceCard('fmcsa', data.checks ? data.checks.fmcsa : null);
  }

  function updateServiceCard(id, checkData) {
    var el = document.getElementById('status-' + id);
    if (!el || !checkData) return;

    var colorClass = 'bg-slate-100 text-slate-700';
    if (checkData.status === 'healthy' || checkData.status === 'Active' || checkData.status === 'Reachable') {
      colorClass = 'bg-green-100 text-green-700';
    } else if (checkData.status === 'degraded') {
      colorClass = 'bg-yellow-100 text-yellow-700';
    } else {
      colorClass = 'bg-red-100 text-red-700';
    }

    el.className = 'text-xs font-bold px-2 py-1 rounded ' + colorClass;
    el.textContent = checkData.message || checkData.status;
  }

  /* --- Weight Sliders --- */
  function updateWeightSliders(weights) {
    Object.keys(weights).forEach(function (key) {
      var slider = document.getElementById('slider-' + key);
      var valEl = document.getElementById('val-' + key);
      if (slider) slider.value = weights[key];
      if (valEl) valEl.textContent = weights[key] + '%';
    });
    updateDonutChart(weights);
  }

  return {
    getInitials: getInitials,
    showToast: showToast,
    showError: showError,
    updateDonutChart: updateDonutChart,
    updateSidebarUser: updateSidebarUser,
    updateHeaderCarrier: updateHeaderCarrier,
    updateCarrierDropdown: updateCarrierDropdown,
    renderKanban: renderKanban,
    renderMobileList: renderMobileList,
    renderStageBreakdown: renderStageBreakdown,
    renderStatusButtons: renderStatusButtons,
    renderStatusHistory: renderStatusHistory,
    renderMessages: renderMessages,
    appendNewMessages: appendNewMessages,
    updateUnreadBadge: updateUnreadBadge,
    updateSystemHealthUI: updateSystemHealthUI,
    updateWeightSliders: updateWeightSliders
  };
})();
