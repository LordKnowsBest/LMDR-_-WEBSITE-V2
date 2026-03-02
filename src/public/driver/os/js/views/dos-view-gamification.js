/**
 * dos-view-gamification.js
 * DriverOS Gamification view — XP progression, tier badge, streak, recent activity.
 * Extracted from DRIVER_GAMIFICATION.html (807 lines) into DOS view module contract.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var TIER_COLORS = {
    'Rookie': '#64748b', 'Apprentice': '#2563eb', 'Road Runner': '#2563eb',
    'Professional': '#7c3aed', 'Highway Pro': '#7c3aed',
    'Expert': '#d97706', 'Expert Hauler': '#d97706',
    'Master': '#ea580c', 'Master Driver': '#ea580c',
    'Legend': '#7c3aed', 'Road Legend': '#7c3aed'
  };

  var TIER_ICONS = {
    'Rookie': 'star', 'Apprentice': 'military_tech', 'Road Runner': 'directions_run',
    'Professional': 'workspace_premium', 'Highway Pro': 'local_shipping',
    'Expert': 'emoji_events', 'Expert Hauler': 'emoji_events',
    'Master': 'diamond', 'Master Driver': 'diamond',
    'Legend': 'auto_awesome', 'Road Legend': 'auto_awesome'
  };

  /* ─── State ─── */
  var state = { xp: 0, level: 1, tier: 'Rookie', nextLevelXp: 500, xpProgress: 0, streak: 0, multiplier: 1, freezes: 0, recentActivity: [] };
  var els = {};

  /* ─── Helpers ─── */
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

  function skeleton(height) {
    var el = h('div', 'dos-card');
    el.style.height = height + 'px';
    el.style.background = 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)';
    el.style.backgroundSize = '200% 100%';
    el.style.animation = 'dosShimmer 1.5s infinite';
    return el;
  }

  function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function formatNum(n) { return (n || 0).toLocaleString(); }

  /* ─── Build DOM ─── */
  function buildUI(root) {
    clearEl(root);

    // Inject shimmer keyframes if not present
    if (!document.getElementById('dos-gamification-style')) {
      var style = document.createElement('style');
      style.id = 'dos-gamification-style';
      style.textContent = '@keyframes dosShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
        '.dos-xp-bar{height:10px;border-radius:9999px;background:#e2e8f0;overflow:hidden;width:100%}' +
        '.dos-xp-fill{height:100%;border-radius:9999px;background:linear-gradient(90deg,#fbbf24,#f59e0b);transition:width .5s ease}' +
        '.dos-streak-fire{color:#f97316;filter:drop-shadow(0 0 6px rgba(249,115,22,.5))}' +
        '.dos-activity-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #e2e8f0}' +
        '.dos-activity-item:last-child{border-bottom:none}';
      document.head.appendChild(style);
    }

    var container = h('div', 'dos-container');
    container.style.paddingTop = '12px';
    container.style.paddingBottom = '80px';

    // ── Skeleton placeholders ──
    var skelWrap = h('div', '');
    skelWrap.id = 'gam-skeleton';
    skelWrap.appendChild(skeleton(140));
    var sk2 = skeleton(60);
    sk2.style.marginTop = '12px';
    skelWrap.appendChild(sk2);
    var sk3 = skeleton(200);
    sk3.style.marginTop = '12px';
    skelWrap.appendChild(sk3);
    container.appendChild(skelWrap);

    // ── Main content (hidden until data) ──
    var main = h('div', '');
    main.id = 'gam-main';
    main.style.display = 'none';

    // --- Tier + Level Card ---
    var tierCard = h('div', 'dos-card');
    tierCard.style.textAlign = 'center';
    tierCard.style.paddingTop = '24px';
    tierCard.style.paddingBottom = '20px';

    var tierIcon = h('div', '');
    tierIcon.id = 'gam-tier-icon';
    tierIcon.style.cssText = 'width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#fff;font-size:32px';
    tierCard.appendChild(tierIcon);

    var tierName = h('div', 'dos-text-heading', '');
    tierName.id = 'gam-tier-name';
    tierCard.appendChild(tierName);

    var levelLabel = h('div', 'dos-text-small', '');
    levelLabel.id = 'gam-level-label';
    levelLabel.style.marginTop = '4px';
    tierCard.appendChild(levelLabel);

    // XP bar section
    var xpSection = h('div', '');
    xpSection.style.marginTop = '16px';
    xpSection.style.padding = '0 8px';

    var xpLabels = h('div', '');
    xpLabels.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:6px';
    var xpCurrent = h('span', 'dos-text-small', '');
    xpCurrent.id = 'gam-xp-current';
    xpCurrent.style.fontWeight = '700';
    xpCurrent.style.color = '#0f172a';
    var xpNext = h('span', 'dos-text-small', '');
    xpNext.id = 'gam-xp-next';
    xpLabels.appendChild(xpCurrent);
    xpLabels.appendChild(xpNext);
    xpSection.appendChild(xpLabels);

    var xpBar = h('div', 'dos-xp-bar');
    var xpFill = h('div', 'dos-xp-fill');
    xpFill.id = 'gam-xp-fill';
    xpFill.style.width = '0%';
    xpBar.appendChild(xpFill);
    xpSection.appendChild(xpBar);
    tierCard.appendChild(xpSection);

    main.appendChild(tierCard);

    // --- Streak + Multiplier Card ---
    var streakCard = h('div', 'dos-card');
    streakCard.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-top:12px';

    var streakLeft = h('div', '');
    streakLeft.style.cssText = 'display:flex;align-items:center;gap:12px';
    var fireIcon = icon('local_fire_department', '');
    fireIcon.id = 'gam-fire-icon';
    fireIcon.style.fontSize = '32px';
    streakLeft.appendChild(fireIcon);
    var streakInfo = h('div', '');
    var streakCount = h('div', 'dos-text-heading', '0');
    streakCount.id = 'gam-streak-count';
    streakCount.style.fontSize = '28px';
    streakCount.style.lineHeight = '1';
    var streakLabel = h('div', 'dos-text-small', 'Day Streak');
    streakInfo.appendChild(streakCount);
    streakInfo.appendChild(streakLabel);
    streakLeft.appendChild(streakInfo);
    streakCard.appendChild(streakLeft);

    var streakRight = h('div', '');
    streakRight.style.textAlign = 'right';
    var multBadge = h('div', 'dos-chip dos-chip-amber', '');
    multBadge.id = 'gam-multiplier';
    multBadge.style.display = 'none';
    streakRight.appendChild(multBadge);
    var freezeRow = h('div', '');
    freezeRow.id = 'gam-freezes';
    freezeRow.style.cssText = 'display:flex;gap:4px;margin-top:6px;justify-content:flex-end';
    streakRight.appendChild(freezeRow);
    streakCard.appendChild(streakRight);

    main.appendChild(streakCard);

    // --- Recent Activity Card ---
    var actCard = h('div', 'dos-card');
    actCard.style.marginTop = '12px';

    var actHeader = h('div', '');
    actHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px';
    var actTitle = h('div', 'dos-text-subheading', 'Recent Activity');
    actHeader.appendChild(actTitle);
    actCard.appendChild(actHeader);

    var actList = h('div', '');
    actList.id = 'gam-activity-list';
    actCard.appendChild(actList);

    var actEmpty = h('div', 'dos-empty');
    actEmpty.id = 'gam-activity-empty';
    actEmpty.style.display = 'none';
    var emptyIcon = icon('history', '');
    var emptyText = h('div', 'dos-text-small', 'Complete actions to earn XP');
    actEmpty.appendChild(emptyIcon);
    actEmpty.appendChild(emptyText);
    actCard.appendChild(actEmpty);

    main.appendChild(actCard);
    container.appendChild(main);
    root.appendChild(container);

    els = {
      skeleton: skelWrap, main: main,
      tierIcon: tierIcon, tierName: tierName, levelLabel: levelLabel,
      xpCurrent: xpCurrent, xpNext: xpNext, xpFill: xpFill,
      fireIcon: fireIcon, streakCount: streakCount, multiplier: multBadge, freezes: freezeRow,
      actList: actList, actEmpty: actEmpty
    };
  }

  /* ─── Render helpers ─── */
  function renderState() {
    var color = TIER_COLORS[state.tier] || '#64748b';
    var tierIconName = TIER_ICONS[state.tier] || 'star';

    // Tier icon
    clearEl(els.tierIcon);
    els.tierIcon.style.background = color;
    els.tierIcon.appendChild(icon(tierIconName, ''));
    els.tierIcon.lastChild.style.fontSize = '32px';
    els.tierIcon.lastChild.style.color = '#fff';

    els.tierName.textContent = state.tier;
    els.levelLabel.textContent = 'Level ' + state.level;
    els.xpCurrent.textContent = formatNum(state.xp) + ' XP';
    els.xpNext.textContent = formatNum(state.nextLevelXp) + ' XP to Level ' + (state.level + 1);
    els.xpFill.style.width = Math.min(state.xpProgress, 100) + '%';

    // Streak
    els.streakCount.textContent = state.streak;
    if (state.streak >= 7) {
      els.fireIcon.classList.add('dos-streak-fire');
    } else {
      els.fireIcon.classList.remove('dos-streak-fire');
    }

    // Multiplier
    if (state.multiplier > 1) {
      els.multiplier.style.display = '';
      els.multiplier.textContent = state.multiplier + 'x XP';
    } else {
      els.multiplier.style.display = 'none';
    }

    // Freezes (3 slots)
    clearEl(els.freezes);
    for (var i = 0; i < 3; i++) {
      var frost = icon('ac_unit', '');
      frost.style.fontSize = '16px';
      frost.style.color = i < state.freezes ? '#22d3ee' : '#cbd5e1';
      els.freezes.appendChild(frost);
    }

    renderActivity();
  }

  function renderActivity() {
    clearEl(els.actList);
    var items = state.recentActivity || [];
    if (items.length === 0) {
      els.actList.style.display = 'none';
      els.actEmpty.style.display = '';
      return;
    }
    els.actList.style.display = '';
    els.actEmpty.style.display = 'none';

    items.slice(0, 10).forEach(function (item) {
      var row = h('div', 'dos-activity-item');

      var iconWrap = h('div', '');
      iconWrap.style.cssText = 'width:40px;height:40px;border-radius:10px;background:#dbeafe;display:flex;align-items:center;justify-content:center;flex-shrink:0';
      iconWrap.appendChild(icon(item.icon || 'bolt', ''));
      iconWrap.lastChild.style.color = '#2563eb';
      row.appendChild(iconWrap);

      var info = h('div', '');
      info.style.flex = '1';
      info.style.minWidth = '0';
      var reason = h('div', 'dos-text-body', item.reason || 'Action completed');
      reason.style.cssText = 'font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      info.appendChild(reason);
      if (item.timestamp) {
        var ts = h('div', 'dos-text-small', item.timestamp);
        info.appendChild(ts);
      }
      row.appendChild(info);

      var xpLabel = h('div', 'dos-chip dos-chip-blue', '+' + (item.xp || 0) + ' XP');
      xpLabel.style.flexShrink = '0';
      row.appendChild(xpLabel);

      els.actList.appendChild(row);
    });
  }

  /* ─── Module ─── */
  DOS.viewModules['gamification'] = {
    _listeners: [],

    mount: function (root) {
      buildUI(root);
      DOS.bridge.send('getGamificationState', {});
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      els = {};
    },

    onMessage: function (action, payload) {
      if (action === 'gamificationStateLoaded' || action === 'gamificationData') {
        var d = payload || {};
        var p = d.progression || d;
        state.xp = p.current_xp || p.xp || 0;
        state.level = p.level || 1;
        state.tier = p.level_title || p.tier || 'Rookie';
        state.nextLevelXp = p.xp_for_next_level || p.nextLevelXp || 500;
        state.xpProgress = p.xp_progress_percent || p.xpProgress || 0;
        state.streak = p.current_streak || p.streak || 0;
        state.multiplier = p.streak_multiplier || p.multiplier || 1;
        state.freezes = p.streak_freezes || p.freezes || 0;
        state.recentActivity = d.recentActivity || d.recent_activity || p.recentActivity || [];

        if (els.skeleton) els.skeleton.style.display = 'none';
        if (els.main) els.main.style.display = '';
        renderState();
      }
    },

    getSnapshot: function () {
      return { xp: state.xp, level: state.level, tier: state.tier };
    }
  };
})();
