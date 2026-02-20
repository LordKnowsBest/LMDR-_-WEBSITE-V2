/* =========================================
   CARRIER ANNOUNCEMENTS — Bridge Module
   VelocityMatch Carrier Portal
   Depends on: AnnouncementsConfig
   ========================================= */
var AnnouncementsBridge = (function () {
  'use strict';

  function postToParent(type, data) {
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function notifyReady() {
    postToParent('carrierAnnouncementsReady');
  }

  function getAnnouncements(status, limit, offset) {
    postToParent('getCarrierAnnouncements', { status: status, limit: limit || 100, offset: offset || 0 });
  }

  function createAnnouncement(payload) {
    postToParent('createAnnouncement', payload);
  }

  function publishAnnouncement(id) {
    postToParent('publishAnnouncement', { announcementId: id });
  }

  function archiveAnnouncement(id) {
    postToParent('archiveAnnouncement', { announcementId: id });
  }

  function previewRecipients(carrierId, targetAudience) {
    postToParent('previewRecipients', { carrierId: carrierId, targetAudience: targetAudience });
  }

  function sendReminder(announcementId, carrierId) {
    postToParent('sendAnnouncementReminder', { announcementId: announcementId, carrierId: carrierId });
  }

  function getAnnouncementDetail(announcementId, carrierId) {
    postToParent('getAnnouncementDetail', {
      announcementId: announcementId,
      carrierId: carrierId,
      includeHiddenComments: true,
      limit: 50,
      offset: 0
    });
  }

  function uploadAttachment(base64Data, fileName, mimeType, carrierId) {
    postToParent('uploadAnnouncementAttachment', {
      base64Data: base64Data,
      fileName: fileName,
      mimeType: mimeType,
      carrierId: carrierId
    });
  }

  function setCommentVisibility(commentId, hidden) {
    postToParent('setAnnouncementCommentVisibility', { commentId: commentId, hidden: hidden });
  }

  function navigateTo(page) {
    window.parent.postMessage({ type: 'navigateTo', action: 'navigateTo', data: { page: page } }, '*');
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data || {};
      var type = msg.type;
      if (type && handlers[type]) {
        handlers[type](msg.data, msg);
      }
    });
  }

  return {
    postToParent: postToParent,
    notifyReady: notifyReady,
    getAnnouncements: getAnnouncements,
    createAnnouncement: createAnnouncement,
    publishAnnouncement: publishAnnouncement,
    archiveAnnouncement: archiveAnnouncement,
    previewRecipients: previewRecipients,
    sendReminder: sendReminder,
    getAnnouncementDetail: getAnnouncementDetail,
    uploadAttachment: uploadAttachment,
    setCommentVisibility: setCommentVisibility,
    navigateTo: navigateTo,
    listen: listen
  };
})();
