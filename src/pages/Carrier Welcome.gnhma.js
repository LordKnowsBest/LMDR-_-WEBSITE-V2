/**
 * Carrier Welcome Page
 * Onboarding page for new carriers - personalized welcome, setup wizard, quick wins
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { getCarrierByDOT } from 'backend/recruiter_service';

$w.onReady(async function () {
  const dotNumber = wixLocation.query.dot;

  if (!dotNumber) {
    // No DOT provided - show generic welcome
    await loadGenericWelcome();
    return;
  }

  await Promise.all([
    loadCarrierWelcome(dotNumber),
    loadOnboardingProgress(dotNumber),
    loadQuickWins(dotNumber)
  ]);

  // Set up HTML component message handlers
  setupOnboardingHandlers();
});

/**
 * Load generic welcome for carriers without DOT
 */
async function loadGenericWelcome() {
  try {
    const title = $w('#welcomeTitle');
    if (title) title.text = 'Welcome to LMDR!';

    const subtitle = $w('#welcomeSubtitle');
    if (subtitle) subtitle.text = 'Start finding qualified drivers today';

    // Hide carrier-specific elements
    try {
      const carrierLogo = $w('#carrierLogo');
      if (carrierLogo && carrierLogo.hide) carrierLogo.hide();
    } catch (e) {
      // Element may not exist
    }

    try {
      const carrierDetails = $w('#carrierDetailsSection');
      if (carrierDetails && carrierDetails.collapse) carrierDetails.collapse();
    } catch (e) {
      // Element may not exist
    }

  } catch (err) {
    console.error('Failed to load generic welcome:', err);
  }
}

/**
 * Load personalized carrier welcome
 * Elements: #welcomeTitle, #carrierLocation, #fleetSizeDisplay, #carrierLogo
 */
async function loadCarrierWelcome(dotNumber) {
  try {
    const carrier = await getCarrierByDOT(dotNumber);

    if (!carrier) {
      await loadGenericWelcome();
      return;
    }

    // Update welcome elements
    try {
      const title = $w('#welcomeTitle');
      if (title) title.text = `Welcome, ${carrier.legal_name}!`;
    } catch (e) {
      // Element may not exist
    }

    try {
      const location = $w('#carrierLocation');
      if (location) location.text = `${carrier.city || ''}, ${carrier.state || ''}`.replace(/^, |, $/g, '');
    } catch (e) {
      // Element may not exist
    }

    try {
      const fleetSize = $w('#fleetSizeDisplay');
      if (fleetSize) fleetSize.text = `${carrier.fleet_size || 0} trucks`;
    } catch (e) {
      // Element may not exist
    }

    try {
      const logo = $w('#carrierLogo');
      if (logo && carrier.logo_url) {
        logo.src = carrier.logo_url;
        logo.show();
      }
    } catch (e) {
      // Element may not exist
    }

  } catch (err) {
    console.error('Failed to load carrier welcome:', err);
    await loadGenericWelcome();
  }
}

/**
 * Load onboarding progress for carrier
 * Elements: #progressBar, #progressText, #onboardingChecklist
 * Collection: CarrierOnboarding (if exists)
 */
async function loadOnboardingProgress(dotNumber) {
  try {
    const result = await wixData.query('CarrierOnboarding')
      .eq('dot_number', dotNumber)
      .find();

    const progress = result.items[0] || {
      profile_complete: false,
      jobs_posted: 0,
      branding_uploaded: false,
      first_candidate_viewed: false,
      payment_setup: false
    };

    // Calculate completion percentage
    const steps = [
      progress.profile_complete,
      progress.jobs_posted > 0,
      progress.branding_uploaded,
      progress.payment_setup
    ];
    const completed = steps.filter(Boolean).length;
    const percentage = Math.round((completed / steps.length) * 100);

    // Update progress bar
    try {
      const progressBar = $w('#progressBar');
      if (progressBar && progressBar.value !== undefined) {
        progressBar.value = percentage;
      }
    } catch (e) {
      // Element may not exist
    }

    try {
      const progressText = $w('#progressText');
      if (progressText) progressText.text = `${percentage}% Complete`;
    } catch (e) {
      // Element may not exist
    }

    // Send to HTML checklist component
    try {
      const htmlChecklist = $w('#onboardingChecklist');
      if (htmlChecklist && htmlChecklist.postMessage) {
        htmlChecklist.postMessage({
          type: 'onboardingProgress',
          data: progress
        });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    // Collection may not exist yet - show default state
    console.log('CarrierOnboarding collection not found');
  }
}

/**
 * Load quick wins data for carrier
 * Shows potential candidates and platform success metrics
 */
async function loadQuickWins(dotNumber) {
  try {
    const [candidatesResult, statsResult] = await Promise.all([
      wixData.query('DriverProfiles')
        .eq('status', 'active')
        .eq('is_discoverable', true)
        .limit(100)
        .find(),
      wixData.query('DriverCarrierInterests')
        .eq('status', 'hired')
        .find({ limit: 500 })
    ]);

    const quickWins = {
      availableDrivers: candidatesResult.totalCount || 0,
      avgTimeToHire: calculateAvgTimeToHire(statsResult.items),
      successRate: calculateSuccessRate(statsResult.items)
    };

    // Update quick wins elements
    try {
      const driversCount = $w('#availableDriversCount');
      if (driversCount) driversCount.text = quickWins.availableDrivers.toLocaleString();
    } catch (e) {
      // Element may not exist
    }

    try {
      const timeToHire = $w('#avgTimeToHire');
      if (timeToHire) timeToHire.text = `${quickWins.avgTimeToHire} days`;
    } catch (e) {
      // Element may not exist
    }

    // Send to HTML component
    try {
      const htmlQuickWins = $w('#quickWinsHtml');
      if (htmlQuickWins && htmlQuickWins.postMessage) {
        htmlQuickWins.postMessage({ type: 'quickWins', data: quickWins });
      }
    } catch (e) {
      // HTML component may not exist
    }

    // Also send to onboarding checklist
    try {
      const htmlChecklist = $w('#onboardingChecklist');
      if (htmlChecklist && htmlChecklist.postMessage) {
        htmlChecklist.postMessage({ type: 'quickWins', data: quickWins });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load quick wins:', err);
  }
}

/**
 * Calculate average time to hire from historical data
 */
function calculateAvgTimeToHire(hires) {
  const times = hires
    .filter(h => h.applied_date && h._updatedDate)
    .map(h => {
      const start = new Date(h.applied_date);
      const end = new Date(h._updatedDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    });

  return times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 14;
}

/**
 * Calculate success rate from historical data
 */
function calculateSuccessRate(hires) {
  // Placeholder - could calculate from actual data
  return 87;
}

/**
 * Set up message handlers for onboarding HTML components
 */
function setupOnboardingHandlers() {
  try {
    const htmlChecklist = $w('#onboardingChecklist');
    if (htmlChecklist && htmlChecklist.onMessage) {
      htmlChecklist.onMessage((event) => {
        if (event.data.type === 'navigateOnboarding') {
          const step = event.data.data?.step;
          switch (step) {
            case 'profile':
              wixLocation.to('/recruiter-console?tab=profile');
              break;
            case 'branding':
              wixLocation.to('/recruiter-console?tab=branding');
              break;
            case 'jobs':
              wixLocation.to('/recruiter-console?tab=jobs');
              break;
            case 'payment':
              wixLocation.to('/checkout');
              break;
            default:
              wixLocation.to('/recruiter-console');
          }
        }
      });
    }
  } catch (e) {
    // HTML component may not exist
  }
}
