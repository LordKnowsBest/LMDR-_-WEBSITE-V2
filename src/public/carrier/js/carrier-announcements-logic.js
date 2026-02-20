/* =========================================
   CARRIER ANNOUNCEMENTS — Logic Module
   VelocityMatch Carrier Portal
   Depends on: AnnouncementsConfig, AnnouncementsBridge, AnnouncementsRender
   ========================================= */
var AnnouncementsLogic = (function () {
  'use strict';

  var state = {
    status: 'published',
    announcements: [],
    filtered: [],
    carrierId: null,
    selectedAnnouncementId: null,
    pendingAttachments: []
  };

  function applyFilters() {
    var priority = document.getElementById('priorityFilter').value;
    var search = document.getElementById('searchInput').value.toLowerCase();
    var dateFrom = document.getElementById('dateFromFilter').value;
    var dateTo = document.getElementById('dateToFilter').value;

    state.filtered = state.announcements.filter(function (item) {
      var matchesPriority = priority === 'all' || item.priority === priority;
      var matchesSearch = !search || (item.title || '').toLowerCase().includes(search);
      var published = item.published_at ? new Date(item.published_at) : null;
      var fromOk = !dateFrom || !published || published >= new Date(dateFrom + 'T00:00:00');
      var toOk = !dateTo || !published || published <= new Date(dateTo + 'T23:59:59');
      return matchesPriority && matchesSearch && fromOk && toOk;
    });
    AnnouncementsRender.renderAnnouncements(state.filtered);
  }

  function refreshAnnouncements() {
    AnnouncementsBridge.getAnnouncements(state.status);
  }

  function setTab(status) {
    state.status = status;
    AnnouncementsRender.updateTabUI(status);
    refreshAnnouncements();
  }

  function openModal() { document.getElementById('announcementModal').classList.add('active'); }
  function closeModal() { document.getElementById('announcementModal').classList.remove('active'); }

  function insertContentToken(token) {
    var field = document.getElementById('annContent');
    var start = field.selectionStart || field.value.length;
    var end = field.selectionEnd || field.value.length;
    var before = field.value.slice(0, start);
    var selected = field.value.slice(start, end);
    var after = field.value.slice(end);
    field.value = before + token.replace('</', selected + '</') + after;
    field.focus();
  }

  function setAudiencePreset() {
    var preset = document.getElementById('annAudiencePreset').value;
    var data = AnnouncementsConfig.AUDIENCE_PRESETS[preset] || AnnouncementsConfig.AUDIENCE_PRESETS.all;
    document.getElementById('annAudience').value = JSON.stringify(data);
  }

  function uploadAttachmentFromModal() {
    var input = document.getElementById('annAttachmentFile');
    var file = input.files && input.files[0];
    if (!file) { alert('Select a file first.'); return; }
    if (file.size > AnnouncementsConfig.MAX_ATTACHMENT_BYTES) { alert('Attachment must be <= 8MB.'); return; }
    if (!AnnouncementsConfig.ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      alert('Supported files: PDF, PNG, JPG, WEBP, TXT.');
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      AnnouncementsBridge.uploadAttachment(reader.result, file.name, file.type, state.carrierId);
    };
    reader.readAsDataURL(file);
  }

  function previewAnnouncement() {
    var title = document.getElementById('annTitle').value.trim();
    var content = document.getElementById('annContent').value.trim();
    var priority = document.getElementById('annPriority').value;
    alert((title || '(untitled)') + '\nPriority: ' + priority + '\n\n' + (content || '(no content)'));
  }

  function submitAnnouncement(publishNow) {
    var title = document.getElementById('annTitle').value.trim();
    var content = document.getElementById('annContent').value.trim();
    if (!title || !content) { alert('Title and content are required.'); return; }

    var targetAudience = { type: 'all', segments: [] };
    var audienceValue = document.getElementById('annAudience').value.trim();
    if (audienceValue) {
      try { targetAudience = JSON.parse(audienceValue); } catch (err) { alert('Target audience JSON is invalid.'); return; }
    }

    var payload = {
      carrier_id: state.carrierId,
      title: title,
      content: content,
      priority: document.getElementById('annPriority').value,
      target_audience: targetAudience,
      allow_comments: document.getElementById('annComments').checked,
      scheduled_at: document.getElementById('annSchedule').value || null,
      expires_at: document.getElementById('annExpiry').value || null,
      status: publishNow ? 'published' : 'draft',
      attachments: state.pendingAttachments
    };
    AnnouncementsBridge.createAnnouncement(payload);
    closeModal();
  }

  function previewAudience() {
    var audienceValue = document.getElementById('annAudience').value.trim();
    var targetAudience = { type: 'all', segments: [] };
    if (audienceValue) {
      try { targetAudience = JSON.parse(audienceValue); } catch (err) { alert('Target audience JSON is invalid.'); return; }
    }
    AnnouncementsBridge.previewRecipients(state.carrierId, targetAudience);
  }

  function sendReminder() {
    if (!state.selectedAnnouncementId) { alert('Open an announcement detail first, then send reminder.'); return; }
    AnnouncementsBridge.sendReminder(state.selectedAnnouncementId, state.carrierId);
  }

  function openAnnouncementDetail(announcementId) {
    state.selectedAnnouncementId = announcementId;
    document.getElementById('announcementDetailModal').classList.add('active');
    document.getElementById('detailBody').innerHTML = 'Loading...';
    AnnouncementsBridge.getAnnouncementDetail(announcementId, state.carrierId);
  }

  function closeDetailModal() { document.getElementById('announcementDetailModal').classList.remove('active'); }

  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var icon = document.getElementById('toggleIcon');
    sidebar.classList.toggle('w-56');
    sidebar.classList.toggle('w-16');
    sidebar.classList.toggle('collapsed');
    if (sidebar.classList.contains('collapsed')) {
      icon.classList.remove('fa-chevron-left');
      icon.classList.add('fa-chevron-right');
    } else {
      icon.classList.remove('fa-chevron-right');
      icon.classList.add('fa-chevron-left');
    }
  }

  function toggleTheme() {
    var body = document.body;
    body.classList.toggle('light-mode');
    var icon = document.getElementById('themeIcon');
    var label = document.getElementById('themeLabel');
    var isLight = body.classList.contains('light-mode');
    icon.className = isLight ? 'fa-solid fa-moon mr-2' : 'fa-solid fa-sun mr-2';
    label.textContent = isLight ? 'Dark mode' : 'Light mode';
  }

  function toggleCommentVisibility(commentId, hidden) {
    AnnouncementsBridge.setCommentVisibility(commentId, hidden);
  }

  function init() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link[data-page]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('collapsed')) toggleSidebar();
        var page = link.getAttribute('data-page');
        if (page) AnnouncementsBridge.navigateTo(page);
      });
    });

    // Bridge listeners
    AnnouncementsBridge.listen({
      carrierAnnouncementsData: function (data) {
        state.announcements = (data && data.announcements) || [];
        state.filtered = state.announcements.slice();
        AnnouncementsRender.updateStats(state.announcements);
        applyFilters();
      },
      recipientPreviewResult: function (data) {
        document.getElementById('previewResult').textContent = ((data && data.total) != null ? data.total : '--') + ' drivers';
      },
      announcementActionResult: function () {
        state.pendingAttachments = [];
        AnnouncementsRender.renderPendingAttachments(state.pendingAttachments);
        refreshAnnouncements();
      },
      carrierContext: function (data) {
        state.carrierId = (data && data.carrierId) || state.carrierId;
      },
      announcementDetailData: function (data) {
        AnnouncementsRender.renderDetailBody(data || {});
      },
      announcementReminderResult: function (data) {
        if (!data || !data.success) {
          alert((data && data.error) || 'Failed to send reminders');
        } else {
          alert('Reminders sent: ' + (data.remindersSent || 0) + ' (Unread: ' + (data.unreadCount || 0) + ')');
        }
      },
      announcementCommentModerationResult: function () {
        if (state.selectedAnnouncementId) openAnnouncementDetail(state.selectedAnnouncementId);
      },
      announcementAttachmentResult: function (data) {
        if (!data || !data.success || !data.attachment) {
          alert((data && data.error) || 'Attachment upload failed');
          return;
        }
        state.pendingAttachments.push(data.attachment);
        AnnouncementsRender.renderPendingAttachments(state.pendingAttachments);
      }
    });

    // Notify ready + initial load
    AnnouncementsBridge.notifyReady();
    refreshAnnouncements();
  }

  return {
    init: init,
    setTab: setTab,
    openModal: openModal,
    closeModal: closeModal,
    closeDetailModal: closeDetailModal,
    insertContentToken: insertContentToken,
    setAudiencePreset: setAudiencePreset,
    uploadAttachmentFromModal: uploadAttachmentFromModal,
    previewAnnouncement: previewAnnouncement,
    submitAnnouncement: submitAnnouncement,
    refreshAnnouncements: refreshAnnouncements,
    applyFilters: applyFilters,
    previewAudience: previewAudience,
    sendReminder: sendReminder,
    openAnnouncementDetail: openAnnouncementDetail,
    toggleSidebar: toggleSidebar,
    toggleTheme: toggleTheme,
    toggleCommentVisibility: toggleCommentVisibility,
    publishAnnouncement: function (id) { AnnouncementsBridge.publishAnnouncement(id); },
    archiveAnnouncement: function (id) { AnnouncementsBridge.archiveAnnouncement(id); }
  };
})();

// Expose globals for onclick handlers in HTML
function setTab(s) { AnnouncementsLogic.setTab(s); }
function openModal() { AnnouncementsLogic.openModal(); }
function closeModal() { AnnouncementsLogic.closeModal(); }
function closeDetailModal() { AnnouncementsLogic.closeDetailModal(); }
function insertContentToken(t) { AnnouncementsLogic.insertContentToken(t); }
function setAudiencePreset() { AnnouncementsLogic.setAudiencePreset(); }
function uploadAttachmentFromModal() { AnnouncementsLogic.uploadAttachmentFromModal(); }
function previewAnnouncement() { AnnouncementsLogic.previewAnnouncement(); }
function submitAnnouncement(p) { AnnouncementsLogic.submitAnnouncement(p); }
function refreshAnnouncements() { AnnouncementsLogic.refreshAnnouncements(); }
function applyFilters() { AnnouncementsLogic.applyFilters(); }
function previewAudience() { AnnouncementsLogic.previewAudience(); }
function sendReminder() { AnnouncementsLogic.sendReminder(); }
function openAnnouncementDetail(id) { AnnouncementsLogic.openAnnouncementDetail(id); }
function toggleSidebar() { AnnouncementsLogic.toggleSidebar(); }
function toggleTheme() { AnnouncementsLogic.toggleTheme(); }
function toggleCommentVisibility(id, h) { AnnouncementsLogic.toggleCommentVisibility(id, h); }
function publishAnnouncement(id) { AnnouncementsLogic.publishAnnouncement(id); }
function archiveAnnouncement(id) { AnnouncementsLogic.archiveAnnouncement(id); }
