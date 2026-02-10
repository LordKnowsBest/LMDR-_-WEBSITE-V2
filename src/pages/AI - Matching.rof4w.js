import { findMatchingCarriers, logMatchEvent, getDriverSavedCarriers } from 'backend/carrierMatching.jsw';
import { getMutualInterestForDriver } from 'backend/mutualInterestService.jsw';
import { enrichCarrier } from 'backend/aiEnrichment.jsw';
import { getOrCreateDriverProfile, setDiscoverability, getDriverInterests, updateDriverDocuments } from 'backend/driverProfiles.jsw';
import { submitApplication, getDriverApplications } from 'backend/applicationService.jsw';
import { extractDocumentForAutoFill } from 'backend/ocrService.jsw';
import { getMatchExplanationForDriver } from 'backend/matchExplanationService.jsw';
import { logFeatureInteraction } from 'backend/featureAdoptionService';
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
      await handleFindMatches(msg.data, freshStatus);
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

    default:
      console.log('Unknown message type:', action);
  }
}

async function handleGetMatchExplanation(payload) {
  try {
    const userStatus = await getUserStatus();

    // For anonymous users, build explanation from local match data
    if (!userStatus.loggedIn) {
      const matchData = lastSearchResults?.matches?.find(
        m => String(m.carrier?.DOT_NUMBER) === String(payload?.carrierDot)
      );

      if (matchData) {
        sendToHtml('matchExplanation', {
          success: true,
          carrierDot: payload.carrierDot,
          overallScore: matchData.overallScore,
          explanation: {
            summary: matchData.overallScore >= 70
              ? 'This carrier is a strong match for your preferences.'
              : matchData.overallScore >= 50
                ? 'This carrier partially matches your preferences.'
                : 'This carrier has some differences from your preferences.',
            categories: Object.entries(matchData.breakdown || {}).map(([key, val]) => ({
              key,
              label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
              score: Math.round(val.score || 0),
              weight: val.weight || 0,
              text: val.reason || `Score: ${Math.round(val.score || 0)}%`,
              status: (val.score || 0) >= 70 ? 'good' : (val.score || 0) >= 40 ? 'partial' : 'poor'
            })),
            tip: 'Sign up to see personalized match insights based on your full profile.'
          }
        });
      } else {
        sendToHtml('matchExplanation', {
          success: false,
          carrierDot: payload?.carrierDot,
          error: 'Match data not available'
        });
      }
      return;
    }

    const { carrierDot } = payload;
    if (!carrierDot) {
      console.warn('Missing carrierDot for match explanation');
      return;
    }

    const result = await getMatchExplanationForDriver(userStatus.userId, carrierDot);

    sendToHtml('matchExplanation', result);
  } catch (error) {
    console.error('Error getting match explanation:', error);
    sendToHtml('matchExplanation', {
      success: false,
      carrierDot: payload?.carrierDot,
      error: 'Failed to retrieve match explanation'
    });
  }
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
// FIND MATCHES - Now returns profile info
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

  console.log(`🔄 Retrying enrichment for DOT: ${dotNumber}`);

  sendToHtml('enrichmentUpdate', { dot_number: dotNumber, status: 'loading', message: 'Retrying...' });

  await delay(2000);

  try {
    const enrichment = await enrichCarrier(dotNumber, { DOT_NUMBER: dotNumber }, {});
    sendToHtml('enrichmentUpdate', { dot_number: dotNumber, status: 'complete', ...enrichment });
  } catch (error) {
    sendToHtml('enrichmentUpdate', {
      dot_number: dotNumber,
      status: 'error',
      error: true,
      ai_summary: 'Retry failed. Check FMCSA directly.'
    });
  }
}

// ============================================================================
// LOG INTEREST - Now updates driver profile
// ============================================================================

async function handleLogInterest(data) {
  console.log('📝 Logging interest:', data.carrierName);

  try {
    const result = await logMatchEvent({
      carrierDOT: data.carrierDOT,
      carrierName: data.carrierName,
      driverZip: data.driverZip,
      driverName: data.driverName,
      matchScore: data.matchScore,
      action: 'interested'
    });

    if (result.success) {
      sendToHtml('interestLogged', {
        success: true,
        carrierDOT: data.carrierDOT,
        method: result.method,
        isNew: result.isNew
      });
    } else {
      // Always respond even on failure so HTML doesn't hang
      console.log('⚠️ Interest logging failed:', result.error);
      sendToHtml('interestLogged', {
        success: false,
        carrierDOT: data.carrierDOT,
        error: result.error || 'Failed to save interest'
      });
    }
  } catch (error) {
    console.error('Error logging interest:', error);
    // Send error response so HTML doesn't hang on "SAVING..."
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
