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

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { findMatchingDrivers, getDriverProfile } from 'backend/driverMatching';
import { saveDriverToPipeline, sendMessageToDriver } from 'backend/driverOutreach';
import { getUsageStats, getSubscription } from 'backend/subscriptionService';
import { getWeightPreferences, saveWeightPreferences } from 'backend/carrierPreferences';
import { getCarrierIdentity } from 'backend/recruiter_service';

/** DEV MODE: Set to true to bypass carrier identity lookup */
const DEV_MODE_BYPASS_CARRIER = true; // TODO: Set to false for production
const DEV_MODE_FALLBACK_DOT = '0000000'; // Placeholder DOT for dev mode

// Cache the carrier DOT for the current recruiter session
let currentCarrierDot = null;

$w.onReady(async function () {
  console.log('[VELO] RecruiterDriverSearch page ready');

  // Check if user is logged in
  const user = wixUsers.currentUser;
  if (!user.loggedIn) {
    console.log('[VELO] User not logged in, redirecting to login');
    wixUsers.promptLogin();
    return;
  }

  // Get the carrier identity using unified lookup (via Airtable-routed recruiterCarriers)
  await loadCarrierIdentity();

  // Initialize the search HTML component handlers
  initSearchHandlers();

  // Initialize the settings sidebar handlers
  initSettingsSidebarHandlers();

  // Check for ?openSettings=true query param (from onboarding flow)
  const openSettings = wixLocation.query.openSettings;
  if (openSettings === 'true' && currentCarrierDot) {
    console.log('[VELO] Auto-opening settings panel (from onboarding flow)');
    setTimeout(() => {
      const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#sidebarHtml'];
      possibleIds.forEach(id => {
        try {
          const comp = $w(id);
          if (comp && typeof comp.postMessage === 'function') {
            comp.postMessage({ type: 'openSettingsPanel' });
          }
        } catch (e) { /* skip */ }
      });
    }, 1000);
  }
});

/**
 * Load carrier identity using the unified service
 * Uses dual-source helpers (Airtable/Wix) from recruiter_service.jsw
 */
async function loadCarrierIdentity() {
  if (DEV_MODE_BYPASS_CARRIER) {
    currentCarrierDot = DEV_MODE_FALLBACK_DOT;
    console.log('[VELO] DEV MODE: Using fallback carrier DOT:', DEV_MODE_FALLBACK_DOT);
    return;
  }

  try {
    console.log('[VELO] Loading carrier identity...');
    const identity = await getCarrierIdentity();

    if (!identity.success) {
      console.warn('[VELO] Carrier identity lookup failed:', identity.error);
      notifyHtmlNoCarrier('Unable to load your account. Please try again.');
      return;
    }

    if (identity.needsOnboarding) {
      console.warn('[VELO] Carrier needs onboarding - no DOT assigned');
      notifyHtmlNoCarrier('Please complete your fleet profile to start searching for drivers.');
      return;
    }

    currentCarrierDot = identity.dotNumber;
    console.log('[VELO] Carrier identity loaded. DOT:', currentCarrierDot, 'Company:', identity.companyName);
  } catch (err) {
    console.error('[VELO] Failed to load carrier identity:', err);
    notifyHtmlNoCarrier('Error loading your account.');
  }
}

/**
 * Notify HTML components that no carrier is assigned
 */
function notifyHtmlNoCarrier(message) {
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#searchHtml'];
  possibleIds.forEach(id => {
    try {
      const comp = $w(id);
      if (comp && typeof comp.postMessage === 'function') {
        comp.postMessage({ type: 'noCarrierAssigned', data: { message } });
      }
    } catch (e) { /* Component doesn't exist */ }
  });
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

        case 'loadSavedSearches':
          // Saved searches not yet implemented — return empty list
          htmlComponent.postMessage({
            type: 'loadSavedSearchesResult',
            data: { success: true, searches: [] }
          });
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
    page: 0,
    pageSize: data.limit || 500,
    usePreferences: true,
    includeMutualMatches: true
  };

  const result = await findMatchingDrivers(currentCarrierDot, filters, options);

  if (result.success) {
    // Transform matches to frontend format
    const drivers = result.matches.map(match => {
      const d = match.driver;
      // Build location string from available fields
      let location = 'Unknown';
      if (d.city && d.state) location = `${d.city}, ${d.state}`;
      else if (d.state) location = d.state;
      else if (d.zip_code) location = d.zip_code;
      else if (d.home_zip) location = d.home_zip;

      return {
        id: d._id,
        name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Driver',
        location,
        experienceYears: d.years_experience || 0,
        matchScore: Math.round(match.score),
        cdlClass: d.cdl_class || null,
        endorsements: d.endorsements || [],
        rationale: match.rationale.join(' ') || 'Good match based on your criteria.',
        isMutualMatch: match.isMutualMatch || false,
        availability: d.availability || 'unknown',
        source: d._source || 'driver_profiles',
        sourceLabel: d._source_label || 'Profile'
      };
    });

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
    const rawEndorsements = driver.endorsements;
    const endorsements = Array.isArray(rawEndorsements) ? rawEndorsements
      : (typeof rawEndorsements === 'string' && rawEndorsements ? rawEndorsements.split(',').map(e => e.trim()) : []);

    let location = 'Unknown';
    if (driver.city && driver.state) location = `${driver.city}, ${driver.state}`;
    else if (driver.state) location = driver.state;
    else if (driver.zip_code) location = driver.zip_code;
    else if (driver.home_zip) location = driver.home_zip;

    const profile = {
      id: driver._id,
      name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Driver',
      location,
      phone: driver.phone || null,
      email: driver.email || null,
      experienceYears: driver.years_experience || 0,
      cdlClass: driver.cdl_class || null,
      endorsements,
      equipment: Array.isArray(driver.equipment_experience) ? driver.equipment_experience : [],
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
  if (DEV_MODE_BYPASS_CARRIER) {
    return {
      tier: 'enterprise',
      used: 0,
      limit: 'Unlimited',
      remaining: 'Unlimited',
      resetDate: null,
      daysUntilReset: 30,
      canSearch: true
    };
  }

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
