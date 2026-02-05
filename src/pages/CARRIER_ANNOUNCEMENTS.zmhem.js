/**
 * CARRIER_ANNOUNCEMENTS Page Code
 * Handles PostMessage bridge for carrier announcements management
 */

import {
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  scheduleAnnouncement,
  archiveAnnouncement,
  previewRecipients,
  uploadAttachment,
  getAnnouncementsForCarrier,
  getCarrierContextForCurrentUser,
  getAnnouncementDetail,
  sendReminderToUnreadDrivers,
  setCommentVisibility
} from 'backend/carrierAnnouncementsService.jsw';

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
    'carrierAnnouncementsReady',
    'getCarrierAnnouncements',
    'createAnnouncement',
    'updateAnnouncement',
    'publishAnnouncement',
    'scheduleAnnouncement',
    'archiveAnnouncement',
    'previewRecipients',
    'uploadAnnouncementAttachment',
    'getAnnouncementDetail',
    'sendAnnouncementReminder',
    'setAnnouncementCommentVisibility'
  ],
  outbound: [
    'carrierAnnouncementsData',
    'announcementActionResult',
    'recipientPreviewResult',
    'announcementAttachmentResult',
    'carrierContext',
    'announcementDetailData',
    'announcementReminderResult',
    'announcementCommentModerationResult'
  ]
};

// ============================================================================
// GLOBAL STATE
// ============================================================================
let carrierId = null;

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================
$w.onReady(async function () {
  console.log('CARRIER_ANNOUNCEMENTS page ready');

  const htmlComponent = getHtmlComponent();
  if (!htmlComponent) {
    console.error('HTML component not found');
    return;
  }

  // Get carrier context on page load
  const ctx = await getCarrierContextForCurrentUser();
  if (ctx.success) {
    carrierId = ctx.carrierId;
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
    case 'carrierAnnouncementsReady':
      console.log('Carrier Announcements HTML ready');
      if (carrierId) {
        sendToHtml('carrierContext', { carrierId });
      }
      break;

    case 'getCarrierAnnouncements':
      await handleGetCarrierAnnouncements(msg.data);
      break;

    case 'createAnnouncement':
      await handleCreateAnnouncement(msg.data);
      break;

    case 'updateAnnouncement':
      await handleUpdateAnnouncement(msg.data);
      break;

    case 'publishAnnouncement':
      await handlePublishAnnouncement(msg.data);
      break;

    case 'scheduleAnnouncement':
      await handleScheduleAnnouncement(msg.data);
      break;

    case 'archiveAnnouncement':
      await handleArchiveAnnouncement(msg.data);
      break;

    case 'previewRecipients':
      await handlePreviewRecipients(msg.data);
      break;

    case 'uploadAnnouncementAttachment':
      await handleUploadAttachment(msg.data);
      break;

    case 'getAnnouncementDetail':
      await handleGetAnnouncementDetail(msg.data);
      break;

    case 'sendAnnouncementReminder':
      await handleSendAnnouncementReminder(msg.data);
      break;

    case 'setAnnouncementCommentVisibility':
      await handleSetCommentVisibility(msg.data);
      break;

    default:
      console.log('Unknown message type:', action);
  }
}

// ============================================================================
// HANDLERS
// ============================================================================
async function handleGetCarrierAnnouncements(data) {
  try {
    const cid = data?.carrierId || carrierId;
    if (!cid) {
      sendToHtml('carrierAnnouncementsData', { success: false, error: 'No carrier context' });
      return;
    }

    carrierId = cid;

    const options = {
      status: data?.status || 'published',
      limit: data?.limit || 100,
      offset: data?.offset || 0
    };

    const result = await getAnnouncementsForCarrier(cid, options);

    sendToHtml('carrierAnnouncementsData', {
      success: result.success,
      announcements: result.success ? result.announcements : [],
      totalCount: result.totalCount || 0,
      error: result.error
    });

  } catch (error) {
    console.error('Error fetching carrier announcements:', error);
    sendToHtml('carrierAnnouncementsData', { success: false, error: error.message });
  }
}

async function handleCreateAnnouncement(data) {
  try {
    if (!data) {
      sendToHtml('announcementActionResult', { success: false, error: 'No data provided' });
      return;
    }

    // Use carrierId from data or global state
    const announcementData = {
      ...data,
      carrier_id: data.carrier_id || carrierId
    };

    const result = await createAnnouncement(announcementData);
    sendToHtml('announcementActionResult', result);

  } catch (error) {
    console.error('Error creating announcement:', error);
    sendToHtml('announcementActionResult', { success: false, error: error.message });
  }
}

async function handleUpdateAnnouncement(data) {
  try {
    const { announcementId, updates } = data || {};

    if (!announcementId || !updates) {
      sendToHtml('announcementActionResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await updateAnnouncement(announcementId, updates);
    sendToHtml('announcementActionResult', result);

  } catch (error) {
    console.error('Error updating announcement:', error);
    sendToHtml('announcementActionResult', { success: false, error: error.message });
  }
}

async function handlePublishAnnouncement(data) {
  try {
    const { announcementId } = data || {};

    if (!announcementId) {
      sendToHtml('announcementActionResult', { success: false, error: 'Missing announcement ID' });
      return;
    }

    const result = await publishAnnouncement(announcementId);
    sendToHtml('announcementActionResult', result);

  } catch (error) {
    console.error('Error publishing announcement:', error);
    sendToHtml('announcementActionResult', { success: false, error: error.message });
  }
}

async function handleScheduleAnnouncement(data) {
  try {
    const { announcementId, scheduledAt } = data || {};

    if (!announcementId || !scheduledAt) {
      sendToHtml('announcementActionResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await scheduleAnnouncement(announcementId, scheduledAt);
    sendToHtml('announcementActionResult', result);

  } catch (error) {
    console.error('Error scheduling announcement:', error);
    sendToHtml('announcementActionResult', { success: false, error: error.message });
  }
}

async function handleArchiveAnnouncement(data) {
  try {
    const { announcementId } = data || {};

    if (!announcementId) {
      sendToHtml('announcementActionResult', { success: false, error: 'Missing announcement ID' });
      return;
    }

    const result = await archiveAnnouncement(announcementId);
    sendToHtml('announcementActionResult', result);

  } catch (error) {
    console.error('Error archiving announcement:', error);
    sendToHtml('announcementActionResult', { success: false, error: error.message });
  }
}

async function handlePreviewRecipients(data) {
  try {
    const cid = data?.carrierId || carrierId;
    const targetAudience = data?.targetAudience || { type: 'all', segments: [] };

    if (!cid) {
      sendToHtml('recipientPreviewResult', { success: false, error: 'No carrier context' });
      return;
    }

    const result = await previewRecipients(cid, targetAudience);
    sendToHtml('recipientPreviewResult', result);

  } catch (error) {
    console.error('Error previewing recipients:', error);
    sendToHtml('recipientPreviewResult', { success: false, error: error.message });
  }
}

async function handleUploadAttachment(data) {
  try {
    const { base64Data, fileName, mimeType, carrierId: cid } = data || {};

    if (!base64Data || !fileName || !mimeType) {
      sendToHtml('announcementAttachmentResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await uploadAttachment(base64Data, fileName, mimeType, cid || carrierId);
    sendToHtml('announcementAttachmentResult', result);

  } catch (error) {
    console.error('Error uploading attachment:', error);
    sendToHtml('announcementAttachmentResult', { success: false, error: error.message });
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


async function handleGetAnnouncementDetail(data) {
  try {
    const announcementId = data?.announcementId;
    const cid = data?.carrierId || carrierId;
    if (!announcementId || !cid) {
      sendToHtml('announcementDetailData', { success: false, error: 'Missing announcementId or carrierId' });
      return;
    }

    const result = await getAnnouncementDetail(announcementId, cid, {
      limit: data?.limit || 50,
      offset: data?.offset || 0,
      includeHiddenComments: !!data?.includeHiddenComments
    });

    sendToHtml('announcementDetailData', result);
  } catch (error) {
    console.error('Error fetching announcement detail:', error);
    sendToHtml('announcementDetailData', { success: false, error: error.message });
  }
}

async function handleSendAnnouncementReminder(data) {
  try {
    const announcementId = data?.announcementId;
    const cid = data?.carrierId || carrierId;
    if (!announcementId || !cid) {
      sendToHtml('announcementReminderResult', { success: false, error: 'Missing announcementId or carrierId' });
      return;
    }

    const result = await sendReminderToUnreadDrivers(announcementId, cid);
    sendToHtml('announcementReminderResult', result);
  } catch (error) {
    console.error('Error sending reminder:', error);
    sendToHtml('announcementReminderResult', { success: false, error: error.message });
  }
}

async function handleSetCommentVisibility(data) {
  try {
    const commentId = data?.commentId;
    const hidden = !!data?.hidden;
    if (!commentId) {
      sendToHtml('announcementCommentModerationResult', { success: false, error: 'Missing commentId' });
      return;
    }

    const result = await setCommentVisibility(commentId, hidden);
    sendToHtml('announcementCommentModerationResult', result);
  } catch (error) {
    console.error('Error moderating comment:', error);
    sendToHtml('announcementCommentModerationResult', { success: false, error: error.message });
  }
}

