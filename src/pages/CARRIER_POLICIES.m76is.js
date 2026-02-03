/**
 * CARRIER_POLICIES Page Code
 * Handles PostMessage bridge for carrier policy repository management
 */

import {
  createPolicy,
  updatePolicy,
  publishPolicyVersion,
  archivePolicy,
  uploadPolicyFile,
  getPoliciesForCarrier,
  getComplianceStatus
} from 'backend/carrierPolicyService.jsw';
import { getCarrierContextForCurrentUser } from 'backend/carrierAnnouncementsService.jsw';

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
    'carrierPoliciesReady',
    'getCarrierPolicies',
    'createPolicy',
    'updatePolicy',
    'publishPolicyVersion',
    'archivePolicy',
    'uploadPolicyFile',
    'getComplianceStatus'
  ],
  outbound: [
    'carrierPoliciesData',
    'policyActionResult',
    'policyUploadResult',
    'complianceStatusData',
    'carrierContext'
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
  console.log('CARRIER_POLICIES page ready');

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
    case 'carrierPoliciesReady':
      console.log('Carrier Policies HTML ready');
      if (carrierId) {
        sendToHtml('carrierContext', { carrierId });
      }
      break;

    case 'getCarrierPolicies':
      await handleGetCarrierPolicies(msg.data);
      break;

    case 'createPolicy':
      await handleCreatePolicy(msg.data);
      break;

    case 'updatePolicy':
      await handleUpdatePolicy(msg.data);
      break;

    case 'publishPolicyVersion':
      await handlePublishPolicyVersion(msg.data);
      break;

    case 'archivePolicy':
      await handleArchivePolicy(msg.data);
      break;

    case 'uploadPolicyFile':
      await handleUploadPolicyFile(msg.data);
      break;

    case 'getComplianceStatus':
      await handleGetComplianceStatus(msg.data);
      break;

    default:
      console.log('Unknown message type:', action);
  }
}

// ============================================================================
// HANDLERS
// ============================================================================
async function handleGetCarrierPolicies(data) {
  try {
    const cid = data?.carrierId || carrierId;
    if (!cid) {
      sendToHtml('carrierPoliciesData', { success: false, error: 'No carrier context' });
      return;
    }

    carrierId = cid;

    const options = {
      status: data?.status || 'published',
      category: data?.category || 'all',
      limit: data?.limit || 200,
      offset: data?.offset || 0
    };

    const result = await getPoliciesForCarrier(cid, options);

    sendToHtml('carrierPoliciesData', {
      success: result.success,
      policies: result.success ? result.policies : [],
      totalCount: result.totalCount || 0,
      error: result.error
    });

  } catch (error) {
    console.error('Error fetching carrier policies:', error);
    sendToHtml('carrierPoliciesData', { success: false, error: error.message });
  }
}

async function handleCreatePolicy(data) {
  try {
    if (!data) {
      sendToHtml('policyActionResult', { success: false, error: 'No data provided' });
      return;
    }

    // Use carrierId from data or global state
    const policyData = {
      ...data,
      carrier_id: data.carrier_id || carrierId
    };

    const result = await createPolicy(policyData);
    sendToHtml('policyActionResult', result);

  } catch (error) {
    console.error('Error creating policy:', error);
    sendToHtml('policyActionResult', { success: false, error: error.message });
  }
}

async function handleUpdatePolicy(data) {
  try {
    const { policyId, updates } = data || {};

    if (!policyId || !updates) {
      sendToHtml('policyActionResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await updatePolicy(policyId, updates);
    sendToHtml('policyActionResult', result);

  } catch (error) {
    console.error('Error updating policy:', error);
    sendToHtml('policyActionResult', { success: false, error: error.message });
  }
}

async function handlePublishPolicyVersion(data) {
  try {
    const { policyId, changeSummary } = data || {};

    if (!policyId) {
      sendToHtml('policyActionResult', { success: false, error: 'Missing policy ID' });
      return;
    }

    const result = await publishPolicyVersion(policyId, changeSummary || '');
    sendToHtml('policyActionResult', result);

  } catch (error) {
    console.error('Error publishing policy:', error);
    sendToHtml('policyActionResult', { success: false, error: error.message });
  }
}

async function handleArchivePolicy(data) {
  try {
    const { policyId } = data || {};

    if (!policyId) {
      sendToHtml('policyActionResult', { success: false, error: 'Missing policy ID' });
      return;
    }

    const result = await archivePolicy(policyId);
    sendToHtml('policyActionResult', result);

  } catch (error) {
    console.error('Error archiving policy:', error);
    sendToHtml('policyActionResult', { success: false, error: error.message });
  }
}

async function handleUploadPolicyFile(data) {
  try {
    const { base64Data, fileName, mimeType, carrierId: cid } = data || {};

    if (!base64Data || !fileName || !mimeType) {
      sendToHtml('policyUploadResult', { success: false, error: 'Missing required fields' });
      return;
    }

    const result = await uploadPolicyFile(base64Data, fileName, mimeType, cid || carrierId);
    sendToHtml('policyUploadResult', result);

  } catch (error) {
    console.error('Error uploading policy file:', error);
    sendToHtml('policyUploadResult', { success: false, error: error.message });
  }
}

async function handleGetComplianceStatus(data) {
  try {
    const cid = data?.carrierId || carrierId;
    if (!cid) {
      sendToHtml('complianceStatusData', { success: false, error: 'No carrier context' });
      return;
    }

    const result = await getComplianceStatus(cid);
    sendToHtml('complianceStatusData', result);

  } catch (error) {
    console.error('Error fetching compliance status:', error);
    sendToHtml('complianceStatusData', { success: false, error: error.message });
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
