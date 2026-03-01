/* eslint-disable no-useless-escape */
import {
  loadDriverBootstrapData,
  findCarrierMatchesForPage,
  startAsyncCarrierSearchForPage,
  getAsyncCarrierSearchStatusForPage,
  startCarrierEnrichmentJobForPage,
  getCarrierEnrichmentStatusForPage,
  getDriverMutualInterestsForPage,
  enrichCarrierForPage,
  getDriverProfileForPage,
  getDriverSavedCarriersForPage,
  updateDriverDiscoverabilityForPage,
  saveDriverDocumentsForPage,
  submitDriverApplicationForPage,
  getDriverApplicationsForPage,
  extractDocumentForAutoFillForPage,
  getDriverMatchExplanationForPage,
  trackFeatureInteractionForPage,
  logCarrierInterestForPage,
  handleAgentTurnForPage,
  resolveApprovalGateForPage,
  getVoiceConfigForPage
} from 'backend/aiMatchingFacade.jsw';
import {
  DEBUG_MESSAGES as CONTRACT_DEBUG_MESSAGES,
  isKnownInboundMessage as isKnownContractInboundMessage,
  isKnownOutboundMessage as isKnownContractOutboundMessage,
  validateHtmlToPageMessage,
  logMessageFlow as logContractMessageFlow
} from 'public/js/ai-matching-contract';
import {
  createAIMatchingPageState,
  normalizeDriverProfileForHtml,
  buildPageReadyPayload
} from 'public/js/ai-matching-page-state';
import { sendToHtmlBridge } from 'public/js/ai-matching-page-bridge';
import { routeAiMatchingAction } from 'public/js/ai-matching-page-router';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

// Wix Users - handle gracefully if not available
let wixUsers;
try {
  wixUsers = require('wix-users');
} catch (e) {
  console.log('wix-users not available, defaulting to free tier');
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  htmlComponentId: 'html4',
  enrichmentDelayMs: 3000,
  maxRetries: 2,
  retryDelayMs: 3000,
  signupPageUrl: '/signup',
  loginPageUrl: '/account/my-account',
  profilePageUrl: '/driver-profile',
  savedCarriersPageUrl: '/saved-carriers',
  postLoginRedirect: '/ai-matching'
};

// ============================================================================
// GLOBAL STATE
// ============================================================================
const pageState = createAIMatchingPageState();
let cachedUserStatus = pageState.cachedUserStatus;
let cachedDriverProfile = pageState.cachedDriverProfile;
let cachedDriverInterests = pageState.cachedDriverInterests;
let lastSearchResults = pageState.lastSearchResults;
let _veloInitDone = pageState.veloInitDone;
let _htmlReadyPending = pageState.htmlReadyPending;

function setCachedUserStatus(value) {
  cachedUserStatus = value;
  pageState.cachedUserStatus = value;
  return value;
}

function setCachedDriverProfile(value) {
  cachedDriverProfile = value;
  pageState.cachedDriverProfile = value;
  return value;
}

function setCachedDriverInterests(value) {
  cachedDriverInterests = value;
  pageState.cachedDriverInterests = value;
  return value;
}

function setLastSearchResults(value) {
  lastSearchResults = value;
  pageState.lastSearchResults = value;
  return value;
}

function setVeloInitDone(value) {
  _veloInitDone = value;
  pageState.veloInitDone = value;
  return value;
}

function setHtmlReadyPending(value) {
  _htmlReadyPending = value;
  pageState.htmlReadyPending = value;
  return value;
}

// Init synchronization — prevents carrierMatchingReady from being dropped
// when the HTML iframe fires before Velo's async profile/interest fetches finish
// ============================================================================
// MESSAGE VALIDATION SYSTEM
// ============================================================================
const DEBUG_MESSAGES = true; // Set to false in production

// Registry of all valid messages - single source of truth
const MESSAGE_REGISTRY = {
  // Messages FROM HTML that page code handles
  inbound: [
    'carrierMatchingReady',
    'findMatches',
    'logInterest',
    'retryEnrichment',
    'navigateToSignup',
    'navigateToLogin',
    'checkUserStatus',
    'getDriverProfile',
    'navigateToSavedCarriers',
    'submitApplication',
    'saveProfileDocs',
    'extractDocumentOCR', // Real-time OCR for form auto-fill
    'getMatchExplanation', // Fetch detailed match rationale
    'logFeatureInteraction', // Feature adoption tracking
    'getDriverApplications', // Fetch driver applications history
    'getMutualInterest', // Phase 1: Fetch mutual interests
    'loginForApplication', // Trigger Wix login from application submit
    'agentMessage', // Send message to AI agent
    'resolveApprovalGate', // Resolve an approval gate (approve/reject)
    'startVoiceCall', // Initiate voice call
    'endVoiceCall', // End voice call
    'getVoiceConfig', // Request voice configuration
    'pollSearchJob', // Async search poll — HTML checks job status every 3s
    'ping' // Health check
  ],
  // Messages TO HTML that page code sends
  outbound: [
    'pageReady',
    'matchResults',
    'matchError',
    'enrichmentUpdate',
    'enrichmentComplete',
    'interestLogged',
    'userStatusUpdate',
    'loginSuccess',
    'loginCancelled',
    'applicationSubmitted',
    'driverProfileLoaded',
    'savedCarriersLoaded',
    'discoverabilityUpdated',
    'profileSaved',
    'ocrResult', // Real-time OCR extraction result
    'matchExplanation', // Return detailed match rationale
    'driverApplications', // Return driver applications
    'mutualInterestData', // Phase 1: Return mutual interest data
    'agentResponse', // Agent orchestration response
    'agentTyping', // Agent is processing
    'agentToolResult', // Tool execution result
    'agentApprovalRequired', // Agent requires user approval to proceed
    'voiceReady', // Voice configuration ready
    'searchJobStarted', // Async search kicked off — contains { jobId }
    'searchJobStatus', // Async search poll response — { status, results? }
    'pong' // Health check response
  ]
};

function validateInboundMessage(action) {
  if (!(isKnownContractInboundMessage(action) || MESSAGE_REGISTRY.inbound.includes(action))) {
    console.warn(`⚠️ UNREGISTERED INBOUND MESSAGE: "${action}" - Add to MESSAGE_REGISTRY.inbound`);
    return false;
  }
  return true;
}

function logMessageFlow(direction, type, data) {
  if (DEBUG_MESSAGES && CONTRACT_DEBUG_MESSAGES) {
    logContractMessageFlow(direction, type, data);
    return;
  }
  if (!DEBUG_MESSAGES) return;
  const arrow = direction === 'in' ? '📥' : '📤';
  const label = direction === 'in' ? 'HTML→Velo' : 'Velo→HTML';
  console.log(`${arrow} [${label}] ${type}`, data ? Object.keys(data) : '(no data)');
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(async function () {
  console.log('🚀 Carrier Matching Page Ready');

  const htmlComponent = getHtmlComponent();

  if (!htmlComponent) {
    console.error('❌ HTML component not found!');
    return;
  }

  console.log('✅ HTML component found:', CONFIG.htmlComponentId);

  // Wire listener FIRST — before any awaits so carrierMatchingReady is never dropped
  // if the iframe DOMContentLoaded fires before our async profile fetch completes
  htmlComponent.onMessage((event) => {
    handleHtmlMessage(event.data);
  });

  // Get initial user status and driver profile
  setCachedUserStatus(await getUserStatus());
  console.log('👤 Initial user status:', cachedUserStatus);

  // If logged in, try to get/create driver profile and fetch interests
  if (cachedUserStatus.loggedIn) {
    try {
      const profileResult = await loadDriverBootstrapData();
      if (profileResult.profile) {
        setCachedDriverProfile(profileResult.profile);
        console.log('👤 Driver profile loaded:', cachedDriverProfile._id);
        console.log('   Is new:', profileResult.isNew);
        console.log('   Completeness:', cachedDriverProfile.profile_completeness_score);
      }

      // Fetch driver's existing carrier interests
      const interestsResult = { success: true, interests: profileResult.interests || [] };
      if (interestsResult.success) {
        setCachedDriverInterests(interestsResult.interests);
        console.log('📋 Driver interests loaded:', cachedDriverInterests.length);
      }
    } catch (profileError) {
      console.error('Profile load error:', profileError);
    }
  }

  setVeloInitDone(true);

  // If HTML fired carrierMatchingReady before our async init finished, send pageReady now
  if (_htmlReadyPending) {
    setHtmlReadyPending(false);
    console.log('📬 Sending deferred pageReady (HTML was ready before Velo init)');
    _sendPageReady();
  }
});

// ============================================================================
// USER STATUS DETECTION
// ============================================================================

async function getUserStatus() {
  try {
    if (!wixUsers) {
      return { loggedIn: false, isPremium: false, tier: 'free' };
    }

    const user = wixUsers.currentUser;
    const loggedIn = user.loggedIn;

    console.log('🔍 Checking user login state:', loggedIn);

    if (!loggedIn) {
      return { loggedIn: false, isPremium: false, tier: 'free' };
    }

    // User is logged in - they get premium
    let userEmail = '';
    try {
      userEmail = await user.getEmail();
    } catch (e) {
      console.log('Could not get email');
    }

    const userId = user.id;

    // For now, any logged-in user is premium
    const isPremium = true;

    console.log(`✅ User authenticated: ${userEmail || userId} (Premium: ${isPremium})`);

    return {
      loggedIn: true,
      isPremium: isPremium,
      tier: 'premium',
      email: userEmail,
      userId: userId
    };

  } catch (error) {
    console.error('Error checking user status:', error);
    return { loggedIn: false, isPremium: false, tier: 'free' };
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
  return $w(`#${CONFIG.htmlComponentId}`);
}

// ============================================================================
// MESSAGE HANDLER - Enhanced with profile operations
// ============================================================================

async function handleHtmlMessage(msg) {
  if (!msg || !msg.type) return;
  if (!validateHtmlToPageMessage(msg)) {
    console.warn('Invalid HTML->Velo message envelope received');
    return;
  }

  const action = msg.action || msg.type;
  const payload = msg.data || {};

  // Validate and log inbound message
  validateInboundMessage(action);
  logMessageFlow('in', action, payload);

  return routeAiMatchingAction(action, payload, {
      ping: async () => {
        sendToHtml('pong', {
          timestamp: Date.now(),
          registeredInbound: MESSAGE_REGISTRY.inbound.length,
          registeredOutbound: MESSAGE_REGISTRY.outbound.length
        });
      },
      findMatches: async (driverPrefs) => {
        const freshStatus = await getUserStatus();
        setCachedUserStatus(freshStatus);
        try {
          await handleFindMatchesAsync(driverPrefs, freshStatus);
        } catch (asyncErr) {
          console.warn('[findMatches] Async path failed, falling back to sync:', asyncErr.message);
          await handleFindMatches(driverPrefs, freshStatus);
        }
      },
      pollSearchJob: async (pollPayload) => {
        const { jobId } = pollPayload || {};
        if (!jobId) return;
        try {
          const poll = await getAsyncCarrierSearchStatusForPage(jobId);
          if (poll.status === 'COMPLETE') {
            await _deliverAsyncResults(poll.results, pollPayload, cachedUserStatus);
          } else {
            sendToHtml('searchJobStatus', { jobId, status: poll.status, error: poll.error });
          }
        } catch (err) {
          sendToHtml('searchJobStatus', { jobId, status: 'FAILED', error: err.message });
        }
      },
      logInterest: async (interestPayload) => {
        await handleLogInterest(interestPayload);
      },
      retryEnrichment: async (retryPayload) => {
        await handleRetryEnrichment(retryPayload);
      },
      navigateToSignup: async () => {
        await handleNavigateToSignup();
      },
      navigateToLogin: async () => {
        await handleNavigateToLogin();
      },
      loginForApplication: async (loginPayload) => {
        if (loginPayload?.mode === 'login') {
          await handleNavigateToLogin();
          return;
        }
        await handleNavigateToSignup();
      },
      checkUserStatus: async () => {
        const status = await getUserStatus();
        setCachedUserStatus(status);
        sendToHtml('userStatusUpdate', status);
      },
      getDriverProfile: async () => {
        await handleGetDriverProfile();
      },
      navigateToSavedCarriers: async () => {
        wixLocation.to(CONFIG.savedCarriersPageUrl);
      },
      carrierMatchingReady: async () => {
        console.log('âœ… HTML Embed Ready');
        if (!_veloInitDone) {
          setHtmlReadyPending(true);
          console.log('â³ Deferring pageReady until Velo init completes...');
          return;
        }
        _sendPageReady();
      },
      submitApplication: async (applicationPayload) => {
        await handleSubmitApplication(applicationPayload);
      },
      saveProfileDocs: async (docsPayload) => {
        await handleSaveProfileDocs(docsPayload);
      },
      extractDocumentOCR: async (ocrPayload) => {
        await handleExtractDocumentOCR(ocrPayload);
      },
      getMatchExplanation: async (explanationPayload) => {
        await handleGetMatchExplanation(explanationPayload);
      },
      getDriverApplications: async () => {
        await handleGetDriverApplications();
      },
      getMutualInterest: async (interestPayload) => {
        await handleGetMutualInterest(interestPayload);
      },
      logFeatureInteraction: async (featurePayload = {}) => {
        trackFeatureInteractionForPage(featurePayload.featureId, featurePayload.userId, featurePayload.action, featurePayload)
          .catch(err => console.warn('Feature tracking failed:', err.message));
      },
      agentMessage: async (agentPayload) => {
        const agentText = agentPayload?.text || '';
        const agentContext = agentPayload?.context || {};
        const userId = cachedDriverProfile?._id || cachedUserStatus?.memberId || 'anonymous';
        sendToHtml('agentTyping', {});
        try {
          const agentResult = await handleAgentTurnForPage('driver', userId, agentText, agentContext);
          if (agentResult.type === 'approval_required') {
            sendToHtml('agentApprovalRequired', agentResult);
          } else {
            sendToHtml('agentResponse', agentResult);
          }
        } catch (err) {
          sendToHtml('agentResponse', { error: err.message });
        }
      },
      resolveApprovalGate: async (approvalPayload) => {
        const { approvalContext, decision, decidedBy } = approvalPayload || {};
        sendToHtml('agentTyping', {});
        try {
          const result = await resolveApprovalGateForPage(approvalContext, decision, decidedBy || 'user');
          sendToHtml('agentResponse', result);
        } catch (err) {
          sendToHtml('agentResponse', { error: err.message });
        }
      },
      getVoiceConfig: async () => {
        try {
          const voiceConf = await getVoiceConfigForPage();
          sendToHtml('voiceReady', voiceConf);
        } catch (err) {
          console.warn('Voice config failed:', err.message);
        }
      },
      startVoiceCall: async () => {},
      endVoiceCall: async () => {},
      default: async (_, unknownAction) => {
        console.log('Unknown message type:', unknownAction);
      }
  });
}

/* Legacy fallback removed
  switch (action) {
    // Health check - respond immediately
    case 'ping':
      sendToHtml('pong', {
        timestamp: Date.now(),
        registeredInbound: MESSAGE_REGISTRY.inbound.length,
        registeredOutbound: MESSAGE_REGISTRY.outbound.length
      });
      break;
    case 'findMatches': {
      // Get fresh user status before searching
      const freshStatus = await getUserStatus();
      setCachedUserStatus(freshStatus);
      // Try async Option B path first; fall back to synchronous Airtable search on error
      try {
        await handleFindMatchesAsync(msg.data, freshStatus);
      } catch (asyncErr) {
        console.warn('[findMatches] Async path failed, falling back to sync:', asyncErr.message);
        await handleFindMatches(msg.data, freshStatus);
      }
      break;
    }

    case 'pollSearchJob': {
      // HTML polling loop — check job status and relay to HTML
      const { jobId } = msg.data || {};
      if (!jobId) break;
      try {
        const poll = await getAsyncCarrierSearchStatusForPage(jobId);
        if (poll.status === 'COMPLETE') {
          // Reshape Railway results into the format handleFindMatches normally returns
          await _deliverAsyncResults(poll.results, msg.data, cachedUserStatus);
        } else {
          sendToHtml('searchJobStatus', { jobId, status: poll.status, error: poll.error });
        }
      } catch (err) {
        sendToHtml('searchJobStatus', { jobId, status: 'FAILED', error: err.message });
      }
      break;
    }

    case 'logInterest':
      await handleLogInterest(msg.data);
      break;

    case 'retryEnrichment':
      await handleRetryEnrichment(msg.data);
      break;

    case 'navigateToSignup':
      await handleNavigateToSignup();
      break;

    case 'navigateToLogin':
      await handleNavigateToLogin();
      break;

    case 'loginForApplication':
      // Reuse signup/login handler - mode passed from HTML determines behavior
      if (msg.data?.mode === 'login') {
        await handleNavigateToLogin();
      } else {
        await handleNavigateToSignup();
      }
      break;

    case 'checkUserStatus': {
      const status = await getUserStatus();
      setCachedUserStatus(status);
      sendToHtml('userStatusUpdate', status);
      break;
    }

    // =========================================
    // NEW: Profile-related actions
    // =========================================

    case 'getDriverProfile':
      await handleGetDriverProfile();
      break;

    case 'navigateToSavedCarriers':
      wixLocation.to(CONFIG.savedCarriersPageUrl);
      break;

    case 'carrierMatchingReady':
      console.log('✅ HTML Embed Ready');
      if (!_veloInitDone) {
        // Async init not done yet — defer pageReady until profile/interests are loaded
        setHtmlReadyPending(true);
        console.log('⏳ Deferring pageReady until Velo init completes...');
        break;
      }
      _sendPageReady();
      break;

    case 'submitApplication':
      await handleSubmitApplication(msg.data);
      break;

    case 'saveProfileDocs':
      await handleSaveProfileDocs(msg.data);
      break;

    case 'extractDocumentOCR':
      await handleExtractDocumentOCR(msg.data);
      break;

    case 'getMatchExplanation':
      await handleGetMatchExplanation(msg.data);
      break;

    case 'getDriverApplications':
      await handleGetDriverApplications();
      break;

    case 'getMutualInterest':
      await handleGetMutualInterest(msg.data);
      break;

    case 'logFeatureInteraction':
      // Non-blocking feature tracking
      trackFeatureInteractionForPage(msg.data.featureId, msg.data.userId, msg.data.action, msg.data)
        .catch(err => console.warn('Feature tracking failed:', err.message));
      break;

    case 'agentMessage': {
      const agentText = msg.data?.text || '';
      const agentContext = msg.data?.context || {};
      const userId = cachedDriverProfile?._id || cachedUserStatus?.memberId || 'anonymous';
      sendToHtml('agentTyping', {});
      try {
        const agentResult = await handleAgentTurnForPage('driver', userId, agentText, agentContext);
        if (agentResult.type === 'approval_required') {
          sendToHtml('agentApprovalRequired', agentResult);
        } else {
          sendToHtml('agentResponse', agentResult);
        }
      } catch (err) {
        sendToHtml('agentResponse', { error: err.message });
      }
      break;
    }

    case 'resolveApprovalGate': {
      const { approvalContext, decision, decidedBy } = msg.data || {};
      sendToHtml('agentTyping', {});
      try {
        const result = await resolveApprovalGateForPage(approvalContext, decision, decidedBy || 'user');
        sendToHtml('agentResponse', result);
      } catch (err) {
        sendToHtml('agentResponse', { error: err.message });
      }
      break;
    }

    case 'getVoiceConfig': {
      try {
        const voiceConf = await getVoiceConfigForPage();
        sendToHtml('voiceReady', voiceConf);
      } catch (err) {
        console.warn('Voice config failed:', err.message);
      }
      break;
    }

    case 'startVoiceCall':
    case 'endVoiceCall':
      // Voice calls handled client-side via VAPI SDK — no backend action needed
      break;

    default:
      console.log('Unknown message type:', action);
  }
}
*/

async function handleGetMatchExplanation(payload) {
  const carrierDot = payload?.carrierDot;

  try {
    const userStatus = await getUserStatus();

    // For logged-in users, try backend service first
    if (userStatus.loggedIn && carrierDot) {
      const result = await getDriverMatchExplanationForPage(userStatus.userId, carrierDot);
      if (result.success) {
        sendToHtml('matchExplanation', { ...result, carrierDot });
        return;
      }
    }

    // Fall back to local match data (works for both anonymous + backend failure)
    const explanation = buildLocalExplanation(carrierDot);
    sendToHtml('matchExplanation', explanation);

  } catch (error) {
    console.error('Error getting match explanation:', error);
    const explanation = buildLocalExplanation(carrierDot);
    sendToHtml('matchExplanation', explanation);
  }
}

// ============================================================================
// LOCAL MATCH EXPLANATION BUILDER
// ============================================================================

const SCORE_LABELS = {
  location: 'Location',
  pay: 'Pay',
  operationType: 'Operation Type',
  turnover: 'Turnover',
  safety: 'Safety Record',
  truckAge: 'Fleet Age',
  fleetSize: 'Fleet Size',
  qualityScore: 'Overall Quality'
};

const SCORE_TEXT = {
  location: { good: 'Within your preferred distance', partial: 'Moderate commute distance', poor: 'Outside your preferred range' },
  pay: { good: 'Meets or exceeds your pay target', partial: 'Close to your pay expectations', poor: 'Below your minimum CPM' },
  operationType: { good: 'Matches your preferred run type', partial: 'Similar operation style', poor: 'Different operation type' },
  turnover: { good: 'Low driver turnover', partial: 'Average turnover rate', poor: 'High turnover rate' },
  safety: { good: 'Strong safety record', partial: 'Acceptable safety record', poor: 'Safety concerns noted' },
  truckAge: { good: 'Modern fleet equipment', partial: 'Average fleet age', poor: 'Older fleet equipment' },
  fleetSize: { good: 'Matches your fleet size preference', partial: 'Different fleet size than preferred', poor: 'Very different fleet size' },
  qualityScore: { good: 'High overall quality score', partial: 'Average quality score', poor: 'Below average quality score' }
};

function buildLocalExplanation(carrierDot) {
  const matchData = lastSearchResults?.matches?.find(
    m => String(m.carrier?.DOT_NUMBER) === String(carrierDot)
  );

  if (!matchData) {
    return { success: false, carrierDot, error: 'Match data not available' };
  }

  const scores = matchData.scores || {};
  const overall = matchData.overallScore || 0;
  const enrichment = matchData.enrichment || {};
  const carrier = matchData.carrier || {};
  const fmcsa = enrichment.fmcsa || matchData.fmcsa || {};

  const categories = Object.entries(scores)
    .filter(([key]) => SCORE_LABELS[key])
    .map(([key, score]) => {
      const s = Math.round(score || 0);
      const tier = s >= 70 ? 'good' : s >= 40 ? 'partial' : 'poor';
      return {
        key,
        label: SCORE_LABELS[key],
        score: s,
        weight: 0,
        text: SCORE_TEXT[key]?.[tier] || `Score: ${s}%`,
        status: tier
      };
    })
    .sort((a, b) => b.score - a.score);

  const summary = overall >= 70
    ? 'This carrier is a strong match for your preferences.'
    : overall >= 50
      ? 'This carrier partially matches your preferences.'
      : 'This carrier has some differences from your preferences.';

  // Build a rich narrative from AI intel + FMCSA data if available
  let llm_narrative = null;
  const carrierName = carrier.LEGAL_NAME || carrier.DBA_NAME || 'This carrier';
  const parts = [];

  if (enrichment.ai_summary) {
    // Strip bullet formatting for inline narrative
    const cleaned = enrichment.ai_summary.replace(/^[•\-]\s*/gm, '').replace(/\*\*/g, '').trim();
    if (cleaned && cleaned !== 'null') parts.push(cleaned);
  }

  if (!parts.length) {
    // Synthesize from individual enrichment fields
    const _clean = v => (v && v.toLowerCase() !== 'unknown' && v.toLowerCase() !== 'n/a') ? v : null;
    const city = _clean(carrier.PHY_CITY);
    const state = _clean(carrier.PHY_STATE);
    const loc = (city && state) ? `${city}, ${state}` : (city || state || null);
    const fleet = carrier.NBR_POWER_UNIT;
    const pay = carrier.PAY_CPM || enrichment.pay_cpm_range;
    const sentiment = enrichment.driver_sentiment;
    const hiringOpp = enrichment.hiring_opportunity;
    const safety = fmcsa.safety_rating;

    // Always push intro — carrier name is always available as a minimum
    const intro = `${carrierName}${loc ? ` is based in ${loc}` : ''}${fleet ? ` with a fleet of ${fleet} trucks` : ''}.`;
    parts.push(intro);
    if (safety && safety !== 'UNKNOWN') parts.push(`FMCSA safety rating: ${safety}.`);
    if (pay && pay !== 'null') parts.push(`Pay: ${pay}.`);
    if (sentiment && sentiment !== 'No Reviews') parts.push(`Driver sentiment: ${sentiment}.`);
    if (hiringOpp && hiringOpp !== 'N/A') parts.push(`Hiring opportunity: ${hiringOpp}.`);
  }

  if (parts.length) {
    llm_narrative = parts.join(' ');
  }

  // Use the scoring module's rationale if available
  const rationale = matchData.rationale || [];
  const tip = rationale.length > 0
    ? rationale[0]
    : 'Sign in to see your personalized match score and get AI-powered insights tailored to your CDL profile.';

  return {
    success: true,
    carrierDot,
    overallScore: overall,
    explanation: { summary, categories, tip, llm_narrative }
  };
}

// ============================================================================
// NAVIGATION HANDLERS
// ============================================================================

async function handleNavigateToSignup() {
  console.log('🔗 Navigating to signup');

  if (wixUsers) {
    try {
      const user = await wixUsers.promptLogin({ mode: 'signup' });
      console.log('✅ User signed up:', user.id);

      // Refresh user status
      setCachedUserStatus(await getUserStatus());

      // Create driver profile for new user
      try {
        const profileResult = await getDriverProfileForPage();
        if (profileResult.success) {
          setCachedDriverProfile(profileResult.profile);
          console.log('👤 Created profile for new user');
        }
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
      }

      // Notify HTML
      sendToHtml('loginSuccess', {
        message: 'Account created! You now have Premium access.',
        userStatus: cachedUserStatus,
        driverProfile: cachedDriverProfile ? {
          id: cachedDriverProfile._id,
          completeness: cachedDriverProfile.profile_completeness_score,
          isNew: true
        } : null
      });

    } catch (error) {
      console.log('Signup cancelled or failed:', error);
      sendToHtml('loginCancelled', {});
    }
  } else {
    wixLocation.to(CONFIG.signupPageUrl);
  }
}

async function handleNavigateToLogin() {
  console.log('🔗 Navigating to login');

  if (wixUsers) {
    try {
      const user = await wixUsers.promptLogin({ mode: 'login' });
      console.log('✅ User logged in:', user.id);

      // Refresh user status
      setCachedUserStatus(await getUserStatus());
      console.log('👤 Updated user status after login:', cachedUserStatus);

      // Load driver profile
      try {
        const profileResult = await getDriverProfileForPage();
        if (profileResult.success) {
          setCachedDriverProfile(profileResult.profile);
          console.log('👤 Loaded profile after login');
        }
      } catch (profileError) {
        console.error('Profile load error:', profileError);
      }

      // Notify HTML with full profile for form pre-population
      sendToHtml('loginSuccess', {
        message: 'Welcome back! You now have Premium access.',
        userStatus: cachedUserStatus,
        driverProfile: cachedDriverProfile ? {
          id: cachedDriverProfile._id,
          displayName: cachedDriverProfile.display_name,
          homeZip: cachedDriverProfile.home_zip,
          maxDistance: cachedDriverProfile.max_commute_miles,
          minCPM: cachedDriverProfile.min_cpm,
          operationType: cachedDriverProfile.preferred_operation_type,
          maxTurnover: cachedDriverProfile.max_turnover_percent,
          maxTruckAge: cachedDriverProfile.max_truck_age_years,
          fleetSize: cachedDriverProfile.fleet_size_preference,
          completeness: cachedDriverProfile.profile_completeness_score,
          totalSearches: cachedDriverProfile.total_searches
        } : null
      });

    } catch (error) {
      console.log('Login cancelled:', error);
      sendToHtml('loginCancelled', {});
    }
  } else {
    wixLocation.to(CONFIG.loginPageUrl);
  }
}

// ============================================================================
// FIND MATCHES — ASYNC OPTION B PATH
// Kicks off the Railway async search, then Velo polls internally every 3s.
// HTML stays in loading state until matchResults arrives — no bridge messages
// needed for the polling loop, so stale HTML cache is not a problem.
// ============================================================================

async function handleFindMatchesAsync(driverPrefs, userStatus) {
  const isPremium = userStatus?.isPremium || false;

  console.log('🚀 [async] Triggering Option B carrier search...');

  const { jobId } = await startAsyncCarrierSearchForPage(driverPrefs, isPremium);

  console.log(`📡 [async] Job ${jobId} started — Velo polling loop starting`);

  // Velo owns the polling loop — no dependency on HTML handling searchJobStarted
  _pollUntilComplete(jobId, driverPrefs, userStatus, 0);
}

/**
 * Recursive setTimeout-based polling loop (runs in Velo page code / browser).
 * Checks job status every 3s, up to 30 attempts (90s max).
 * On COMPLETE: calls _deliverAsyncResults → sends matchResults to HTML.
 * On FAILED or timeout: sends matchError to HTML.
 */
function _pollUntilComplete(jobId, driverPrefs, userStatus, attempts) {
  const MAX_ATTEMPTS = 30;
  if (attempts >= MAX_ATTEMPTS) {
    console.warn(`[async poll] Job ${jobId} timed out after ${MAX_ATTEMPTS} attempts`);
    sendToHtml('matchError', { error: 'Search timed out. Please try again.' });
    return;
  }
  setTimeout(async () => {
    try {
      console.log(`[async poll] Checking job ${jobId} (attempt ${attempts + 1})`);
      const poll = await getAsyncCarrierSearchStatusForPage(jobId);
      if (poll.status === 'COMPLETE') {
        console.log(`✅ [async poll] Job ${jobId} complete — delivering results`);
        await _deliverAsyncResults(poll.results, driverPrefs, userStatus);
      } else if (poll.status === 'FAILED') {
        console.warn(`[async poll] Job ${jobId} failed:`, poll.error);
        sendToHtml('matchError', { error: poll.error || 'Search failed. Please try again.' });
      } else {
        // Still PROCESSING — poll again
        _pollUntilComplete(jobId, driverPrefs, userStatus, attempts + 1);
      }
    } catch (err) {
      console.error('[async poll] Unexpected error:', err.message);
      sendToHtml('matchError', { error: err.message });
    }
  }, 3000);
}

/**
 * Called when polling detects COMPLETE.
 * Enriches the top Airtable-backed result (dot:{number} carriers skip enrichment)
 * and delivers the final matchResults payload to the HTML.
 */
async function _deliverAsyncResults(rawResults, origPrefs, userStatus) {
  if (!rawResults || rawResults.length === 0) {
    sendToHtml('matchError', { error: 'No carriers found. Try adjusting your preferences.' });
    return;
  }

  const driverPrefs = origPrefs?.driverPrefs || origPrefs || {};

  // Phase 1: Merge mutual interests for logged-in users
  let enrichedMatches = rawResults;
  if (userStatus?.userId || userStatus?.loggedIn) {
    try {
      const driverId = userStatus.userId || wixUsers?.currentUser?.id;
      if (driverId) {
        const interestResult = await getDriverMutualInterestsForPage(driverId);
        interestResult.mutualInterests = interestResult.mutualInterests || interestResult.interests;
        interestResult.mutualInterests = interestResult.mutualInterests || interestResult.interests;
        if (interestResult.success && interestResult.interests?.length > 0) {
          const mutualMap = {};
          interestResult.interests.forEach(m => { mutualMap[String(m.carrierDot)] = m; });
          enrichedMatches = rawResults.map(match => {
            const dot = String(match.carrier?.DOT_NUMBER);
            return mutualMap[dot]
              ? { ...match, isMutualMatch: true, mutualStrength: mutualMap[dot].mutualStrength, mutualSignals: mutualMap[dot].signals }
              : match;
          });
        }
      }
    } catch (err) {
      console.warn('[async] Mutual interest merge failed (non-blocking):', err.message);
    }
  }

  setLastSearchResults({ matches: enrichedMatches, totalScored: enrichedMatches.length });

  const isPremiumUser = userStatus?.isPremium || false;
  const isLoggedIn = !!(userStatus?.loggedIn || userStatus?.userId);
  const maxVisible = isPremiumUser ? 10 : 2;
  const visibleMatches = enrichedMatches.slice(0, maxVisible);
  const hiddenCount = Math.max(0, enrichedMatches.length - maxVisible);
  const _needsAutoEnrich = visibleMatches.find(m => m.needsEnrichment && !m.fmcsaOnly);
  const autoEnrichDot = _needsAutoEnrich ? String(_needsAutoEnrich.carrier.DOT_NUMBER) : null;

  sendToHtml('matchResults', {
    matches:      visibleMatches,
    totalScored:  enrichedMatches.length,
    totalMatches: enrichedMatches.length,
    userTier:     userStatus?.tier || 'free',
    maxAllowed:   maxVisible,
    isPremium:    isPremiumUser,
    upsellMessage: !isLoggedIn && hiddenCount > 0
      ? `Sign up free to see ${hiddenCount} more matches in your area.`
      : null,
    driverProfile: cachedDriverProfile ? {
      id: cachedDriverProfile._id,
      displayName: cachedDriverProfile.display_name,
      completeness: cachedDriverProfile.profile_completeness_score,
    } : null,
    autoEnrichDot,
    source: 'async-option-b',
  });

  // Fire enrichmentUpdate for every visible carrier Railway pre-enriched via Groq
  // so the renderer paints immediately without waiting for a second round-trip.
  const visiblePreEnriched = visibleMatches.filter(m => !m.needsEnrichment && m.enrichment);
  if (visiblePreEnriched.length > 0) {
    for (const m of visiblePreEnriched) {
      const dotNumber = String(m.carrier.DOT_NUMBER);
      sendToHtml('enrichmentUpdate', {
        dot_number: dotNumber,
        status:     m.enrichment.error ? 'error' : 'complete',
        ...m.enrichment,
      });
      // Backfill lastSearchResults so buildLocalExplanation can access enrichment for WHY THIS JOB
      const _preIdx = lastSearchResults?.matches?.findIndex(mr => String(mr.carrier?.DOT_NUMBER) === dotNumber);
      if (_preIdx >= 0) lastSearchResults.matches[_preIdx].enrichment = m.enrichment;
    }
    sendToHtml('enrichmentComplete', { totalEnriched: visiblePreEnriched.length });
  }

  // For visible carriers Railway didn't enrich, use Railway/Groq first
  const visibleNeedsEnrich = visibleMatches.find(m => m.needsEnrichment && !m.fmcsaOnly);
  if (visibleNeedsEnrich) {
    const dotNumber = String(visibleNeedsEnrich.carrier.DOT_NUMBER);
    const carrierName = visibleNeedsEnrich.carrier.LEGAL_NAME || visibleNeedsEnrich.carrier.DBA_NAME || `DOT ${dotNumber}`;
    const knownData = {
      city:              visibleNeedsEnrich.carrier.PHY_CITY          || null,
      state:             visibleNeedsEnrich.carrier.PHY_STATE         || null,
      fleet_size:        visibleNeedsEnrich.carrier.NBR_POWER_UNIT    || null,
      safety_rating:     visibleNeedsEnrich.carrier.SAFETY_RATING     || null,
      carrier_operation: visibleNeedsEnrich.carrier.CARRIER_OPERATION || null,
    };
    sendToHtml('enrichmentUpdate', { dot_number: dotNumber, status: 'loading', position: 1, total: 1, message: 'AI Researching...' });
    try {
      const jobId = 'enr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      await startCarrierEnrichmentJobForPage(jobId, dotNumber, carrierName, knownData);
      console.log(`📡 [auto-enrich] Job ${jobId} started for DOT ${dotNumber} — polling...`);
      let attempts = 0;
      const maxAttempts = 30;
      await new Promise((resolve) => {
        const timer = setInterval(async () => {
          attempts++;
          try {
            const statusResult = await getCarrierEnrichmentStatusForPage(jobId);
            if (statusResult.status === 'COMPLETE') {
              clearInterval(timer);
              console.log(`✅ [auto-enrich] Job ${jobId} complete — delivering enrichment for DOT ${dotNumber}`);
              const _enrichData = statusResult.enrichment;
              sendToHtml('enrichmentUpdate', { dot_number: dotNumber, status: 'complete', ..._enrichData });
              // Backfill lastSearchResults so buildLocalExplanation can access enrichment
              const _idx = lastSearchResults?.matches?.findIndex(m => String(m.carrier?.DOT_NUMBER) === String(dotNumber));
              if (_idx >= 0) lastSearchResults.matches[_idx].enrichment = _enrichData;
              if (!visiblePreEnriched.length) sendToHtml('enrichmentComplete', { totalEnriched: 1 });
              resolve();
            } else if (statusResult.status === 'FAILED') {
              clearInterval(timer);
              throw new Error(statusResult.error || 'Enrichment failed');
            } else if (attempts >= maxAttempts) {
              clearInterval(timer);
              throw new Error('Auto-enrichment timed out');
            }
          } catch (pollErr) {
            clearInterval(timer);
            console.warn(`[auto-enrich] Poll error for DOT ${dotNumber}:`, pollErr.message);
            // Fallback to Wix-side Groq if Railway times out
            const enrichment = await enrichWithRetry(dotNumber, visibleNeedsEnrich.carrier, driverPrefs);
            const enrichStatus = enrichment.building ? 'building' : enrichment.error ? 'error' : 'complete';
            sendToHtml('enrichmentUpdate', { dot_number: dotNumber, status: enrichStatus, ...enrichment });
            // Backfill lastSearchResults so buildLocalExplanation can access enrichment
            const _idx2 = lastSearchResults?.matches?.findIndex(m => String(m.carrier?.DOT_NUMBER) === String(dotNumber));
            if (_idx2 >= 0) lastSearchResults.matches[_idx2].enrichment = enrichment;
            if (!visiblePreEnriched.length) sendToHtml('enrichmentComplete', { totalEnriched: 1 });
            resolve();
          }
        }, 3000);
      });
    } catch (autoEnrichErr) {
      console.warn(`[auto-enrich] Failed for DOT ${dotNumber}:`, autoEnrichErr.message);
      // Final fallback to Wix Groq
      const enrichment = await enrichWithRetry(dotNumber, visibleNeedsEnrich.carrier, driverPrefs);
      const enrichStatus = enrichment.building ? 'building' : enrichment.error ? 'error' : 'complete';
      sendToHtml('enrichmentUpdate', { dot_number: dotNumber, status: enrichStatus, ...enrichment });
      // Backfill lastSearchResults so buildLocalExplanation can access enrichment
      const _idx3 = lastSearchResults?.matches?.findIndex(m => String(m.carrier?.DOT_NUMBER) === String(dotNumber));
      if (_idx3 >= 0) lastSearchResults.matches[_idx3].enrichment = enrichment;
      if (!visiblePreEnriched.length) sendToHtml('enrichmentComplete', { totalEnriched: 1 });
    }
  }
}

// ============================================================================
// FIND MATCHES - Synchronous Airtable path (fallback / existing behavior)
// ============================================================================

async function handleFindMatches(driverPrefs, userStatus) {
  const isPremium = userStatus?.isPremium || false;

  console.log('🔍 Running backend search with:', driverPrefs);
  console.log('👤 User tier:', userStatus?.tier || 'free', '| isPremium:', isPremium);

  try {
    // Call backend with premium flag
    const result = await findCarrierMatchesForPage(driverPrefs, isPremium);

    if (!result.success) {
      sendToHtml('matchError', { error: result.error });
      return;
    }

    console.log(`📊 Scored ${result.totalScored}, returning ${result.matches.length} (${result.userTier} tier)`);

    // Update cached profile if returned
    if (result.driverProfile) {
      setCachedDriverProfile({ ...(cachedDriverProfile || {}), ...result.driverProfile });
    }

    // Phase 1: Enrich with Mutual Interests (if logged in)
    let enrichedMatches = result.matches;
    if (userStatus?.userId || userStatus?.loggedIn) {
      try {
        const driverId = userStatus.userId || wixUsers.currentUser.id;
        const interestResult = await getDriverMutualInterestsForPage(driverId);

        if (interestResult.success && interestResult.interests?.length > 0) {
          console.log(`🤝 Found ${interestResult.mutualInterests.length} mutual matches`);

          // Create lookup map for efficiency
          const mutualMap = {};
          interestResult.interests.forEach(m => {
            mutualMap[String(m.carrierDot)] = m;
          });

          // Merge into matches
          enrichedMatches = result.matches.map(match => {
            const dot = String(match.carrier?.DOT_NUMBER);
            if (mutualMap[dot]) {
              return {
                ...match,
                isMutualMatch: true,
                mutualStrength: mutualMap[dot].mutualStrength,
                mutualSignals: mutualMap[dot].signals,
                lastMutualActivity: mutualMap[dot].lastCarrierActivityDate
              };
            }
            return match;
          });
        }
      } catch (err) {
        console.error('Failed to fetch mutual interests:', err);
        // Don't fail the search, just log and continue without mutual data
      }
    }

    // Store results for later use (e.g., anonymous match explanations)
    setLastSearchResults({ ...result, matches: enrichedMatches });

    // Handle enrichments — only auto-enrich the #1 match; rest are on-demand via button click
    const needsEnrichment = result.matches.filter(m => m.needsEnrichment);
    const autoEnrichDot = needsEnrichment.length > 0 ? String(needsEnrichment[0].carrier.DOT_NUMBER) : null;

    // Send results with tier info AND profile info (include autoEnrichDot so HTML knows which card to show loading)
    sendToHtml('matchResults', {
      matches: enrichedMatches,
      totalScored: result.totalScored,
      userTier: result.userTier,
      maxAllowed: result.maxAllowed,
      totalMatches: result.totalMatches,
      upsellMessage: result.upsellMessage,
      isPremium: isPremium,
      driverProfile: result.driverProfile,
      autoEnrichDot
    });

    if (needsEnrichment.length > 0) {
      console.log(`🤖 Auto-enriching top match (${needsEnrichment.length} total need enrichment)`);
      const topMatch = needsEnrichment[0];
      const dotNumber = topMatch.carrier.DOT_NUMBER;

      sendToHtml('enrichmentUpdate', {
        dot_number: dotNumber,
        status: 'loading',
        position: 1,
        total: 1
      });

      const enrichment = await enrichWithRetry(dotNumber, topMatch.carrier, driverPrefs);

      // Determine status: 'complete' (real data), 'building' (background in progress), or 'error'
      let enrichStatus = 'complete';
      if (enrichment.building) {
        enrichStatus = 'building';
      } else if (enrichment.error) {
        enrichStatus = 'error';
      }

      sendToHtml('enrichmentUpdate', {
        dot_number: dotNumber,
        status: enrichStatus,
        ...enrichment
      });

      sendToHtml('enrichmentComplete', { totalEnriched: 1 });
    }

  } catch (error) {
    console.error('❌ Search error:', error);
    sendToHtml('matchError', { error: error.message });
  }
}

// ============================================================================
// STAGGERED ENRICHMENT
// ============================================================================

async function enrichCarriersSequentially(matches, driverPrefs) {
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const dotNumber = match.carrier.DOT_NUMBER;

    console.log(`🤖 Enriching DOT: ${dotNumber} (${i + 1}/${matches.length})`);

    sendToHtml('enrichmentUpdate', {
      dot_number: dotNumber,
      status: 'loading',
      position: i + 1,
      total: matches.length
    });

    const enrichment = await enrichWithRetry(dotNumber, match.carrier, driverPrefs);

    sendToHtml('enrichmentUpdate', {
      dot_number: dotNumber,
      status: enrichment.error ? 'error' : 'complete',
      ...enrichment
    });

    if (i < matches.length - 1) {
      await delay(CONFIG.enrichmentDelayMs);
    }
  }

  console.log('✅ All enrichments complete');
  sendToHtml('enrichmentComplete', { totalEnriched: matches.length });
}

async function enrichWithRetry(dotNumber, carrierData, driverPrefs) {
  let lastError = null;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      return await enrichCarrierForPage(dotNumber, carrierData, driverPrefs);
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed for DOT ${dotNumber}:`, error.message);

      if (attempt < CONFIG.maxRetries) {
        const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('rate');
        await delay(isRateLimit ? CONFIG.retryDelayMs * 2 : CONFIG.retryDelayMs);
      }
    }
  }

  return {
    dot_number: String(dotNumber),
    error: true,
    errorMessage: lastError?.message || 'Enrichment failed',
    ai_summary: 'AI enrichment unavailable. Check FMCSA records directly.',
    data_confidence: 'None'
  };
}

// ============================================================================
// RETRY SINGLE ENRICHMENT
// ============================================================================

async function handleRetryEnrichment(data) {
  const dotNumber = data.dot || data.dot_number;
  if (!dotNumber) return;

  console.log(`🔄 [async] Triggering Railway/Groq enrichment for DOT: ${dotNumber}`);
  sendToHtml('enrichmentUpdate', { dot_number: dotNumber, status: 'loading', message: 'Researching...' });

  try {
    // Pull carrier context from last search results for better AI research context
    const matchData   = lastSearchResults?.matches?.find(
      m => String(m.carrier?.DOT_NUMBER) === String(dotNumber)
    );
    const carrier     = matchData?.carrier || {};
    const carrierName = carrier.LEGAL_NAME || carrier.DBA_NAME || `DOT ${dotNumber}`;
    const knownData   = {
      city:              carrier.PHY_CITY          || null,
      state:             carrier.PHY_STATE         || null,
      fleet_size:        carrier.NBR_POWER_UNIT    || null,
      safety_rating:     carrier.SAFETY_RATING     || null,
      carrier_operation: carrier.CARRIER_OPERATION || null,
    };

    // Generate a job ID and kick Railway async (returns immediately, <1s)
    const jobId = 'enr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await startCarrierEnrichmentJobForPage(jobId, dotNumber, carrierName, knownData);

    console.log(`📡 [enrich] Job ${jobId} started for DOT ${dotNumber} — polling...`);

    // Poll every 3s until Railway enrichment finishes (max 90s = 30 attempts)
    let attempts = 0;
    const maxAttempts = 30;
    await new Promise((resolve) => {
      const timer = setInterval(async () => {
        attempts++;
        try {
          const statusResult = await getCarrierEnrichmentStatusForPage(jobId);
          if (statusResult.status === 'COMPLETE') {
            clearInterval(timer);
            console.log(`✅ [enrich] Job ${jobId} complete — delivering enrichment`);
            sendToHtml('enrichmentUpdate', {
              dot_number: String(dotNumber),
              status: 'complete',
              ...statusResult.enrichment,
            });
            // Backfill lastSearchResults so buildLocalExplanation can use ai_summary for WHY THIS JOB
            const _retryIdx = lastSearchResults?.matches?.findIndex(m => String(m.carrier?.DOT_NUMBER) === String(dotNumber));
            if (_retryIdx >= 0) lastSearchResults.matches[_retryIdx].enrichment = statusResult.enrichment;
            resolve();
          } else if (statusResult.status === 'FAILED') {
            clearInterval(timer);
            throw new Error(statusResult.error || 'Enrichment failed');
          } else if (attempts >= maxAttempts) {
            clearInterval(timer);
            throw new Error('Enrichment timed out after 90s');
          }
        } catch (pollErr) {
          clearInterval(timer);
          console.warn(`[retryEnrichment] Railway failed for DOT ${dotNumber} — falling back to Groq:`, pollErr.message);
          try {
            const carrier = lastSearchResults?.matches?.find(
              m => String(m.carrier?.DOT_NUMBER) === String(dotNumber)
            )?.carrier || {};
            const groqResult = await enrichWithRetry(dotNumber, carrier, null);
            sendToHtml('enrichmentUpdate', {
              dot_number: String(dotNumber),
              status: groqResult.error ? 'error' : 'complete',
              ...groqResult,
            });
            // Backfill lastSearchResults so buildLocalExplanation can use ai_summary for WHY THIS JOB
            const _groqIdx = lastSearchResults?.matches?.findIndex(m => String(m.carrier?.DOT_NUMBER) === String(dotNumber));
            if (_groqIdx >= 0) lastSearchResults.matches[_groqIdx].enrichment = groqResult;
          } catch (groqErr) {
            sendToHtml('enrichmentUpdate', {
              dot_number: String(dotNumber),
              status: 'error',
              error: true,
              ai_summary: 'AI profile unavailable. Check FMCSA records directly.',
            });
          }
          resolve();
        }
      }, 3000);
    });

  } catch (error) {
    console.error(`[retryEnrichment] Failed for DOT ${dotNumber}:`, error.message);
    sendToHtml('enrichmentUpdate', {
      dot_number: String(dotNumber),
      status: 'error',
      error: true,
      ai_summary: 'AI profile unavailable. Check FMCSA records directly.',
    });
  }
}

// ============================================================================
// LOG INTEREST - Now updates driver profile
// ============================================================================

async function handleLogInterest(data) {
  console.log('📝 Logging interest:', data.carrierName);

  const INTEREST_TIMEOUT_MS = 10000;

  try {
    const result = await Promise.race([
      logCarrierInterestForPage({
        carrierDOT: data.carrierDOT,
        carrierName: data.carrierName,
        driverZip: data.driverZip,
        driverName: data.driverName,
        matchScore: data.matchScore,
        action: 'interested'
      }),
      new Promise(resolve =>
        setTimeout(() => resolve({ success: true, method: 'optimistic', timedOut: true }), INTEREST_TIMEOUT_MS)
      )
    ]);

    if (result.timedOut) {
      console.log('⏱️ Interest save timed out — responding optimistically');
    }

    if (result.success) {
      sendToHtml('interestLogged', {
        success: true,
        carrierDOT: data.carrierDOT,
        method: result.method,
        isNew: result.isNew
      });
    } else {
      console.log('⚠️ Interest logging failed:', result.error);
      sendToHtml('interestLogged', {
        success: false,
        carrierDOT: data.carrierDOT,
        error: result.error || 'Failed to save interest'
      });
    }
  } catch (error) {
    console.error('Error logging interest:', error);
    sendToHtml('interestLogged', {
      success: false,
      carrierDOT: data.carrierDOT,
      error: error.message || 'Unexpected error'
    });
  }
}

// ============================================================================
// NEW: Profile Handlers
// ============================================================================

async function handleGetDriverProfile() {
  try {
    const profileResult = await getDriverProfileForPage();

    if (profileResult.success) {
      setCachedDriverProfile(profileResult.profile);
      sendToHtml('driverProfileLoaded', {
        success: true,
        profile: normalizeDriverProfileForHtml(cachedDriverProfile),
        isNew: profileResult.isNew
      });
    } else {
      sendToHtml('driverProfileLoaded', { success: false, error: profileResult.error });
    }
  } catch (error) {
    console.error('Error getting profile:', error);
    sendToHtml('driverProfileLoaded', { success: false, error: error.message });
  }
}

async function handleGetSavedCarriers() {
  try {
    const result = await getDriverSavedCarriersForPage();

    sendToHtml('savedCarriersLoaded', {
      success: result.success,
      carriers: result.carriers,
      totalCount: result.totalCount,
      error: result.error
    });
  } catch (error) {
    console.error('Error getting saved carriers:', error);
    sendToHtml('savedCarriersLoaded', { success: false, carriers: [], error: error.message });
  }
}

async function handleToggleDiscoverability(data) {
  try {
    const result = await updateDriverDiscoverabilityForPage(data.isDiscoverable);

    if (result.success) {
      setCachedDriverProfile(result.profile);
      sendToHtml('discoverabilityUpdated', {
        success: true,
        isDiscoverable: result.profile.is_discoverable
      });
    } else {
      sendToHtml('discoverabilityUpdated', { success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error toggling discoverability:', error);
    sendToHtml('discoverabilityUpdated', { success: false, error: error.message });
  }
}


async function handleSaveProfileDocs(data) {
  try {
    const result = await saveDriverDocumentsForPage(data);

    if (result.success) {
      setCachedDriverProfile(result.profile);

      // Send success back to HTML to close modal
      sendToHtml('profileSaved', {
        success: true,
        profile: {
          completeness: cachedDriverProfile.profile_completeness_score,
          missingFields: cachedDriverProfile.missing_fields,
          cdl_front_image: cachedDriverProfile.cdl_front_image,
          cdl_back_image: cachedDriverProfile.cdl_back_image,
          med_card_image: cachedDriverProfile.med_card_image,
          resume_file: cachedDriverProfile.resume_file
        }
      });

      // Update HTML with new profile state
      sendToHtml('driverProfileLoaded', {
        success: true,
        profile: {
          id: cachedDriverProfile._id,
          displayName: cachedDriverProfile.display_name,
          homeZip: cachedDriverProfile.home_zip,
          completeness: cachedDriverProfile.profile_completeness_score,
          missingFields: cachedDriverProfile.missing_fields,
          cdl_front_image: cachedDriverProfile.cdl_front_image,
          cdl_back_image: cachedDriverProfile.cdl_back_image,
          med_card_image: cachedDriverProfile.med_card_image,
          resume_file: cachedDriverProfile.resume_file
        }
      });

    } else {
      sendToHtml('profileSaved', { success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error saving profile docs:', error);
    sendToHtml('profileSaved', { success: false, error: error.message });
  }
}

// ============================================================================
// REAL-TIME OCR FOR FORM AUTO-FILL
// ============================================================================

async function handleExtractDocumentOCR(data) {
  if (!data || !data.base64Data || !data.docType) {
    sendToHtml('ocrResult', {
      success: false,
      docType: data?.docType,
      error: 'Missing document data or type'
    });
    return;
  }

  console.log(`🔍 Real-time OCR requested for ${data.docType}`);

  try {
    const result = await extractDocumentForAutoFillForPage(data.base64Data, data.docType);

    console.log(`📄 OCR Result for ${data.docType}:`, result.success ? 'Success' : 'Failed');

    sendToHtml('ocrResult', result);

  } catch (error) {
    console.error('❌ OCR extraction error:', error);
    sendToHtml('ocrResult', {
      success: false,
      docType: data.docType,
      error: error.message
    });
  }
}

// ============================================================================
// PAGE READY PAYLOAD
// ============================================================================

function _sendPageReady() {
  sendToHtml('pageReady', buildPageReadyPayload(pageState, wixUsers?.currentUser?.id || null));
}

// ============================================================================
// UTILITIES
// ============================================================================

function sendToHtml(type, data) {
  // Validate outbound message is registered
  if (!(isKnownContractOutboundMessage(type) || MESSAGE_REGISTRY.outbound.includes(type))) {
    console.warn(`⚠️ UNREGISTERED OUTBOUND MESSAGE: "${type}" - Add to MESSAGE_REGISTRY.outbound`);
  }

  logMessageFlow('out', type, data);

  try {
    const component = getComponent();
    if (!(component && typeof component.postMessage === 'function')) {
      return;
    }

    sendToHtmlBridge(type, data, {
      component,
      logMessageFlow: null,
      fallbackRegistry: MESSAGE_REGISTRY.outbound
    });
  } catch (error) {
    console.error('Error sending to HTML:', error);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// APPLICATION SUBMISSION HANDLER
// ============================================================================

async function handleSubmitApplication(data) {
  if (!data || !data.carrierDOT) {
    sendToHtml('applicationSubmitted', { success: false, error: 'Missing carrier information' });
    return;
  }

  try {
    console.log('📝 Submitting application to carrier:', data.carrierDOT);

    // Pass ALL form data to backend (don't filter - let backend handle it)
    const result = await submitDriverApplicationForPage({
      // Carrier info
      carrierDOT: data.carrierDOT,
      carrierName: data.carrierName,
      matchScore: data.matchScore,

      // Driver identity (NEW)
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,  // Date of Birth - CRITICAL FIX

      // Contact info
      phone: data.phone,
      email: data.email,
      preferredContact: data.preferredContact,

      // Location (NEW)
      city: data.city,
      state: data.state,
      homeZip: data.homeZip,

      // CDL info
      cdlNumber: data.cdlNumber,
      cdlExpiration: data.cdlExpiration,
      cdlClass: data.cdlClass,           // NEW
      endorsements: data.endorsements,   // NEW - array
      medCardExpiration: data.medCardExpiration,

      // Experience (NEW)
      yearsExperience: data.yearsExperience,
      equipmentExperience: data.equipmentExperience,  // NEW - array
      mvrStatus: data.mvrStatus,                      // NEW

      // Safety & Compliance (NEW)
      accidentsLast3Years: data.accidentsLast3Years,
      violationsLast3Years: data.violationsLast3Years,
      cdlRestrictions: data.cdlRestrictions,

      // Employment History (NEW)
      companiesLast3Years: data.companiesLast3Years,
      employer1Name: data.employer1Name,
      employer1Duration: data.employer1Duration,
      employer2Name: data.employer2Name,
      employer2Duration: data.employer2Duration,
      employer3Name: data.employer3Name,
      employer3Duration: data.employer3Duration,

      // Preferences (NEW)
      preferredRoutes: data.preferredRoutes,          // NEW - array
      homeTimePreference: data.homeTimePreference,    // NEW
      availability: data.availability,

      // Message
      message: data.message,

      // Documents
      documents: data.documents,
      existingProfileDocs: data.existingProfileDocs
    });

    if (result.success) {
      console.log('✅ Application submitted successfully');
      sendToHtml('applicationSubmitted', {
        success: true,
        carrierDOT: data.carrierDOT,
        carrierName: data.carrierName,
        status: 'applied'
      });
    } else {
      console.error('❌ Application failed:', result.error);
      sendToHtml('applicationSubmitted', {
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Application error:', error);
    sendToHtml('applicationSubmitted', {
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// APPLICATION HISTORY HANDLER
// ============================================================================

async function handleGetDriverApplications() {
  try {
    const userStatus = await getUserStatus();

    if (!userStatus.loggedIn) {
      sendToHtml('driverApplications', []); // Return empty if not logged in
      return;
    }

    const driverId = userStatus.userId;
    console.log('📂 Fetching applications for driver:', driverId);

    const result = await getDriverApplicationsForPage(driverId);

    // Check if result is array (old format) or object (new format)
    // Based on previous step, it returns the applications directly if successful, 
    // or we might need to handle success/error wrapper if the service was written that way.
    // Checking service impl: 
    // It returns `applications.map(...)`. So it returns an array directly.
    // Wait, let's be safe.

    // Looking at applicationService.jsw in diffs:
    // export async function getDriverApplications(driverId) { ... return formattedApps; }
    // It returns an array.

    sendToHtml('driverApplications', result);

  } catch (error) {
    console.error('Error getting driver applications:', error);
    // Send empty array on error to allow graceful degradation
    sendToHtml('driverApplications', []);
  }
}

async function handleGetMutualInterest(data) {
  try {
    const driverId = data.driverId || (wixUsers && wixUsers.currentUser.id);
    if (!driverId) return;

    console.log('🤝 Fetching mutual interests for:', driverId);
    const result = await getDriverMutualInterestsForPage(driverId);

    if (result.success) {
      sendToHtml('mutualInterestData', {
        interests: result.interests || []
      });
    } else {
      console.warn('Mutual interest fetch returned unsuccessful:', result);
      sendToHtml('mutualInterestData', { interests: [] });
    }
  } catch (error) {
    console.error('Error handling mutual interest request:', error);
    sendToHtml('mutualInterestData', { interests: [], error: error.message });
  }
}
