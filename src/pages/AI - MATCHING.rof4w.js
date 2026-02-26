import { findMatchingCarriers, logMatchEvent, getDriverSavedCarriers } from 'backend/carrierMatching.jsw';
import { triggerSemanticSearch, checkSearchStatus, triggerEnrichmentJob, checkEnrichmentStatus } from 'backend/asyncSearchService.jsw';
import { getMutualInterestForDriver } from 'backend/mutualInterestService.jsw';
import { enrichCarrier } from 'backend/aiEnrichment.jsw';
import { getOrCreateDriverProfile, setDiscoverability, getDriverInterests, updateDriverDocuments } from 'backend/driverProfiles.jsw';
import { submitApplication, getDriverApplications } from 'backend/applicationService.jsw';
import { extractDocumentForAutoFill } from 'backend/ocrService.jsw';
import { getMatchExplanationForDriver } from 'backend/matchExplanationService.jsw';
import { logFeatureInteraction } from 'backend/featureAdoptionService';
import { handleAgentTurn, resumeAfterApproval } from 'backend/agentService';
import { getVoiceConfig } from 'backend/voiceService';
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
let cachedUserStatus = null;
let cachedDriverProfile = null;
let cachedDriverInterests = [];
let lastSearchResults = null;

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
  if (!MESSAGE_REGISTRY.inbound.includes(action)) {
    console.warn(`⚠️ UNREGISTERED INBOUND MESSAGE: "${action}" - Add to MESSAGE_REGISTRY.inbound`);
    return false;
  }
  return true;
}

function logMessageFlow(direction, type, data) {
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

  // Get initial user status and driver profile
  cachedUserStatus = await getUserStatus();
  console.log('👤 Initial user status:', cachedUserStatus);

  // If logged in, try to get/create driver profile and fetch interests
  if (cachedUserStatus.loggedIn) {
    try {
      const profileResult = await getOrCreateDriverProfile();
      if (profileResult.success) {
        cachedDriverProfile = profileResult.profile;
        console.log('👤 Driver profile loaded:', cachedDriverProfile._id);
        console.log('   Is new:', profileResult.isNew);
        console.log('   Completeness:', cachedDriverProfile.profile_completeness_score);
      }

      // Fetch driver's existing carrier interests
      const interestsResult = await getDriverInterests();
      if (interestsResult.success) {
        cachedDriverInterests = interestsResult.interests;
        console.log('📋 Driver interests loaded:', cachedDriverInterests.length);
      }
    } catch (profileError) {
      console.error('Profile load error:', profileError);
    }
  }

  // Set up message listener
  htmlComponent.onMessage((event) => {
    handleHtmlMessage(event.data);
  });
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

  const action = msg.action || msg.type;

  // Validate and log inbound message
  validateInboundMessage(action);
  logMessageFlow('in', action, msg.data);

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
      cachedUserStatus = freshStatus;
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
        const poll = await checkSearchStatus(jobId);
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
      cachedUserStatus = status;
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
      console.log('✅ HTML Embed Ready - Sending initial state');
      sendToHtml('pageReady', {
        userStatus: cachedUserStatus,
        memberId: wixUsers?.currentUser?.id || null,
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
          totalSearches: cachedDriverProfile.total_searches,
          isComplete: cachedDriverProfile.is_complete,
          missingFields: cachedDriverProfile.missing_fields,
          isDiscoverable: cachedDriverProfile.is_discoverable,
          cdl_front_image: cachedDriverProfile.cdl_front_image,
          cdl_back_image: cachedDriverProfile.cdl_back_image,
          med_card_image: cachedDriverProfile.med_card_image,
          resume_file: cachedDriverProfile.resume_file
        } : null,
        appliedCarriers: cachedDriverInterests.map(i => ({
          carrierDOT: i.carrier_dot,
          carrierName: i.carrier_name,
          actionType: i.action_type,
          timestamp: i.action_timestamp
        }))
      });
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
      logFeatureInteraction(msg.data.featureId, msg.data.userId, msg.data.action, msg.data)
        .catch(err => console.warn('Feature tracking failed:', err.message));
      break;

    case 'agentMessage': {
      const agentText = msg.data?.text || '';
      const agentContext = msg.data?.context || {};
      const userId = cachedDriverProfile?._id || cachedUserStatus?.memberId || 'anonymous';
      sendToHtml('agentTyping', {});
      try {
        const agentResult = await handleAgentTurn('driver', userId, agentText, agentContext);
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
        const result = await resumeAfterApproval(approvalContext, decision, decidedBy || 'user');
        sendToHtml('agentResponse', result);
      } catch (err) {
        sendToHtml('agentResponse', { error: err.message });
      }
      break;
    }

    case 'getVoiceConfig': {
      try {
        const voiceConf = await getVoiceConfig();
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

async function handleGetMatchExplanation(payload) {
  const carrierDot = payload?.carrierDot;

  try {
    const userStatus = await getUserStatus();

    // For logged-in users, try backend service first
    if (userStatus.loggedIn && carrierDot) {
      const result = await getMatchExplanationForDriver(userStatus.userId, carrierDot);
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

  // Build a rich narrative from Perplexity AI intel + FMCSA data if available
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
    const city = carrier.PHY_CITY || null;
    const state = carrier.PHY_STATE || null;
    const loc = city && state ? `${city}, ${state}` : (state || null);
    const fleet = carrier.NBR_POWER_UNIT;
    const pay = carrier.PAY_CPM || enrichment.pay_cpm_range;
    const sentiment = enrichment.driver_sentiment;
    const hiringOpp = enrichment.hiring_opportunity;
    const safety = fmcsa.safety_rating;

    if (loc || fleet || pay) {
      const intro = `${carrierName}${loc ? ` is based in ${loc}` : ''}${fleet ? ` with a fleet of ${fleet} trucks` : ''}.`;
      parts.push(intro);
    }
    if (safety && safety !== 'UNKNOWN') parts.push(`FMCSA safety rating: ${safety}.`);
    if (pay && pay !== 'null') parts.push(`Pay: ${pay}.`);
    if (sentiment && sentiment !== 'No Reviews') parts.push(`Driver sentiment: ${sentiment}.`);
    if (hiringOpp && hiringOpp !== 'N/A') parts.push(`Hiring opportunity: ${hiringOpp}.`);
  }

  if (parts.length) {
    llm_narrative = parts.join(' ');
  }

  console.log('[WHY-DBG] buildLocalExplanation - DOT:', carrierDot, '| enrichment.ai_summary:', enrichment.ai_summary ? enrichment.ai_summary.substring(0, 80) : null, '| carrier.PHY_CITY:', carrier.PHY_CITY, '| carrier.PHY_STATE:', carrier.PHY_STATE, '| llm_narrative:', llm_narrative ? llm_narrative.substring(0, 80) : null);

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
      cachedUserStatus = await getUserStatus();

      // Create driver profile for new user
      try {
        const profileResult = await getOrCreateDriverProfile();
        if (profileResult.success) {
          cachedDriverProfile = profileResult.profile;
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
      cachedUserStatus = await getUserStatus();
      console.log('👤 Updated user status after login:', cachedUserStatus);

      // Load driver profile
      try {
        const profileResult = await getOrCreateDriverProfile();
        if (profileResult.success) {
          cachedDriverProfile = profileResult.profile;
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

  const { jobId } = await triggerSemanticSearch(driverPrefs, isPremium);

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
      const poll = await checkSearchStatus(jobId);
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
        const interestResult = await getMutualInterestForDriver(driverId);
        if (interestResult.success && interestResult.mutualInterests?.length > 0) {
          const mutualMap = {};
          interestResult.mutualInterests.forEach(m => { mutualMap[String(m.carrierDot)] = m; });
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

  lastSearchResults = { matches: enrichedMatches, totalScored: enrichedMatches.length };

  // All users see 2 results initially; remaining stay in enrichedMatches for upsell unlock
  const visibleMatches = enrichedMatches.slice(0, 2);
  const hiddenCount = Math.max(0, enrichedMatches.length - 2);
  const isPremiumUser = userStatus?.isPremium || false;
  const _needsAutoEnrich = visibleMatches.find(m => m.needsEnrichment && !m.fmcsaOnly);
  const autoEnrichDot = _needsAutoEnrich ? String(_needsAutoEnrich.carrier.DOT_NUMBER) : null;

  sendToHtml('matchResults', {
    matches:      visibleMatches,
    totalScored:  enrichedMatches.length,
    totalMatches: enrichedMatches.length,
    userTier:     userStatus?.tier || 'free',
    maxAllowed:   2,
    isPremium:    isPremiumUser,
    upsellMessage: hiddenCount > 0
      ? `Sign in to see ${hiddenCount + 2} more matches in your area.`
      : null,
    driverProfile: cachedDriverProfile ? {
      id: cachedDriverProfile._id,
      displayName: cachedDriverProfile.display_name,
      completeness: cachedDriverProfile.profile_completeness_score,
    } : null,
    autoEnrichDot,
    source: 'async-option-b',
  });

  // Fire enrichmentUpdate for every visible carrier Railway pre-enriched via Perplexity
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
    }
    sendToHtml('enrichmentComplete', { totalEnriched: visiblePreEnriched.length });
  }

  // For visible carriers Railway didn't enrich, use Railway/Perplexity (richer than Wix Groq)
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
      await triggerEnrichmentJob(jobId, dotNumber, carrierName, knownData);
      console.log(`📡 [auto-enrich] Job ${jobId} started for DOT ${dotNumber} — polling...`);
      let attempts = 0;
      const maxAttempts = 30;
      await new Promise((resolve) => {
        const timer = setInterval(async () => {
          attempts++;
          try {
            const statusResult = await checkEnrichmentStatus(jobId);
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
    const result = await findMatchingCarriers(driverPrefs, isPremium);

    if (!result.success) {
      sendToHtml('matchError', { error: result.error });
      return;
    }

    console.log(`📊 Scored ${result.totalScored}, returning ${result.matches.length} (${result.userTier} tier)`);

    // Update cached profile if returned
    if (result.driverProfile) {
      cachedDriverProfile = { ...cachedDriverProfile, ...result.driverProfile };
    }

    // Phase 1: Enrich with Mutual Interests (if logged in)
    let enrichedMatches = result.matches;
    if (userStatus?.userId || userStatus?.loggedIn) {
      try {
        const driverId = userStatus.userId || wixUsers.currentUser.id;
        const interestResult = await getMutualInterestForDriver(driverId);

        if (interestResult.success && interestResult.mutualInterests?.length > 0) {
          console.log(`🤝 Found ${interestResult.mutualInterests.length} mutual matches`);

          // Create lookup map for efficiency
          const mutualMap = {};
          interestResult.mutualInterests.forEach(m => {
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
    lastSearchResults = { ...result, matches: enrichedMatches };

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
      return await enrichCarrier(dotNumber, carrierData, driverPrefs);
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

  console.log(`🔄 [async] Triggering Railway/Perplexity enrichment for DOT: ${dotNumber}`);
  sendToHtml('enrichmentUpdate', { dot_number: dotNumber, status: 'loading', message: 'Researching...' });

  try {
    // Pull carrier context from last search results for better Perplexity accuracy
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
    await triggerEnrichmentJob(jobId, dotNumber, carrierName, knownData);

    console.log(`📡 [enrich] Job ${jobId} started for DOT ${dotNumber} — polling...`);

    // Poll every 3s until Railway/Perplexity finishes (max 90s = 30 attempts)
    let attempts = 0;
    const maxAttempts = 30;
    await new Promise((resolve) => {
      const timer = setInterval(async () => {
        attempts++;
        try {
          const statusResult = await checkEnrichmentStatus(jobId);
          if (statusResult.status === 'COMPLETE') {
            clearInterval(timer);
            console.log(`✅ [enrich] Job ${jobId} complete — delivering enrichment`);
            sendToHtml('enrichmentUpdate', {
              dot_number: String(dotNumber),
              status: 'complete',
              ...statusResult.enrichment,
            });
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
          console.error(`[retryEnrichment] Poll error for DOT ${dotNumber}:`, pollErr.message);
          sendToHtml('enrichmentUpdate', {
            dot_number: String(dotNumber),
            status: 'error',
            error: true,
            ai_summary: 'AI profile unavailable. Check FMCSA records directly.',
          });
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
      logMatchEvent({
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
    const profileResult = await getOrCreateDriverProfile();

    if (profileResult.success) {
      cachedDriverProfile = profileResult.profile;
      sendToHtml('driverProfileLoaded', {
        success: true,
        profile: {
          id: cachedDriverProfile._id,
          displayName: cachedDriverProfile.display_name,
          email: cachedDriverProfile.email,
          homeZip: cachedDriverProfile.home_zip,
          maxDistance: cachedDriverProfile.max_commute_miles,
          minCPM: cachedDriverProfile.min_cpm,
          operationType: cachedDriverProfile.preferred_operation_type,
          maxTurnover: cachedDriverProfile.max_turnover_percent,
          maxTruckAge: cachedDriverProfile.max_truck_age_years,
          fleetSize: cachedDriverProfile.fleet_size_preference,
          yearsExperience: cachedDriverProfile.years_experience,
          cdlClass: cachedDriverProfile.cdl_class,
          endorsements: cachedDriverProfile.endorsements,
          cleanMVR: cachedDriverProfile.clean_mvr,
          completeness: cachedDriverProfile.profile_completeness_score,
          totalSearches: cachedDriverProfile.total_searches,
          isComplete: cachedDriverProfile.is_complete,
          isDiscoverable: cachedDriverProfile.is_discoverable,
          missingFields: cachedDriverProfile.missing_fields,
          cdl_front_image: cachedDriverProfile.cdl_front_image,
          cdl_back_image: cachedDriverProfile.cdl_back_image,
          med_card_image: cachedDriverProfile.med_card_image,
          resume_file: cachedDriverProfile.resume_file
        },
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
    const result = await getDriverSavedCarriers();

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
    const result = await setDiscoverability(data.isDiscoverable);

    if (result.success) {
      cachedDriverProfile = result.profile;
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
    const result = await updateDriverDocuments(data);

    if (result.success) {
      cachedDriverProfile = result.profile;

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
    const result = await extractDocumentForAutoFill(data.base64Data, data.docType);

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
// UTILITIES
// ============================================================================

function sendToHtml(type, data) {
  // Validate outbound message is registered
  if (!MESSAGE_REGISTRY.outbound.includes(type)) {
    console.warn(`⚠️ UNREGISTERED OUTBOUND MESSAGE: "${type}" - Add to MESSAGE_REGISTRY.outbound`);
  }

  logMessageFlow('out', type, data);

  try {
    const component = getComponent();
    if (component && typeof component.postMessage === 'function') {
      component.postMessage({ type, data, timestamp: Date.now() });
    }
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
    const result = await submitApplication({
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

    const result = await getDriverApplications(driverId);

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
    const result = await getMutualInterestForDriver(driverId);

    if (result.success) {
      sendToHtml('mutualInterestData', {
        interests: result.mutualInterests || []
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
