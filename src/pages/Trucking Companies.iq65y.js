/**
 * Trucking Companies Page
 * Landing page for carriers - shows platform benefits, pricing, and drives recruiter signups
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixLocation from 'wix-location';
import { getCarrierPlatformStats } from 'backend/publicStatsService';
import { submitCarrierStaffingRequest, submitCarrierIntakePreferences } from 'backend/carrierLeadsService';
import { getCarrierTestimonials } from 'backend/contentService';

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
 */
function setupCarrierFormHandler() {
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#carrierFormHtml', '#truckingFormHtml'];

  possibleIds.forEach(htmlId => {
    try {
      const htmlComponent = $w(htmlId);
      if (htmlComponent.rendered && htmlComponent.onMessage) {
        htmlComponent.onMessage(async (event) => {
          if (!event.data || typeof event.data !== 'object') return;

          if (event.data.type === 'submitCarrierStaffingRequest') {
            try {
              const result = await submitCarrierStaffingRequest(event.data.data);
              htmlComponent.postMessage({ type: 'staffingRequestResult', data: { success: true, leadId: result?.leadId || result?._id || 'unknown' } });
              if (result.success && result.leadId) {
                setTimeout(() => { wixLocation.to(`/checkout?id=${result.leadId}`); }, 1500);
              }
            } catch (error) {
              htmlComponent.postMessage({ type: 'staffingRequestResult', success: false, error: error.message });
            }
          }

          if (event.data.type === 'submitCarrierIntakePreferences') {
            try {
              await submitCarrierIntakePreferences(event.data.data);
              htmlComponent.postMessage({ type: 'intakePreferencesResult', data: { success: true } });
            } catch (error) {
              htmlComponent.postMessage({ type: 'intakePreferencesResult', data: { success: false, error: error.message } });
            }
          }

          if (event.data.type === 'navigateToPreferences') wixLocation.to('/recruiter-driver-search?openSettings=true');
          if (event.data.type === 'navigateToDashboard') wixLocation.to('/recruiter-console');
        });
      }
    } catch (e) { }
  });
}

/**
 * Load platform stats formatted for carrier audience
 */
async function loadCarrierStats() {
  try {
    const stats = await getCarrierPlatformStats();

    const statElements = {
      '#statQualifiedDrivers': stats.qualifiedDrivers.toLocaleString(),
      '#statAvgTimeToHire': `${stats.avgDaysToHire} days`,
      '#statRetentionRate': `${stats.retentionRate}%`,
      '#statCostPerHire': `$${stats.avgCostPerHire}`
    };

    Object.entries(statElements).forEach(([selector, value]) => {
      try {
        const element = $w(selector);
        if (element.rendered && element.text !== undefined) element.text = value;
      } catch (e) { }
    });

    try {
      const htmlStats = $w('#carrierStatsHtml');
      if (htmlStats.rendered && htmlStats.postMessage) {
        htmlStats.postMessage({ type: 'carrierStats', stats });
      }
    } catch (e) { }

  } catch (err) {
    console.error('Failed to load carrier stats:', err);
  }
}

/**
 * Load carrier testimonials
 * Element: #carrierTestimonialsRepeater
 */
async function loadCarrierTestimonials() {
  try {
    const result = await getCarrierTestimonials(3);

    if (!result.success || result.testimonials.length === 0) {
      try {
        const section = $w('#carrierTestimonialsSection');
        if (section.rendered && section.collapse) section.collapse();
      } catch (e) { }
      return;
    }

    const repeater = $w('#carrierTestimonialsRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = result.testimonials;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#testimonialQuote').rendered) $item('#testimonialQuote').text = `"${itemData.quote}"`;
          if ($item('#testimonialCompany').rendered) $item('#testimonialCompany').text = itemData.carrierName;
          if ($item('#testimonialLogo').rendered && itemData.logoUrl) $item('#testimonialLogo').src = itemData.logoUrl;
        } catch (e) { }
      });
    }

  } catch (err) {
    console.error('Failed to load carrier testimonials:', err);
    try {
      const section = $w('#carrierTestimonialsSection');
      if (section.rendered && section.collapse) section.collapse();
    } catch (e) { }
  }
}

/**
 * Initialize ROI Calculator HTML component
 */
async function initROICalculator() {
  try {
    const htmlCalc = $w('#roiCalculatorHtml');
    if (!htmlCalc || !htmlCalc.postMessage) return;

    const marketData = {
      avgCostPerHireTraditional: 8500, avgCostPerHireLMDR: 299,
      avgTimeToHireTraditional: 45, avgTimeToHireLMDR: 14,
      avgTurnoverCost: 12000
    };

    htmlCalc.postMessage({ type: 'marketData', data: marketData });

    htmlCalc.onMessage((event) => {
      if (event.data.type === 'navigateToCarrierSignup') wixLocation.to('/carrier-welcome');
    });

  } catch (e) { }
}

