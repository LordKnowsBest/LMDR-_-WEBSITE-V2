/**
 * dos-view-challenges.js
 * DriverOS Challenges view — Active/Completed tabs, join, progress bars.
 * Extracted from CHALLENGES.html (806 lines).
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var TYPE_CHIPS = {
    'daily':    'dos-chip-blue',
    'weekly':   'dos-chip-amber',
    'monthly':  'dos-chip-green',
    'event':    'dos-chip-amber',
    'one_time': 'dos-chip-gray'
  };

  var state = { tab: 'active', active: [], completed: [], available: [] };
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

    if (!document.getElementById('dos-challenges-style')) {
      var style = document.createElement('style');
      style.id = 'dos-challenges-style';
      style.textContent =
        '@keyframes dosShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
        '.dos-prog-bar{height:8px;border-radius:9999px;background:#e2e8f0;overflow:hidden;width:100%}' +
        '.dos-prog-fill{height:100%;border-radius:9999px;transition:width .4s ease}' +
        '.dos-prog-fill-active{background:#2563eb}' +
        '.dos-prog-fill-done{background:#22c55e}' +
        '.dos-tab-pill{min-height:40px;min-width:80px;padding:8px 16px;border-radius:12px;font-size:14px;font-weight:700;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .15s,color .15s}' +
        '.dos-tab-pill.active{background:#fff;color:#2563eb;box-shadow:0 1px 3px rgba(0,0,0,.08)}' +
        '.dos-tab-pill:not(.active){background:transparent;color:#64748b}';
      document.head.appendChild(style);
    }

    var container = h('div', 'dos-container');
    container.style.paddingTop = '12px';
    container.style.paddingBottom = '80px';

    // Header
    var header = h('div', '');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px';
    header.appendChild(h('div', 'dos-text-heading', 'Challenges'));
    var completedCount = h('div', '');
    completedCount.style.textAlign = 'right';
    var cc = h('div', '');
    cc.id = 'cha-completed-count';
    cc.style.cssText = 'font-size:24px;font-weight:800;color:#2563eb;line-height:1';
    cc.textContent = '0';
    completedCount.appendChild(cc);
    completedCount.appendChild(h('div', 'dos-text-small', 'Completed'));
    header.appendChild(completedCount);
    container.appendChild(header);

    // Tab bar
    var tabBar = h('div', '');
    tabBar.style.cssText = 'display:flex;gap:4px;padding:4px;background:#f1f5f9;border-radius:14px;margin-bottom:16px';
    tabBar.id = 'cha-tabs';
    var tabs = [
      { id: 'active', label: 'Active', icon: 'track_changes' },
      { id: 'available', label: 'Available', icon: 'add_circle' },
      { id: 'completed', label: 'Done', icon: 'check_circle' }
    ];
    tabs.forEach(function (t) {
      var btn = h('button', 'dos-tab-pill' + (t.id === 'active' ? ' active' : ''));
      btn.setAttribute('data-tab', t.id);
      btn.style.flex = '1';
      var ic = icon(t.icon, '');
      ic.style.cssText = 'font-size:18px;vertical-align:middle;margin-right:4px';
      btn.appendChild(ic);
      var lbl = document.createTextNode(t.label);
      btn.appendChild(lbl);
      tabBar.appendChild(btn);
    });
    container.appendChild(tabBar);

    // Skeleton
    var skel = h('div', '');
    skel.id = 'cha-skeleton';
    for (var i = 0; i < 3; i++) {
      var sk = h('div', 'dos-card');
      sk.style.cssText = 'height:100px;margin-bottom:12px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:dosShimmer 1.5s infinite';
      skel.appendChild(sk);
    }
    container.appendChild(skel);

    // List
    var list = h('div', '');
    list.id = 'cha-list';
    list.style.display = 'none';
    container.appendChild(list);

    // Empty
    var empty = h('div', 'dos-empty');
    empty.id = 'cha-empty';
    empty.style.display = 'none';
    empty.appendChild(icon('emoji_events', ''));
    empty.appendChild(h('div', 'dos-text-body', 'No challenges here'));
    container.appendChild(empty);

    root.appendChild(container);
    els = { skeleton: skel, list: list, empty: empty, tabs: tabBar, completedCount: cc };
  }

  function bindTabs(self) {
    var btns = els.tabs.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        var fn = function () {
          state.tab = btn.getAttribute('data-tab');
          var all = els.tabs.querySelectorAll('button');
          for (var j = 0; j < all.length; j++) {
            all[j].className = 'dos-tab-pill' + (all[j].getAttribute('data-tab') === state.tab ? ' active' : '');
            all[j].style.flex = '1';
          }
          renderList();
        };
        btn.addEventListener('click', fn);
        self._listeners.push({ el: btn, type: 'click', fn: fn });
      })(btns[i]);
    }
  }

  function getTimeLeft(expiresAt) {
    if (!expiresAt) return '';
    var diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    var hrs = Math.floor(diff / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    if (hrs > 24) return Math.floor(hrs / 24) + 'd ' + (hrs % 24) + 'h';
    return hrs + 'h ' + mins + 'm';
  }

  function renderList() {
    clearEl(els.list);
    var items = state.tab === 'active' ? state.active :
                state.tab === 'available' ? state.available : state.completed;

    els.completedCount.textContent = state.completed.length;

    if (items.length === 0) {
      els.list.style.display = 'none';
      els.empty.style.display = '';
      // Contextual empty text
      var emptyText = els.empty.querySelector('.dos-text-body');
      if (emptyText) {
        if (state.tab === 'active') emptyText.textContent = 'No active challenges. Browse Available!';
        else if (state.tab === 'available') emptyText.textContent = 'No challenges available right now';
        else emptyText.textContent = 'Complete challenges to see them here';
      }
      return;
    }

    els.list.style.display = '';
    els.empty.style.display = 'none';

    items.forEach(function (ch) {
      var card = h('div', 'dos-card');
      card.style.marginBottom = '12px';

      // Top row: type chip + time
      var topRow = h('div', '');
      topRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap';

      var typeChip = h('span', 'dos-chip ' + (TYPE_CHIPS[ch.type] || 'dos-chip-gray'));
      typeChip.textContent = (ch.type || 'daily').toUpperCase();
      typeChip.style.cssText = 'font-size:10px;font-weight:700;padding:2px 8px;min-height:auto';
      topRow.appendChild(typeChip);

      var timeLeft = getTimeLeft(ch.expires_at);
      if (timeLeft && state.tab !== 'completed') {
        var timeBadge = h('span', 'dos-text-small');
        timeBadge.style.cssText = 'display:flex;align-items:center;gap:4px';
        var clockIc = icon('schedule', '');
        clockIc.style.fontSize = '14px';
        timeBadge.appendChild(clockIc);
        timeBadge.appendChild(document.createTextNode(timeLeft));
        topRow.appendChild(timeBadge);
      }
      card.appendChild(topRow);

      // Content row
      var content = h('div', '');
      content.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:12px';

      var info = h('div', '');
      info.style.cssText = 'flex:1;min-width:0';
      var titleEl = h('div', 'dos-text-body', ch.title || 'Challenge');
      titleEl.style.fontWeight = '700';
      info.appendChild(titleEl);
      if (ch.description) {
        var desc = h('div', 'dos-text-small', ch.description);
        desc.style.cssText = 'margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden';
        info.appendChild(desc);
      }
      content.appendChild(info);

      // Reward + action
      var rightCol = h('div', '');
      rightCol.style.cssText = 'text-align:right;flex-shrink:0';
      var rewardChip = h('div', 'dos-chip dos-chip-blue');
      rewardChip.style.cssText = 'font-size:12px;font-weight:700';
      rewardChip.textContent = '+' + (ch.xp_reward || 0) + ' XP';
      rightCol.appendChild(rewardChip);

      // Join button for available
      if (state.tab === 'available') {
        var joinBtn = h('button', 'dos-btn-secondary');
        joinBtn.textContent = 'Join';
        joinBtn.style.cssText = 'margin-top:8px;padding:8px 16px;font-size:13px;min-height:40px';
        joinBtn.setAttribute('data-id', ch._id);
        rightCol.appendChild(joinBtn);
      }

      // Claim button for completed active
      var progress = ch.progress || 0;
      var target = ch.target || 1;
      if (state.tab === 'active' && progress >= target && !ch.claimed) {
        var claimBtn = h('button', 'dos-btn-primary');
        claimBtn.textContent = 'Claim';
        claimBtn.style.cssText = 'margin-top:8px;padding:8px 16px;font-size:13px;min-height:40px';
        claimBtn.setAttribute('data-id', ch._id);
        rightCol.appendChild(claimBtn);
      }

      content.appendChild(rightCol);
      card.appendChild(content);

      // Progress bar for active
      if (state.tab === 'active') {
        var pct = Math.min((progress / target) * 100, 100);
        var isComplete = progress >= target;

        var progWrap = h('div', '');
        progWrap.style.marginTop = '12px';
        var progLabels = h('div', '');
        progLabels.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:4px';
        progLabels.appendChild(h('span', 'dos-text-small', 'Progress'));
        var progCount = h('span', 'dos-text-small', progress + '/' + target);
        progCount.style.fontWeight = '700';
        progCount.style.color = isComplete ? '#22c55e' : '#475569';
        progLabels.appendChild(progCount);
        progWrap.appendChild(progLabels);

        var bar = h('div', 'dos-prog-bar');
        var fill = h('div', 'dos-prog-fill ' + (isComplete ? 'dos-prog-fill-done' : 'dos-prog-fill-active'));
        fill.style.width = pct + '%';
        bar.appendChild(fill);
        progWrap.appendChild(bar);
        card.appendChild(progWrap);
      }

      // Completed date for done tab
      if (state.tab === 'completed' && ch.completed_at) {
        var doneDate = h('div', 'dos-text-small');
        doneDate.style.marginTop = '8px';
        var checkIc = icon('check_circle', '');
        checkIc.style.cssText = 'font-size:14px;color:#22c55e;vertical-align:middle;margin-right:4px';
        doneDate.appendChild(checkIc);
        doneDate.appendChild(document.createTextNode('Completed ' + new Date(ch.completed_at).toLocaleDateString()));
        card.appendChild(doneDate);
      }

      els.list.appendChild(card);
    });
  }

  function bindActions(self) {
    // Delegate clicks on list for join/claim buttons
    var fn = function (e) {
      var btn = e.target.closest('button[data-id]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      if (btn.classList.contains('dos-btn-secondary')) {
        DOS.bridge.send('joinChallenge', { challengeId: id });
        btn.textContent = 'Joining...';
        btn.disabled = true;
      } else if (btn.classList.contains('dos-btn-primary')) {
        DOS.bridge.send('claimReward', { challengeId: id });
        btn.textContent = 'Claiming...';
        btn.disabled = true;
      }
    };
    els.list.addEventListener('click', fn);
    self._listeners.push({ el: els.list, type: 'click', fn: fn });
  }

  DOS.viewModules['challenges'] = {
    _listeners: [],

    mount: function (root) {
      buildUI(root);
      bindTabs(this);
      bindActions(this);
      DOS.bridge.send('getChallenges', {});
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      els = {};
    },

    onMessage: function (action, payload) {
      if (action === 'challengesLoaded' || action === 'challengesData') {
        var d = payload || {};
        state.active = d.active || [];
        state.available = d.available || [];
        state.completed = d.completed || [];

        if (els.skeleton) els.skeleton.style.display = 'none';
        if (els.list) els.list.style.display = '';
        renderList();
      } else if (action === 'challengeJoined' || action === 'challengeStarted') {
        var ch = payload;
        if (ch) {
          state.available = state.available.filter(function (c) { return c._id !== ch._id; });
          state.active.unshift(Object.assign({}, ch, { progress: 0 }));
          state.tab = 'active';
          var allBtns = els.tabs.querySelectorAll('button');
          for (var j = 0; j < allBtns.length; j++) {
            allBtns[j].className = 'dos-tab-pill' + (allBtns[j].getAttribute('data-tab') === 'active' ? ' active' : '');
            allBtns[j].style.flex = '1';
          }
          renderList();
        }
      } else if (action === 'rewardClaimed') {
        var claimed = payload;
        if (claimed && claimed._id) {
          state.active = state.active.filter(function (c) { return c._id !== claimed._id; });
          state.completed.unshift(Object.assign({}, claimed, { completed_at: new Date().toISOString() }));
          renderList();
        }
      }
    },

    getSnapshot: function () {
      return { tab: state.tab, activeCount: state.active.length, completedCount: state.completed.length };
    }
  };
})();
