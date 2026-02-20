/* =========================================
   DRIVER ANNOUNCEMENTS — Logic Module
   Depends on: DriverAnnouncementsBridge
   Config, rendering, event handling
   ========================================= */
var DriverAnnouncementsLogic = (function () {
  'use strict';

  var state = {
    announcements: [],
    filtered: [],
    driverId: null,
    carrierId: null,
    offset: 0,
    limit: 25,
    expandedId: null,
    readStartedAt: {},
    loadingMore: false
  };

  // ── Filters ──
  function refreshFeed() {
    state.offset = 0;
    DriverAnnouncementsBridge.getAnnouncements(
      state.driverId, state.carrierId, state.limit, 0
    );
  }

  function loadMoreAnnouncements() {
    if (state.loadingMore) return;
    state.loadingMore = true;
    state.offset += state.limit;
    DriverAnnouncementsBridge.getAnnouncements(
      state.driverId, state.carrierId, state.limit, state.offset
    );
  }

  function applyFilters() {
    var readFilter = document.getElementById('readFilter').value;
    var priorityFilter = document.getElementById('priorityFilter').value;

    state.filtered = state.announcements.filter(function (item) {
      var readOk = readFilter === 'all' || item.read_status === readFilter;
      var priorityOk = priorityFilter === 'all' || item.priority === priorityFilter;
      return readOk && priorityOk;
    });

    renderFeed();
  }

  // ── Render ──
  function renderFeed() {
    var feed = document.getElementById('announcementFeed');
    if (!state.filtered.length) {
      feed.innerHTML = '<div class="p-6 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">No announcements yet.</div>';
      return;
    }

    feed.innerHTML = state.filtered.map(function (item) {
      var priority = item.priority || 'normal';
      var badgeClass = priority === 'urgent' ? 'bg-red-100 text-red-700' :
        priority === 'important' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
      var isUnread = item.read_status !== 'read';
      var published = item.published_at ? new Date(item.published_at).toLocaleString() : '';
      return (
        '<div class="p-4 rounded-xl border ' + (isUnread ? 'border-lmdr-blue bg-white' : 'border-slate-200 bg-slate-50') + '">' +
          '<div class="flex items-center justify-between">' +
            '<div>' +
              '<div class="flex items-center gap-2">' +
                '<span class="text-sm font-semibold">' + (item.title || 'Untitled') + '</span>' +
                '<span class="pill ' + badgeClass + '">' + priority + '</span>' +
                (isUnread ? '<span class="pill bg-lmdr-yellow text-lmdr-dark">NEW</span>' : '') +
              '</div>' +
              '<p class="text-xs text-slate-500 mt-1">' + published + '</p>' +
            '</div>' +
            '<button class="px-2 py-1 rounded border border-slate-200 text-xs" onclick="DriverAnnouncementsLogic.toggleDetail(\'' + item._id + '\')">' +
              (state.expandedId === item._id ? 'Hide' : 'Read full') +
            '</button>' +
          '</div>' +
          '<p class="text-sm text-slate-700 mt-2">' + ((item.content_plain || '').slice(0, 160)) + '...</p>' +
          (state.expandedId === item._id ? renderExpanded(item) : '') +
        '</div>'
      );
    }).join('');
  }

  function renderExpanded(item) {
    var attachments = Array.isArray(item.attachments) ? item.attachments : [];
    var attachmentHtml = attachments.length
      ? '<div class="mt-3"><div class="text-xs font-semibold uppercase tracking-widest text-slate-500">Attachments</div>' +
        '<ul class="mt-1 space-y-1">' +
        attachments.map(function (a) {
          return '<li><a class="text-lmdr-blue underline text-xs" href="' + a.url + '" target="_blank" rel="noopener">' + (a.name || 'Attachment') + '</a></li>';
        }).join('') + '</ul></div>'
      : '';
    var commentsEnabled = item.allow_comments !== false;
    return (
      '<div class="mt-3 border-t border-slate-200 pt-3">' +
        '<div class="text-sm text-slate-800 whitespace-pre-wrap">' + (item.content || item.content_plain || '') + '</div>' +
        attachmentHtml +
        (commentsEnabled
          ? '<div class="mt-3">' +
              '<label class="text-xs uppercase tracking-widest text-slate-500">Add Comment</label>' +
              '<div class="mt-1 flex gap-2">' +
                '<input id="commentInput-' + item._id + '" type="text" maxlength="500" class="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Write a reply..." />' +
                '<button class="px-3 py-2 rounded-lg bg-lmdr-blue text-white text-sm" onclick="DriverAnnouncementsLogic.submitComment(\'' + item._id + '\')">Send</button>' +
              '</div>' +
            '</div>'
          : '<div class="mt-3 text-xs text-slate-500">Comments disabled for this announcement.</div>') +
      '</div>'
    );
  }

  function updateUnreadCount() {
    var unread = state.announcements.filter(function (a) { return a.read_status !== 'read'; }).length;
    document.getElementById('unreadCount').textContent = unread;
  }

  // ── Actions ──
  function markRead(id, timeSpentSeconds) {
    if (!id) return;
    DriverAnnouncementsBridge.markRead(id, state.driverId, 'web', timeSpentSeconds);
    var item = state.announcements.find(function (a) { return a._id === id; });
    if (item) {
      item.read_status = 'read';
      applyFilters();
      updateUnreadCount();
    }
  }

  function toggleDetail(id) {
    if (state.expandedId === id) {
      var start = state.readStartedAt[id];
      if (start) {
        var elapsedSeconds = Math.round((Date.now() - start) / 1000);
        markRead(id, elapsedSeconds);
        delete state.readStartedAt[id];
      }
      state.expandedId = null;
    } else {
      state.expandedId = id;
      state.readStartedAt[id] = Date.now();
      markRead(id, null);
    }
    applyFilters();
  }

  function submitComment(announcementId) {
    var input = document.getElementById('commentInput-' + announcementId);
    if (!input) return;
    var commentText = input.value.trim();
    if (!commentText) return;
    DriverAnnouncementsBridge.addComment(announcementId, state.driverId, commentText);
    input.value = '';
  }

  // ── Message Handler ──
  function handleMessage(event) {
    var msg = event.data || {};
    var type = msg.type;
    var data = msg.data;

    if (type === 'driverAnnouncementsData') {
      var incoming = (data && data.announcements) || [];
      if (state.offset > 0) {
        var seen = {};
        state.announcements.forEach(function (a) { seen[a._id] = true; });
        var merged = state.announcements.slice();
        incoming.forEach(function (item) {
          if (!seen[item._id]) merged.push(item);
        });
        state.announcements = merged;
      } else {
        state.announcements = incoming;
      }
      state.filtered = state.announcements.slice();
      applyFilters();
      updateUnreadCount();
      var hasMore = incoming.length >= state.limit;
      document.getElementById('loadMoreBtn').classList.toggle('hidden', !hasMore);
      state.loadingMore = false;
    }

    if (type === 'driverContext') {
      state.driverId = (data && data.driverId) || state.driverId;
      state.carrierId = (data && data.carrierId) || state.carrierId;
      refreshFeed();
    }

    if (type === 'announcementCommentResult') {
      if (data && !data.success) {
        alert(data.error || 'Failed to add comment');
      }
    }
  }

  // ── Infinite Scroll ──
  function setupScrollListener() {
    var feedEl = document.getElementById('announcementFeed');
    if (!feedEl) return;
    feedEl.addEventListener('scroll', function (event) {
      var el = event.target;
      var nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
      var loadMoreVisible = !document.getElementById('loadMoreBtn').classList.contains('hidden');
      if (nearBottom && loadMoreVisible) {
        loadMoreAnnouncements();
      }
    });
  }

  // ── Expose Globals for onclick ──
  function exposeGlobals() {
    window.refreshFeed = refreshFeed;
    window.applyFilters = applyFilters;
    window.loadMoreAnnouncements = loadMoreAnnouncements;
  }

  // ── Init ──
  function init() {
    exposeGlobals();
    window.addEventListener('message', handleMessage);
    setupScrollListener();
    DriverAnnouncementsBridge.ready();
  }

  return {
    init: init,
    toggleDetail: toggleDetail,
    submitComment: submitComment,
    refreshFeed: refreshFeed,
    applyFilters: applyFilters
  };
})();
