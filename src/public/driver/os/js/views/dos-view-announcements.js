/**
 * dos-view-announcements.js
 * DriverOS Announcements view — announcement cards with priority, expand/collapse.
 * Migrated from DRIVER_ANNOUNCEMENTS.html: all `type` keys become `action` keys.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var PRIORITY_CHIPS = {
    'urgent':    { cls: 'dos-chip-amber', icon: 'warning' },
    'important': { cls: 'dos-chip-blue',  icon: 'priority_high' },
    'normal':    { cls: 'dos-chip-gray',  icon: 'info' }
  };

  var state = { announcements: [], expandedId: null, filter: 'all' };
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

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function buildUI(root) {
    clearEl(root);

    if (!document.getElementById('dos-announcements-style')) {
      var style = document.createElement('style');
      style.id = 'dos-announcements-style';
      style.textContent =
        '@keyframes dosShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
        '.dos-ann-card{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:box-shadow .15s ease}' +
        '.dos-ann-card:active{box-shadow:0 1px 2px rgba(0,0,0,.05)}' +
        '.dos-ann-body{max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;padding:0 16px}' +
        '.dos-ann-body.expanded{max-height:600px;padding:0 16px 16px}' +
        '.dos-unread-dot{width:8px;height:8px;border-radius:50%;background:#2563eb;flex-shrink:0}';
      document.head.appendChild(style);
    }

    var container = h('div', 'dos-container');
    container.style.paddingTop = '12px';
    container.style.paddingBottom = '80px';

    // Header
    var header = h('div', '');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px';
    var titleEl = h('div', 'dos-text-heading', 'Announcements');
    header.appendChild(titleEl);
    var unreadBadge = h('div', 'dos-badge');
    unreadBadge.id = 'ann-unread-count';
    unreadBadge.textContent = '0';
    header.appendChild(unreadBadge);
    container.appendChild(header);

    // Filter pills
    var filterRow = h('div', 'dos-scroll-row');
    filterRow.id = 'ann-filters';
    filterRow.style.marginBottom = '16px';
    var filters = ['all', 'urgent', 'important', 'normal'];
    filters.forEach(function (f) {
      var pill = h('button', 'dos-chip ' + (f === 'all' ? 'dos-chip-blue' : 'dos-chip-gray'));
      pill.textContent = f.charAt(0).toUpperCase() + f.slice(1);
      pill.setAttribute('data-filter', f);
      pill.style.cssText = 'cursor:pointer;min-height:40px;flex-shrink:0;-webkit-tap-highlight-color:transparent';
      filterRow.appendChild(pill);
    });
    container.appendChild(filterRow);

    // Skeleton
    var skel = h('div', '');
    skel.id = 'ann-skeleton';
    for (var i = 0; i < 3; i++) {
      var sk = h('div', 'dos-card');
      sk.style.cssText = 'height:80px;margin-bottom:12px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:dosShimmer 1.5s infinite';
      skel.appendChild(sk);
    }
    container.appendChild(skel);

    // List
    var list = h('div', '');
    list.id = 'ann-list';
    list.style.display = 'none';
    container.appendChild(list);

    // Empty
    var empty = h('div', 'dos-empty');
    empty.id = 'ann-empty';
    empty.style.display = 'none';
    empty.appendChild(icon('campaign', ''));
    empty.appendChild(h('div', 'dos-text-body', 'No announcements'));
    container.appendChild(empty);

    root.appendChild(container);
    els = { skeleton: skel, list: list, empty: empty, filters: filterRow, unreadCount: unreadBadge };
  }

  function renderList() {
    clearEl(els.list);

    var items = state.announcements;
    if (state.filter !== 'all') {
      items = items.filter(function (a) { return a.priority === state.filter; });
    }

    // Update unread count
    var unread = state.announcements.filter(function (a) { return !a.isRead; }).length;
    els.unreadCount.textContent = unread;
    els.unreadCount.style.display = unread > 0 ? '' : 'none';

    if (items.length === 0) {
      els.list.style.display = 'none';
      els.empty.style.display = '';
      return;
    }
    els.list.style.display = '';
    els.empty.style.display = 'none';

    items.forEach(function (ann) {
      var card = h('div', 'dos-card dos-ann-card');
      card.style.cssText = 'margin-bottom:12px;padding:0;overflow:hidden';
      card.setAttribute('data-ann-id', ann._id);

      // Card header (always visible)
      var hdr = h('div', '');
      hdr.style.cssText = 'padding:16px;display:flex;align-items:flex-start;gap:12px';

      // Unread dot
      if (!ann.isRead) {
        var dot = h('div', 'dos-unread-dot');
        dot.style.marginTop = '6px';
        hdr.appendChild(dot);
      }

      var content = h('div', '');
      content.style.cssText = 'flex:1;min-width:0';

      // Priority + date row
      var metaRow = h('div', '');
      metaRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap';

      var pri = PRIORITY_CHIPS[ann.priority] || PRIORITY_CHIPS.normal;
      var priChip = h('span', 'dos-chip ' + pri.cls);
      priChip.style.cssText = 'font-size:10px;padding:2px 8px;min-height:auto;font-weight:700;text-transform:uppercase';
      var priIcon = icon(pri.icon, '');
      priIcon.style.fontSize = '14px';
      priChip.appendChild(priIcon);
      priChip.appendChild(document.createTextNode(' ' + (ann.priority || 'normal')));
      metaRow.appendChild(priChip);

      var dateEl = h('span', 'dos-text-small', formatDate(ann.publishedAt || ann.createdAt));
      metaRow.appendChild(dateEl);
      content.appendChild(metaRow);

      // Title
      var titleEl = h('div', 'dos-text-body', ann.title || 'Announcement');
      titleEl.style.fontWeight = '700';
      content.appendChild(titleEl);

      // Preview (when collapsed)
      if (ann.body || ann.content) {
        var preview = h('div', 'dos-text-small');
        preview.style.cssText = 'margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
        var bodyText = ann.body || ann.content || '';
        preview.textContent = bodyText.length > 80 ? bodyText.substring(0, 80) + '...' : bodyText;
        content.appendChild(preview);
      }

      hdr.appendChild(content);

      // Chevron
      var chevron = icon('expand_more', '');
      chevron.style.cssText = 'font-size:24px;color:#94a3b8;flex-shrink:0;transition:transform .2s ease';
      chevron.id = 'ann-chevron-' + ann._id;
      if (state.expandedId === ann._id) chevron.style.transform = 'rotate(180deg)';
      hdr.appendChild(chevron);

      card.appendChild(hdr);

      // Expandable body
      var body = h('div', 'dos-ann-body' + (state.expandedId === ann._id ? ' expanded' : ''));
      body.id = 'ann-body-' + ann._id;

      var bodyContent = h('div', 'dos-text-body');
      bodyContent.style.cssText = 'font-size:14px;line-height:1.6;white-space:pre-wrap';
      bodyContent.textContent = ann.body || ann.content || '';
      body.appendChild(bodyContent);

      // Author
      if (ann.author) {
        var authorEl = h('div', 'dos-text-small');
        authorEl.style.marginTop = '12px';
        authorEl.textContent = 'Posted by ' + ann.author;
        body.appendChild(authorEl);
      }

      card.appendChild(body);
      els.list.appendChild(card);
    });
  }

  function bindEvents(self) {
    // Filter clicks
    var filterFn = function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      state.filter = btn.getAttribute('data-filter');
      var all = els.filters.querySelectorAll('button');
      for (var j = 0; j < all.length; j++) {
        all[j].className = 'dos-chip ' + (all[j].getAttribute('data-filter') === state.filter ? 'dos-chip-blue' : 'dos-chip-gray');
        all[j].style.cssText = 'cursor:pointer;min-height:40px;flex-shrink:0;-webkit-tap-highlight-color:transparent';
      }
      renderList();
    };
    els.filters.addEventListener('click', filterFn);
    self._listeners.push({ el: els.filters, type: 'click', fn: filterFn });

    // Card expand/collapse
    var cardFn = function (e) {
      var card = e.target.closest('.dos-ann-card');
      if (!card) return;
      var id = card.getAttribute('data-ann-id');
      if (!id) return;

      // Toggle expand
      if (state.expandedId === id) {
        state.expandedId = null;
      } else {
        state.expandedId = id;
        // Mark as read
        var ann = state.announcements.find(function (a) { return a._id === id; });
        if (ann && !ann.isRead) {
          ann.isRead = true;
          DOS.bridge.send('markAnnouncementRead', { announcementId: id });
        }
      }
      renderList();
    };
    els.list.addEventListener('click', cardFn);
    self._listeners.push({ el: els.list, type: 'click', fn: cardFn });
  }

  DOS.viewModules['announcements'] = {
    _listeners: [],

    mount: function (root) {
      buildUI(root);
      bindEvents(this);
      // NOTE: Using action key (not type key) per DOS protocol migration
      DOS.bridge.send('getAnnouncements', {});
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      els = {};
      state.expandedId = null;
    },

    onMessage: function (action, payload) {
      if (action === 'announcementsLoaded' || action === 'driverAnnouncementsData') {
        var d = payload || {};
        state.announcements = d.announcements || d.items || [];
        if (els.skeleton) els.skeleton.style.display = 'none';
        renderList();
      }
    },

    getSnapshot: function () {
      var unread = state.announcements.filter(function (a) { return !a.isRead; }).length;
      return { total: state.announcements.length, unread: unread, filter: state.filter };
    }
  };
})();
