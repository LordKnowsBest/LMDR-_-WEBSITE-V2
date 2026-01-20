/**
 * Recruiter Driver Search Page
 *
 * Connects the RECRUITER_DRIVER_SEARCH.html iframe to backend services
 * for the Reverse Matching Engine. Handles PostMessage communication.
 *
 * Backend Services:
 * - driverMatching.jsw: findMatchingDrivers(), getDriverProfile()
 * - driverOutreach.jsw: saveDriverToPipeline(), sendMessageToDriver()
 * - subscriptionService.jsw: getUsageStats(), getSubscription()
 *
 * @see conductor/tracks/reverse_matching_20251225/IMPLEMENTATION_PLAN.md
 */

import wixData from 'wix-data';
import wixUsers from 'wix-users';
import { findMatchingDrivers, getDriverProfile } from 'backend/driverMatching';
import { saveDriverToPipeline, sendMessageToDriver } from 'backend/driverOutreach';
import { getUsageStats, getSubscription } from 'backend/subscriptionService';
import { getWeightPreferences, saveWeightPreferences } from 'backend/carrierPreferences';

// Cache the carrier DOT for the current recruiter session
let currentCarrierDot = null;

// DEV MODE: Set to a test carrier DOT for development/testing
// Set to null in production to require proper recruiter-carrier assignment
const DEV_MODE_CARRIER_DOT = '123456'; // TODO: Remove or set to null for production

$w.onReady(async function () {
  console.log('[VELO] RecruiterDriverSearch page ready');

  // Check if user is logged in
  const user = wixUsers.currentUser;
  if (!user.loggedIn) {
    console.log('[VELO] User not logged in, redirecting to login');
    wixUsers.promptLogin();
    return;
  }

  // Get the carrier DOT for this recruiter
  await loadRecruiterCarrier(user.id);

  // Initialize the search HTML component handlers
  initSearchHandlers();

  // Initialize the settings sidebar handlers
  initSettingsSidebarHandlers();
});

/**
 * Load the carrier associated with this recruiter
 */
async function loadRecruiterCarrier(userId) {
  try {
    console.log('[VELO] Looking up carrier for recruiter_id:', userId);

    // First try with is_active: true
    const activeResult = await wixData.query('recruiterCarriers')
      .eq('recruiter_id', userId)
      .eq('is_active', true)
      .limit(1)
      .find({ suppressAuth: true });

    if (activeResult.items.length > 0) {
      currentCarrierDot = activeResult.items[0].carrier_dot;
      console.log('[VELO] Loaded active carrier DOT:', currentCarrierDot);
      return;
    }

    // If no active record, check if there are ANY records (possibly inactive)
    const anyResult = await wixData.query('recruiterCarriers')
      .eq('recruiter_id', userId)
      .limit(5)
      .find({ suppressAuth: true });

    if (anyResult.items.length > 0) {
      // Found records but they're inactive - use first one anyway for dev
      const record = anyResult.items[0];
      currentCarrierDot = record.carrier_dot;
      console.warn('[VELO] Found INACTIVE carrier record. carrier_dot:', currentCarrierDot, 'is_active:', record.is_active);
      console.warn('[VELO] Record needs activation in Wix. Using it anyway for dev.');
      return;
    }

    // No records at all - use dev fallback
    if (DEV_MODE_CARRIER_DOT) {
      currentCarrierDot = DEV_MODE_CARRIER_DOT;
      console.warn('[VELO] No recruiterCarriers records found. DEV MODE: Using test carrier DOT:', currentCarrierDot);
    } else {
      console.warn('[VELO] No carrier assigned to this recruiter and no DEV_MODE fallback');
    }

  } catch (err) {
    console.error('[VELO] Failed to load recruiter carrier:', err);
    if (DEV_MODE_CARRIER_DOT) {
      currentCarrierDot = DEV_MODE_CARRIER_DOT;
      console.warn('[VELO] DEV MODE: Fallback to test carrier DOT:', currentCarrierDot);
    }
  }
}

/**
 * Initialize PostMessage handlers for the search HTML component
 */
function initSearchHandlers() {
  // Try multiple possible HTML component IDs (Wix assigns dynamically)
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#searchHtml'];

  possibleIds.forEach(id => {
    try {
      const htmlComponent = $w(id);
      if (htmlComponent && htmlComponent.onMessage) {
        console.log('[VELO] Attaching search handlers to', id);
        attachMessageHandlers(htmlComponent);
      }
    } catch (e) {
      // Component may not exist on page - skip silently
    }
  });
}

/**
 * Attach all PostMessage handlers to an HTML component
 */
function attachMessageHandlers(htmlComponent) {
  htmlComponent.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    console.log('[VELO] Received message:', msg.type);

    try {
      switch (msg.type) {
        case 'searchDrivers':
          await handleSearchDrivers(htmlComponent, msg.data);
          break;

        case 'viewDriverProfile':
          await handleViewProfile(htmlComponent, msg.data);
          break;

        case 'saveDriver':
          await handleSaveDriver(htmlComponent, msg.data);
          break;

        case 'contactDriver':
          await handleContactDriver(htmlComponent, msg.data);
          break;

        case 'getQuotaStatus':
          await handleGetQuotaStatus(htmlComponent);
          break;

        case 'driverSearchReady':
          console.log('[VELO] Driver search component is ready');
          // Send initial quota status when component loads
          await handleGetQuotaStatus(htmlComponent);
          break;

        default:
          console.warn('[VELO] Unknown message type:', msg.type);
      }
    } catch (error) {
      console.error('[VELO] Handler error:', error);
      htmlComponent.postMessage({
        type: msg.type + 'Result',
        data: { success: false, error: error.message || 'An error occurred' }
      });
    }
  });
}

/**
 * Handle driver search requests
 */
async function handleSearchDrivers(htmlComponent, data) {
  if (!currentCarrierDot) {
    htmlComponent.postMessage({
      type: 'searchDriversResult',
      data: { success: false, error: 'No carrier assigned. Please contact support.' }
    });
    return;
  }

  // Map frontend filter names to backend format
  const filters = {
    cdl_types: data.cdlClasses,
    endorsements: data.endorsements,
    zip_code: data.zip,
    radius_miles: data.radius,
    min_experience: data.minExperience,
    availability: data.availability
  };

  // Remove null/undefined filters
  Object.keys(filters).forEach(key => {
    if (filters[key] === null || filters[key] === undefined) {
      delete filters[key];
    }
  });

  const options = {
    page: Math.floor((data.offset || 0) / (data.limit || 20)),
    pageSize: data.limit || 20,
    usePreferences: true,
    includeMutualMatches: true
  };

  const result = await findMatchingDrivers(currentCarrierDot, filters, options);

  if (result.success) {
    // Transform matches to frontend format
    const drivers = result.matches.map(match => ({
      id: match.driver._id,
      name: `${match.driver.first_name || ''} ${match.driver.last_name || ''}`.trim() || 'Driver',
      location: match.driver.city && match.driver.state
        ? `${match.driver.city}, ${match.driver.state}`
        : match.driver.zip_code || 'Unknown',
      experienceYears: match.driver.years_experience || 0,
      matchScore: Math.round(match.score),
      cdlClass: match.driver.cdl_class || 'A',
      endorsements: match.driver.endorsements || [],
      rationale: match.rationale.join(' ') || 'Good match based on your criteria.',
      isMutualMatch: match.isMutualMatch || false,
      availability: match.driver.availability || 'unknown'
    }));

    // Get quota status to include with results
    const quotaStatus = await getFormattedQuotaStatus();

    htmlComponent.postMessage({
      type: 'searchDriversResult',
      data: {
        success: true,
        drivers,
        total: result.pagination.totalCount,
        quotaStatus
      }
    });
  } else {
    htmlComponent.postMessage({
      type: 'searchDriversResult',
      data: { success: false, error: result.error }
    });
  }
}

/**
 * Handle view driver profile requests
 */
async function handleViewProfile(htmlComponent, data) {
  if (!currentCarrierDot) {
    htmlComponent.postMessage({
      type: 'viewDriverProfileResult',
      data: { success: false, error: 'No carrier assigned.' }
    });
    return;
  }

  const result = await getDriverProfile(currentCarrierDot, data.driverId, {
    matchScore: data.matchScore
  });

  if (result.success) {
    const driver = result.driver;

    // Format driver profile for frontend
    const profile = {
      id: driver._id,
      name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Driver',
      location: driver.city && driver.state
        ? `${driver.city}, ${driver.state}`
        : driver.zip_code || 'Unknown',
      phone: driver.phone || null,
      email: driver.email || null,
      experienceYears: driver.years_experience || 0,
      cdlClass: driver.cdl_class || 'A',
      endorsements: driver.endorsements || [],
      equipment: driver.equipment_experience || [],
      availability: driver.availability || 'unknown',
      salaryExpectation: driver.salary_expectation || null,
      preferredRoutes: driver.preferred_routes || [],
      homeTime: driver.home_time_preference || null,
      mvrStatus: driver.mvr_status || 'unknown',
      workHistory: driver.work_history || [],
      rationale: data.rationale || []
    };

    // Get updated quota status
    const quotaStatus = {
      used: result.quota.used,
      limit: result.quota.total,
      remaining: result.quota.remaining
    };

    htmlComponent.postMessage({
      type: 'viewDriverProfileResult',
      data: {
        success: true,
        driver: profile,
        quotaUsed: result.quotaUsed,
        quotaStatus
      }
    });
  } else {
    // Check if it's a quota exceeded error
    const isQuotaExceeded = result.error &&
      (result.error.includes('quota') || result.error.includes('exhausted'));

    htmlComponent.postMessage({
      type: 'viewDriverProfileResult',
      data: {
        success: false,
        error: result.error,
        quotaExceeded: isQuotaExceeded
      }
    });
  }
}

/**
 * Handle save driver to pipeline requests
 */
async function handleSaveDriver(htmlComponent, data) {
  if (!currentCarrierDot) {
    htmlComponent.postMessage({
      type: 'saveDriverResult',
      data: { success: false, error: 'No carrier assigned.' }
    });
    return;
  }

  const result = await saveDriverToPipeline(
    currentCarrierDot,
    data.driverId,
    data.notes || ''
  );

  htmlComponent.postMessage({
    type: 'saveDriverResult',
    data: {
      success: result.success,
      error: result.error,
      alreadySaved: result.errorCode === 'DUPLICATE_SAVE'
    }
  });
}

/**
 * Handle contact driver requests
 */
async function handleContactDriver(htmlComponent, data) {
  if (!currentCarrierDot) {
    htmlComponent.postMessage({
      type: 'contactDriverResult',
      data: { success: false, error: 'No carrier assigned.' }
    });
    return;
  }

  const result = await sendMessageToDriver(
    currentCarrierDot,
    data.driverId,
    data.message
  );

  htmlComponent.postMessage({
    type: 'contactDriverResult',
    data: {
      success: result.success,
      error: result.error,
      requiresSubscription: result.errorCode === 'SUBSCRIPTION_REQUIRED'
    }
  });
}

/**
 * Handle quota status requests
 */
async function handleGetQuotaStatus(htmlComponent) {
  const quotaStatus = await getFormattedQuotaStatus();

  htmlComponent.postMessage({
    type: 'getQuotaStatusResult',
    data: {
      success: true,
      ...quotaStatus
    }
  });
}

/**
 * Get formatted quota status for frontend display
 */
async function getFormattedQuotaStatus() {
  if (!currentCarrierDot) {
    return {
      tier: 'free',
      used: 0,
      limit: 0,
      remaining: 0,
      resetDate: null,
      canSearch: false
    };
  }

  try {
    const [usage, subscription] = await Promise.all([
      getUsageStats(currentCarrierDot),
      getSubscription(currentCarrierDot)
    ]);

    return {
      tier: subscription.plan_type || 'free',
      used: usage.used || 0,
      limit: usage.quota === -1 ? 'Unlimited' : (usage.quota || 0),
      remaining: usage.remaining === -1 ? 'Unlimited' : (usage.remaining || 0),
      resetDate: usage.resetDate || null,
      daysUntilReset: usage.daysUntilReset || 0,
      canSearch: subscription.plan_type !== 'free' && subscription.is_active
    };
  } catch (err) {
    console.error('[VELO] Failed to get quota status:', err);
    return {
      tier: 'free',
      used: 0,
      limit: 0,
      remaining: 0,
      resetDate: null,
      canSearch: false
    };
  }
}

// ============================================================================
// SETTINGS SIDEBAR HANDLERS (Integrated into Sidebar.html)
// ============================================================================

// Reference to the sidebar HTML component (contains settings panel)
let sidebarComponent = null;

/**
 * Initialize handlers for the sidebar HTML component (which includes settings panel)
 */
function initSettingsSidebarHandlers() {
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#sidebarHtml'];

  possibleIds.forEach(id => {
    try {
      const htmlComponent = $w(id);
      if (htmlComponent && htmlComponent.onMessage) {
        htmlComponent.onMessage(async (event) => {
          const msg = event.data;
          if (!msg || !msg.type) return;

          console.log('[VELO] Received from sidebar:', msg.type);

          switch (msg.type) {
            // Sidebar is ready
            case 'sidebarReady':
              console.log('[VELO] Sidebar component ready at', id);
              sidebarComponent = htmlComponent;
              break;

            // User opened settings panel and wants current preferences
            case 'getWeightPreferences':
              await handleGetWeightPreferences(htmlComponent);
              break;

            // User wants to save weight preferences
            case 'saveWeightPreferences':
              await handleSaveWeightPreferences(htmlComponent, msg.data);
              break;

            // Settings button clicked from search page header
            case 'openSettingsSidebar':
              if (sidebarComponent) {
                sidebarComponent.postMessage({ type: 'openSettingsPanel' });
              }
              break;
          }
        });
      }
    } catch (e) {
      // Component may not exist - skip silently
    }
  });
}

/**
 * Handle request to get current weight preferences
 */
async function handleGetWeightPreferences(htmlComponent) {
  if (!currentCarrierDot) {
    console.warn('[VELO] No carrier DOT, using defaults');
    return;
  }

  const result = await getWeightPreferences(currentCarrierDot);

  if (result.success) {
    // Transform weights to frontend format (remove 'weight_' prefix)
    const weights = {
      qualifications: result.weights.weight_qualifications,
      experience: result.weights.weight_experience,
      location: result.weights.weight_location,
      availability: result.weights.weight_availability,
      salaryFit: result.weights.weight_salaryFit,
      engagement: result.weights.weight_engagement
    };

    htmlComponent.postMessage({
      type: 'loadWeightPreferences',
      data: { success: true, weights, isDefault: result.isDefault }
    });

    console.log('[VELO] Sent weight preferences to sidebar');
  }
}

/**
 * Handle save weight preferences request from sidebar
 */
async function handleSaveWeightPreferences(htmlComponent, data) {
  if (!currentCarrierDot) {
    htmlComponent.postMessage({
      type: 'savePreferencesResult',
      data: { success: false, error: 'No carrier assigned' }
    });
    return;
  }

  // Data from sidebar has 'weight_' prefix already
  const weights = {
    weight_qualifications: data.weight_qualifications,
    weight_experience: data.weight_experience,
    weight_location: data.weight_location,
    weight_availability: data.weight_availability,
    weight_salaryFit: data.weight_salaryFit,
    weight_engagement: data.weight_engagement
  };

  console.log('[VELO] Saving weight preferences:', weights);

  const result = await saveWeightPreferences(currentCarrierDot, weights);

  htmlComponent.postMessage({
    type: 'savePreferencesResult',
    data: {
      success: result.success,
      error: result.error,
      weights: result.weights
    }
  });

  if (result.success) {
    console.log('[VELO] Weight preferences saved successfully');
  } else {
    console.error('[VELO] Failed to save weight preferences:', result.error);
  }
}
