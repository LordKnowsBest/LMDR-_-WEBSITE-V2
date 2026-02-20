/* =========================================
   DRIVER ANNOUNCEMENTS — Bridge Module
   Depends on: nothing
   Handles postMessage communication with Wix page code
   ========================================= */
var DriverAnnouncementsBridge = (function () {
  'use strict';

  function send(type, data) {
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function ready() {
    send('driverAnnouncementsReady');
  }

  function getAnnouncements(driverId, carrierId, limit, offset) {
    send('getDriverAnnouncements', {
      driverId: driverId,
      carrierId: carrierId,
      limit: limit,
      offset: offset
    });
  }

  function markRead(announcementId, driverId, deviceType, timeSpentSeconds) {
    send('markAnnouncementRead', {
      announcementId: announcementId,
      driverId: driverId,
      deviceType: deviceType,
      timeSpentSeconds: timeSpentSeconds
    });
  }

  function addComment(announcementId, driverId, commentText) {
    send('addAnnouncementComment', {
      announcementId: announcementId,
      driverId: driverId,
      commentText: commentText
    });
  }

  return {
    send: send,
    ready: ready,
    getAnnouncements: getAnnouncements,
    markRead: markRead,
    addComment: addComment
  };
})();
