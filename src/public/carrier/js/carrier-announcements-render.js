/* =========================================
   CARRIER ANNOUNCEMENTS — Render Module
   VelocityMatch Carrier Portal
   Depends on: AnnouncementsConfig
   ========================================= */
var AnnouncementsRender = (function () {
  'use strict';

  function renderAnnouncements(filtered) {
    var list = document.getElementById('announcementList');
    if (!filtered.length) {
      list.innerHTML = '<div class="p-6 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">No announcements yet for this view.</div>';
      return;
    }

    list.innerHTML = filtered.map(function (item) {
      var badgeColor = AnnouncementsConfig.PRIORITY_COLORS[item.priority] || AnnouncementsConfig.PRIORITY_COLORS.normal;
      var published = item.published_at ? new Date(item.published_at).toLocaleString() : 'Not published';
      var reads = Number(item.read_count || 0);
      var total = Number(item.total_recipients || 0);
      var rate = total ? Math.round((reads / total) * 100) : 0;
      return '<div class="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-vm-sky/40 transition">' +
        '<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">' +
          '<div>' +
            '<div class="flex items-center gap-2">' +
              '<span class="text-sm font-semibold">' + (item.title || 'Untitled') + '</span>' +
              '<span class="text-xs px-2 py-0.5 rounded-full ' + badgeColor + '">' + (item.priority || 'normal') + '</span>' +
            '</div>' +
            '<p class="text-xs text-slate-400 mt-1">' + published + '</p>' +
          '</div>' +
          '<div class="flex items-center gap-3">' +
            '<div class="text-xs text-slate-300">Read ' + rate + '%</div>' +
            '<button class="px-3 py-1.5 rounded-lg bg-white/10 text-xs" onclick="publishAnnouncement(\'' + item._id + '\')">Publish</button>' +
            '<button class="px-3 py-1.5 rounded-lg bg-white/10 text-xs" onclick="archiveAnnouncement(\'' + item._id + '\')">Archive</button>' +
            '<button class="px-3 py-1.5 rounded-lg bg-white/10 text-xs" onclick="openAnnouncementDetail(\'' + item._id + '\')">Details</button>' +
          '</div>' +
        '</div>' +
        '<div class="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">' +
          '<div class="h-full bg-sky-400" style="width:' + Math.max(0, Math.min(100, rate)) + '%"></div>' +
        '</div>' +
        '<p class="text-sm text-slate-200 mt-2">' + ((item.content_plain || '').slice(0, 140)) + '...</p>' +
      '</div>';
    }).join('');
  }

  function updateStats(announcements) {
    var published = announcements.filter(function (a) { return a.status === 'published'; }).length;
    var scheduled = announcements.filter(function (a) { return a.status === 'scheduled'; }).length;
    var drafts = announcements.filter(function (a) { return a.status === 'draft'; }).length;
    var readRates = announcements
      .filter(function (a) { return a.total_recipients; })
      .map(function (a) { return Math.round((Number(a.read_count || 0) / Number(a.total_recipients || 1)) * 100); });
    var avgRate = readRates.length ? Math.round(readRates.reduce(function (a, b) { return a + b; }, 0) / readRates.length) : 0;

    document.getElementById('statPublished').textContent = published;
    document.getElementById('statScheduled').textContent = scheduled;
    document.getElementById('statDrafts').textContent = drafts;
    document.getElementById('statReadRate').textContent = avgRate + '%';
  }

  function renderPendingAttachments(attachments) {
    var list = document.getElementById('annAttachmentList');
    list.innerHTML = attachments.map(function (a) {
      return '<li>' + a.name + ' <span class="text-slate-500">(' + a.type + ')</span></li>';
    }).join('');
  }

  function renderDetailBody(detail) {
    var body = document.getElementById('detailBody');
    if (!detail.success) {
      body.innerHTML = '<div class="text-rose-300">' + (detail.error || 'Failed to load detail') + '</div>';
      return;
    }

    var stats = detail.stats || {};
    var readReceipts = detail.readReceipts || [];
    var unreadDrivers = detail.unreadDrivers || [];
    var comments = detail.comments || [];

    var listRead = readReceipts.slice(0, 20).map(function (r) {
      return '<li>' + (r.driver_id || 'driver') + ' - ' + new Date(r.read_at).toLocaleString() + '</li>';
    }).join('');

    var listUnread = unreadDrivers.slice(0, 20).map(function (d) {
      return '<li>' + (d.display_name || d.first_name || d._id || 'driver') + '</li>';
    }).join('');

    var listComments = comments.slice(0, 20).map(function (c) {
      return '<li class="border border-white/10 rounded-lg p-2">' +
        '<div class="font-semibold">' + (c.driver_name || 'Driver') + '</div>' +
        '<div class="text-slate-300">' + (c.comment_text || '') + '</div>' +
        '<div class="mt-2"><button class="px-2 py-1 rounded bg-white/10 text-xs" onclick="toggleCommentVisibility(\'' + c._id + '\', ' + (c.is_hidden ? 'false' : 'true') + ')">' +
        (c.is_hidden ? 'Unhide' : 'Hide') + '</button></div></li>';
    }).join('');

    body.innerHTML =
      '<div class="grid md:grid-cols-3 gap-3">' +
        '<div class="rounded-xl border border-white/10 p-3"><div class="text-xs text-slate-400">Read Rate</div><div class="text-xl font-bold">' + (stats.readRate || 0) + '%</div></div>' +
        '<div class="rounded-xl border border-white/10 p-3"><div class="text-xs text-slate-400">Reads</div><div class="text-xl font-bold">' + (stats.readCount || 0) + '/' + (stats.totalRecipients || 0) + '</div></div>' +
        '<div class="rounded-xl border border-white/10 p-3"><div class="text-xs text-slate-400">Avg Time</div><div class="text-xl font-bold">' + (stats.avgTimeSpentSeconds || 0) + 's</div></div>' +
      '</div>' +
      '<div class="mt-4 grid md:grid-cols-2 gap-4">' +
        '<div><h4 class="font-semibold mb-2">Read Receipts</h4><ul class="space-y-1 text-xs">' + (listRead || '<li>No reads yet</li>') + '</ul></div>' +
        '<div><h4 class="font-semibold mb-2">Unread Drivers</h4><ul class="space-y-1 text-xs">' + (listUnread || '<li>No unread drivers</li>') + '</ul></div>' +
      '</div>' +
      '<div class="mt-4"><h4 class="font-semibold mb-2">Comments</h4><ul class="space-y-2 text-xs">' + (listComments || '<li>No comments</li>') + '</ul></div>';
  }

  function updateTabUI(status) {
    document.getElementById('currentStatus').textContent = status[0].toUpperCase() + status.slice(1);
    AnnouncementsConfig.TABS.forEach(function (key) {
      var tab = document.getElementById('tab' + key[0].toUpperCase() + key.slice(1));
      tab.className = key === status ? 'pb-3 tab-active' : 'pb-3 tab-inactive';
    });
  }

  return {
    renderAnnouncements: renderAnnouncements,
    updateStats: updateStats,
    renderPendingAttachments: renderPendingAttachments,
    renderDetailBody: renderDetailBody,
    updateTabUI: updateTabUI
  };
})();
