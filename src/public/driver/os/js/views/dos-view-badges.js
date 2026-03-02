/**
 * dos-view-badges.js
 * DriverOS Badges & Achievements view — 2-col grid, earned/locked states, progress.
 * Extracted from DRIVER_BADGES.html (659 lines).
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var CAT_COLORS = {
    'profile':   { bg: '#dbeafe', text: '#1e40af' },
    'activity':  { bg: '#dcfce7', text: '#166534' },
    'milestone': { bg: '#f3e8ff', text: '#6b21a8' },
    'community': { bg: '#fce7f3', text: '#9d174d' },
    'streak':    { bg: '#ffedd5', text: '#9a3412' }
  };

  var state = { earned: [], available: [], progress: {}, filter: 'all' };
  var els = {};

  function h(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function icon(name, cls) {
    var sp = h('span', 'material-symbols-outlined' + (cls ? ' ' + cls : ''));
    sp.textContent = name;
    return sp;
  }

  function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function buildUI(root) {
    clearEl(root);

    if (!document.getElementById('dos-badges-style')) {
      var style = document.createElement('style');
      style.id = 'dos-badges-style';
      style.textContent =
        '@keyframes dosShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
        '.dos-badge-icon{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px}' +
        '.dos-badge-icon.earned{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#fff;box-shadow:0 4px 12px rgba(251,191,36,.3)}' +
        '.dos-badge-icon.locked{background:#f1f5f9;color:#cbd5e1}' +
        '.dos-badge-progress{height:4px;border-radius:9999px;background:#e2e8f0;overflow:hidden;margin-top:6px}' +
        '.dos-badge-progress-fill{height:100%;border-radius:9999px;background:#2563eb;transition:width .4s ease}' +
        '.dos-lock-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center}';
      document.head.appendChild(style);
    }

    var container = h('div', 'dos-container');
    container.style.paddingTop = '12px';
    container.style.paddingBottom = '80px';

    // Header
    var header = h('div', '');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px';
    var title = h('div', 'dos-text-heading', 'Badges');
    var countWrap = h('div', '');
    countWrap.style.textAlign = 'right';
    var earnedCount = h('div', '');
    earnedCount.id = 'bdg-earned-count';
    earnedCount.style.cssText = 'font-size:24px;font-weight:800;color:#2563eb;line-height:1';
    var countLabel = h('div', 'dos-text-small', 'Earned');
    countWrap.appendChild(earnedCount);
    countWrap.appendChild(countLabel);
    header.appendChild(title);
    header.appendChild(countWrap);
    container.appendChild(header);

    // Filter pills
    var filterRow = h('div', 'dos-scroll-row');
    filterRow.style.marginBottom = '16px';
    filterRow.id = 'bdg-filters';
    var cats = ['all', 'profile', 'activity', 'streak', 'milestone', 'community'];
    cats.forEach(function (cat) {
      var pill = h('button', 'dos-chip' + (cat === 'all' ? ' dos-chip-blue' : ' dos-chip-gray'));
      pill.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      pill.setAttribute('data-cat', cat);
      pill.style.cssText = 'cursor:pointer;min-height:40px;min-width:48px;flex-shrink:0;-webkit-tap-highlight-color:transparent';
      filterRow.appendChild(pill);
    });
    container.appendChild(filterRow);

    // Skeleton
    var skel = h('div', 'dos-grid');
    skel.id = 'bdg-skeleton';
    for (var i = 0; i < 4; i++) {
      var sk = h('div', 'dos-card');
      sk.style.cssText = 'height:140px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:dosShimmer 1.5s infinite';
      skel.appendChild(sk);
    }
    container.appendChild(skel);

    // Grid
    var grid = h('div', 'dos-grid');
    grid.id = 'bdg-grid';
    grid.style.cssText = 'display:none;grid-template-columns:repeat(2,1fr);gap:12px';
    container.appendChild(grid);

    // Empty
    var empty = h('div', 'dos-empty');
    empty.id = 'bdg-empty';
    empty.style.display = 'none';
    empty.appendChild(icon('emoji_events', ''));
    empty.appendChild(h('div', 'dos-text-body', 'No badges in this category'));
    container.appendChild(empty);

    root.appendChild(container);

    els = { skeleton: skel, grid: grid, empty: empty, filters: filterRow, earnedCount: earnedCount };
  }

  function bindFilters(self) {
    var btns = els.filters.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        var fn = function () {
          state.filter = btn.getAttribute('data-cat');
          // Update pill styles
          var all = els.filters.querySelectorAll('button');
          for (var j = 0; j < all.length; j++) {
            all[j].className = 'dos-chip ' + (all[j].getAttribute('data-cat') === state.filter ? 'dos-chip-blue' : 'dos-chip-gray');
            all[j].style.cssText = 'cursor:pointer;min-height:40px;min-width:48px;flex-shrink:0;-webkit-tap-highlight-color:transparent';
          }
          renderGrid();
        };
        btn.addEventListener('click', fn);
        self._listeners.push({ el: btn, type: 'click', fn: fn });
      })(btns[i]);
    }
  }

  function getAllBadges() {
    var map = {};
    state.earned.forEach(function (b) { map[b._id] = Object.assign({}, b, { unlocked: true }); });
    state.available.forEach(function (b) {
      if (!map[b._id]) map[b._id] = Object.assign({}, b, { unlocked: false });
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function renderGrid() {
    clearEl(els.grid);
    var all = getAllBadges();

    if (state.filter !== 'all') {
      all = all.filter(function (b) { return b.category === state.filter; });
    }

    // Sort: earned first
    all.sort(function (a, b) {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    els.earnedCount.textContent = state.earned.length;

    if (all.length === 0) {
      els.grid.style.display = 'none';
      els.empty.style.display = '';
      return;
    }

    els.grid.style.display = '';
    els.empty.style.display = 'none';

    all.forEach(function (badge) {
      var card = h('div', 'dos-card');
      card.style.cssText = 'text-align:center;position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent';
      if (!badge.unlocked) card.style.opacity = '0.55';

      // Badge icon
      var badgeIcon = h('div', 'dos-badge-icon ' + (badge.unlocked ? 'earned' : 'locked'));
      var ic = icon(badge.icon || 'emoji_events', '');
      ic.style.fontSize = '28px';
      if (!badge.unlocked) ic.style.color = '#cbd5e1';
      badgeIcon.appendChild(ic);

      if (!badge.unlocked) {
        var lockOv = h('div', 'dos-lock-overlay');
        var lockIc = icon('lock', '');
        lockIc.style.cssText = 'font-size:18px;color:#94a3b8;position:absolute;bottom:4px;right:4px';
        card.appendChild(lockIc);
      }

      card.appendChild(badgeIcon);

      // Category chip
      var catCol = CAT_COLORS[badge.category] || CAT_COLORS.profile;
      var catChip = h('div', 'dos-text-small', badge.category || 'profile');
      catChip.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:4px';
      catChip.style.background = catCol.bg;
      catChip.style.color = catCol.text;
      card.appendChild(catChip);

      // Name
      var name = h('div', 'dos-text-body', badge.name || 'Badge');
      name.style.cssText = 'font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      card.appendChild(name);

      // Description
      if (badge.description) {
        var desc = h('div', 'dos-text-small', badge.description);
        desc.style.cssText = 'margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
        card.appendChild(desc);
      }

      // Progress bar for partially earned
      var prog = state.progress[badge._id];
      if (!badge.unlocked && prog && prog.current !== undefined && prog.target) {
        var pct = Math.min((prog.current / prog.target) * 100, 100);
        var bar = h('div', 'dos-badge-progress');
        var fill = h('div', 'dos-badge-progress-fill');
        fill.style.width = pct + '%';
        bar.appendChild(fill);
        card.appendChild(bar);
        var pText = h('div', 'dos-text-small', prog.current + '/' + prog.target);
        pText.style.marginTop = '2px';
        card.appendChild(pText);
      }

      els.grid.appendChild(card);
    });
  }

  DOS.viewModules['badges'] = {
    _listeners: [],

    mount: function (root) {
      buildUI(root);
      bindFilters(this);
      DOS.bridge.send('getBadges', {});
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      els = {};
    },

    onMessage: function (action, payload) {
      if (action === 'badgesLoaded' || action === 'achievementsData') {
        var d = payload || {};
        state.earned = d.earned || d.achievements && d.achievements.filter(function (a) { return a.unlocked; }) || [];
        state.available = d.available || d.achievements && d.achievements.filter(function (a) { return !a.unlocked; }) || [];
        state.progress = d.progress || {};

        // Build progress from available badges that have progress/target fields
        state.available.forEach(function (b) {
          if (b.progress !== undefined && b.target && !state.progress[b._id]) {
            state.progress[b._id] = { current: b.progress, target: b.target };
          }
        });

        if (els.skeleton) els.skeleton.style.display = 'none';
        renderGrid();
      }
    },

    getSnapshot: function () {
      return { earnedCount: state.earned.length, filter: state.filter };
    }
  };
})();
