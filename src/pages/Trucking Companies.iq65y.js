/**
 * Trucking Companies Page
 * Landing page for carriers - shows platform benefits, pricing, and drives recruiter signups
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getCarrierPlatformStats, getPublicStats } from 'backend/publicStatsService';
import { submitCarrierStaffingRequest, submitCarrierIntakePreferences } from 'backend/carrierLeadsService';

$w.onReady(async function () {
  console.log('[VELO] ✅ Trucking Companies page onReady fired');

  // Setup form handler for embedded HTML component
  setupCarrierFormHandler();

  await Promise.all([
    loadCarrierStats(),
    loadCarrierTestimonials(),
    initROICalculator()
  ]);
});

/**
 * Setup handler for carrier staffing form in HTML component
 * Scans multiple HTML component IDs since Wix assigns IDs dynamically
 */
function setupCarrierFormHandler() {
  // Try common HTML component IDs - the form might be in any of these
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#carrierFormHtml', '#truckingFormHtml'];

  console.log('[VELO] 🔍 Looking for HTML components to attach form handler...');

  possibleIds.forEach(htmlId => {
    try {
      const htmlComponent = $w(htmlId);
      if (htmlComponent && htmlComponent.onMessage) {
        console.log(`[VELO] ✅ Found HTML component: ${htmlId}`);

        // Listen for form ready signal and submissions
        htmlComponent.onMessage(async (event) => {
          if (!event.data || typeof event.data !== 'object') return;

          console.log(`[VELO] 📥 Message from ${htmlId}:`, event.data.type);

          // Handle form ready notification
          if (event.data.type === 'staffingFormReady') {
            console.log(`[VELO] ✅ Form in ${htmlId} is ready`);
          }

          // Handle form submission
          if (event.data.type === 'submitCarrierStaffingRequest') {
            console.log('[VELO] ─────────────────────────────────────');
            console.log('[VELO] 🚀 PROCESSING FORM SUBMISSION');
            console.log('[VELO] ─────────────────────────────────────');
            console.log('[VELO] 📋 Received data:', JSON.stringify(event.data.data, null, 2));

            try {
              console.log('[VELO] 📤 Calling submitCarrierStaffingRequest backend...');
              const result = await submitCarrierStaffingRequest(event.data.data);

              console.log('[VELO] ✅ Backend response:', result);

              // Send success back to HTML
              htmlComponent.postMessage({
                type: 'staffingRequestResult',
                success: true,
                leadId: result?.leadId || result?._id || 'unknown'
              });
              console.log('[VELO] 📤 Sent success response to form');

            } catch (error) {
              console.error('[VELO] ❌ Backend error:', error.message);
              console.error('[VELO] Full error:', error);

              // Send error back to HTML
              htmlComponent.postMessage({
                type: 'staffingRequestResult',
                success: false,
                error: error.message || 'Unknown error occurred'
              });
              console.log('[VELO] 📤 Sent error response to form');
            }
          }

          // Handle intake preferences submission (carrier matching criteria)
          if (event.data.type === 'submitCarrierIntakePreferences') {
            console.log('[VELO] 📋 Processing intake preferences:', event.data.data);
            try {
              const result = await submitCarrierIntakePreferences(event.data.data);
              console.log('[VELO] ✅ Preferences saved:', result);
              htmlComponent.postMessage({
                type: 'intakePreferencesResult',
                data: { success: true }
              });
            } catch (error) {
              console.error('[VELO] ❌ Preferences save error:', error.message);
              htmlComponent.postMessage({
                type: 'intakePreferencesResult',
                data: { success: false, error: error.message }
              });
            }
          }

          // Handle intake form ready signal
          if (event.data.type === 'carrierIntakeReady') {
            console.log(`[VELO] ✅ Carrier intake form in ${htmlId} is ready`);
          }

          // Handle post-submission navigation
          if (event.data.type === 'navigateToPreferences') {
            console.log('[VELO] 🔀 Navigating to preferences setup');
            wixLocation.to('/recruiter-driver-search?openSettings=true');
          }
          if (event.data.type === 'navigateToDashboard') {
            console.log('[VELO] 🔀 Navigating to dashboard');
            wixLocation.to('/recruiter-console');
          }
        });
      }
    } catch (e) {
      // Component doesn't exist - this is expected for most IDs
      console.log(`[VELO] ℹ️ ${htmlId} not found (this is OK)`);
    }
  });
}

/**
 * Load platform stats formatted for carrier audience
 * Elements: #statQualifiedDrivers, #statAvgTimeToHire, #statRetentionRate, #statCostPerHire
 */
async function loadCarrierStats() {
  try {
    const stats = await getCarrierPlatformStats();

    // Update stat elements
    const statElements = {
      '#statQualifiedDrivers': stats.qualifiedDrivers.toLocaleString(),
      '#statAvgTimeToHire': `${stats.avgDaysToHire} days`,
      '#statRetentionRate': `${stats.retentionRate}%`,
      '#statCostPerHire': `$${stats.avgCostPerHire}`
    };

    Object.entries(statElements).forEach(([selector, value]) => {
      try {
        const element = $w(selector);
        if (element && element.text !== undefined) {
          element.text = value;
        }
      } catch (e) {
        // Element may not exist on page
      }
    });

    // Send to HTML stats component if exists
    try {
      const htmlStats = $w('#carrierStatsHtml');
      if (htmlStats && htmlStats.postMessage) {
        htmlStats.postMessage({ type: 'carrierStats', stats });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load carrier stats:', err);
  }
}

/**
 * Load carrier testimonials
 * Element: #carrierTestimonialsRepeater
 * Collection: CarrierTestimonials (if exists)
 */
async function loadCarrierTestimonials() {
  try {
    const result = await wixData.query('CarrierTestimonials')
      .eq('is_approved', true)
      .limit(3)
      .find();

    if (result.items.length === 0) {
      // Hide testimonials section if no data
      try {
        const section = $w('#carrierTestimonialsSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    const repeater = $w('#carrierTestimonialsRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = result.items.map(t => ({
        _id: t._id,
        quote: t.testimonial_text,
        companyName: t.company_name,
        contactName: t.contact_name,
        contactTitle: t.contact_title,
        logoUrl: t.logo_url,
        fleetSize: t.fleet_size,
        hiresCount: t.hires_through_platform
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#testimonialQuote')) $item('#testimonialQuote').text = `"${itemData.quote}"`;
          if ($item('#testimonialCompany')) $item('#testimonialCompany').text = itemData.companyName;
          if ($item('#testimonialContact')) $item('#testimonialContact').text = itemData.contactName;
          if ($item('#testimonialTitle')) $item('#testimonialTitle').text = itemData.contactTitle;
          if ($item('#testimonialHires')) $item('#testimonialHires').text = `${itemData.hiresCount} hires`;
          if ($item('#testimonialLogo') && itemData.logoUrl) {
            $item('#testimonialLogo').src = itemData.logoUrl;
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    // Collection may not exist yet - hide section
    console.log('CarrierTestimonials collection not found or empty');
    try {
      const section = $w('#carrierTestimonialsSection');
      if (section && section.collapse) section.collapse();
    } catch (e) {
      // Section may not exist
    }
  }
}

/**
 * Initialize ROI Calculator HTML component
 * Element: #roiCalculatorHtml
 */
async function initROICalculator() {
  try {
    const htmlCalc = $w('#roiCalculatorHtml');
    if (!htmlCalc || !htmlCalc.postMessage) return;

    // Send market data for calculations
    const marketData = {
      avgCostPerHireTraditional: 8500,  // Industry average
      avgCostPerHireLMDR: 299,          // Platform fee
      avgTimeToHireTraditional: 45,     // Industry average days
      avgTimeToHireLMDR: 14,            // Platform average
      avgTurnoverCost: 12000            // Cost of driver turnover
    };

    htmlCalc.postMessage({ type: 'marketData', data: marketData });

    // Listen for navigation requests from calculator
    htmlCalc.onMessage((event) => {
      if (event.data.type === 'navigateToCarrierSignup') {
        wixLocation.to('/carrier-welcome');
      }
    });

  } catch (e) {
    // ROI calculator HTML component may not exist
  }
}
