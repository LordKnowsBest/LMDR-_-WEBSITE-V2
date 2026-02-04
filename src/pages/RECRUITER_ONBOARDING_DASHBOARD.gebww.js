// ============================================================================
// RECRUITER ONBOARDING DASHBOARD - Page Code
// Wires the HTML component (RECRUITER_ONBOARDING_DASHBOARD.html) to backend
// onboarding workflow and document collection services.
// ============================================================================

import {
  getActiveWorkflows,
  getWorkflowStatus,
  updateWorkflowStatus,
  cancelWorkflow
} from 'backend/onboardingWorkflowService';

import {
  getDocumentStatus,
  verifyDocument as verifyDoc,
  sendDocumentReminder,
  getDocumentOcrData
} from 'backend/documentCollectionService';

import {
  getOrCreateRecruiterProfile,
  getRecruiterCarriers
} from 'backend/recruiter_service';

import wixLocation from 'wix-location';

let wixUsers;
try {
  wixUsers = require('wix-users');
} catch (e) {
  console.log('wix-users not available');
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

const DEBUG_MESSAGES = true;

// Registry mirrors the HTML component's MESSAGE_REGISTRY for validation
const MESSAGE_REGISTRY = {
  inbound: [
    'onboardingDashboardReady',
    'getWorkflows',
    'verifyDocument',
    'rejectDocument',
    'sendReminder',
    'getDocumentDetails',
    'cancelWorkflow',
    'putOnHold',
    'resumeWorkflow',
    'markStarted',
    'navigateTo'
  ],
  outbound: [
    'initOnboardingDashboard',
    'workflowList',
    'documentDetails',
    'actionResult',
    'workflowUpdate'
  ]
};

// ============================================================================
// STATE
// ============================================================================

let cachedRecruiterProfile = null;
let cachedCarriers = [];
let recruiterId = null;

// ============================================================================
// MESSAGE HELPERS
// ============================================================================

function validateInboundMessage(action) {
  if (!MESSAGE_REGISTRY.inbound.includes(action)) {
    console.warn(`UNREGISTERED INBOUND MESSAGE: "${action}" - Add to MESSAGE_REGISTRY.inbound`);
    return false;
  }
  return true;
}

function logMessageFlow(direction, type, data) {
  if (!DEBUG_MESSAGES) return;
  const label = direction === 'in' ? 'HTML->Velo' : 'Velo->HTML';
  console.log(`[${label}] ${type}`, data ? Object.keys(data) : '(no data)');
}

function sendToHtml(component, type, data) {
  if (!MESSAGE_REGISTRY.outbound.includes(type)) {
    console.warn(`UNREGISTERED OUTBOUND MESSAGE: "${type}" - Add to MESSAGE_REGISTRY.outbound`);
  }
  logMessageFlow('out', type, data);
  try {
    component.postMessage({ type, data, timestamp: Date.now() });
  } catch (err) {
    console.error('sendToHtml error:', err);
  }
}

// ============================================================================
// HTML COMPONENT DISCOVERY (safety-checked)
// ============================================================================

function getHtmlComponents() {
  const found = [];
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        found.push(component);
      }
    } catch (error) {
      // Element not on page - skip
    }
  }
  return found;
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
  console.log('Recruiter Onboarding Dashboard Ready');

  const components = getHtmlComponents();

  if (!components.length) {
    console.warn('No HTML component found for Onboarding Dashboard page');
    return;
  }

  for (const component of components) {
    component.onMessage(async (event) => {
      await routeMessage(component, event?.data);
    });
  }
});

// ============================================================================
// MESSAGE ROUTER
// ============================================================================

async function routeMessage(component, message) {
  if (!message || !message.type) return;

  const action = message.type;
  validateInboundMessage(action);
  logMessageFlow('in', action, message.data);

  try {
    switch (action) {
      case 'onboardingDashboardReady':
        await handleDashboardReady(component);
        break;

      case 'getWorkflows':
        await handleGetWorkflows(message.data, component);
        break;

      case 'getDocumentDetails':
        await handleGetDocumentDetails(message.data, component);
        break;

      case 'verifyDocument':
        await handleVerifyDocument(message.data, component);
        break;

      case 'rejectDocument':
        await handleRejectDocument(message.data, component);
        break;

      case 'sendReminder':
        await handleSendReminder(message.data, component);
        break;

      case 'cancelWorkflow':
        await handleCancelWorkflow(message.data, component);
        break;

      case 'putOnHold':
        await handlePutOnHold(message.data, component);
        break;

      case 'resumeWorkflow':
        await handleResumeWorkflow(message.data, component);
        break;

      case 'markStarted':
        await handleMarkStarted(message.data, component);
        break;

      case 'navigateTo':
        handleNavigateTo(message.data);
        break;

      default:
        console.warn('Unhandled action:', action);
    }
  } catch (error) {
    console.error('Error handling message:', action, error);
    sendToHtml(component, 'actionResult', {
      action,
      success: false,
      error: error.message || 'Unknown error'
    });
  }
}

// ============================================================================
// HANDLER: Dashboard Ready (Auth + Init)
// ============================================================================

async function handleDashboardReady(component) {
  console.log('Onboarding Dashboard ready, checking auth...');

  // Check authentication
  if (!wixUsers || !wixUsers.currentUser.loggedIn) {
    console.log('User not logged in, redirecting...');
    wixLocation.to('/account/my-account');
    return;
  }

  // Get recruiter profile
  const profileResult = await getOrCreateRecruiterProfile();
  if (!profileResult.success) {
    console.error('Failed to get recruiter profile:', profileResult.error);
    sendToHtml(component, 'actionResult', {
      action: 'init',
      success: false,
      error: profileResult.error || 'Failed to load recruiter profile'
    });
    return;
  }

  cachedRecruiterProfile = profileResult.profile;
  cachedCarriers = profileResult.carriers || [];
  recruiterId = wixUsers.currentUser.id;

  // Build carrier list for the filter dropdown
  const carrierList = cachedCarriers.map(c => ({
    id: c.carrier_dot || c._id || c.id,
    name: c.carrier_name || c.legal_name || c.title || 'Unknown Carrier'
  }));

  // Send init data to HTML
  sendToHtml(component, 'initOnboardingDashboard', {
    recruiterId,
    carriers: carrierList
  });
}

// ============================================================================
// HANDLER: Get Workflows
// ============================================================================

async function handleGetWorkflows(data, component) {
  const effectiveRecruiterId = data?.recruiterId || recruiterId;

  if (!effectiveRecruiterId) {
    sendToHtml(component, 'workflowList', { workflows: [] });
    return;
  }

  try {
    const result = await getActiveWorkflows({
      recruiterId: effectiveRecruiterId,
      includeCompleted: false
    });

    if (!result.success) {
      sendToHtml(component, 'workflowList', { workflows: [] });
      return;
    }

    // Transform workflows to the shape the HTML component expects
    const workflows = (result.workflows || []).map(transformWorkflowForHtml);

    sendToHtml(component, 'workflowList', { workflows });
  } catch (error) {
    console.error('handleGetWorkflows error:', error);
    sendToHtml(component, 'workflowList', { workflows: [] });
  }
}

/**
 * Transform a backend workflow record to the shape the HTML component expects.
 * The HTML renders: id, driverName, driverEmail, carrierId, carrierName,
 * status, documentsStatus, documentsProgress, backgroundStatus, drugTestStatus,
 * orientationStatus, createdDate, startDate, documents[], backgroundCheck, drugTest,
 * complianceIssues[]
 */
function transformWorkflowForHtml(workflow) {
  const wfId = workflow._id || workflow.id;

  // Parse compliance issues
  let complianceIssues = [];
  if (Array.isArray(workflow.compliance_issues)) {
    complianceIssues = workflow.compliance_issues;
  } else if (typeof workflow.compliance_issues === 'string') {
    try {
      complianceIssues = JSON.parse(workflow.compliance_issues);
    } catch (e) {
      // Not parseable
    }
  }

  // Build documents array from workflow data if available
  const documents = (workflow.documents || []).map(doc => ({
    id: doc._id || doc.id,
    documentType: doc.document_type || doc.documentType,
    displayName: doc.display_name || doc.displayName || doc.document_type || 'Document',
    status: doc.status || 'requested',
    rejectionReason: doc.rejection_reason || doc.rejectionReason || null
  }));

  // Build background check object
  let backgroundCheck = null;
  if (workflow.background_status && workflow.background_status !== 'not_started') {
    backgroundCheck = {
      provider: workflow.background_provider || workflow.metadata?.background_provider || null,
      status: workflow.background_status,
      orderedDate: workflow.background_ordered_date || null,
      estimatedCompletion: workflow.background_estimated_completion || null,
      completedDate: workflow.background_completed_date || null
    };
  }

  // Build drug test object
  let drugTest = null;
  if (workflow.drug_test_status && workflow.drug_test_status !== 'not_started') {
    drugTest = {
      status: workflow.drug_test_status,
      appointmentDate: workflow.drug_test_appointment_date || null,
      completedDate: workflow.drug_test_completed_date || null,
      collectionSite: workflow.drug_test_collection_site || null
    };
  }

  // Count document progress
  const totalDocs = documents.length;
  const verifiedDocs = documents.filter(d => d.status === 'verified').length;
  const documentsProgress = totalDocs > 0 ? `${verifiedDocs}/${totalDocs}` : '';

  return {
    id: wfId,
    driverName: workflow.driverName || workflow.metadata?.driver_name || 'Unknown Driver',
    driverEmail: workflow.driver_email || workflow.metadata?.driver_email || '',
    carrierId: workflow.carrier_id,
    carrierName: workflow.carrierName || workflow.metadata?.carrier_name || 'Unknown Carrier',
    status: workflow.status,
    documentsStatus: workflow.documents_status || 'pending',
    documentsProgress,
    backgroundStatus: workflow.background_status || 'not_started',
    drugTestStatus: workflow.drug_test_status || 'not_started',
    orientationStatus: workflow.orientation_status || 'not_started',
    createdDate: workflow._createdDate || workflow.created_date,
    startDate: workflow.start_date || null,
    documents,
    backgroundCheck,
    drugTest,
    complianceIssues
  };
}

// ============================================================================
// HANDLER: Get Document Details (for modal)
// ============================================================================

async function handleGetDocumentDetails(data, component) {
  const { workflowId, documentId } = data || {};

  if (!workflowId || !documentId) {
    sendToHtml(component, 'documentDetails', {
      displayName: 'Unknown',
      error: 'Missing workflowId or documentId'
    });
    return;
  }

  try {
    // Get document status for the workflow
    const docStatusResult = await getDocumentStatus(workflowId);
    let docRecord = null;

    if (docStatusResult.success && docStatusResult.documents) {
      docRecord = docStatusResult.documents.find(
        d => (d._id || d.id) === documentId
      );
    }

    // Try to get OCR data
    let ocrData = {};
    try {
      const ocrResult = await getDocumentOcrData(documentId);
      if (ocrResult.success && ocrResult.ocrData) {
        ocrData = ocrResult.ocrData;
      }
    } catch (ocrErr) {
      // OCR data may not be available - that's OK
    }

    sendToHtml(component, 'documentDetails', {
      displayName: docRecord?.display_name || docRecord?.document_type || 'Document',
      fileUrl: docRecord?.file_url || docRecord?.upload_url || null,
      fileName: docRecord?.file_name || docRecord?.original_filename || 'document.pdf',
      submittedDate: docRecord?.submitted_date || docRecord?.uploaded_date || null,
      ocrData
    });
  } catch (error) {
    console.error('handleGetDocumentDetails error:', error);
    sendToHtml(component, 'documentDetails', {
      displayName: 'Error',
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Verify Document
// ============================================================================

async function handleVerifyDocument(data, component) {
  const { workflowId, documentId } = data || {};

  if (!documentId) {
    sendToHtml(component, 'actionResult', {
      action: 'verifyDocument',
      success: false,
      error: 'Document ID is required'
    });
    return;
  }

  try {
    const verifierId = recruiterId || wixUsers?.currentUser?.id;
    const result = await verifyDoc(documentId, verifierId, 'verified');

    sendToHtml(component, 'actionResult', {
      action: 'verifyDocument',
      success: result.success,
      workflowId,
      documentId,
      error: result.error
    });
  } catch (error) {
    console.error('handleVerifyDocument error:', error);
    sendToHtml(component, 'actionResult', {
      action: 'verifyDocument',
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Reject Document
// ============================================================================

async function handleRejectDocument(data, component) {
  const { workflowId, documentId, rejectionReason } = data || {};

  if (!documentId) {
    sendToHtml(component, 'actionResult', {
      action: 'rejectDocument',
      success: false,
      error: 'Document ID is required'
    });
    return;
  }

  if (!rejectionReason) {
    sendToHtml(component, 'actionResult', {
      action: 'rejectDocument',
      success: false,
      error: 'Rejection reason is required'
    });
    return;
  }

  try {
    const verifierId = recruiterId || wixUsers?.currentUser?.id;
    const result = await verifyDoc(documentId, verifierId, 'rejected', rejectionReason);

    sendToHtml(component, 'actionResult', {
      action: 'rejectDocument',
      success: result.success,
      workflowId,
      documentId,
      error: result.error
    });
  } catch (error) {
    console.error('handleRejectDocument error:', error);
    sendToHtml(component, 'actionResult', {
      action: 'rejectDocument',
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Send Reminder
// ============================================================================

async function handleSendReminder(data, component) {
  const { workflowId, methods, customMessage } = data || {};

  if (!workflowId) {
    sendToHtml(component, 'actionResult', {
      action: 'sendReminder',
      success: false,
      error: 'Workflow ID is required'
    });
    return;
  }

  try {
    // Get pending/requested documents for this workflow
    const docStatusResult = await getDocumentStatus(workflowId);

    if (!docStatusResult.success) {
      sendToHtml(component, 'actionResult', {
        action: 'sendReminder',
        success: false,
        error: docStatusResult.error || 'Failed to get document status'
      });
      return;
    }

    // Find documents that need reminders (requested or rejected)
    const pendingDocs = (docStatusResult.documents || []).filter(
      d => d.status === 'requested' || d.status === 'rejected'
    );

    if (pendingDocs.length === 0) {
      sendToHtml(component, 'actionResult', {
        action: 'sendReminder',
        success: true,
        workflowId,
        error: null
      });
      return;
    }

    // Send reminders for each pending document
    let sentCount = 0;
    let errors = [];

    for (const doc of pendingDocs) {
      try {
        const docId = doc._id || doc.id;
        const result = await sendDocumentReminder(docId);
        if (result.success) {
          sentCount++;
        } else {
          errors.push(result.error);
        }
      } catch (err) {
        errors.push(err.message);
      }
    }

    sendToHtml(component, 'actionResult', {
      action: 'sendReminder',
      success: sentCount > 0,
      workflowId,
      remindersSent: sentCount,
      error: errors.length > 0 ? errors.join('; ') : null
    });
  } catch (error) {
    console.error('handleSendReminder error:', error);
    sendToHtml(component, 'actionResult', {
      action: 'sendReminder',
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Cancel Workflow
// ============================================================================

async function handleCancelWorkflow(data, component) {
  const { workflowId } = data || {};

  if (!workflowId) {
    sendToHtml(component, 'actionResult', {
      action: 'cancelWorkflow',
      success: false,
      error: 'Workflow ID is required'
    });
    return;
  }

  try {
    const result = await cancelWorkflow(workflowId, 'Cancelled by recruiter');

    sendToHtml(component, 'actionResult', {
      action: 'cancelWorkflow',
      success: result.success,
      workflowId,
      error: result.error?.message || result.error
    });
  } catch (error) {
    console.error('handleCancelWorkflow error:', error);
    sendToHtml(component, 'actionResult', {
      action: 'cancelWorkflow',
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Put On Hold
// ============================================================================

async function handlePutOnHold(data, component) {
  const { workflowId } = data || {};

  if (!workflowId) {
    sendToHtml(component, 'actionResult', {
      action: 'putOnHold',
      success: false,
      error: 'Workflow ID is required'
    });
    return;
  }

  try {
    const result = await updateWorkflowStatus(workflowId, 'on_hold', {
      note: 'Put on hold by recruiter'
    });

    sendToHtml(component, 'actionResult', {
      action: 'putOnHold',
      success: result.success,
      workflowId,
      error: result.error?.message || result.error
    });
  } catch (error) {
    console.error('handlePutOnHold error:', error);
    sendToHtml(component, 'actionResult', {
      action: 'putOnHold',
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Resume Workflow
// ============================================================================

async function handleResumeWorkflow(data, component) {
  const { workflowId } = data || {};

  if (!workflowId) {
    sendToHtml(component, 'actionResult', {
      action: 'resumeWorkflow',
      success: false,
      error: 'Workflow ID is required'
    });
    return;
  }

  try {
    // Resume to in_progress state
    const result = await updateWorkflowStatus(workflowId, 'in_progress', {
      note: 'Resumed by recruiter'
    });

    sendToHtml(component, 'actionResult', {
      action: 'resumeWorkflow',
      success: result.success,
      workflowId,
      error: result.error?.message || result.error
    });
  } catch (error) {
    console.error('handleResumeWorkflow error:', error);
    sendToHtml(component, 'actionResult', {
      action: 'resumeWorkflow',
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Mark Started
// ============================================================================

async function handleMarkStarted(data, component) {
  const { workflowId } = data || {};

  if (!workflowId) {
    sendToHtml(component, 'actionResult', {
      action: 'markStarted',
      success: false,
      error: 'Workflow ID is required'
    });
    return;
  }

  try {
    const result = await updateWorkflowStatus(workflowId, 'in_progress', {
      note: 'Started by recruiter',
      startDate: new Date().toISOString()
    });

    sendToHtml(component, 'actionResult', {
      action: 'markStarted',
      success: result.success,
      workflowId,
      error: result.error?.message || result.error
    });
  } catch (error) {
    console.error('handleMarkStarted error:', error);
    sendToHtml(component, 'actionResult', {
      action: 'markStarted',
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Navigate To
// ============================================================================

function handleNavigateTo(data) {
  if (!data || !data.page) return;

  console.log('Navigating to:', data.page);

  const pageRoutes = {
    'dashboard': '/recruiter-console',
    'messaging': '/recruiter-console',
    'new-onboarding': '/recruiter-console',
    'pipeline': '/recruiter-console',
    'settings': '/account/my-account',
    'onboarding': '/recruiter-onboarding-dashboard'
  };

  const route = pageRoutes[data.page] || `/${data.page}`;
  wixLocation.to(route);
}
