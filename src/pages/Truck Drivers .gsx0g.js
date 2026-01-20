/**
 * Truck Drivers Page
 * Landing page for drivers - shows job opportunities, benefits, and drives signups
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getTopJobOpportunities, getJobsByState, getRecentHires } from 'backend/publicStatsService';

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
    if (repeater && repeater.data !== undefined) {
      repeater.data = jobs;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#carrierName')) $item('#carrierName').text = itemData.carrierName;
          if ($item('#jobPayRange')) $item('#jobPayRange').text = itemData.payRange;
          if ($item('#jobLocation')) $item('#jobLocation').text = itemData.location;
          if ($item('#jobType')) $item('#jobType').text = itemData.operationType;
          if ($item('#jobBenefits')) $item('#jobBenefits').text = itemData.benefits;

          // Set up click handler to navigate to matching
          const learnMoreBtn = $item('#learnMoreBtn');
          if (learnMoreBtn) {
            learnMoreBtn.onClick(() => {
              wixLocation.to(`/ai-matching?carrier=${itemData._id}`);
            });
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

    // Send to HTML component if exists
    try {
      const htmlJobs = $w('#jobsFeedHtml');
      if (htmlJobs && htmlJobs.postMessage) {
        htmlJobs.postMessage({ type: 'jobsData', jobs });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load job highlights:', err);
  }
}

/**
 * Load driver testimonials
 * Element: #testimonialsRepeater
 * Collection: DriverTestimonials (if exists)
 */
async function loadDriverTestimonials() {
  try {
    // Check if DriverTestimonials collection exists
    const result = await wixData.query('DriverTestimonials')
      .eq('is_approved', true)
      .eq('is_featured', true)
      .limit(3)
      .find();

    if (result.items.length === 0) {
      // Hide testimonials section if no data
      try {
        const section = $w('#testimonialsSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    const repeater = $w('#testimonialsRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = result.items.map(t => ({
        _id: t._id,
        quote: t.testimonial_text,
        driverName: t.driver_first_name,
        yearsExperience: t.years_experience,
        operationType: t.operation_type,
        photoUrl: t.photo_url || '/default-driver.png'
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#testimonialQuote')) $item('#testimonialQuote').text = `"${itemData.quote}"`;
          if ($item('#testimonialName')) $item('#testimonialName').text = itemData.driverName;
          if ($item('#testimonialExp')) $item('#testimonialExp').text = `${itemData.yearsExperience} years experience`;
          if ($item('#testimonialType')) $item('#testimonialType').text = itemData.operationType;
          if ($item('#testimonialPhoto') && itemData.photoUrl) {
            $item('#testimonialPhoto').src = itemData.photoUrl;
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    // Collection may not exist yet - hide section
    console.log('DriverTestimonials collection not found or empty');
    try {
      const section = $w('#testimonialsSection');
      if (section && section.collapse) section.collapse();
    } catch (e) {
      // Section may not exist
    }
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
      // Hide location section if no state provided
      try {
        const section = $w('#locationJobsSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    const jobs = await getJobsByState(userState, 4);

    if (jobs.length === 0) {
      try {
        const section = $w('#locationJobsSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    // Update section title
    try {
      const title = $w('#locationTitle');
      if (title) title.text = `Jobs in ${userState}`;
    } catch (e) {
      // Element may not exist
    }

    const repeater = $w('#locationJobsRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = jobs;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#locJobCarrier')) $item('#locJobCarrier').text = itemData.carrierName;
          if ($item('#locJobPay')) $item('#locJobPay').text = itemData.payRange;
          if ($item('#locJobType')) $item('#locJobType').text = itemData.operationType;
        } catch (e) {
          // Element may not exist
        }
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

    // Send to HTML ticker component
    try {
      const htmlTicker = $w('#hireTicker');
      if (htmlTicker && htmlTicker.postMessage) {
        htmlTicker.postMessage({ type: 'recentHires', hires });
      }
    } catch (e) {
      // HTML component may not exist
    }

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
    if (htmlJobs && htmlJobs.onMessage) {
      htmlJobs.onMessage((event) => {
        if (event.data.type === 'navigateToMatching') {
          const carrierId = event.data.data?.preselectedCarrier;
          if (carrierId) {
            wixLocation.to(`/ai-matching?carrier=${carrierId}`);
          } else {
            wixLocation.to('/ai-matching');
          }
        }
      });
    }
  } catch (e) {
    // HTML component may not exist
  }
}
