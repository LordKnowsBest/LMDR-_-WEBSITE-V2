/* eslint-disable */
/**
 * Recruiter Onboarding Dashboard Page Code Tests
 *
 * Tests the Velo page-code logic for RECRUITER_ONBOARDING_DASHBOARD.gebww.js.
 * Covers: HTML component discovery safety, message routing, carrier identity
 * resolution, workflow data transformation, and error handling.
 */

/* eslint-env jest */

// =============================================================================
// MOCKS
// =============================================================================

const mockPostMessage = jest.fn();
const mockOnMessage = jest.fn();

function createMockComponent(id) {
  return {
    _id: id,
    onMessage: mockOnMessage,
    postMessage: mockPostMessage
  };
}

const mockWixUsers = {
  currentUser: {
    loggedIn: true,
    id: 'recruiter-abc-123'
  }
};

const mockWixLocation = {
  to: jest.fn()
};

const mockBackend = {
  getActiveWorkflows: jest.fn(),
  getWorkflowStatus: jest.fn(),
  updateWorkflowStatus: jest.fn(),
  cancelWorkflow: jest.fn(),
  getDocumentStatus: jest.fn(),
  verifyDocument: jest.fn(),
  sendDocumentReminder: jest.fn(),
  getDocumentOcrData: jest.fn(),
  getOrCreateRecruiterProfile: jest.fn(),
  getRecruiterCarriers: jest.fn()
};

// =============================================================================
// REPLICATED LOGIC: HTML Component Discovery
// =============================================================================

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

/**
 * Simulates getHtmlComponents() from the page code.
 * Each element in mockElements should be { id, component } or null for missing.
 */
function simulateGetHtmlComponents(mockElements) {
  const found = [];
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const entry = mockElements[id];
      if (entry && typeof entry.onMessage === 'function') {
        found.push(entry);
      }
    } catch (error) {
      // Element not on page - skip
    }
  }
  return found;
}

// =============================================================================
// REPLICATED LOGIC: Message Validation
// =============================================================================

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

function validateInboundMessage(action) {
  return MESSAGE_REGISTRY.inbound.includes(action);
}

// =============================================================================
// REPLICATED LOGIC: Workflow Data Transformation
// =============================================================================

function transformWorkflowForHtml(workflow) {
  const wfId = workflow._id || workflow.id;

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

  const documents = (workflow.documents || []).map(doc => ({
    id: doc._id || doc.id,
    documentType: doc.document_type || doc.documentType,
    displayName: doc.display_name || doc.displayName || doc.document_type || 'Document',
    status: doc.status || 'requested',
    rejectionReason: doc.rejection_reason || doc.rejectionReason || null
  }));

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

  let drugTest = null;
  if (workflow.drug_test_status && workflow.drug_test_status !== 'not_started') {
    drugTest = {
      status: workflow.drug_test_status,
      appointmentDate: workflow.drug_test_appointment_date || null,
      completedDate: workflow.drug_test_completed_date || null,
      collectionSite: workflow.drug_test_collection_site || null
    };
  }

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

// =============================================================================
// REPLICATED LOGIC: Message Router
// =============================================================================

let cachedRecruiterProfile = null;
let cachedCarriers = [];
let recruiterId = null;

function resetState() {
  cachedRecruiterProfile = null;
  cachedCarriers = [];
  recruiterId = null;
}

function sendToHtml(component, type, data) {
  try {
    component.postMessage({ type, data, timestamp: Date.now() });
  } catch (err) {
    // swallow
  }
}

async function routeMessage(component, message, services = mockBackend, users = mockWixUsers, location = mockWixLocation) {
  if (!message || !message.type) return 'no-op';

  const action = message.type;
  validateInboundMessage(action);

  try {
    switch (action) {
      case 'onboardingDashboardReady':
        await handleDashboardReady(component, services, users, location);
        return 'dashboardReady';

      case 'getWorkflows':
        await handleGetWorkflows(message.data, component, services);
        return 'getWorkflows';

      case 'getDocumentDetails':
        await handleGetDocumentDetails(message.data, component, services);
        return 'getDocumentDetails';

      case 'verifyDocument':
        await handleVerifyDocument(message.data, component, services, users);
        return 'verifyDocument';

      case 'rejectDocument':
        await handleRejectDocument(message.data, component, services, users);
        return 'rejectDocument';

      case 'sendReminder':
        await handleSendReminder(message.data, component, services);
        return 'sendReminder';

      case 'cancelWorkflow':
        await handleCancelWorkflow(message.data, component, services);
        return 'cancelWorkflow';

      case 'putOnHold':
        await handlePutOnHold(message.data, component, services);
        return 'putOnHold';

      case 'resumeWorkflow':
        await handleResumeWorkflow(message.data, component, services);
        return 'resumeWorkflow';

      case 'navigateTo':
        handleNavigateTo(message.data, location);
        return 'navigateTo';

      default:
        return 'unhandled';
    }
  } catch (error) {
    sendToHtml(component, 'actionResult', {
      action,
      success: false,
      error: error.message || 'Unknown error'
    });
    return 'error';
  }
}

// --- Handler replicas ---

async function handleDashboardReady(component, services, users, location) {
  if (!users || !users.currentUser.loggedIn) {
    location.to('/account/my-account');
    return;
  }

  const profileResult = await services.getOrCreateRecruiterProfile();
  if (!profileResult.success) {
    sendToHtml(component, 'actionResult', {
      action: 'init',
      success: false,
      error: profileResult.error || 'Failed to load recruiter profile'
    });
    return;
  }

  cachedRecruiterProfile = profileResult.profile;
  cachedCarriers = profileResult.carriers || [];
  recruiterId = users.currentUser.id;

  const carrierList = cachedCarriers.map(c => ({
    id: c.carrier_dot || c._id || c.id,
    name: c.carrier_name || c.legal_name || c.title || 'Unknown Carrier'
  }));

  sendToHtml(component, 'initOnboardingDashboard', {
    recruiterId,
    carriers: carrierList
  });
}

async function handleGetWorkflows(data, component, services) {
  const effectiveRecruiterId = data?.recruiterId || recruiterId;

  if (!effectiveRecruiterId) {
    sendToHtml(component, 'workflowList', { workflows: [] });
    return;
  }

  try {
    const result = await services.getActiveWorkflows({
      recruiterId: effectiveRecruiterId,
      includeCompleted: false
    });

    if (!result.success) {
      sendToHtml(component, 'workflowList', { workflows: [] });
      return;
    }

    const workflows = (result.workflows || []).map(transformWorkflowForHtml);
    sendToHtml(component, 'workflowList', { workflows });
  } catch (error) {
    sendToHtml(component, 'workflowList', { workflows: [] });
  }
}

async function handleGetDocumentDetails(data, component, services) {
  const { workflowId, documentId } = data || {};

  if (!workflowId || !documentId) {
    sendToHtml(component, 'documentDetails', {
      displayName: 'Unknown',
      error: 'Missing workflowId or documentId'
    });
    return;
  }

  try {
    const docStatusResult = await services.getDocumentStatus(workflowId);
    let docRecord = null;

    if (docStatusResult.success && docStatusResult.documents) {
      docRecord = docStatusResult.documents.find(
        d => (d._id || d.id) === documentId
      );
    }

    let ocrData = {};
    try {
      const ocrResult = await services.getDocumentOcrData(documentId);
      if (ocrResult.success && ocrResult.ocrData) {
        ocrData = ocrResult.ocrData;
      }
    } catch (ocrErr) {
      // OCR not available
    }

    sendToHtml(component, 'documentDetails', {
      displayName: docRecord?.display_name || docRecord?.document_type || 'Document',
      fileUrl: docRecord?.file_url || docRecord?.upload_url || null,
      fileName: docRecord?.file_name || docRecord?.original_filename || 'document.pdf',
      submittedDate: docRecord?.submitted_date || docRecord?.uploaded_date || null,
      ocrData
    });
  } catch (error) {
    sendToHtml(component, 'documentDetails', {
      displayName: 'Error',
      error: error.message
    });
  }
}

async function handleVerifyDocument(data, component, services, users) {
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
    const verifierId = recruiterId || users?.currentUser?.id;
    const result = await services.verifyDocument(documentId, verifierId, 'verified');

    sendToHtml(component, 'actionResult', {
      action: 'verifyDocument',
      success: result.success,
      workflowId,
      documentId,
      error: result.error
    });
  } catch (error) {
    sendToHtml(component, 'actionResult', {
      action: 'verifyDocument',
      success: false,
      error: error.message
    });
  }
}

async function handleRejectDocument(data, component, services, users) {
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
    const verifierId = recruiterId || users?.currentUser?.id;
    const result = await services.verifyDocument(documentId, verifierId, 'rejected', rejectionReason);

    sendToHtml(component, 'actionResult', {
      action: 'rejectDocument',
      success: result.success,
      workflowId,
      documentId,
      error: result.error
    });
  } catch (error) {
    sendToHtml(component, 'actionResult', {
      action: 'rejectDocument',
      success: false,
      error: error.message
    });
  }
}

async function handleSendReminder(data, component, services) {
  const { workflowId } = data || {};

  if (!workflowId) {
    sendToHtml(component, 'actionResult', {
      action: 'sendReminder',
      success: false,
      error: 'Workflow ID is required'
    });
    return;
  }

  try {
    const docStatusResult = await services.getDocumentStatus(workflowId);

    if (!docStatusResult.success) {
      sendToHtml(component, 'actionResult', {
        action: 'sendReminder',
        success: false,
        error: docStatusResult.error || 'Failed to get document status'
      });
      return;
    }

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

    let sentCount = 0;
    let errors = [];

    for (const doc of pendingDocs) {
      try {
        const docId = doc._id || doc.id;
        const result = await services.sendDocumentReminder(docId);
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
    sendToHtml(component, 'actionResult', {
      action: 'sendReminder',
      success: false,
      error: error.message
    });
  }
}

async function handleCancelWorkflow(data, component, services) {
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
    const result = await services.cancelWorkflow(workflowId, 'Cancelled by recruiter');

    sendToHtml(component, 'actionResult', {
      action: 'cancelWorkflow',
      success: result.success,
      workflowId,
      error: result.error?.message || result.error
    });
  } catch (error) {
    sendToHtml(component, 'actionResult', {
      action: 'cancelWorkflow',
      success: false,
      error: error.message
    });
  }
}

async function handlePutOnHold(data, component, services) {
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
    const result = await services.updateWorkflowStatus(workflowId, 'on_hold', {
      note: 'Put on hold by recruiter'
    });

    sendToHtml(component, 'actionResult', {
      action: 'putOnHold',
      success: result.success,
      workflowId,
      error: result.error?.message || result.error
    });
  } catch (error) {
    sendToHtml(component, 'actionResult', {
      action: 'putOnHold',
      success: false,
      error: error.message
    });
  }
}

async function handleResumeWorkflow(data, component, services) {
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
    const result = await services.updateWorkflowStatus(workflowId, 'in_progress', {
      note: 'Resumed by recruiter'
    });

    sendToHtml(component, 'actionResult', {
      action: 'resumeWorkflow',
      success: result.success,
      workflowId,
      error: result.error?.message || result.error
    });
  } catch (error) {
    sendToHtml(component, 'actionResult', {
      action: 'resumeWorkflow',
      success: false,
      error: error.message
    });
  }
}

function handleNavigateTo(data, location) {
  if (!data || !data.page) return;

  const pageRoutes = {
    'dashboard': '/recruiter-console',
    'messaging': '/recruiter-console',
    'new-onboarding': '/recruiter-console',
    'pipeline': '/recruiter-console',
    'settings': '/account/my-account',
    'onboarding': '/recruiter-onboarding-dashboard'
  };

  const route = pageRoutes[data.page] || `/${data.page}`;
  location.to(route);
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Recruiter Onboarding Dashboard Page Code', () => {
  let component;

  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    component = createMockComponent('html1');

    // Default successful backend responses
    mockBackend.getOrCreateRecruiterProfile.mockResolvedValue({
      success: true,
      profile: { _id: 'profile-1', name: 'Test Recruiter' },
      carriers: [
        { carrier_dot: 'DOT-111', carrier_name: 'Acme Trucking' },
        { _id: 'carrier-2', legal_name: 'Beta Freight' }
      ]
    });

    mockBackend.getActiveWorkflows.mockResolvedValue({
      success: true,
      workflows: []
    });

    mockBackend.getDocumentStatus.mockResolvedValue({
      success: true,
      documents: []
    });

    mockBackend.verifyDocument.mockResolvedValue({ success: true });
    mockBackend.sendDocumentReminder.mockResolvedValue({ success: true });
    mockBackend.cancelWorkflow.mockResolvedValue({ success: true });
    mockBackend.updateWorkflowStatus.mockResolvedValue({ success: true });
    mockBackend.getDocumentOcrData.mockResolvedValue({ success: true, ocrData: {} });
  });

  // ===========================================================================
  // HTML Component Discovery Safety
  // ===========================================================================

  describe('HTML Component Discovery Safety', () => {
    test('should return only components that have onMessage function', () => {
      const elements = {
        '#html1': createMockComponent('html1'),
        '#html2': { _id: 'html2', postMessage: jest.fn() }, // missing onMessage
        '#html3': createMockComponent('html3')
      };

      const found = simulateGetHtmlComponents(elements);
      expect(found).toHaveLength(2);
      expect(found[0]._id).toBe('html1');
      expect(found[1]._id).toBe('html3');
    });

    test('should return empty array when no components exist', () => {
      const found = simulateGetHtmlComponents({});
      expect(found).toHaveLength(0);
    });

    test('should handle thrown errors for missing elements gracefully', () => {
      const elements = new Proxy({}, {
        get(target, prop) {
          if (prop === '#html1') throw new Error('Element not found');
          return undefined;
        }
      });

      const found = simulateGetHtmlComponents(elements);
      expect(found).toHaveLength(0);
    });

    test('should skip null/undefined components', () => {
      const elements = {
        '#html1': null,
        '#html2': undefined,
        '#html3': createMockComponent('html3')
      };

      const found = simulateGetHtmlComponents(elements);
      expect(found).toHaveLength(1);
      expect(found[0]._id).toBe('html3');
    });

    test('should scan all six expected HTML component IDs', () => {
      expect(HTML_COMPONENT_IDS).toEqual([
        '#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'
      ]);
    });
  });

  // ===========================================================================
  // Message Validation
  // ===========================================================================

  describe('Message Validation', () => {
    test('should validate all registered inbound actions', () => {
      const expected = [
        'onboardingDashboardReady', 'getWorkflows', 'verifyDocument',
        'rejectDocument', 'sendReminder', 'getDocumentDetails',
        'cancelWorkflow', 'putOnHold', 'resumeWorkflow', 'navigateTo'
      ];
      for (const action of expected) {
        expect(validateInboundMessage(action)).toBe(true);
      }
    });

    test('should reject unregistered inbound actions', () => {
      expect(validateInboundMessage('unknownAction')).toBe(false);
      expect(validateInboundMessage('')).toBe(false);
      expect(validateInboundMessage('init')).toBe(false);
    });

    test('outbound registry should contain expected message types', () => {
      expect(MESSAGE_REGISTRY.outbound).toContain('initOnboardingDashboard');
      expect(MESSAGE_REGISTRY.outbound).toContain('workflowList');
      expect(MESSAGE_REGISTRY.outbound).toContain('documentDetails');
      expect(MESSAGE_REGISTRY.outbound).toContain('actionResult');
      expect(MESSAGE_REGISTRY.outbound).toContain('workflowUpdate');
    });
  });

  // ===========================================================================
  // Message Routing
  // ===========================================================================

  describe('Message Routing', () => {
    test('should return no-op for null message', async () => {
      const result = await routeMessage(component, null);
      expect(result).toBe('no-op');
    });

    test('should return no-op for message without type', async () => {
      const result = await routeMessage(component, { data: {} });
      expect(result).toBe('no-op');
    });

    test('should route onboardingDashboardReady', async () => {
      const result = await routeMessage(component, { type: 'onboardingDashboardReady' });
      expect(result).toBe('dashboardReady');
      expect(mockBackend.getOrCreateRecruiterProfile).toHaveBeenCalled();
    });

    test('should route getWorkflows', async () => {
      recruiterId = 'recruiter-abc-123';
      const result = await routeMessage(component, {
        type: 'getWorkflows',
        data: { recruiterId: 'recruiter-abc-123' }
      });
      expect(result).toBe('getWorkflows');
      expect(mockBackend.getActiveWorkflows).toHaveBeenCalled();
    });

    test('should route getDocumentDetails', async () => {
      const result = await routeMessage(component, {
        type: 'getDocumentDetails',
        data: { workflowId: 'wf-1', documentId: 'doc-1' }
      });
      expect(result).toBe('getDocumentDetails');
    });

    test('should route verifyDocument', async () => {
      recruiterId = 'recruiter-abc-123';
      const result = await routeMessage(component, {
        type: 'verifyDocument',
        data: { documentId: 'doc-1', workflowId: 'wf-1' }
      });
      expect(result).toBe('verifyDocument');
      expect(mockBackend.verifyDocument).toHaveBeenCalledWith('doc-1', 'recruiter-abc-123', 'verified');
    });

    test('should route rejectDocument', async () => {
      recruiterId = 'recruiter-abc-123';
      const result = await routeMessage(component, {
        type: 'rejectDocument',
        data: { documentId: 'doc-1', workflowId: 'wf-1', rejectionReason: 'Blurry image' }
      });
      expect(result).toBe('rejectDocument');
      expect(mockBackend.verifyDocument).toHaveBeenCalledWith('doc-1', 'recruiter-abc-123', 'rejected', 'Blurry image');
    });

    test('should route sendReminder', async () => {
      const result = await routeMessage(component, {
        type: 'sendReminder',
        data: { workflowId: 'wf-1' }
      });
      expect(result).toBe('sendReminder');
    });

    test('should route cancelWorkflow', async () => {
      const result = await routeMessage(component, {
        type: 'cancelWorkflow',
        data: { workflowId: 'wf-1' }
      });
      expect(result).toBe('cancelWorkflow');
      expect(mockBackend.cancelWorkflow).toHaveBeenCalledWith('wf-1', 'Cancelled by recruiter');
    });

    test('should route putOnHold', async () => {
      const result = await routeMessage(component, {
        type: 'putOnHold',
        data: { workflowId: 'wf-1' }
      });
      expect(result).toBe('putOnHold');
      expect(mockBackend.updateWorkflowStatus).toHaveBeenCalledWith('wf-1', 'on_hold', {
        note: 'Put on hold by recruiter'
      });
    });

    test('should route resumeWorkflow', async () => {
      const result = await routeMessage(component, {
        type: 'resumeWorkflow',
        data: { workflowId: 'wf-1' }
      });
      expect(result).toBe('resumeWorkflow');
      expect(mockBackend.updateWorkflowStatus).toHaveBeenCalledWith('wf-1', 'in_progress', {
        note: 'Resumed by recruiter'
      });
    });

    test('should route navigateTo', async () => {
      const result = await routeMessage(component, {
        type: 'navigateTo',
        data: { page: 'dashboard' }
      });
      expect(result).toBe('navigateTo');
      expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-console');
    });

    test('should return unhandled for unknown message type', async () => {
      const result = await routeMessage(component, { type: 'someUnknownAction' });
      expect(result).toBe('unhandled');
    });
  });

  // ===========================================================================
  // Carrier Identity Resolution
  // ===========================================================================

  describe('Carrier Identity Resolution', () => {
    test('should prefer carrier_dot as carrier id', async () => {
      mockBackend.getOrCreateRecruiterProfile.mockResolvedValue({
        success: true,
        profile: { _id: 'p1' },
        carriers: [
          { carrier_dot: 'DOT-999', _id: 'id-1', carrier_name: 'Dot Carrier' }
        ]
      });

      await routeMessage(component, { type: 'onboardingDashboardReady' });

      const sentData = component.postMessage.mock.calls.find(
        c => c[0].type === 'initOnboardingDashboard'
      );
      expect(sentData).toBeTruthy();
      expect(sentData[0].data.carriers[0].id).toBe('DOT-999');
    });

    test('should fall back to _id when carrier_dot is missing', async () => {
      mockBackend.getOrCreateRecruiterProfile.mockResolvedValue({
        success: true,
        profile: { _id: 'p1' },
        carriers: [
          { _id: 'carrier-fallback', carrier_name: 'Fallback Carrier' }
        ]
      });

      await routeMessage(component, { type: 'onboardingDashboardReady' });

      const sentData = component.postMessage.mock.calls.find(
        c => c[0].type === 'initOnboardingDashboard'
      );
      expect(sentData[0].data.carriers[0].id).toBe('carrier-fallback');
    });

    test('should fall back to id when both carrier_dot and _id are missing', async () => {
      mockBackend.getOrCreateRecruiterProfile.mockResolvedValue({
        success: true,
        profile: { _id: 'p1' },
        carriers: [
          { id: 'generic-id', carrier_name: 'Generic Carrier' }
        ]
      });

      await routeMessage(component, { type: 'onboardingDashboardReady' });

      const sentData = component.postMessage.mock.calls.find(
        c => c[0].type === 'initOnboardingDashboard'
      );
      expect(sentData[0].data.carriers[0].id).toBe('generic-id');
    });

    test('should prefer carrier_name, then legal_name, then title for display', async () => {
      mockBackend.getOrCreateRecruiterProfile.mockResolvedValue({
        success: true,
        profile: { _id: 'p1' },
        carriers: [
          { carrier_dot: '1', carrier_name: 'Primary Name' },
          { carrier_dot: '2', legal_name: 'Legal Name LLC' },
          { carrier_dot: '3', title: 'Title Based' },
          { carrier_dot: '4' }
        ]
      });

      await routeMessage(component, { type: 'onboardingDashboardReady' });

      const sentData = component.postMessage.mock.calls.find(
        c => c[0].type === 'initOnboardingDashboard'
      );
      const carriers = sentData[0].data.carriers;
      expect(carriers[0].name).toBe('Primary Name');
      expect(carriers[1].name).toBe('Legal Name LLC');
      expect(carriers[2].name).toBe('Title Based');
      expect(carriers[3].name).toBe('Unknown Carrier');
    });

    test('should handle empty carriers array from profile', async () => {
      mockBackend.getOrCreateRecruiterProfile.mockResolvedValue({
        success: true,
        profile: { _id: 'p1' },
        carriers: []
      });

      await routeMessage(component, { type: 'onboardingDashboardReady' });

      const sentData = component.postMessage.mock.calls.find(
        c => c[0].type === 'initOnboardingDashboard'
      );
      expect(sentData[0].data.carriers).toEqual([]);
    });

    test('should handle undefined carriers from profile', async () => {
      mockBackend.getOrCreateRecruiterProfile.mockResolvedValue({
        success: true,
        profile: { _id: 'p1' }
        // carriers not present
      });

      await routeMessage(component, { type: 'onboardingDashboardReady' });

      const sentData = component.postMessage.mock.calls.find(
        c => c[0].type === 'initOnboardingDashboard'
      );
      expect(sentData[0].data.carriers).toEqual([]);
    });
  });

  // ===========================================================================
  // Workflow Data Transformation
  // ===========================================================================

  describe('Workflow Data Transformation', () => {
    test('should transform a full workflow with all fields', () => {
      const workflow = {
        _id: 'wf-100',
        driverName: 'John Doe',
        driver_email: 'john@example.com',
        carrier_id: 'DOT-555',
        carrierName: 'Express Freight',
        status: 'in_progress',
        documents_status: 'partial',
        background_status: 'pending',
        drug_test_status: 'scheduled',
        orientation_status: 'not_started',
        _createdDate: '2026-01-15',
        start_date: '2026-01-20',
        compliance_issues: ['expired_medical_card'],
        documents: [
          {
            _id: 'doc-a',
            document_type: 'cdl',
            display_name: 'CDL License',
            status: 'verified'
          },
          {
            _id: 'doc-b',
            document_type: 'medical_card',
            display_name: 'Medical Card',
            status: 'requested'
          }
        ],
        background_provider: 'Checkr',
        background_ordered_date: '2026-01-16',
        background_estimated_completion: '2026-01-23',
        drug_test_appointment_date: '2026-01-22',
        drug_test_collection_site: 'Quest Diagnostics'
      };

      const result = transformWorkflowForHtml(workflow);

      expect(result.id).toBe('wf-100');
      expect(result.driverName).toBe('John Doe');
      expect(result.driverEmail).toBe('john@example.com');
      expect(result.carrierId).toBe('DOT-555');
      expect(result.carrierName).toBe('Express Freight');
      expect(result.status).toBe('in_progress');
      expect(result.documentsStatus).toBe('partial');
      expect(result.documentsProgress).toBe('1/2');
      expect(result.backgroundStatus).toBe('pending');
      expect(result.drugTestStatus).toBe('scheduled');
      expect(result.orientationStatus).toBe('not_started');
      expect(result.createdDate).toBe('2026-01-15');
      expect(result.startDate).toBe('2026-01-20');
      expect(result.complianceIssues).toEqual(['expired_medical_card']);
      expect(result.documents).toHaveLength(2);
      expect(result.documents[0].id).toBe('doc-a');
      expect(result.documents[0].displayName).toBe('CDL License');
      expect(result.backgroundCheck).toEqual({
        provider: 'Checkr',
        status: 'pending',
        orderedDate: '2026-01-16',
        estimatedCompletion: '2026-01-23',
        completedDate: null
      });
      expect(result.drugTest).toEqual({
        status: 'scheduled',
        appointmentDate: '2026-01-22',
        completedDate: null,
        collectionSite: 'Quest Diagnostics'
      });
    });

    test('should use fallback id field when _id is missing', () => {
      const result = transformWorkflowForHtml({ id: 'fallback-id', status: 'pending' });
      expect(result.id).toBe('fallback-id');
    });

    test('should default driverName to Unknown Driver when not provided', () => {
      const result = transformWorkflowForHtml({ _id: 'wf-1', status: 'new' });
      expect(result.driverName).toBe('Unknown Driver');
    });

    test('should pull driverName from metadata if top-level field is missing', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        metadata: { driver_name: 'From Metadata' },
        status: 'new'
      });
      expect(result.driverName).toBe('From Metadata');
    });

    test('should default carrierName to Unknown Carrier when not provided', () => {
      const result = transformWorkflowForHtml({ _id: 'wf-1', status: 'new' });
      expect(result.carrierName).toBe('Unknown Carrier');
    });

    test('should pull carrierName from metadata fallback', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        metadata: { carrier_name: 'Metadata Carrier' },
        status: 'new'
      });
      expect(result.carrierName).toBe('Metadata Carrier');
    });

    test('should parse compliance_issues from JSON string', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        compliance_issues: '["issue_a","issue_b"]',
        status: 'new'
      });
      expect(result.complianceIssues).toEqual(['issue_a', 'issue_b']);
    });

    test('should handle unparseable compliance_issues string', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        compliance_issues: 'not-json',
        status: 'new'
      });
      expect(result.complianceIssues).toEqual([]);
    });

    test('should handle compliance_issues already as array', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        compliance_issues: ['already', 'array'],
        status: 'new'
      });
      expect(result.complianceIssues).toEqual(['already', 'array']);
    });

    test('should return null backgroundCheck when status is not_started', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        background_status: 'not_started',
        status: 'new'
      });
      expect(result.backgroundCheck).toBeNull();
    });

    test('should return null backgroundCheck when status is undefined', () => {
      const result = transformWorkflowForHtml({ _id: 'wf-1', status: 'new' });
      expect(result.backgroundCheck).toBeNull();
    });

    test('should build backgroundCheck when status is active', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        background_status: 'in_progress',
        background_provider: 'Accurate',
        status: 'new'
      });
      expect(result.backgroundCheck).not.toBeNull();
      expect(result.backgroundCheck.provider).toBe('Accurate');
      expect(result.backgroundCheck.status).toBe('in_progress');
    });

    test('should pull background_provider from metadata fallback', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        background_status: 'pending',
        metadata: { background_provider: 'MetadataProvider' },
        status: 'new'
      });
      expect(result.backgroundCheck.provider).toBe('MetadataProvider');
    });

    test('should return null drugTest when status is not_started', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        drug_test_status: 'not_started',
        status: 'new'
      });
      expect(result.drugTest).toBeNull();
    });

    test('should build drugTest when status is active', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        drug_test_status: 'completed',
        drug_test_completed_date: '2026-01-25',
        drug_test_collection_site: 'LabCorp',
        status: 'new'
      });
      expect(result.drugTest).toEqual({
        status: 'completed',
        appointmentDate: null,
        completedDate: '2026-01-25',
        collectionSite: 'LabCorp'
      });
    });

    test('should compute documentsProgress correctly', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        status: 'in_progress',
        documents: [
          { _id: 'd1', status: 'verified' },
          { _id: 'd2', status: 'verified' },
          { _id: 'd3', status: 'requested' }
        ]
      });
      expect(result.documentsProgress).toBe('2/3');
    });

    test('should return empty string for documentsProgress when no documents', () => {
      const result = transformWorkflowForHtml({ _id: 'wf-1', status: 'new' });
      expect(result.documentsProgress).toBe('');
    });

    test('should map document fields with fallback chains', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        status: 'new',
        documents: [
          {
            id: 'alt-id',
            documentType: 'mvr',
            displayName: 'Motor Vehicle Record',
            status: 'submitted',
            rejectionReason: 'Expired'
          }
        ]
      });
      expect(result.documents[0].id).toBe('alt-id');
      expect(result.documents[0].documentType).toBe('mvr');
      expect(result.documents[0].displayName).toBe('Motor Vehicle Record');
      expect(result.documents[0].status).toBe('submitted');
      expect(result.documents[0].rejectionReason).toBe('Expired');
    });

    test('should default document status to requested', () => {
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        status: 'new',
        documents: [{ _id: 'd1' }]
      });
      expect(result.documents[0].status).toBe('requested');
    });

    test('should default document displayName through fallback chain', () => {
      // Falls through display_name -> displayName -> document_type -> 'Document'
      const result = transformWorkflowForHtml({
        _id: 'wf-1',
        status: 'new',
        documents: [{ _id: 'd1', document_type: 'w9' }]
      });
      expect(result.documents[0].displayName).toBe('w9');

      const result2 = transformWorkflowForHtml({
        _id: 'wf-1',
        status: 'new',
        documents: [{ _id: 'd2' }]
      });
      expect(result2.documents[0].displayName).toBe('Document');
    });
  });

  // ===========================================================================
  // Handler: onboardingDashboardReady
  // ===========================================================================

  describe('Handler: onboardingDashboardReady', () => {
    test('should redirect unauthenticated user', async () => {
      const unauthUsers = { currentUser: { loggedIn: false, id: null } };
      await routeMessage(
        component,
        { type: 'onboardingDashboardReady' },
        mockBackend,
        unauthUsers,
        mockWixLocation
      );
      expect(mockWixLocation.to).toHaveBeenCalledWith('/account/my-account');
      expect(mockBackend.getOrCreateRecruiterProfile).not.toHaveBeenCalled();
    });

    test('should redirect when wixUsers is null', async () => {
      await routeMessage(
        component,
        { type: 'onboardingDashboardReady' },
        mockBackend,
        null,
        mockWixLocation
      );
      expect(mockWixLocation.to).toHaveBeenCalledWith('/account/my-account');
    });

    test('should send error when profile fetch fails', async () => {
      mockBackend.getOrCreateRecruiterProfile.mockResolvedValue({
        success: false,
        error: 'DB connection failed'
      });

      await routeMessage(component, { type: 'onboardingDashboardReady' });

      const errorCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'init'
      );
      expect(errorCall).toBeTruthy();
      expect(errorCall[0].data.success).toBe(false);
      expect(errorCall[0].data.error).toBe('DB connection failed');
    });

    test('should cache recruiterId after successful auth', async () => {
      await routeMessage(component, { type: 'onboardingDashboardReady' });
      expect(recruiterId).toBe('recruiter-abc-123');
    });

    test('should send initOnboardingDashboard with carrier list', async () => {
      await routeMessage(component, { type: 'onboardingDashboardReady' });

      const initCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'initOnboardingDashboard'
      );
      expect(initCall).toBeTruthy();
      expect(initCall[0].data.recruiterId).toBe('recruiter-abc-123');
      expect(initCall[0].data.carriers).toHaveLength(2);
      expect(initCall[0].data.carriers[0].id).toBe('DOT-111');
      expect(initCall[0].data.carriers[0].name).toBe('Acme Trucking');
      expect(initCall[0].data.carriers[1].id).toBe('carrier-2');
      expect(initCall[0].data.carriers[1].name).toBe('Beta Freight');
    });
  });

  // ===========================================================================
  // Handler: getWorkflows
  // ===========================================================================

  describe('Handler: getWorkflows', () => {
    test('should send empty workflows when no recruiterId', async () => {
      // recruiterId is null and no data.recruiterId provided
      await routeMessage(component, { type: 'getWorkflows', data: {} });

      const wfCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'workflowList'
      );
      expect(wfCall[0].data.workflows).toEqual([]);
      expect(mockBackend.getActiveWorkflows).not.toHaveBeenCalled();
    });

    test('should use data.recruiterId when provided', async () => {
      await routeMessage(component, {
        type: 'getWorkflows',
        data: { recruiterId: 'override-id' }
      });

      expect(mockBackend.getActiveWorkflows).toHaveBeenCalledWith({
        recruiterId: 'override-id',
        includeCompleted: false
      });
    });

    test('should fall back to cached recruiterId', async () => {
      recruiterId = 'cached-recruiter';
      await routeMessage(component, { type: 'getWorkflows', data: {} });

      expect(mockBackend.getActiveWorkflows).toHaveBeenCalledWith({
        recruiterId: 'cached-recruiter',
        includeCompleted: false
      });
    });

    test('should send empty list when backend returns success:false', async () => {
      recruiterId = 'r1';
      mockBackend.getActiveWorkflows.mockResolvedValue({ success: false });

      await routeMessage(component, { type: 'getWorkflows', data: {} });

      const wfCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'workflowList'
      );
      expect(wfCall[0].data.workflows).toEqual([]);
    });

    test('should transform and send workflows on success', async () => {
      recruiterId = 'r1';
      mockBackend.getActiveWorkflows.mockResolvedValue({
        success: true,
        workflows: [
          { _id: 'wf-1', status: 'in_progress', driverName: 'Jane', carrier_id: 'DOT-1' }
        ]
      });

      await routeMessage(component, { type: 'getWorkflows', data: {} });

      const wfCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'workflowList'
      );
      expect(wfCall[0].data.workflows).toHaveLength(1);
      expect(wfCall[0].data.workflows[0].id).toBe('wf-1');
      expect(wfCall[0].data.workflows[0].driverName).toBe('Jane');
    });

    test('should send empty list when backend throws', async () => {
      recruiterId = 'r1';
      mockBackend.getActiveWorkflows.mockRejectedValue(new Error('Timeout'));

      await routeMessage(component, { type: 'getWorkflows', data: {} });

      const wfCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'workflowList'
      );
      expect(wfCall[0].data.workflows).toEqual([]);
    });
  });

  // ===========================================================================
  // Handler: getDocumentDetails
  // ===========================================================================

  describe('Handler: getDocumentDetails', () => {
    test('should return error when workflowId is missing', async () => {
      await routeMessage(component, {
        type: 'getDocumentDetails',
        data: { documentId: 'doc-1' }
      });

      const detailCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'documentDetails'
      );
      expect(detailCall[0].data.error).toBe('Missing workflowId or documentId');
    });

    test('should return error when documentId is missing', async () => {
      await routeMessage(component, {
        type: 'getDocumentDetails',
        data: { workflowId: 'wf-1' }
      });

      const detailCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'documentDetails'
      );
      expect(detailCall[0].data.error).toBe('Missing workflowId or documentId');
    });

    test('should fetch document status and OCR data', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: true,
        documents: [
          {
            _id: 'doc-1',
            display_name: 'CDL Front',
            file_url: 'https://files.example.com/cdl.pdf',
            file_name: 'cdl_front.pdf',
            submitted_date: '2026-01-10'
          }
        ]
      });
      mockBackend.getDocumentOcrData.mockResolvedValue({
        success: true,
        ocrData: { name: 'John Doe', expiry: '2028-01' }
      });

      await routeMessage(component, {
        type: 'getDocumentDetails',
        data: { workflowId: 'wf-1', documentId: 'doc-1' }
      });

      const detailCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'documentDetails'
      );
      expect(detailCall[0].data.displayName).toBe('CDL Front');
      expect(detailCall[0].data.fileUrl).toBe('https://files.example.com/cdl.pdf');
      expect(detailCall[0].data.fileName).toBe('cdl_front.pdf');
      expect(detailCall[0].data.ocrData).toEqual({ name: 'John Doe', expiry: '2028-01' });
    });

    test('should handle OCR failure gracefully', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: true,
        documents: [{ _id: 'doc-1', document_type: 'medical' }]
      });
      mockBackend.getDocumentOcrData.mockRejectedValue(new Error('OCR not available'));

      await routeMessage(component, {
        type: 'getDocumentDetails',
        data: { workflowId: 'wf-1', documentId: 'doc-1' }
      });

      const detailCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'documentDetails'
      );
      // Should still succeed, just with empty ocrData
      expect(detailCall[0].data.displayName).toBe('medical');
      expect(detailCall[0].data.ocrData).toEqual({});
    });

    test('should fallback to document.pdf when no filename fields exist', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: true,
        documents: [{ _id: 'doc-1' }]
      });

      await routeMessage(component, {
        type: 'getDocumentDetails',
        data: { workflowId: 'wf-1', documentId: 'doc-1' }
      });

      const detailCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'documentDetails'
      );
      expect(detailCall[0].data.fileName).toBe('document.pdf');
    });

    test('should use upload_url fallback for file URL', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: true,
        documents: [{ _id: 'doc-1', upload_url: 'https://upload.example.com/doc.pdf' }]
      });

      await routeMessage(component, {
        type: 'getDocumentDetails',
        data: { workflowId: 'wf-1', documentId: 'doc-1' }
      });

      const detailCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'documentDetails'
      );
      expect(detailCall[0].data.fileUrl).toBe('https://upload.example.com/doc.pdf');
    });

    test('should handle document not found in list', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: true,
        documents: [{ _id: 'other-doc' }]
      });

      await routeMessage(component, {
        type: 'getDocumentDetails',
        data: { workflowId: 'wf-1', documentId: 'doc-missing' }
      });

      const detailCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'documentDetails'
      );
      // docRecord is null so fallback to 'Document'
      expect(detailCall[0].data.displayName).toBe('Document');
      expect(detailCall[0].data.fileUrl).toBeNull();
    });
  });

  // ===========================================================================
  // Handler: verifyDocument
  // ===========================================================================

  describe('Handler: verifyDocument', () => {
    test('should fail when documentId is missing', async () => {
      await routeMessage(component, {
        type: 'verifyDocument',
        data: { workflowId: 'wf-1' }
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'verifyDocument'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Document ID is required');
    });

    test('should call verifyDocument with verified status', async () => {
      recruiterId = 'rec-1';
      await routeMessage(component, {
        type: 'verifyDocument',
        data: { documentId: 'doc-1', workflowId: 'wf-1' }
      });

      expect(mockBackend.verifyDocument).toHaveBeenCalledWith('doc-1', 'rec-1', 'verified');

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'verifyDocument'
      );
      expect(resultCall[0].data.success).toBe(true);
      expect(resultCall[0].data.documentId).toBe('doc-1');
      expect(resultCall[0].data.workflowId).toBe('wf-1');
    });

    test('should fall back to wixUsers.currentUser.id when recruiterId is null', async () => {
      recruiterId = null;
      await routeMessage(component, {
        type: 'verifyDocument',
        data: { documentId: 'doc-1', workflowId: 'wf-1' }
      });

      expect(mockBackend.verifyDocument).toHaveBeenCalledWith(
        'doc-1', 'recruiter-abc-123', 'verified'
      );
    });

    test('should send error on backend failure', async () => {
      recruiterId = 'rec-1';
      mockBackend.verifyDocument.mockRejectedValue(new Error('Service down'));

      await routeMessage(component, {
        type: 'verifyDocument',
        data: { documentId: 'doc-1', workflowId: 'wf-1' }
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'verifyDocument'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Service down');
    });
  });

  // ===========================================================================
  // Handler: rejectDocument
  // ===========================================================================

  describe('Handler: rejectDocument', () => {
    test('should fail when documentId is missing', async () => {
      await routeMessage(component, {
        type: 'rejectDocument',
        data: { workflowId: 'wf-1', rejectionReason: 'Blurry' }
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'rejectDocument'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Document ID is required');
    });

    test('should fail when rejectionReason is missing', async () => {
      await routeMessage(component, {
        type: 'rejectDocument',
        data: { documentId: 'doc-1', workflowId: 'wf-1' }
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'rejectDocument'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Rejection reason is required');
    });

    test('should call verifyDocument with rejected status and reason', async () => {
      recruiterId = 'rec-1';
      await routeMessage(component, {
        type: 'rejectDocument',
        data: { documentId: 'doc-1', workflowId: 'wf-1', rejectionReason: 'Wrong document' }
      });

      expect(mockBackend.verifyDocument).toHaveBeenCalledWith(
        'doc-1', 'rec-1', 'rejected', 'Wrong document'
      );

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'rejectDocument'
      );
      expect(resultCall[0].data.success).toBe(true);
    });
  });

  // ===========================================================================
  // Handler: sendReminder
  // ===========================================================================

  describe('Handler: sendReminder', () => {
    test('should fail when workflowId is missing', async () => {
      await routeMessage(component, {
        type: 'sendReminder',
        data: {}
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'sendReminder'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Workflow ID is required');
    });

    test('should succeed with no reminders when no pending docs', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: true,
        documents: [{ _id: 'doc-1', status: 'verified' }]
      });

      await routeMessage(component, {
        type: 'sendReminder',
        data: { workflowId: 'wf-1' }
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'sendReminder'
      );
      expect(resultCall[0].data.success).toBe(true);
      expect(mockBackend.sendDocumentReminder).not.toHaveBeenCalled();
    });

    test('should send reminders for requested and rejected documents', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: true,
        documents: [
          { _id: 'doc-1', status: 'requested' },
          { _id: 'doc-2', status: 'rejected' },
          { _id: 'doc-3', status: 'verified' }
        ]
      });
      mockBackend.sendDocumentReminder.mockResolvedValue({ success: true });

      await routeMessage(component, {
        type: 'sendReminder',
        data: { workflowId: 'wf-1' }
      });

      expect(mockBackend.sendDocumentReminder).toHaveBeenCalledTimes(2);
      expect(mockBackend.sendDocumentReminder).toHaveBeenCalledWith('doc-1');
      expect(mockBackend.sendDocumentReminder).toHaveBeenCalledWith('doc-2');

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'sendReminder'
      );
      expect(resultCall[0].data.success).toBe(true);
      expect(resultCall[0].data.remindersSent).toBe(2);
    });

    test('should report partial failure when some reminders fail', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: true,
        documents: [
          { _id: 'doc-1', status: 'requested' },
          { _id: 'doc-2', status: 'requested' }
        ]
      });
      mockBackend.sendDocumentReminder
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Rate limited' });

      await routeMessage(component, {
        type: 'sendReminder',
        data: { workflowId: 'wf-1' }
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'sendReminder'
      );
      expect(resultCall[0].data.success).toBe(true);
      expect(resultCall[0].data.remindersSent).toBe(1);
      expect(resultCall[0].data.error).toBe('Rate limited');
    });

    test('should report failure when all reminders fail', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: true,
        documents: [{ _id: 'doc-1', status: 'requested' }]
      });
      mockBackend.sendDocumentReminder.mockResolvedValue({ success: false, error: 'Bounce' });

      await routeMessage(component, {
        type: 'sendReminder',
        data: { workflowId: 'wf-1' }
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'sendReminder'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.remindersSent).toBe(0);
    });

    test('should handle getDocumentStatus failure', async () => {
      mockBackend.getDocumentStatus.mockResolvedValue({
        success: false,
        error: 'Workflow not found'
      });

      await routeMessage(component, {
        type: 'sendReminder',
        data: { workflowId: 'wf-1' }
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'sendReminder'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Workflow not found');
    });
  });

  // ===========================================================================
  // Handler: cancelWorkflow
  // ===========================================================================

  describe('Handler: cancelWorkflow', () => {
    test('should fail when workflowId is missing', async () => {
      await routeMessage(component, {
        type: 'cancelWorkflow',
        data: {}
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'cancelWorkflow'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Workflow ID is required');
    });

    test('should call cancelWorkflow with correct reason', async () => {
      await routeMessage(component, {
        type: 'cancelWorkflow',
        data: { workflowId: 'wf-1' }
      });

      expect(mockBackend.cancelWorkflow).toHaveBeenCalledWith('wf-1', 'Cancelled by recruiter');

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'cancelWorkflow'
      );
      expect(resultCall[0].data.success).toBe(true);
      expect(resultCall[0].data.workflowId).toBe('wf-1');
    });

    test('should handle backend error', async () => {
      mockBackend.cancelWorkflow.mockRejectedValue(new Error('Cannot cancel completed workflow'));

      await routeMessage(component, {
        type: 'cancelWorkflow',
        data: { workflowId: 'wf-1' }
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'cancelWorkflow'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Cannot cancel completed workflow');
    });
  });

  // ===========================================================================
  // Handler: putOnHold
  // ===========================================================================

  describe('Handler: putOnHold', () => {
    test('should fail when workflowId is missing', async () => {
      await routeMessage(component, {
        type: 'putOnHold',
        data: {}
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'putOnHold'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Workflow ID is required');
    });

    test('should call updateWorkflowStatus with on_hold', async () => {
      await routeMessage(component, {
        type: 'putOnHold',
        data: { workflowId: 'wf-1' }
      });

      expect(mockBackend.updateWorkflowStatus).toHaveBeenCalledWith(
        'wf-1', 'on_hold', { note: 'Put on hold by recruiter' }
      );
    });
  });

  // ===========================================================================
  // Handler: resumeWorkflow
  // ===========================================================================

  describe('Handler: resumeWorkflow', () => {
    test('should fail when workflowId is missing', async () => {
      await routeMessage(component, {
        type: 'resumeWorkflow',
        data: {}
      });

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'resumeWorkflow'
      );
      expect(resultCall[0].data.success).toBe(false);
      expect(resultCall[0].data.error).toBe('Workflow ID is required');
    });

    test('should call updateWorkflowStatus with in_progress', async () => {
      await routeMessage(component, {
        type: 'resumeWorkflow',
        data: { workflowId: 'wf-1' }
      });

      expect(mockBackend.updateWorkflowStatus).toHaveBeenCalledWith(
        'wf-1', 'in_progress', { note: 'Resumed by recruiter' }
      );

      const resultCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.action === 'resumeWorkflow'
      );
      expect(resultCall[0].data.success).toBe(true);
    });
  });

  // ===========================================================================
  // Handler: navigateTo
  // ===========================================================================

  describe('Handler: navigateTo', () => {
    test('should not navigate when page is missing', async () => {
      await routeMessage(component, { type: 'navigateTo', data: {} });
      expect(mockWixLocation.to).not.toHaveBeenCalled();
    });

    test('should not navigate when data is null', async () => {
      await routeMessage(component, { type: 'navigateTo', data: null });
      expect(mockWixLocation.to).not.toHaveBeenCalled();
    });

    test.each([
      ['dashboard', '/recruiter-console'],
      ['messaging', '/recruiter-console'],
      ['new-onboarding', '/recruiter-console'],
      ['pipeline', '/recruiter-console'],
      ['settings', '/account/my-account'],
      ['onboarding', '/recruiter-onboarding-dashboard']
    ])('should route "%s" to "%s"', async (page, expectedRoute) => {
      await routeMessage(component, { type: 'navigateTo', data: { page } });
      expect(mockWixLocation.to).toHaveBeenCalledWith(expectedRoute);
    });

    test('should use page name as fallback route for unknown pages', async () => {
      await routeMessage(component, { type: 'navigateTo', data: { page: 'custom-page' } });
      expect(mockWixLocation.to).toHaveBeenCalledWith('/custom-page');
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe('Error Handling', () => {
    test('should catch handler errors and send actionResult with error', async () => {
      mockBackend.getOrCreateRecruiterProfile.mockRejectedValue(
        new Error('Unexpected failure')
      );

      const result = await routeMessage(component, { type: 'onboardingDashboardReady' });
      expect(result).toBe('error');

      const errorCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'actionResult' && c[0].data.success === false
      );
      expect(errorCall).toBeTruthy();
      expect(errorCall[0].data.action).toBe('onboardingDashboardReady');
      expect(errorCall[0].data.error).toBe('Unexpected failure');
    });

    test('should include timestamp in all postMessage calls', async () => {
      recruiterId = 'r1';
      await routeMessage(component, { type: 'getWorkflows', data: {} });

      const calls = component.postMessage.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      for (const call of calls) {
        expect(call[0].timestamp).toBeDefined();
        expect(typeof call[0].timestamp).toBe('number');
      }
    });

    test('should handle postMessage throwing without crashing', () => {
      const badComponent = {
        postMessage: jest.fn(() => { throw new Error('iframe disconnected'); }),
        onMessage: jest.fn()
      };

      // sendToHtml wraps in try-catch, should not throw
      expect(() => {
        sendToHtml(badComponent, 'actionResult', { action: 'test', success: false });
      }).not.toThrow();
    });

    test('should handle completely empty data object in handlers', async () => {
      // Each handler should gracefully handle missing data fields
      await routeMessage(component, { type: 'verifyDocument', data: {} });
      await routeMessage(component, { type: 'rejectDocument', data: {} });
      await routeMessage(component, { type: 'sendReminder', data: {} });
      await routeMessage(component, { type: 'cancelWorkflow', data: {} });
      await routeMessage(component, { type: 'putOnHold', data: {} });
      await routeMessage(component, { type: 'resumeWorkflow', data: {} });

      // All should have sent actionResult messages with success:false
      const errorResults = component.postMessage.mock.calls.filter(
        c => c[0].type === 'actionResult' && c[0].data.success === false
      );
      expect(errorResults).toHaveLength(6);
    });

    test('should handle undefined data in handler calls', async () => {
      await routeMessage(component, { type: 'getDocumentDetails' });

      const detailCall = component.postMessage.mock.calls.find(
        c => c[0].type === 'documentDetails'
      );
      expect(detailCall[0].data.error).toBe('Missing workflowId or documentId');
    });
  });
});
