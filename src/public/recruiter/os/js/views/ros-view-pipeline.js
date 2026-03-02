// ============================================================================
// ROS-VIEW-PIPELINE — Multi-Mode Candidate Pipeline
// Modes: Kanban · List · Focus
// Neumorphic Solarized Design System
//
// Security: All user-supplied strings pass through esc() (textContent-based
// sanitization) before HTML interpolation — safe against XSS injection.
// ============================================================================

(function () {
  'use strict';

  var VIEW_ID = 'pipeline';
  var MESSAGES = [
    'pipelineLoaded', 'statusUpdated', 'statsLoaded', 'candidateDetails',
    'notesAdded', 'error'
  ];

  var STAGES = [
    { id: 'interested', label: 'Interested', icon: 'star',          grad: 'from-amber-400 to-amber-600',    text: 'text-amber-600',   bg: 'bg-amber-500/10',   ring: 'ring-amber-400/40' },
    { id: 'contacted',  label: 'Contacted',  icon: 'call',          grad: 'from-lmdr-blue to-blue-600',     text: 'text-lmdr-blue',   bg: 'bg-blue-500/10',    ring: 'ring-blue-400/40' },
    { id: 'review',     label: 'Review',     icon: 'rate_review',   grad: 'from-violet-500 to-violet-700',  text: 'text-violet-600',  bg: 'bg-violet-500/10',  ring: 'ring-violet-400/40' },
    { id: 'offer',      label: 'Offer',      icon: 'handshake',     grad: 'from-orange-400 to-orange-600',  text: 'text-orange-600',  bg: 'bg-orange-500/10',  ring: 'ring-orange-400/40' },
    { id: 'hired',      label: 'Hired',      icon: 'verified',      grad: 'from-emerald-500 to-emerald-700',text: 'text-emerald-600', bg: 'bg-emerald-500/10', ring: 'ring-emerald-400/40' }
  ];

  var MODES = [
    { id: 'kanban', icon: 'view_kanban',           label: 'Board' },
    { id: 'list',   icon: 'format_list_bulleted',   label: 'List' },
    { id: 'focus',  icon: 'center_focus_strong',    label: 'Focus' }
  ];

  // ── State ──
  var currentMode = 'kanban';
  var candidates = {};
  var allCandidates = [];
  var stats = {};
  var focusIndex = 0;
  var focusStageFilter = null;
  var selectedIds = new Set();
  var sortField = 'name';
  var sortDir = 'asc';
  var draggedCardId = null;
  var activeDrawerCandidateId = null;

  // ── Utilities ──
  // XSS-safe escaper: uses DOM textContent to neutralize any HTML/script
  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function toast(msg, isError) {
    var t = document.createElement('div');
    t.className = 'fixed top-[80px] right-6 z-[9999] px-5 py-3 rounded-xl neu text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
    t.style.animation = 'fadeUp .35s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
    var icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-[16px] ' + (isError ? 'text-red-500' : 'text-emerald-500');
    icon.textContent = isError ? 'error' : 'check_circle';
    t.appendChild(icon);
    t.appendChild(document.createTextNode(' ' + msg));
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; t.style.transition = 'all .3s';
      setTimeout(function () { t.remove(); }, 300);
    }, 2800);
  }

  function getStage(id) {
    return STAGES.find(function (s) { return s.id === id; }) || STAGES[0];
  }

  function ini(name) {
    return (name || '?').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  }

  function daysAgo(dateStr) {
    if (!dateStr) return '--';
    var diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    return diff <= 0 ? 'Today' : diff + 'd';
  }

  function getFocusList() {
    if (focusStageFilter) return candidates[focusStageFilter] || [];
    return allCandidates;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — Main
  // ══════════════════════════════════════════════════════════════════════════

  function render() {
    return [
      renderHeader(),
      renderStats(),
      renderModeSwitcher(),
      '<div id="pipe-content" class="flex-1 mt-4 relative z-10 transition-all duration-300" style="min-height:0">' + renderMode() + '</div>',
      renderDrawer(),
      renderNoteModal()
    ].join('');
  }

  // ── Header ──
  function renderHeader() {
    return '<div class="flex items-center gap-3 relative z-10">' +
      '<button onclick="ROS.views.showView(\'home\')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center hover:scale-105 transition-transform">' +
        '<span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span></button>' +
      '<div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">' +
        '<span class="material-symbols-outlined text-white text-[18px]">view_kanban</span></div>' +
      '<div>' +
        '<h2 class="text-[17px] font-black text-lmdr-dark leading-tight tracking-tight">Candidate Pipeline</h2>' +
        '<p class="text-[10px] font-bold text-tan mt-0.5" id="pipe-total">Loading...</p>' +
      '</div>' +
      '<div class="ml-auto flex items-center gap-2">' +
        '<button onclick="ROS.views._pipeline.refresh()" class="w-8 h-8 neu-x rounded-lg flex items-center justify-center hover:scale-105 transition-transform" title="Refresh">' +
          '<span class="material-symbols-outlined text-tan text-[14px]">refresh</span></button>' +
      '</div>' +
    '</div>';
  }

  // ── Stats Bar ──
  function renderStats() {
    var cards = [
      { id: 'stat-total',      label: 'Total',      color: 'text-lmdr-dark', icon: 'groups' },
      { id: 'stat-week',       label: 'This Week',  color: 'text-lmdr-blue', icon: 'trending_up' },
      { id: 'stat-conversion', label: 'Conversion',  color: 'text-emerald-600', icon: 'verified' },
      { id: 'stat-days',       label: 'Avg Days',   color: 'text-orange-600', icon: 'schedule' }
    ];
    var html = '<div class="grid grid-cols-4 gap-3 mt-4 relative z-10">';
    cards.forEach(function (c) {
      html += '<div class="neu-x p-3 rounded-xl flex items-center gap-3">' +
        '<div class="w-8 h-8 rounded-lg neu-ins flex items-center justify-center flex-none">' +
          '<span class="material-symbols-outlined text-[14px] ' + c.color + '">' + c.icon + '</span></div>' +
        '<div>' +
          '<p class="text-[8px] font-black uppercase tracking-[.15em] text-tan">' + c.label + '</p>' +
          '<h3 class="text-[18px] font-black ' + c.color + ' leading-none mt-0.5" id="' + c.id + '">--</h3>' +
        '</div></div>';
    });
    html += '</div>';
    return html;
  }

  // ── Mode Switcher ──
  function renderModeSwitcher() {
    var html = '<div class="mt-4 flex items-center gap-2 relative z-10 flex-wrap">' +
      '<div class="neu-in rounded-xl p-1 flex gap-1">';
    MODES.forEach(function (m) {
      var active = m.id === currentMode;
      html += '<button onclick="ROS.views._pipeline.switchMode(\'' + m.id + '\')" ' +
        'class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ' +
        (active ? 'neu-x text-lmdr-dark' : 'text-tan hover:text-lmdr-dark') + '" ' +
        'id="pipe-mode-' + m.id + '">' +
        '<span class="material-symbols-outlined text-[14px]">' + m.icon + '</span>' +
        '<span class="hidden sm:inline">' + m.label + '</span>' +
      '</button>';
    });
    html += '</div>';

    // Stage filter pills (for Focus mode)
    if (currentMode === 'focus') {
      html += '<div class="flex gap-1.5 ml-3">' +
        '<button onclick="ROS.views._pipeline.filterFocusStage(null)" class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ' +
          (!focusStageFilter ? 'neu-x text-lmdr-dark' : 'text-tan hover:text-lmdr-dark') + '">All</button>';
      STAGES.forEach(function (s) {
        html += '<button onclick="ROS.views._pipeline.filterFocusStage(\'' + s.id + '\')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ' +
          (focusStageFilter === s.id ? 'neu-x ' + s.text : 'text-tan hover:text-lmdr-dark') + '">' + s.label + '</button>';
      });
      html += '</div>';
    }

    // Bulk action bar (for List mode with selections)
    if (currentMode === 'list' && selectedIds.size > 0) {
      html += '<div class="ml-auto flex items-center gap-2">' +
        '<span class="text-[11px] font-bold text-lmdr-blue">' + selectedIds.size + ' selected</span>' +
        '<button onclick="ROS.views._pipeline.bulkAdvance()" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white text-[10px] font-bold hover:scale-105 transition-transform">Advance Stage</button>' +
        '<button onclick="ROS.views._pipeline.clearSelection()" class="px-3 py-1.5 rounded-lg neu-x text-[10px] font-bold text-tan">Clear</button>' +
      '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderMode() {
    switch (currentMode) {
      case 'kanban': return renderKanban();
      case 'list':   return renderList();
      case 'focus':  return renderFocus();
      default:       return renderKanban();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODE 1: KANBAN
  // ══════════════════════════════════════════════════════════════════════════

  function renderKanban() {
    var cols = STAGES.map(function (s) {
      var items = candidates[s.id] || [];
      return '<div class="flex flex-col flex-1 min-w-[170px] pipe-column" data-stage="' + s.id + '" ' +
        'ondragover="ROS.views._pipeline.allowDrop(event)" ondrop="ROS.views._pipeline.drop(event)">' +
        '<div class="px-3 py-2.5 rounded-xl neu-in text-center mb-3 flex items-center justify-center gap-2">' +
          '<span class="material-symbols-outlined text-[14px] ' + s.text + '">' + s.icon + '</span>' +
          '<span class="text-[10px] font-black uppercase tracking-wider ' + s.text + '">' + s.label + '</span>' +
          '<span class="ml-auto w-5 h-5 rounded-full ' + s.bg + ' text-[10px] font-black ' + s.text + ' flex items-center justify-center" id="pipe-count-' + s.id + '">' + items.length + '</span>' +
        '</div>' +
        '<div class="flex-1 flex flex-col gap-2 min-h-[80px] pb-10 overflow-y-auto thin-scroll" id="pipe-col-' + s.id + '">' +
          (items.length === 0
            ? '<div class="text-center text-[10px] text-tan/40 py-6 border-2 border-dashed border-tan/15 rounded-xl mx-1 mt-1">Drop here</div>'
            : items.map(function (c) { return renderKanbanCard(c, s); }).join('')) +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="flex gap-3 flex-1 overflow-x-auto thin-scroll pb-4">' + cols + '</div>';
  }

  function renderKanbanCard(c, stage) {
    var name = c.name || c.driver_name || 'Unknown';
    var detail = c.cdl_type || c.location || 'CDL-A Driver';
    var id = c._id || c.id || '';
    var badge = c.badge || '';
    var lastDate = daysAgo(c.last_contacted || c.updatedDate || c._updatedDate);
    var badgeColors = {
      'New Match': 'bg-amber-500/15 text-amber-700', 'AI Found': 'bg-blue-500/15 text-lmdr-blue',
      'Replied': 'bg-emerald-500/15 text-emerald-700', 'Hot Lead': 'bg-red-500/15 text-red-600'
    };
    var bc = badgeColors[badge] || 'bg-tan/10 text-tan';
    var badgeHtml = badge ? '<span class="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ' + bc + '">' + esc(badge) + '</span>' : '';

    return '<div draggable="true" ondragstart="ROS.views._pipeline.drag(event)" ' +
      'id="pipe-card-' + esc(id) + '" data-id="' + esc(id) + '" ' +
      'class="p-3 neu-x rounded-xl cursor-grab hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 group" ' +
      'onclick="ROS.views._pipeline.viewCandidate(\'' + esc(id) + '\')">' +
      '<div class="flex gap-2.5">' +
        '<div class="w-9 h-9 rounded-full bg-gradient-to-br ' + stage.grad + ' flex items-center justify-center text-[10px] font-black text-white flex-none shadow-sm">' + esc(ini(name)) + '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="text-[12px] font-bold text-lmdr-dark truncate group-hover:text-lmdr-blue transition-colors">' + esc(name) + '</div>' +
          '<div class="text-[10px] text-tan mt-0.5 truncate">' + esc(detail) + '</div>' +
          '<div class="flex items-center gap-2 mt-2">' +
            badgeHtml +
            '<span class="text-[8px] text-tan/60 font-bold ml-auto flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px]">schedule</span>' + lastDate + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODE 2: LIST
  // ══════════════════════════════════════════════════════════════════════════

  function renderList() {
    var sorted = getSortedCandidates();

    var headerCols = [
      { field: 'select', label: '', width: 'w-10', sortable: false },
      { field: 'name',   label: 'Candidate', width: 'flex-1 min-w-[160px]', sortable: true },
      { field: 'cdl',    label: 'CDL / Type', width: 'w-[100px]', sortable: true },
      { field: 'location', label: 'Location', width: 'w-[120px]', sortable: true },
      { field: 'status', label: 'Stage', width: 'w-[110px]', sortable: true },
      { field: 'days',   label: 'Days', width: 'w-[60px]', sortable: true },
      { field: 'actions', label: '', width: 'w-[100px]', sortable: false }
    ];

    var thead = '<div class="flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-tan">';
    headerCols.forEach(function (col) {
      var sortIcon = '';
      if (col.sortable && sortField === col.field) {
        sortIcon = '<span class="material-symbols-outlined text-[10px] text-lmdr-blue">' + (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') + '</span>';
      }
      var click = col.sortable ? ' onclick="ROS.views._pipeline.sortBy(\'' + col.field + '\')" class="cursor-pointer hover:text-lmdr-dark transition-colors flex items-center gap-1 ' + col.width + '"' : ' class="' + col.width + '"';
      thead += '<div' + click + '>' + col.label + sortIcon + '</div>';
    });
    thead += '</div>';

    var rows = '';
    if (sorted.length === 0) {
      rows = '<div class="text-center py-12 text-[12px] text-tan/50">No candidates in pipeline</div>';
    } else {
      sorted.forEach(function (c, i) {
        rows += renderListRow(c, i);
      });
    }

    return '<div class="neu-in rounded-xl overflow-hidden">' +
      thead +
      '<div class="max-h-[calc(100vh-380px)] overflow-y-auto thin-scroll divide-y divide-tan/10">' + rows + '</div>' +
    '</div>';
  }

  function renderListRow(c, index) {
    var name = c.name || c.driver_name || 'Unknown';
    var id = c._id || c.id || '';
    var stage = getStage((c.status || c.stage || 'interested').toLowerCase());
    var cdl = c.cdl_type || c.cdl_class || 'CDL-A';
    var loc = c.location || c.city || '--';
    var lastDate = daysAgo(c.last_contacted || c.updatedDate || c._updatedDate);
    var isSelected = selectedIds.has(id);
    var delay = Math.min(index * 20, 300);

    return '<div class="flex items-center gap-2 px-3 py-2.5 hover:bg-tan/5 transition-colors group cursor-pointer" ' +
      'style="animation: fadeUp .3s ' + delay + 'ms both" ' +
      'onclick="ROS.views._pipeline.viewCandidate(\'' + esc(id) + '\')">' +

      // Checkbox
      '<div class="w-10 flex-none flex items-center justify-center">' +
        '<div onclick="event.stopPropagation(); ROS.views._pipeline.toggleSelect(\'' + esc(id) + '\')" ' +
          'class="w-4 h-4 rounded ' + (isSelected ? 'bg-lmdr-blue' : 'neu-ins') + ' flex items-center justify-center cursor-pointer transition-all">' +
          (isSelected ? '<span class="material-symbols-outlined text-white text-[12px]">check</span>' : '') +
        '</div>' +
      '</div>' +

      // Name + Avatar
      '<div class="flex-1 min-w-[160px] flex items-center gap-2.5">' +
        '<div class="w-8 h-8 rounded-full bg-gradient-to-br ' + stage.grad + ' flex items-center justify-center text-[9px] font-black text-white flex-none">' + esc(ini(name)) + '</div>' +
        '<div class="min-w-0">' +
          '<div class="text-[12px] font-bold text-lmdr-dark truncate group-hover:text-lmdr-blue transition-colors">' + esc(name) + '</div>' +
          (c.badge ? '<span class="text-[8px] font-bold ' + stage.text + '">' + esc(c.badge) + '</span>' : '') +
        '</div>' +
      '</div>' +

      // CDL
      '<div class="w-[100px] text-[11px] font-bold text-lmdr-dark">' + esc(cdl) + '</div>' +

      // Location
      '<div class="w-[120px] text-[11px] text-tan truncate">' + esc(loc) + '</div>' +

      // Stage pill
      '<div class="w-[110px]">' +
        '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ' + stage.bg + ' ' + stage.text + '">' +
          '<span class="material-symbols-outlined text-[10px]">' + stage.icon + '</span>' + stage.label +
        '</span>' +
      '</div>' +

      // Days
      '<div class="w-[60px] text-[11px] font-bold text-tan text-center">' + lastDate + '</div>' +

      // Actions (hover-reveal)
      '<div class="w-[100px] flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">' +
        '<button onclick="event.stopPropagation(); ROS.views._pipeline.callCandidate(\'' + esc(id) + '\')" class="w-7 h-7 rounded-lg neu-x flex items-center justify-center hover:scale-110 transition-transform" title="Call">' +
          '<span class="material-symbols-outlined text-[13px] text-emerald-600">call</span></button>' +
        '<button onclick="event.stopPropagation(); ROS.views._pipeline.advanceCandidate(\'' + esc(id) + '\')" class="w-7 h-7 rounded-lg neu-x flex items-center justify-center hover:scale-110 transition-transform" title="Advance">' +
          '<span class="material-symbols-outlined text-[13px] text-lmdr-blue">arrow_forward</span></button>' +
        '<button onclick="event.stopPropagation(); ROS.views._pipeline.quickNote(\'' + esc(id) + '\')" class="w-7 h-7 rounded-lg neu-x flex items-center justify-center hover:scale-110 transition-transform" title="Note">' +
          '<span class="material-symbols-outlined text-[13px] text-amber-600">edit_note</span></button>' +
      '</div>' +
    '</div>';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODE 3: FOCUS (Triage Queue)
  // ══════════════════════════════════════════════════════════════════════════

  function renderFocus() {
    var list = getFocusList();
    if (list.length === 0) {
      return '<div class="flex items-center justify-center h-full">' +
        '<div class="text-center py-16">' +
          '<div class="w-16 h-16 rounded-2xl neu mx-auto flex items-center justify-center mb-4">' +
            '<span class="material-symbols-outlined text-[28px] text-tan/40">inbox</span></div>' +
          '<p class="text-[14px] font-bold text-lmdr-dark">Pipeline Empty</p>' +
          '<p class="text-[11px] text-tan mt-1">No candidates to review right now</p>' +
        '</div></div>';
    }

    if (focusIndex >= list.length) focusIndex = list.length - 1;
    if (focusIndex < 0) focusIndex = 0;
    var c = list[focusIndex];
    var stage = getStage((c.status || c.stage || 'interested').toLowerCase());
    var name = c.name || c.driver_name || 'Unknown';
    var id = c._id || c.id || '';
    var cdl = c.cdl_type || c.cdl_class || 'CDL-A';
    var loc = c.location || c.city || '--';
    var phone = c.phone || 'No phone';
    var email = c.email || 'No email';
    var lastDate = daysAgo(c.last_contacted || c.updatedDate || c._updatedDate);
    var exp = c.years_experience || c.experience || '--';
    var badge = c.badge || '';

    // Stage progress dots
    var stageIdx = STAGES.findIndex(function (s) { return s.id === stage.id; });
    var dots = '<div class="flex items-center gap-1.5">';
    STAGES.forEach(function (s, i) {
      if (i < stageIdx) {
        dots += '<div class="w-2.5 h-2.5 rounded-full bg-gradient-to-br ' + s.grad + ' shadow-sm"></div>' +
          '<div class="w-6 h-0.5 bg-gradient-to-r ' + s.grad + ' rounded-full"></div>';
      } else if (i === stageIdx) {
        dots += '<div class="w-4 h-4 rounded-full bg-gradient-to-br ' + s.grad + ' shadow-md flex items-center justify-center ring-2 ' + s.ring + '">' +
          '<span class="material-symbols-outlined text-white text-[10px]">' + s.icon + '</span></div>';
        if (i < STAGES.length - 1) dots += '<div class="w-6 h-0.5 bg-tan/20 rounded-full"></div>';
      } else {
        dots += '<div class="w-2.5 h-2.5 rounded-full neu-ins"></div>';
        if (i < STAGES.length - 1) dots += '<div class="w-6 h-0.5 bg-tan/20 rounded-full"></div>';
      }
    });
    dots += '</div>';

    // Decorative ghost cards behind the main card
    var stackBg = '<div class="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">' +
      (list.length > 2 ? '<div class="absolute w-[calc(100%-40px)] h-[320px] rounded-2xl neu-x opacity-20 transform translate-y-4 scale-[0.92]"></div>' : '') +
      (list.length > 1 ? '<div class="absolute w-[calc(100%-24px)] h-[330px] rounded-2xl neu-x opacity-35 transform translate-y-2 scale-[0.96]"></div>' : '') +
    '</div>';

    return '<div class="flex flex-col items-center justify-center flex-1 relative px-4">' +

      // Counter
      '<div class="text-[11px] font-bold text-tan mb-4 flex items-center gap-2">' +
        '<span class="material-symbols-outlined text-[14px]">filter_list</span>' +
        '<span>' + (focusIndex + 1) + ' of ' + list.length + '</span>' +
        (focusStageFilter ? '<span class="px-2 py-0.5 rounded-md ' + getStage(focusStageFilter).bg + ' ' + getStage(focusStageFilter).text + ' text-[9px] font-black uppercase">' + getStage(focusStageFilter).label + '</span>' : '') +
      '</div>' +

      // Card stack container
      '<div class="relative w-full max-w-[420px]">' +
        stackBg +

        // Main card
        '<div class="relative neu rounded-2xl overflow-hidden" id="focus-card" style="animation: fadeUp .35s cubic-bezier(0.18, 0.89, 0.32, 1.28)">' +

          // Stage color bar
          '<div class="h-2 bg-gradient-to-r ' + stage.grad + '"></div>' +

          '<div class="p-6">' +
            // Avatar + name + stage
            '<div class="flex items-start gap-4">' +
              '<div class="w-14 h-14 rounded-xl bg-gradient-to-br ' + stage.grad + ' flex items-center justify-center text-[18px] font-black text-white shadow-lg flex-none">' + esc(ini(name)) + '</div>' +
              '<div class="flex-1 min-w-0">' +
                '<h3 class="text-[18px] font-black text-lmdr-dark leading-tight">' + esc(name) + '</h3>' +
                '<p class="text-[12px] font-bold text-tan mt-0.5">' + esc(cdl) + (loc !== '--' ? ' &middot; ' + esc(loc) : '') + '</p>' +
                '<div class="mt-2">' + dots + '</div>' +
              '</div>' +
              (badge ? '<span class="text-[9px] font-black px-2.5 py-1 rounded-lg ' + stage.bg + ' ' + stage.text + ' uppercase tracking-wider flex-none">' + esc(badge) + '</span>' : '') +
            '</div>' +

            // Quick stats strip
            '<div class="grid grid-cols-3 gap-3 mt-5">' +
              '<div class="neu-ins rounded-xl p-3 text-center">' +
                '<p class="text-[8px] font-black uppercase tracking-[.12em] text-tan">Stage</p>' +
                '<p class="text-[13px] font-black ' + stage.text + ' mt-1">' + stage.label + '</p></div>' +
              '<div class="neu-ins rounded-xl p-3 text-center">' +
                '<p class="text-[8px] font-black uppercase tracking-[.12em] text-tan">In Pipeline</p>' +
                '<p class="text-[13px] font-black text-lmdr-dark mt-1">' + lastDate + '</p></div>' +
              '<div class="neu-ins rounded-xl p-3 text-center">' +
                '<p class="text-[8px] font-black uppercase tracking-[.12em] text-tan">Experience</p>' +
                '<p class="text-[13px] font-black text-lmdr-dark mt-1">' + esc(String(exp)) + (exp !== '--' ? ' yr' : '') + '</p></div>' +
            '</div>' +

            // Contact info
            '<div class="mt-5 neu-in rounded-xl p-4 space-y-3">' +
              '<div class="flex items-center gap-3 cursor-pointer hover:text-lmdr-blue transition-colors" onclick="ROS.views._pipeline.callCandidate(\'' + esc(id) + '\')">' +
                '<div class="w-7 h-7 rounded-lg neu-x flex items-center justify-center flex-none">' +
                  '<span class="material-symbols-outlined text-[13px] text-emerald-600">call</span></div>' +
                '<span class="text-[12px] font-bold text-lmdr-dark">' + esc(phone) + '</span>' +
                '<span class="material-symbols-outlined text-[12px] text-tan/40 ml-auto">content_copy</span>' +
              '</div>' +
              '<div class="flex items-center gap-3">' +
                '<div class="w-7 h-7 rounded-lg neu-x flex items-center justify-center flex-none">' +
                  '<span class="material-symbols-outlined text-[13px] text-lmdr-blue">mail</span></div>' +
                '<span class="text-[12px] font-bold text-lmdr-dark break-all">' + esc(email) + '</span>' +
              '</div>' +
            '</div>' +

          '</div>' +
        '</div>' +
      '</div>' +

      // Action bar
      '<div class="flex items-center gap-3 mt-6 mb-2">' +
        '<button onclick="ROS.views._pipeline.focusPrev()" class="w-10 h-10 rounded-xl neu-x flex items-center justify-center hover:scale-110 transition-transform ' + (focusIndex <= 0 ? 'opacity-30 pointer-events-none' : '') + '" title="Previous">' +
          '<span class="material-symbols-outlined text-[18px] text-tan">chevron_left</span></button>' +
        '<button onclick="ROS.views._pipeline.callCandidate(\'' + esc(id) + '\')" class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Call">' +
          '<span class="material-symbols-outlined text-white text-[22px]">call</span></button>' +
        '<button onclick="ROS.views._pipeline.advanceCandidate(\'' + esc(id) + '\')" class="w-12 h-12 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center hover:scale-110 transition-transform shadow-lg" title="Advance Stage">' +
          '<span class="material-symbols-outlined text-white text-[22px]">arrow_forward</span></button>' +
        '<button onclick="ROS.views._pipeline.quickNote(\'' + esc(id) + '\')" class="w-12 h-12 rounded-xl neu flex items-center justify-center hover:scale-110 transition-transform" title="Add Note">' +
          '<span class="material-symbols-outlined text-amber-600 text-[22px]">edit_note</span></button>' +
        '<button onclick="ROS.views._pipeline.focusNext()" class="w-10 h-10 rounded-xl neu-x flex items-center justify-center hover:scale-110 transition-transform ' + (focusIndex >= list.length - 1 ? 'opacity-30 pointer-events-none' : '') + '" title="Next">' +
          '<span class="material-symbols-outlined text-[18px] text-tan">chevron_right</span></button>' +
      '</div>' +

      // Keyboard hint
      '<p class="text-[9px] text-tan/50 font-bold mt-1 flex items-center gap-3">' +
        '<span>&larr; &rarr; Navigate</span><span>Enter Advance</span><span>N Note</span></p>' +
    '</div>';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DRAWER (Shared across modes)
  // ══════════════════════════════════════════════════════════════════════════

  function renderDrawer() {
    return '<div id="pipe-drawer-overlay" class="fixed inset-0 bg-black/20 z-[90] hidden opacity-0 transition-opacity backdrop-blur-[2px]" ' +
      'onclick="ROS.views._pipeline.closeDrawer()"></div>' +

      '<div id="pipe-drawer" class="fixed top-0 right-0 h-full w-full max-w-[380px] bg-beige z-[100] transform translate-x-full transition-transform duration-300 flex flex-col" style="box-shadow: -8px 0 24px rgba(0,0,0,.08)">' +
        '<div class="p-5 border-b border-tan/10 flex justify-between items-center">' +
          '<div class="flex items-center gap-3">' +
            '<div id="drawer-initials" class="w-10 h-10 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-white font-black flex items-center justify-center text-[12px]"></div>' +
            '<div>' +
              '<h3 id="drawer-name" class="font-black text-[15px] text-lmdr-dark leading-tight">--</h3>' +
              '<p id="drawer-subtitle" class="text-[10px] font-bold text-tan mt-0.5">--</p>' +
            '</div></div>' +
          '<button onclick="ROS.views._pipeline.closeDrawer()" class="w-8 h-8 rounded-full neu-x flex items-center justify-center text-tan hover:text-lmdr-dark transition-colors">' +
            '<span class="material-symbols-outlined text-[16px]">close</span></button>' +
        '</div>' +

        '<div class="flex-1 overflow-y-auto thin-scroll p-5 space-y-5">' +
          '<div>' +
            '<h4 class="text-[9px] font-black uppercase tracking-[.12em] text-tan mb-2">Status</h4>' +
            '<div class="neu-in rounded-xl p-2">' +
              '<select id="drawer-status" onchange="ROS.views._pipeline.changeDrawerStatus()" class="w-full bg-transparent text-[12px] font-bold text-lmdr-dark focus:outline-none px-2 py-1 border-none">' +
                STAGES.map(function (s) { return '<option value="' + s.id + '">' + s.label + '</option>'; }).join('') +
              '</select></div></div>' +

          '<div>' +
            '<h4 class="text-[9px] font-black uppercase tracking-[.12em] text-tan mb-2">Contact</h4>' +
            '<div class="neu-x p-4 rounded-xl space-y-3">' +
              '<div class="flex items-center gap-3"><div class="w-6 h-6 rounded-lg neu-ins flex items-center justify-center text-tan flex-none"><span class="material-symbols-outlined text-[12px]">call</span></div>' +
                '<span id="drawer-phone" class="text-[12px] font-bold text-lmdr-dark">--</span></div>' +
              '<div class="flex items-center gap-3"><div class="w-6 h-6 rounded-lg neu-ins flex items-center justify-center text-tan flex-none"><span class="material-symbols-outlined text-[12px]">mail</span></div>' +
                '<span id="drawer-email" class="text-[12px] font-bold text-lmdr-dark break-all">--</span></div>' +
            '</div></div>' +

          '<div>' +
            '<div class="flex justify-between items-center mb-2">' +
              '<h4 class="text-[9px] font-black uppercase tracking-[.12em] text-tan">Notes</h4>' +
              '<button onclick="ROS.views._pipeline.openNoteModal()" class="text-[10px] font-bold text-lmdr-blue hover:underline">+ Add</button></div>' +
            '<div id="drawer-notes" class="space-y-2">' +
              '<div class="text-[11px] text-tan/50 italic text-center py-4 neu-ins rounded-xl">No notes yet</div>' +
            '</div></div>' +
        '</div>' +

        '<div class="p-4 border-t border-tan/10 flex gap-2">' +
          '<button onclick="ROS.views._pipeline.openNoteModal()" class="flex-1 neu-x px-4 py-2.5 rounded-xl text-[11px] font-bold text-lmdr-blue flex items-center justify-center gap-1.5"><span class="material-symbols-outlined text-[14px]">edit_note</span>Note</button>' +
          '<button onclick="ROS.views._pipeline.viewFullProfile()" class="flex-1 bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"><span class="material-symbols-outlined text-[14px]">person</span>Full Profile</button>' +
        '</div>' +
      '</div>';
  }

  // ── Note Modal ──
  function renderNoteModal() {
    return '<div id="pipe-notes-modal" class="fixed inset-0 bg-black/40 z-[120] hidden flex items-center justify-center backdrop-blur-sm opacity-0 transition-opacity">' +
      '<div class="neu rounded-2xl w-full max-w-sm overflow-hidden transform scale-95 transition-transform" id="pipe-notes-content">' +
        '<div class="p-5 border-b border-tan/10 flex justify-between items-center">' +
          '<h3 class="font-black text-[15px] text-lmdr-dark">Add Note</h3>' +
          '<button onclick="ROS.views._pipeline.closeNoteModal()" class="text-tan hover:text-lmdr-dark transition"><span class="material-symbols-outlined text-[18px]">close</span></button></div>' +
        '<div class="p-5"><textarea id="pipe-new-note" rows="4" class="w-full neu-in rounded-xl px-4 py-3 text-[12px] font-medium text-lmdr-dark bg-transparent border-none placeholder-tan/40 focus:outline-none focus:ring-2 focus:ring-lmdr-blue/30 resize-none" placeholder="Type your note..."></textarea></div>' +
        '<div class="p-5 border-t border-tan/10 flex justify-end gap-3">' +
          '<button onclick="ROS.views._pipeline.closeNoteModal()" class="px-4 py-2 text-[11px] font-bold text-tan hover:text-lmdr-dark transition">Cancel</button>' +
          '<button onclick="ROS.views._pipeline.saveNote()" class="bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white px-5 py-2 rounded-xl text-[11px] font-bold hover:scale-105 transition-transform">Save</button>' +
        '</div></div></div>';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════

  function onMount() {
    ROS.bridge.sendToVelo('getPipeline', {});
    ROS.bridge.sendToVelo('getStats', {});
    document.addEventListener('keydown', handleKeyboard);
  }

  function onUnmount() {
    candidates = {};
    allCandidates = [];
    stats = {};
    focusIndex = 0;
    selectedIds.clear();
    document.removeEventListener('keydown', handleKeyboard);
  }

  function handleKeyboard(e) {
    if (currentMode !== 'focus') return;
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    var list = getFocusList();
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); ROS.views._pipeline.focusNext(); break;
      case 'ArrowLeft':  e.preventDefault(); ROS.views._pipeline.focusPrev(); break;
      case 'Enter':      e.preventDefault(); if (list[focusIndex]) ROS.views._pipeline.advanceCandidate(list[focusIndex]._id || list[focusIndex].id); break;
      case 'n': case 'N': e.preventDefault(); if (list[focusIndex]) ROS.views._pipeline.quickNote(list[focusIndex]._id || list[focusIndex].id); break;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MESSAGE HANDLER
  // ══════════════════════════════════════════════════════════════════════════

  function onMessage(type, data) {
    switch (type) {
      case 'pipelineLoaded':
        if (data && data.candidates) {
          allCandidates = data.candidates;
          groupCandidates(data.candidates);
          refreshContent();
        }
        break;
      case 'statsLoaded':
        stats = data || {};
        renderStatsData();
        break;
      case 'statusUpdated':
        toast('Moved to ' + (data && data.status ? getStage(data.status).label : 'new stage'));
        ROS.bridge.sendToVelo('getPipeline', {});
        ROS.bridge.sendToVelo('getStats', {});
        break;
      case 'candidateDetails':
        if (data) renderCandidateDrawerDetails(data);
        break;
      case 'notesAdded':
        toast('Note saved');
        ROS.views._pipeline.closeNoteModal();
        if (activeDrawerCandidateId) {
          ROS.bridge.sendToVelo('getCandidateDetails', { candidateId: activeDrawerCandidateId });
        }
        break;
      case 'error':
        toast((data && data.message) || 'Something went wrong', true);
        break;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DATA HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  function groupCandidates(list) {
    candidates = {};
    STAGES.forEach(function (s) { candidates[s.id] = []; });
    (list || []).forEach(function (c) {
      var stage = (c.status || c.stage || 'interested').toLowerCase();
      if (candidates[stage]) candidates[stage].push(c);
      else candidates['interested'].push(c);
    });
  }

  function getSortedCandidates() {
    var flat = allCandidates.slice();
    flat.sort(function (a, b) {
      var av, bv;
      switch (sortField) {
        case 'name':     av = (a.name || a.driver_name || '').toLowerCase(); bv = (b.name || b.driver_name || '').toLowerCase(); break;
        case 'cdl':      av = (a.cdl_type || ''); bv = (b.cdl_type || ''); break;
        case 'location': av = (a.location || a.city || ''); bv = (b.location || b.city || ''); break;
        case 'status':   av = (a.status || a.stage || ''); bv = (b.status || b.stage || ''); break;
        case 'days':     av = new Date(a.last_contacted || a.updatedDate || 0).getTime(); bv = new Date(b.last_contacted || b.updatedDate || 0).getTime(); break;
        default:         av = ''; bv = '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return flat;
  }

  function refreshContent() {
    var el = document.getElementById('pipe-content');
    if (el) el.innerHTML = renderMode();
    updateTotalCount();
    var switcherBtn = document.getElementById('pipe-mode-kanban');
    if (switcherBtn) {
      var parent = switcherBtn.closest('.mt-4');
      if (parent) parent.outerHTML = renderModeSwitcher();
    }
  }

  function updateTotalCount() {
    var el = document.getElementById('pipe-total');
    if (el) {
      var activeStages = Object.keys(candidates).filter(function (k) { return candidates[k].length > 0; }).length;
      el.textContent = allCandidates.length + ' candidates' + (activeStages ? ' \u00b7 ' + activeStages + ' active stages' : '');
    }
  }

  function renderStatsData() {
    var set = function (id, val) { var e = document.getElementById(id); if (e) e.textContent = val; };
    set('stat-total', stats.totalCandidates || stats.total || '--');
    set('stat-week', stats.thisWeek || '--');
    set('stat-conversion', stats.conversionRate ? stats.conversionRate + '%' : '--');
    set('stat-days', stats.avgDays || '--');
  }

  function renderCandidateDrawerDetails(data) {
    var name = data.name || data.driver_name || 'Unknown';
    var stage = getStage((data.status || 'interested').toLowerCase());
    var set = function (id, val) { var e = document.getElementById(id); if (e) e.textContent = val; };

    set('drawer-name', name);
    set('drawer-subtitle', data.location || data.cdl_type || 'Candidate');
    set('drawer-phone', data.phone || 'No phone');
    set('drawer-email', data.email || 'No email');

    var iniEl = document.getElementById('drawer-initials');
    if (iniEl) {
      iniEl.textContent = ini(name);
      iniEl.className = 'w-10 h-10 rounded-xl bg-gradient-to-br ' + stage.grad + ' text-white font-black flex items-center justify-center text-[12px]';
    }

    var statusEl = document.getElementById('drawer-status');
    if (statusEl) statusEl.value = (data.status || 'interested').toLowerCase();

    // Notes — all user content runs through esc() for XSS safety
    var notesEl = document.getElementById('drawer-notes');
    if (notesEl) {
      if (data.notes && data.notes.length > 0) {
        notesEl.innerHTML = data.notes.map(function (n) {
          var txt = esc(n.text || n.content || '');
          var author = esc(n.author || 'Me');
          var date = (n.date || n.createdAt) ? new Date(n.date || n.createdAt).toLocaleString() : '';
          return '<div class="neu-ins p-3 rounded-xl"><p class="text-[11px] text-lmdr-dark leading-relaxed">' + txt + '</p>' +
            '<p class="text-[8px] font-black text-tan mt-2 uppercase tracking-wider">' + esc(date) + ' \u00b7 ' + author + '</p></div>';
        }).join('');
      } else {
        notesEl.innerHTML = '<div class="text-[11px] text-tan/50 italic text-center py-4 neu-ins rounded-xl">No notes yet</div>';
      }
    }

    activeDrawerCandidateId = data._id || data.id || '';
    var drawer = document.getElementById('pipe-drawer');
    if (drawer) drawer.dataset.candidateId = activeDrawerCandidateId;

    var overlay = document.getElementById('pipe-drawer-overlay');
    if (overlay) { overlay.classList.remove('hidden'); void overlay.offsetWidth; overlay.classList.remove('opacity-0'); }
    if (drawer) drawer.classList.remove('translate-x-full');
  }

  function getNextStage(currentStageId) {
    var idx = STAGES.findIndex(function (s) { return s.id === currentStageId; });
    return idx < STAGES.length - 1 ? STAGES[idx + 1].id : currentStageId;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════════

  ROS.views._pipeline = {

    switchMode: function (mode) {
      if (mode === currentMode) return;
      currentMode = mode;
      selectedIds.clear();
      var content = document.getElementById('pipe-content');
      if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(6px)';
        setTimeout(function () {
          content.innerHTML = renderMode();
          void content.offsetWidth;
          content.style.opacity = '1';
          content.style.transform = 'translateY(0)';
        }, 180);
      }
      var switcherBtn = document.getElementById('pipe-mode-kanban');
      if (switcherBtn) {
        var parent = switcherBtn.closest('.mt-4');
        if (parent) parent.outerHTML = renderModeSwitcher();
      }
    },

    refresh: function () {
      ROS.bridge.sendToVelo('getPipeline', {});
      ROS.bridge.sendToVelo('getStats', {});
      toast('Refreshing...');
    },

    viewCandidate: function (id) {
      ROS.bridge.sendToVelo('getCandidateDetails', { candidateId: id });
    },

    viewFullProfile: function () {
      var nameEl = document.getElementById('drawer-name');
      var statEl = document.getElementById('drawer-status');
      if (!ROS.state) ROS.state = {};
      ROS.state.lifecycleContext = {
        driverId: activeDrawerCandidateId,
        driverName: nameEl ? nameEl.textContent : '',
        status: statEl ? statEl.value : ''
      };
      this.closeDrawer();
      ROS.views.showView('lifecycle');
    },

    callCandidate: function (id) {
      var c = allCandidates.find(function (x) { return (x._id || x.id) === id; });
      if (c && c.phone) {
        ROS.bridge.sendToVelo('initiateCall', { candidateId: id, phone: c.phone, name: c.name || c.driver_name });
        toast('Calling ' + (c.name || c.driver_name || 'candidate'));
      } else {
        toast('No phone number available', true);
      }
    },

    advanceCandidate: function (id) {
      var c = allCandidates.find(function (x) { return (x._id || x.id) === id; });
      if (c) {
        var cur = (c.status || c.stage || 'interested').toLowerCase();
        var next = getNextStage(cur);
        if (next === cur) toast('Already at final stage');
        else ROS.bridge.sendToVelo('updateCandidateStatus', { candidateId: id, status: next });
      }
    },

    quickNote: function (id) {
      activeDrawerCandidateId = id;
      var drawer = document.getElementById('pipe-drawer');
      if (drawer) drawer.dataset.candidateId = id;
      this.openNoteModal();
    },

    updateStatus: function (id, status) {
      ROS.bridge.sendToVelo('updateCandidateStatus', { candidateId: id, status: status });
    },

    closeDrawer: function () {
      var drawer = document.getElementById('pipe-drawer');
      var overlay = document.getElementById('pipe-drawer-overlay');
      if (drawer) drawer.classList.add('translate-x-full');
      if (overlay) { overlay.classList.add('opacity-0'); setTimeout(function () { overlay.classList.add('hidden'); }, 300); }
    },

    changeDrawerStatus: function () {
      var select = document.getElementById('drawer-status');
      if (activeDrawerCandidateId && select) this.updateStatus(activeDrawerCandidateId, select.value);
    },

    openNoteModal: function () {
      var modal = document.getElementById('pipe-notes-modal');
      var content = document.getElementById('pipe-notes-content');
      var input = document.getElementById('pipe-new-note');
      if (input) input.value = '';
      if (modal) { modal.classList.remove('hidden'); void modal.offsetWidth; modal.classList.remove('opacity-0'); }
      if (content) content.classList.remove('scale-95');
      if (input) setTimeout(function () { input.focus(); }, 200);
    },

    closeNoteModal: function () {
      var modal = document.getElementById('pipe-notes-modal');
      var content = document.getElementById('pipe-notes-content');
      if (modal) modal.classList.add('opacity-0');
      if (content) content.classList.add('scale-95');
      setTimeout(function () { if (modal) modal.classList.add('hidden'); }, 200);
    },

    saveNote: function () {
      var input = document.getElementById('pipe-new-note');
      var text = input ? input.value.trim() : '';
      if (text && activeDrawerCandidateId) {
        ROS.bridge.sendToVelo('addCandidateNote', { candidateId: activeDrawerCandidateId, note: text });
        if (input) { input.value = ''; input.placeholder = 'Saving...'; }
      }
    },

    // Kanban drag-and-drop
    drag: function (ev) {
      draggedCardId = ev.target.dataset.id;
      ev.dataTransfer.setData('text', ev.target.id);
      ev.dataTransfer.effectAllowed = 'move';
      ev.target.style.opacity = '0.4';
    },
    allowDrop: function (ev) {
      ev.preventDefault();
      var col = ev.target.closest('.pipe-column');
      if (col) {
        document.querySelectorAll('.pipe-column').forEach(function (c) { c.classList.remove('ring-2', 'ring-lmdr-blue/30', 'rounded-xl'); });
        col.classList.add('ring-2', 'ring-lmdr-blue/30', 'rounded-xl');
      }
    },
    drop: function (ev) {
      ev.preventDefault();
      document.querySelectorAll('.pipe-column').forEach(function (c) { c.classList.remove('ring-2', 'ring-lmdr-blue/30', 'rounded-xl'); });
      var col = ev.target.closest('.pipe-column');
      if (col && draggedCardId) { this.updateStatus(draggedCardId, col.dataset.stage); draggedCardId = null; }
    },

    // List sorting & selection
    sortBy: function (field) {
      if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortField = field; sortDir = 'asc'; }
      refreshContent();
    },
    toggleSelect: function (id) {
      if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id);
      refreshContent();
    },
    clearSelection: function () { selectedIds.clear(); refreshContent(); },
    bulkAdvance: function () {
      if (selectedIds.size === 0) return;
      selectedIds.forEach(function (id) {
        var c = allCandidates.find(function (x) { return (x._id || x.id) === id; });
        if (c) ROS.bridge.sendToVelo('updateCandidateStatus', { candidateId: id, status: getNextStage((c.status || c.stage || 'interested').toLowerCase()) });
      });
      toast('Advancing ' + selectedIds.size + ' candidates');
      selectedIds.clear();
    },

    // Focus navigation
    focusNext: function () {
      if (focusIndex < getFocusList().length - 1) { focusIndex++; animateFocusCard('right'); }
    },
    focusPrev: function () {
      if (focusIndex > 0) { focusIndex--; animateFocusCard('left'); }
    },
    filterFocusStage: function (stageId) {
      focusStageFilter = stageId; focusIndex = 0; refreshContent();
    }
  };

  function animateFocusCard(direction) {
    var card = document.getElementById('focus-card');
    if (card) {
      card.style.transition = 'opacity .15s, transform .15s';
      card.style.opacity = '0';
      card.style.transform = 'translateX(' + (direction === 'right' ? '-30px' : '30px') + ')';
      setTimeout(function () { refreshContent(); }, 150);
    } else {
      refreshContent();
    }
  }

  // Dragend cleanup
  document.addEventListener('dragend', function (e) {
    if (e.target.classList && e.target.classList.contains('cursor-grab')) {
      e.target.style.opacity = '1';
      document.querySelectorAll('.pipe-column').forEach(function (c) { c.classList.remove('ring-2', 'ring-lmdr-blue/30', 'rounded-xl'); });
    }
  });

  // Register
  ROS.views.registerView(VIEW_ID, { render: render, onMount: onMount, onUnmount: onUnmount, onMessage: onMessage, messages: MESSAGES });
})();
