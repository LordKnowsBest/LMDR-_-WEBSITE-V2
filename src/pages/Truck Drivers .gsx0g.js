/**
 * Truck Drivers Page
 * Landing page for drivers - shows job opportunities, benefits, and drives signups
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixLocation from 'wix-location';
import { getTopJobOpportunities, getJobsByState, getRecentHires } from 'backend/publicStatsService';
import { getDriverTestimonials } from 'backend/contentService';

$w.onReady(async function () {
  await Promise.all([
    loadJobHighlights(),
    loadDriverTestimonials(),
    loadLocationBasedJobs(),
    loadRecentHiresTicker()
  ]);

  // Set up HTML component message handlers
  setupHtmlMessageHandlers();
});

/**
 * Load top job opportunities sorted by pay
 * Element: #jobHighlightsRepeater
 */
async function loadJobHighlights() {
  try {
    const jobs = await getTopJobOpportunities(6);

    const repeater = $w('#jobHighlightsRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = jobs;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#carrierName').rendered) $item('#carrierName').text = itemData.carrierName;
          if ($item('#jobPayRange').rendered) $item('#jobPayRange').text = itemData.payRange;
          if ($item('#jobLocation').rendered) $item('#jobLocation').text = itemData.location;
          if ($item('#jobType').rendered) $item('#jobType').text = itemData.operationType;
          if ($item('#jobBenefits').rendered) $item('#jobBenefits').text = itemData.benefits;

          const learnMoreBtn = $item('#learnMoreBtn');
          if (learnMoreBtn.rendered) {
            learnMoreBtn.onClick(() => {
              wixLocation.to(`/ai-matching?carrier=${itemData._id}`);
            });
          }
        } catch (e) { }
      });
    }

    try {
      const htmlJobs = $w('#jobsFeedHtml');
      if (htmlJobs.rendered && htmlJobs.postMessage) {
        htmlJobs.postMessage({ type: 'jobsData', jobs });
      }
    } catch (e) { }

  } catch (err) {
    console.error('Failed to load job highlights:', err);
  }
}

/**
 * Load driver testimonials
 * Element: #testimonialsRepeater
 */
async function loadDriverTestimonials() {
  try {
    const result = await getDriverTestimonials(3);

    if (!result.success || result.testimonials.length === 0) {
      try {
        const section = $w('#testimonialsSection');
        if (section.rendered && section.collapse) section.collapse();
      } catch (e) { }
      return;
    }

    const repeater = $w('#testimonialsRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = result.testimonials;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#testimonialQuote').rendered) $item('#testimonialQuote').text = `"${itemData.quote}"`;
          if ($item('#testimonialName').rendered) $item('#testimonialName').text = itemData.driverName;
          if ($item('#testimonialExp').rendered) $item('#testimonialExp').text = `${itemData.yearsExperience} years experience`;
          if ($item('#testimonialType').rendered) $item('#testimonialType').text = itemData.operationType;
          if ($item('#testimonialPhoto').rendered && itemData.photoUrl) {
            $item('#testimonialPhoto').src = itemData.photoUrl;
          }
        } catch (e) { }
      });
    }

  } catch (err) {
    console.error('Failed to load testimonials:', err);
    try {
      const section = $w('#testimonialsSection');
      if (section.rendered && section.collapse) section.collapse();
    } catch (e) { }
  }
}

/**
 * Load location-based job suggestions
 * Uses URL query param or collapses section
 * Element: #locationJobsRepeater
 */
async function loadLocationBasedJobs() {
  try {
    const query = wixLocation.query;
    const userState = query.state || null;

    if (!userState) {
      try {
        const section = $w('#locationJobsSection');
        if (section.rendered && section.collapse) section.collapse();
      } catch (e) { }
      return;
    }

    const jobs = await getJobsByState(userState, 4);

    if (jobs.length === 0) {
      try {
        const section = $w('#locationJobsSection');
        if (section.rendered && section.collapse) section.collapse();
      } catch (e) { }
      return;
    }

    try {
      const title = $w('#locationTitle');
      if (title.rendered) title.text = `Jobs in ${userState}`;
    } catch (e) { }

    const repeater = $w('#locationJobsRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = jobs;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#locJobCarrier').rendered) $item('#locJobCarrier').text = itemData.carrierName;
          if ($item('#locJobPay').rendered) $item('#locJobPay').text = itemData.payRange;
          if ($item('#locJobType').rendered) $item('#locJobType').text = itemData.operationType;
        } catch (e) { }
      });
    }

  } catch (err) {
    console.error('Failed to load location-based jobs:', err);
  }
}

/**
 * Load recent hires for social proof ticker
 * Element: #hireTicker (HTML component)
 */
async function loadRecentHiresTicker() {
  try {
    const hires = await getRecentHires(10);

    try {
      const htmlTicker = $w('#hireTicker');
      if (htmlTicker.rendered && htmlTicker.postMessage) {
        htmlTicker.postMessage({ type: 'recentHires', hires });
      }
    } catch (e) { }

  } catch (err) {
    console.error('Failed to load recent hires:', err);
  }
}

/**
 * Set up message handlers for HTML components
 */
function setupHtmlMessageHandlers() {
  try {
    const htmlJobs = $w('#jobsFeedHtml');
    if (htmlJobs.rendered && htmlJobs.onMessage) {
      htmlJobs.onMessage((event) => {
        if (event.data.type === 'navigateToMatching') {
          const carrierId = event.data.data?.preselectedCarrier;
          if (carrierId) wixLocation.to(`/ai-matching?carrier=${carrierId}`);
          else wixLocation.to('/ai-matching');
        }
      });
    }
  } catch (e) { }
}
