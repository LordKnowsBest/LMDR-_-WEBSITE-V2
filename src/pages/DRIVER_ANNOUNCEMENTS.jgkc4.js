/**
 * DRIVER_ANNOUNCEMENTS Page Code
 * Handles PostMessage bridge for driver announcements feed
 */

import {
  getAnnouncementsForDriver,
  markAnnouncementRead,
  addComment
} from 'backend/carrierAnnouncementsService.jsw';
import wixUsers from 'wix-users';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  htmlComponentId: 'html1',
  debugMessages: true
};

// ============================================================================
// MESSAGE REGISTRY
// ============================================================================
const MESSAGE_REGISTRY = {
  inbound: [
    'driverAnnouncementsReady',
    'getDriverAnnouncements',
    'markAnnouncementRead',
    'addAnnouncementComment'
  ],
  outbound: [
    'driverAnnouncementsData',
    'announcementCommentResult',
    'driverContext'
  ]
};

// ============================================================================
// GLOBAL STATE
// ============================================================================
let driverId = null;
let carrierId = null;

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================
$w.onReady(async function () {
  console.log('DRIVER_ANNOUNCEMENTS page ready');

  const htmlComponent = getHtmlComponent();
  if (!htmlComponent) {
    console.error('HTML component not found');
    return;
  }

  // Get driver context on page load
  const user = wixUsers.currentUser;
  if (user.loggedIn) {
    driverId = user.id;
  }

  htmlComponent.onMessage((event) => {
    handleMessage(event.data);
  });
});

// ============================================================================
// HTML COMPONENT FINDER
// ============================================================================
function getHtmlComponent() {
  const possibleIds = [CONFIG.htmlComponentId, 'html1', 'html2', 'html3', 'htmlEmbed1'];
  for (const id of possibleIds) {
    try {
      const el = $w(`#${id}`);
      if (el && typeof el.onMessage === 'function') {
        CONFIG.htmlComponentId = id;
        return el;
      }
    } catch (e) { }
  }
  return null;
}

function getComponent() {
  return $w(`#${CONFIG.htmlComponentId}`);
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================
async function handleMessage(msg) {
  if (!msg || !msg.type) return;

  const action = msg.type;
  if (CONFIG.debugMessages) {
    console.log('📥 [Velo] Received:', action, msg.data || '(no data)');
  }

  switch (action) {
    case 'driverAnnouncementsReady':
      console.log('Driver Announcements HTML ready');
      if (driverId || carrierId) {
        sendToHtml('driverContext', { driverId, carrierId });
      }
      break;

    case 'getDriverAnnouncements':
      await handleGetDriverAnnouncements(msg.data);
      break;

    case 'markAnnouncementRead':
      await handleMarkAnnouncementRead(msg.data);
      break;

    case 'addAnnouncementComment':
      await handleAddAnnouncementComment(msg.data);
      break;

    default:
      console.log('Unknown message type:', action);
  }
}

// ============================================================================
// HANDLERS
// ============================================================================
async function handleGetDriverAnnouncements(data) {
  try {
    const did = data?.driverId || driverId;
    const cid = data?.carrierId || carrierId;

    if (!did || !cid) {
      sendToHtml('driverAnnouncementsData', { success: false, error: 'Missing driver or carrier context' });
      return;
    }

    // Store for later use
    driverId = did;
    carrierId = cid;

    const options = {
      limit: data?.limit || 100,
      offset: data?.offset || 0
    };

    const result = await getAnnouncementsForDriver(did, cid, options);

    sendToHtml('driverAnnouncementsData', {
      success: result.success,
      announcements: result.success ? result.announcements : [],
      error: result.error
    });

  } catch (error) {
    console.error('Error fetching driver announcements:', error);
    sendToHtml('driverAnnouncementsData', { success: false, error: error.message });
  }
}

async function handleMarkAnnouncementRead(data) {
  try {
    const { announcementId, deviceType, timeSpentSeconds } = data || {};
    const did = data?.driverId || driverId;

    if (!announcementId || !did) {
      // Silent fail for read receipts - not critical
      return;
    }

    await markAnnouncementRead(announcementId, did, deviceType || 'web', timeSpentSeconds);

  } catch (error) {
    console.error('Error marking announcement read:', error);
    // Don't send error to HTML - read receipts should fail silently
  }
}

async function handleAddAnnouncementComment(data) {
  try {
    const { announcementId, commentText } = data || {};
    const did = data?.driverId || driverId;

    if (!announcementId || !did || !commentText) {
      sendToHtml('announcementCommentResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await addComment(announcementId, did, commentText);
    sendToHtml('announcementCommentResult', result);

  } catch (error) {
    console.error('Error adding comment:', error);
    sendToHtml('announcementCommentResult', { success: false, error: error.message });
  }
}

// ============================================================================
// UTILITIES
// ============================================================================
function sendToHtml(type, data) {
  if (CONFIG.debugMessages) {
    console.log('📤 [Velo] Sending:', type, data ? Object.keys(data) : '(no data)');
  }

  try {
    const component = getComponent();
    if (component && typeof component.postMessage === 'function') {
      component.postMessage({ type, data, timestamp: Date.now() });
    }
  } catch (error) {
    console.error('Error sending to HTML:', error);
  }
}
