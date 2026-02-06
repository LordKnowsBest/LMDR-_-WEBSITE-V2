// Quick Apply Page - Streamlined document upload flow for CDL drivers
// Allows drivers to quickly upload their CDL, Medical Card, and Resume
// with AI-powered OCR extraction for form auto-fill

import { getOrCreateDriverProfile, updateDriverDocuments } from 'backend/driverProfiles';
import { extractDocumentForAutoFill } from 'backend/ocrService';
import { submitApplication } from 'backend/applicationService';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

// Wix Users - handle gracefully if not available
let wixUsers;
try {
  wixUsers = require('wix-users');
} catch (e) {
  console.log('wix-users not available');
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  htmlComponentId: 'quickApplyHtml',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
  matchingPageUrl: '/ai-matching',
  dashboardPageUrl: '/driver-dashboard',
  loginPageUrl: '/account/my-account'
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

let cachedUserStatus = null;
let cachedDriverProfile = null;
let preSelectedCarrier = null;
let uploadedDocuments = {
  cdlFront: null,
  cdlBack: null,
  medCard: null,
  mvr: null,
  resume: null
};
let extractedData = {};

// ============================================================================
// MESSAGE VALIDATION SYSTEM
// ============================================================================

const DEBUG_MESSAGES = true; // Set to false in production

// Registry of all valid messages - single source of truth
const MESSAGE_REGISTRY = {
  // Messages FROM HTML that page code handles
  inbound: [
    'quickApplyReady',
    'quickApplyFormReady',  // New: from updated HTML
    'uploadDocument',
    'submitQuickApply',
    'clearDocument',
    'runOCR',
    'extractDocumentOCR',   // New: from updated HTML (OCR request)
    'navigateToMatching',
    'navigateToLogin',
    'navigateToDashboard',
    'checkUserStatus',
    'getProfile',
    'ping' // Health check
  ],
  // Messages TO HTML that page code sends
  outbound: [
    'pageReady',
    'profileLoaded',
    'ocrProcessing',
    'ocrComplete',
    'ocrResult',            // New: for updated HTML
    'ocrError',
    'uploadSuccess',
    'uploadError',
    'applicationSubmitted',
    'applicationError',
    'submitResult',         // New: for updated HTML
    'documentCleared',
    'userStatusUpdate',
    'pong' // Health check response
  ]
};

function validateInboundMessage(action) {
  if (!MESSAGE_REGISTRY.inbound.includes(action)) {
    console.warn(`[Quick Apply] UNREGISTERED INBOUND MESSAGE: "${action}" - Add to MESSAGE_REGISTRY.inbound`);
    return false;
  }
  return true;
}

function logMessageFlow(direction, type, data) {
  if (!DEBUG_MESSAGES) return;
  const arrow = direction === 'in' ? '[IN]' : '[OUT]';
  const label = direction === 'in' ? 'HTML->Velo' : 'Velo->HTML';
  console.log(`${arrow} [${label}] ${type}`, data ? Object.keys(data) : '(no data)');
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
  console.log('[Quick Apply] Page Ready');

  const htmlComponent = getHtmlComponent();

  if (!htmlComponent) {
    console.error('[Quick Apply] HTML component not found!');
    return;
  }

  console.log('[Quick Apply] HTML component found:', CONFIG.htmlComponentId);

  // Check URL params for carrier pre-selection
  await checkUrlParams();

  // Get initial user status
  cachedUserStatus = await getUserStatus();
  console.log('[Quick Apply] User status:', cachedUserStatus);

  // If logged in, load driver profile and existing documents
  if (cachedUserStatus.loggedIn) {
    await loadExistingProfile();
  }

  // Set up message listener
  htmlComponent.onMessage((event) => {
    handleHtmlMessage(event.data);
  });
});

// ============================================================================
// URL PARAMETER HANDLING
// ============================================================================

async function checkUrlParams() {
  try {
    const query = wixLocation.query;

    // Check for carrier pre-selection (e.g., ?carrier=12345)
    if (query.carrier) {
      preSelectedCarrier = {
        dot: query.carrier,
        name: query.carrierName || null
      };
      console.log('[Quick Apply] Pre-selected carrier:', preSelectedCarrier);
    }

    // Check for job reference (e.g., ?job=abc123)
    if (query.job) {
      preSelectedCarrier = preSelectedCarrier || {};
      preSelectedCarrier.jobId = query.job;
      console.log('[Quick Apply] Job reference:', query.job);
    }

    // Check for source tracking
    if (query.source) {
      console.log('[Quick Apply] Traffic source:', query.source);
    }

  } catch (error) {
    console.error('[Quick Apply] URL param check error:', error);
  }
}

// ============================================================================
// USER STATUS DETECTION
// ============================================================================

async function getUserStatus() {
  try {
    if (!wixUsers) {
      return { loggedIn: false, isPremium: false, tier: 'guest' };
    }

    const user = wixUsers.currentUser;
    const loggedIn = user.loggedIn;

    if (!loggedIn) {
      return { loggedIn: false, isPremium: false, tier: 'guest' };
    }

    let userEmail = '';
    try {
      userEmail = await user.getEmail();
    } catch (e) {
      console.log('[Quick Apply] Could not get email');
    }

    const userId = user.id;

    return {
      loggedIn: true,
      isPremium: true,
      tier: 'premium',
      email: userEmail,
      userId: userId
    };

  } catch (error) {
    console.error('[Quick Apply] Error checking user status:', error);
    return { loggedIn: false, isPremium: false, tier: 'guest' };
  }
}

// ============================================================================
// PROFILE LOADING
// ============================================================================

async function loadExistingProfile() {
  try {
    const profileResult = await getOrCreateDriverProfile();

    if (profileResult.success) {
      cachedDriverProfile = profileResult.profile;
      console.log('[Quick Apply] Profile loaded:', cachedDriverProfile._id);
      console.log('[Quick Apply] Profile completeness:', cachedDriverProfile.profile_completeness_score);

      // Check for existing documents
      if (cachedDriverProfile.cdl_front_image) {
        uploadedDocuments.cdlFront = { url: cachedDriverProfile.cdl_front_image, isExisting: true };
      }
      if (cachedDriverProfile.cdl_back_image) {
        uploadedDocuments.cdlBack = { url: cachedDriverProfile.cdl_back_image, isExisting: true };
      }
      if (cachedDriverProfile.med_card_image) {
        uploadedDocuments.medCard = { url: cachedDriverProfile.med_card_image, isExisting: true };
      }
      if (cachedDriverProfile.resume_file) {
        uploadedDocuments.resume = { url: cachedDriverProfile.resume_file, isExisting: true };
      }

      return cachedDriverProfile;
    } else {
      console.error('[Quick Apply] Profile load failed:', profileResult.error);
      return null;
    }

  } catch (error) {
    console.error('[Quick Apply] Profile load error:', error);
    return null;
  }
}

// ============================================================================
// HTML COMPONENT FINDER
// ============================================================================

function getHtmlComponent() {
  const possibleIds = [CONFIG.htmlComponentId, 'html1', 'html2', 'html3', 'html4', 'html5', 'htmlEmbed1'];

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
  try {
    return $w(`#${CONFIG.htmlComponentId}`);
  } catch (e) {
    return null;
  }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

async function handleHtmlMessage(msg) {
  if (!msg || !msg.type) return;

  const action = msg.action || msg.type;

  // Validate and log inbound message
  validateInboundMessage(action);
  logMessageFlow('in', action, msg.data);

  switch (action) {
    // Health check
    case 'ping':
      sendToHtml('pong', {
        timestamp: Date.now(),
        registeredInbound: MESSAGE_REGISTRY.inbound.length,
        registeredOutbound: MESSAGE_REGISTRY.outbound.length
      });
      break;

    // Page ready signal from HTML (both old and new format)
    case 'quickApplyReady':
    case 'quickApplyFormReady':
      await handleQuickApplyReady();
      break;

    // New: Direct OCR extraction request from HTML (extractDocumentOCR)
    case 'extractDocumentOCR':
      await handleExtractDocumentOCR(msg.data);
      break;

    // Document upload
    case 'uploadDocument':
      await handleDocumentUpload(msg.data);
      break;

    // Clear document
    case 'clearDocument':
      await handleClearDocument(msg.data);
      break;

    // Run OCR on uploaded document
    case 'runOCR':
      await handleRunOCR(msg.data);
      break;

    // Submit quick apply
    case 'submitQuickApply':
      await handleSubmitQuickApply(msg.data);
      break;

    // Navigation
    case 'navigateToMatching':
      wixLocation.to(CONFIG.matchingPageUrl);
      break;

    case 'navigateToDashboard':
      wixLocation.to(CONFIG.dashboardPageUrl);
      break;

    case 'navigateToLogin':
      await handleNavigateToLogin();
      break;

    // User status check
    case 'checkUserStatus': {
      const status = await getUserStatus();
      cachedUserStatus = status;
      sendToHtml('userStatusUpdate', status);
      break;
    }

    // Get profile
    case 'getProfile':
      await handleGetProfile();
      break;

    default:
      console.log('[Quick Apply] Unknown message type:', action);
  }
}

// ============================================================================
// HANDLER: Quick Apply Ready
// ============================================================================

async function handleQuickApplyReady() {
  console.log('[Quick Apply] HTML Embed Ready - Sending initial state');

  // Prepare profile data for HTML
  const profileData = cachedDriverProfile ? {
    id: cachedDriverProfile._id,
    displayName: cachedDriverProfile.display_name,
    email: cachedDriverProfile.email,
    phone: cachedDriverProfile.phone,
    homeZip: cachedDriverProfile.home_zip,
    cdlClass: cachedDriverProfile.cdl_class,
    cdlNumber: cachedDriverProfile.cdl_number,
    cdlExpiration: cachedDriverProfile.cdl_expiration,
    medCardExpiration: cachedDriverProfile.med_card_expiration,
    endorsements: cachedDriverProfile.endorsements,
    yearsExperience: cachedDriverProfile.years_experience,
    completeness: cachedDriverProfile.profile_completeness_score,
    isComplete: cachedDriverProfile.is_complete,
    missingFields: cachedDriverProfile.missing_fields,
    // Existing document URLs
    cdlFrontImage: cachedDriverProfile.cdl_front_image,
    cdlBackImage: cachedDriverProfile.cdl_back_image,
    medCardImage: cachedDriverProfile.med_card_image,
    resumeFile: cachedDriverProfile.resume_file
  } : null;

  sendToHtml('pageReady', {
    userStatus: cachedUserStatus,
    driverProfile: profileData,
    preSelectedCarrier: preSelectedCarrier,
    uploadedDocuments: {
      cdlFront: uploadedDocuments.cdlFront ? { exists: true, isExisting: uploadedDocuments.cdlFront.isExisting } : null,
      cdlBack: uploadedDocuments.cdlBack ? { exists: true, isExisting: uploadedDocuments.cdlBack.isExisting } : null,
      medCard: uploadedDocuments.medCard ? { exists: true, isExisting: uploadedDocuments.medCard.isExisting } : null,
      resume: uploadedDocuments.resume ? { exists: true, isExisting: uploadedDocuments.resume.isExisting } : null
    },
    extractedData: extractedData
  });
}

// ============================================================================
// HANDLER: Get Profile
// ============================================================================

async function handleGetProfile() {
  try {
    if (!cachedUserStatus.loggedIn) {
      sendToHtml('profileLoaded', { success: false, error: 'Not logged in' });
      return;
    }

    const profile = await loadExistingProfile();

    if (profile) {
      sendToHtml('profileLoaded', {
        success: true,
        profile: {
          id: profile._id,
          displayName: profile.display_name,
          email: profile.email,
          phone: profile.phone,
          homeZip: profile.home_zip,
          cdlClass: profile.cdl_class,
          cdlNumber: profile.cdl_number,
          cdlExpiration: profile.cdl_expiration,
          medCardExpiration: profile.med_card_expiration,
          endorsements: profile.endorsements,
          yearsExperience: profile.years_experience,
          completeness: profile.profile_completeness_score,
          cdlFrontImage: profile.cdl_front_image,
          cdlBackImage: profile.cdl_back_image,
          medCardImage: profile.med_card_image,
          resumeFile: profile.resume_file
        }
      });
    } else {
      sendToHtml('profileLoaded', { success: false, error: 'Profile not found' });
    }

  } catch (error) {
    console.error('[Quick Apply] Get profile error:', error);
    sendToHtml('profileLoaded', { success: false, error: error.message });
  }
}

// ============================================================================
// HANDLER: Document Upload
// ============================================================================

async function handleDocumentUpload(data) {
  if (!data || !data.docType || !data.file) {
    sendToHtml('uploadError', { error: 'Missing document data', docType: data?.docType });
    return;
  }

  const { docType, file } = data;
  const { base64, name, type, size } = file;

  console.log(`[Quick Apply] Processing upload: ${docType} - ${name} (${Math.round(size / 1024)}KB)`);

  // Validate file size
  if (size > CONFIG.maxFileSize) {
    sendToHtml('uploadError', {
      error: `File too large. Maximum size is ${Math.round(CONFIG.maxFileSize / (1024 * 1024))}MB`,
      docType: docType
    });
    return;
  }

  // Validate file type
  if (!CONFIG.supportedFormats.includes(type)) {
    sendToHtml('uploadError', {
      error: 'Unsupported file format. Please use JPEG, PNG, or PDF.',
      docType: docType
    });
    return;
  }

  try {
    // Store the document data locally
    const docData = {
      data: base64,
      name: name,
      type: type,
      size: size,
      uploadedAt: new Date().toISOString(),
      isExisting: false
    };

    // Store in appropriate slot
    switch (docType) {
      case 'cdlFront':
      case 'CDL_FRONT':
        uploadedDocuments.cdlFront = docData;
        break;
      case 'cdlBack':
      case 'CDL_BACK':
        uploadedDocuments.cdlBack = docData;
        break;
      case 'medCard':
      case 'MED_CARD':
        uploadedDocuments.medCard = docData;
        break;
      case 'resume':
      case 'RESUME':
        uploadedDocuments.resume = docData;
        break;
      default:
        console.warn('[Quick Apply] Unknown document type:', docType);
    }

    console.log(`[Quick Apply] Document stored: ${docType}`);

    sendToHtml('uploadSuccess', {
      docType: docType,
      fileName: name,
      fileSize: size,
      fileType: type
    });

    // Auto-run OCR for CDL and Med Card
    if (['cdlFront', 'CDL_FRONT', 'cdlBack', 'CDL_BACK', 'medCard', 'MED_CARD'].includes(docType)) {
      // Slight delay to let UI update
      setTimeout(() => {
        handleRunOCR({ docType: docType, base64Data: base64 });
      }, 500);
    }

  } catch (error) {
    console.error('[Quick Apply] Upload error:', error);
    sendToHtml('uploadError', {
      error: error.message,
      docType: docType
    });
  }
}

// ============================================================================
// HANDLER: Clear Document
// ============================================================================

async function handleClearDocument(data) {
  if (!data || !data.docType) {
    return;
  }

  const { docType } = data;

  switch (docType) {
    case 'cdlFront':
    case 'CDL_FRONT':
      uploadedDocuments.cdlFront = null;
      if (extractedData.cdlFront) delete extractedData.cdlFront;
      break;
    case 'cdlBack':
    case 'CDL_BACK':
      uploadedDocuments.cdlBack = null;
      if (extractedData.cdlBack) delete extractedData.cdlBack;
      break;
    case 'medCard':
    case 'MED_CARD':
      uploadedDocuments.medCard = null;
      if (extractedData.medCard) delete extractedData.medCard;
      break;
    case 'mvr':
    case 'MVR':
      uploadedDocuments.mvr = null;
      break;
    case 'resume':
    case 'RESUME':
      uploadedDocuments.resume = null;
      break;
  }

  console.log(`[Quick Apply] Document cleared: ${docType}`);

  sendToHtml('documentCleared', { docType: docType });
}

// ============================================================================
// HANDLER: Extract Document OCR (New format from updated HTML)
// ============================================================================

async function handleExtractDocumentOCR(data) {
  if (!data || !data.base64Data || !data.docType) {
    sendToHtml('ocrResult', {
      success: false,
      docType: data?.docType,
      error: 'Missing required data for OCR'
    });
    return;
  }

  const { base64Data, docType, inputId } = data;

  console.log(`[Quick Apply] OCR extraction requested for ${docType}`);

  try {
    // Call the OCR service
    const result = await extractDocumentForAutoFill(base64Data, docType);

    if (result.success) {
      console.log(`[Quick Apply] OCR success for ${docType}:`, result.extracted);

      // Store extracted data
      const normalizedType = normalizeDocType(docType);
      extractedData[normalizedType] = result.extracted;

      // Send result back to HTML in expected format
      sendToHtml('ocrResult', {
        success: true,
        docType: docType,
        inputId: inputId,
        confidence: result.confidence,
        consensusMethod: result.consensusMethod,
        extracted: result.extracted
      });

    } else {
      console.error(`[Quick Apply] OCR failed for ${docType}:`, result.error);
      sendToHtml('ocrResult', {
        success: false,
        docType: docType,
        inputId: inputId,
        error: result.error || 'OCR extraction failed',
        userMessage: result.userMessage
      });
    }

  } catch (error) {
    console.error('[Quick Apply] OCR error:', error);
    sendToHtml('ocrResult', {
      success: false,
      docType: docType,
      inputId: inputId,
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Run OCR
// ============================================================================

async function handleRunOCR(data) {
  if (!data || !data.docType) {
    sendToHtml('ocrError', { error: 'Missing document type', docType: data?.docType });
    return;
  }

  const { docType } = data;
  let base64Data = data.base64Data;

  // If base64 not provided, get from stored document
  if (!base64Data) {
    const normalizedType = normalizeDocType(docType);
    const doc = uploadedDocuments[normalizedType];
    if (doc && doc.data) {
      base64Data = doc.data;
    } else {
      sendToHtml('ocrError', { error: 'No document found', docType: docType });
      return;
    }
  }

  // Map to OCR service doc types
  const ocrDocType = mapToOcrDocType(docType);

  console.log(`[Quick Apply] Running OCR for ${docType} (mapped to ${ocrDocType})`);

  // Notify HTML that OCR is processing
  sendToHtml('ocrProcessing', { docType: docType });

  try {
    const result = await extractDocumentForAutoFill(base64Data, ocrDocType);

    if (result.success) {
      console.log(`[Quick Apply] OCR success for ${docType}:`, result.extracted);

      // Store extracted data
      const normalizedType = normalizeDocType(docType);
      extractedData[normalizedType] = result.extracted;

      sendToHtml('ocrComplete', {
        docType: docType,
        confidence: result.confidence,
        consensusMethod: result.consensusMethod,
        extracted: result.extracted
      });

    } else {
      console.error(`[Quick Apply] OCR failed for ${docType}:`, result.error);
      sendToHtml('ocrError', {
        docType: docType,
        error: result.error || 'OCR extraction failed'
      });
    }

  } catch (error) {
    console.error('[Quick Apply] OCR error:', error);
    sendToHtml('ocrError', {
      docType: docType,
      error: error.message
    });
  }
}

// ============================================================================
// HANDLER: Submit Quick Apply
// ============================================================================

async function handleSubmitQuickApply(data) {
  console.log('[Quick Apply] Submitting application...');

  // For new HTML format, documents come inside data.documents
  // For old format, they come from uploadedDocuments state
  const hasNewFormat = data && data.documents;

  // Check if user is logged in (for full submission)
  // Allow guest submissions for profile-only saves
  const isGuestSubmission = !cachedUserStatus.loggedIn;

  try {
    // Prepare documents for submission
    let documents = {};

    if (hasNewFormat && data.documents) {
      // New format: documents are in data.documents
      documents = {
        cdlFront: data.documents.cdlFront || null,
        cdlBack: data.documents.cdlBack || null,
        medCard: data.documents.medCard || null,
        mvr: data.documents.mvr || null,
        resume: data.documents.resume || null
      };
    } else {
      // Old format: use uploadedDocuments state
      if (uploadedDocuments.cdlFront && uploadedDocuments.cdlFront.data) {
        documents.cdlFront = {
          data: uploadedDocuments.cdlFront.data,
          name: uploadedDocuments.cdlFront.name,
          type: uploadedDocuments.cdlFront.type
        };
      }

      if (uploadedDocuments.cdlBack && uploadedDocuments.cdlBack.data) {
        documents.cdlBack = {
          data: uploadedDocuments.cdlBack.data,
          name: uploadedDocuments.cdlBack.name,
          type: uploadedDocuments.cdlBack.type
        };
      }

      if (uploadedDocuments.medCard && uploadedDocuments.medCard.data) {
        documents.medCard = {
          data: uploadedDocuments.medCard.data,
          name: uploadedDocuments.medCard.name,
          type: uploadedDocuments.medCard.type
        };
      }

      if (uploadedDocuments.resume && uploadedDocuments.resume.data) {
        documents.resume = {
          data: uploadedDocuments.resume.data,
          name: uploadedDocuments.resume.name,
          type: uploadedDocuments.resume.type
        };
      }
    }

    // Prepare existing document URLs for reference
    const existingProfileDocs = cachedDriverProfile ? {
      cdl_front_image: cachedDriverProfile.cdl_front_image,
      cdl_back_image: cachedDriverProfile.cdl_back_image,
      med_card_image: cachedDriverProfile.med_card_image,
      resume_file: cachedDriverProfile.resume_file
    } : {};

    // Merge extracted data with form data
    const cdlData = extractedData.cdlFront || extractedData.cdlBack || {};
    const medCardData = extractedData.medCard || {};

    // Build application payload
    const applicationPayload = {
      // Carrier info (from URL params or form)
      carrierDOT: data.carrierDOT || preSelectedCarrier?.dot || null,
      carrierName: data.carrierName || preSelectedCarrier?.name || null,

      // Contact info
      phone: data.phone || cachedDriverProfile?.phone || '',
      email: data.email || cachedDriverProfile?.email || '',
      preferredContact: data.preferredContact || 'phone',

      // Availability
      availability: data.availability || 'Immediately',
      message: data.message || '',

      // CDL info (from form or OCR)
      cdlNumber: data.cdlNumber || cdlData.licenseNumber || cachedDriverProfile?.cdl_number || '',
      cdlExpiration: data.cdlExpiration || cdlData.expirationDate || cachedDriverProfile?.cdl_expiration || '',
      medCardExpiration: data.medCardExpiration || medCardData.certificateExpirationDate || cachedDriverProfile?.med_card_expiration || '',

      // Documents
      documents: documents,
      existingProfileDocs: existingProfileDocs
    };

    // If no carrier specified, just save documents to profile
    if (!applicationPayload.carrierDOT) {
      console.log('[Quick Apply] No carrier specified - saving documents to profile');

      const updateResult = await updateDriverDocuments({
        cdlFront: documents.cdlFront || null,
        cdlBack: documents.cdlBack || null,
        medCard: documents.medCard || null,
        resume: documents.resume || null
      });

      if (updateResult.success) {
        cachedDriverProfile = updateResult.profile;
        const successResponse = {
          success: true,
          type: 'profileUpdate',
          message: 'Documents saved to your profile successfully!',
          profile: {
            completeness: updateResult.profile.profile_completeness_score,
            cdlFrontImage: updateResult.profile.cdl_front_image,
            cdlBackImage: updateResult.profile.cdl_back_image,
            medCardImage: updateResult.profile.med_card_image,
            resumeFile: updateResult.profile.resume_file
          }
        };
        sendToHtml('applicationSubmitted', successResponse);
        sendToHtml('submitResult', successResponse); // Also send for new HTML format
      } else {
        const errorResponse = { success: false, error: updateResult.error || 'Failed to save documents' };
        sendToHtml('applicationError', errorResponse);
        sendToHtml('submitResult', errorResponse); // Also send for new HTML format
      }

      return;
    }

    // Submit the application
    console.log('[Quick Apply] Submitting to carrier:', applicationPayload.carrierDOT);

    const result = await submitApplication(applicationPayload);

    if (result.success) {
      console.log('[Quick Apply] Application submitted successfully');

      // Clear uploaded documents (they're now saved)
      uploadedDocuments = {
        cdlFront: null,
        cdlBack: null,
        medCard: null,
        mvr: null,
        resume: null
      };

      const successResponse = {
        success: true,
        type: 'application',
        carrierDOT: applicationPayload.carrierDOT,
        carrierName: applicationPayload.carrierName,
        applicationId: result.application?._id,
        isNew: result.isNew,
        message: 'Your application has been submitted successfully!'
      };
      sendToHtml('applicationSubmitted', successResponse);
      sendToHtml('submitResult', successResponse); // Also send for new HTML format

    } else {
      console.error('[Quick Apply] Application failed:', result.error);
      const errorResponse = { success: false, error: result.error || 'Failed to submit application' };
      sendToHtml('applicationError', errorResponse);
      sendToHtml('submitResult', errorResponse); // Also send for new HTML format
    }

  } catch (error) {
    console.error('[Quick Apply] Submit error:', error);
    const errorResponse = { success: false, error: error.message };
    sendToHtml('applicationError', errorResponse);
    sendToHtml('submitResult', errorResponse); // Also send for new HTML format
  }
}

// ============================================================================
// HANDLER: Navigate to Login
// ============================================================================

async function handleNavigateToLogin() {
  console.log('[Quick Apply] Navigating to login');

  if (wixUsers) {
    try {
      const user = await wixUsers.promptLogin({ mode: 'login' });
      console.log('[Quick Apply] User logged in:', user.id);

      // Refresh user status
      cachedUserStatus = await getUserStatus();

      // Load profile
      await loadExistingProfile();

      // Notify HTML
      sendToHtml('userStatusUpdate', {
        ...cachedUserStatus,
        justLoggedIn: true
      });

      // Send updated page state
      await handleQuickApplyReady();

    } catch (error) {
      console.log('[Quick Apply] Login cancelled:', error);
    }
  } else {
    wixLocation.to(CONFIG.loginPageUrl);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normalizeDocType(docType) {
  switch (docType) {
    case 'cdlFront':
    case 'CDL_FRONT':
      return 'cdlFront';
    case 'cdlBack':
    case 'CDL_BACK':
      return 'cdlBack';
    case 'medCard':
    case 'MED_CARD':
      return 'medCard';
    case 'mvr':
    case 'MVR':
      return 'mvr';
    case 'resume':
    case 'RESUME':
      return 'resume';
    default:
      return docType;
  }
}

function mapToOcrDocType(docType) {
  switch (docType) {
    case 'cdlFront':
    case 'CDL_FRONT':
      return 'CDL_FRONT';
    case 'cdlBack':
    case 'CDL_BACK':
      return 'CDL_BACK';
    case 'medCard':
    case 'MED_CARD':
      return 'MED_CARD';
    default:
      return docType;
  }
}

function sendToHtml(type, data) {
  // Validate outbound message is registered
  if (!MESSAGE_REGISTRY.outbound.includes(type)) {
    console.warn(`[Quick Apply] UNREGISTERED OUTBOUND MESSAGE: "${type}" - Add to MESSAGE_REGISTRY.outbound`);
  }

  logMessageFlow('out', type, data);

  try {
    const component = getComponent();
    if (component && typeof component.postMessage === 'function') {
      component.postMessage({ type, data, timestamp: Date.now() });
    }
  } catch (error) {
    console.error('[Quick Apply] Error sending to HTML:', error);
  }
}

// ============================================================================
// UI ELEMENT HELPERS (for direct Wix element manipulation if needed)
// ============================================================================

function safeGetElement(selector) {
  try {
    const el = $w(selector);
    return el && el.valid !== false ? el : null;
  } catch (e) {
    return null;
  }
}

function showElement(selector) {
  const el = safeGetElement(selector);
  if (el && typeof el.show === 'function') {
    el.show();
  }
}

function hideElement(selector) {
  const el = safeGetElement(selector);
  if (el && typeof el.hide === 'function') {
    el.hide();
  }
}

function setElementText(selector, text) {
  const el = safeGetElement(selector);
  if (el && typeof el.text !== 'undefined') {
    el.text = text;
  }
}

function setElementSrc(selector, src) {
  const el = safeGetElement(selector);
  if (el && typeof el.src !== 'undefined') {
    el.src = src;
  }
}

function enableElement(selector) {
  const el = safeGetElement(selector);
  if (el && typeof el.enable === 'function') {
    el.enable();
  }
}

function disableElement(selector) {
  const el = safeGetElement(selector);
  if (el && typeof el.disable === 'function') {
    el.disable();
  }
}
